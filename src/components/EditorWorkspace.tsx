import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Crop,
  Scaling,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Undo2,
  Redo2,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  FileCode,
  Check,
  Split,
  Palette,
  ArrowRight
} from 'lucide-react';
import {
  CropRect,
  canvasToWebpBlob,
  canvasToPngBlob,
  cropCanvas,
  resizeCanvas,
  rotateCanvas,
  flipCanvas,
  downloadBlob,
  formatBytes,
  cloneCanvas,
} from '../utils/imageProcessing';
import { CropOverlay } from './CropOverlay';
import { ResizeModal } from './ResizeModal';
import { IcoExportModal } from './IcoExportModal';

interface EditorWorkspaceProps {
  originalImage: HTMLImageElement;
  initialCutoutCanvas: HTMLCanvasElement;
  originalFilename: string;
  originalFileSize?: number;
  onReset: () => void;
}

type BackgroundMode = 'checker-dark' | 'checker-light' | 'white' | 'dark' | 'custom' | 'split';

interface QualityPreset {
  label: string;
  value: number; // 0.01 to 1.0
  desc: string;
}

const QUALITY_PRESETS: QualityPreset[] = [
  { label: 'Max', value: 1.0, desc: 'Lossless quality' },
  { label: 'High', value: 0.85, desc: 'Optimal for web (85%)' },
  { label: 'Med', value: 0.70, desc: 'Balanced compression' },
  { label: 'Compact', value: 0.50, desc: 'Smallest file size' },
];

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  originalImage,
  initialCutoutCanvas,
  originalFilename,
  originalFileSize = 500 * 1024,
}) => {
  // Current working canvas state
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement>(() => cloneCanvas(initialCutoutCanvas));
  
  // History stack for Undo / Redo
  const [history, setHistory] = useState<HTMLCanvasElement[]>([cloneCanvas(initialCutoutCanvas)]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Background and Preview settings
  const [bgMode, setBgMode] = useState<BackgroundMode>('checker-dark');
  const [customBgColor, setCustomBgColor] = useState<string>('#3b82f6');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 to 100
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5, 2

  // WebP Compression & Quality settings
  const [quality, setQuality] = useState<number>(0.85);
  const [estimatedWebpSize, setEstimatedWebpSize] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals & Active Tools
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [showResizeModal, setShowResizeModal] = useState<boolean>(false);
  const [showIcoModal, setShowIcoModal] = useState<boolean>(false);

  // References
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update history when canvas changes
  const pushNewState = useCallback((newCanvas: HTMLCanvasElement) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newCanvas);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setCurrentCanvas(newCanvas);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCurrentCanvas(cloneCanvas(history[prevIdx]));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCurrentCanvas(cloneCanvas(history[nextIdx]));
    }
  };

  // Recalculate estimated WebP output size whenever canvas or quality changes
  useEffect(() => {
    let active = true;
    canvasToWebpBlob(currentCanvas, quality)
      .then((blob) => {
        if (active) setEstimatedWebpSize(blob.size);
      })
      .catch(() => {
        if (active) setEstimatedWebpSize(null);
      });

    return () => {
      active = false;
    };
  }, [currentCanvas, quality]);

  // Keep track of viewport container dimensions for crop overlay calculations
  useEffect(() => {
    const updateDims = () => {
      if (viewportRef.current) {
        setViewportDims({
          width: viewportRef.current.clientWidth,
          height: viewportRef.current.clientHeight,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Draw current image onto the preview canvas
  useEffect(() => {
    const preview = previewCanvasRef.current;
    if (!preview) return;

    preview.width = currentCanvas.width;
    preview.height = currentCanvas.height;
    const ctx = preview.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, preview.width, preview.height);

    if (bgMode === 'split') {
      // Split mode: Left side shows original image, Right side shows transparent cutout
      const splitPx = (preview.width * splitPos) / 100;

      // Draw original on left
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitPx, preview.height);
      ctx.clip();
      ctx.drawImage(originalImage, 0, 0, preview.width, preview.height);
      ctx.restore();

      // Draw cutout on right
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitPx, 0, preview.width - splitPx, preview.height);
      ctx.clip();
      ctx.drawImage(currentCanvas, 0, 0);
      ctx.restore();

      // Draw divider line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitPx, 0);
      ctx.lineTo(splitPx, preview.height);
      ctx.stroke();
    } else {
      ctx.drawImage(currentCanvas, 0, 0);
    }
  }, [currentCanvas, bgMode, splitPos, originalImage]);

  // Action handlers: Rotate, Flip, Crop, Resize
  const handleRotate = (deg: 90 | -90) => {
    const rotated = rotateCanvas(currentCanvas, deg);
    pushNewState(rotated);
  };

  const handleFlip = (horizontal: boolean, vertical: boolean) => {
    const flipped = flipCanvas(currentCanvas, horizontal, vertical);
    pushNewState(flipped);
  };

  const handleApplyCrop = (cropRect: CropRect) => {
    const cropped = cropCanvas(currentCanvas, cropRect);
    pushNewState(cropped);
    setIsCropping(false);
  };

  const handleApplyResize = (targetW: number, targetH: number) => {
    const resized = resizeCanvas(currentCanvas, targetW, targetH);
    pushNewState(resized);
    setShowResizeModal(false);
  };

  // Export handlers
  const handleDownloadWebp = async () => {
    setIsExporting(true);
    try {
      const blob = await canvasToWebpBlob(currentCanvas, quality);
      const cleanName = originalFilename.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${cleanName}-cutout.webp`);
    } catch (err) {
      console.error('Download WebP error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const blob = await canvasToPngBlob(currentCanvas);
      const cleanName = originalFilename.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${cleanName}-cutout.png`);
    } catch (err) {
      console.error('Download PNG error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic background style for the viewport
  const getViewportBackground = () => {
    switch (bgMode) {
      case 'checker-dark':
        return {
          backgroundImage:
            'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
          backgroundColor: '#0f172a',
        };
      case 'checker-light':
        return {
          backgroundImage:
            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
          backgroundColor: '#ffffff',
        };
      case 'white':
        return { backgroundColor: '#ffffff' };
      case 'dark':
        return { backgroundColor: '#020617' };
      case 'custom':
        return { backgroundColor: customBgColor };
      case 'split':
        return {
          backgroundImage:
            'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
          backgroundSize: '24px 24px',
          backgroundColor: '#0f172a',
        };
    }
  };

  const sizeSavingsPct =
    estimatedWebpSize && originalFileSize > 0
      ? Math.max(0, Math.round(((originalFileSize - estimatedWebpSize) / originalFileSize) * 100))
      : null;

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-slate-950">
      {/* Top Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        {/* Undo / Redo & Dimension Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3 font-mono text-[11px] text-slate-400">
            <span>{currentCanvas.width} × {currentCanvas.height} px</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400 font-semibold truncate max-w-[150px]">
              {originalFilename}
            </span>
          </div>
        </div>

        {/* Viewport Background selector */}
        <div className="flex items-center gap-1.5">
          <span className="hidden md:inline text-slate-400 mr-1">Preview Bg:</span>
          
          <button
            onClick={() => setBgMode('checker-dark')}
            className={`rounded-lg px-2 py-1 transition cursor-pointer ${
              bgMode === 'checker-dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
            title="Dark Transparency Grid"
          >
            Dark Grid
          </button>

          <button
            onClick={() => setBgMode('checker-light')}
            className={`rounded-lg px-2 py-1 transition cursor-pointer ${
              bgMode === 'checker-light'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
            title="Light Transparency Grid"
          >
            Light Grid
          </button>

          <button
            onClick={() => setBgMode('white')}
            className={`rounded-lg px-2 py-1 transition cursor-pointer ${
              bgMode === 'white'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
            title="Solid White"
          >
            White
          </button>

          <button
            onClick={() => setBgMode('dark')}
            className={`rounded-lg px-2 py-1 transition cursor-pointer ${
              bgMode === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
            title="Solid Dark"
          >
            Dark
          </button>

          {/* Color swatch picker */}
          <div className="relative flex items-center">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => {
                setCustomBgColor(e.target.value);
                setBgMode('custom');
              }}
              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
              title="Custom Color"
            />
          </div>

          {/* Before / After Split Slider Toggle */}
          <button
            onClick={() => setBgMode(bgMode === 'split' ? 'checker-dark' : 'split')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 transition cursor-pointer ${
              bgMode === 'split'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
            title="Before / After Split View"
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-slate-400 min-w-[32px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body: Viewport + Right Side Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Center Canvas Viewport */}
        <div
          ref={viewportRef}
          style={getViewportBackground()}
          className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-auto select-none"
        >
          {/* Container holding image */}
          <div
            className="relative transition-transform duration-100 shadow-2xl rounded-lg"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            <canvas
              ref={previewCanvasRef}
              className="max-h-[70vh] max-w-[85vw] lg:max-w-[55vw] object-contain rounded-md"
            />

            {/* Split Comparison Slider Handle */}
            {bgMode === 'split' && (
              <div
                style={{ left: `${splitPos}%` }}
                className="absolute top-0 bottom-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize pointer-events-auto"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const handleMove = (ev: MouseEvent) => {
                    if (!previewCanvasRef.current) return;
                    const rect = previewCanvasRef.current.getBoundingClientRect();
                    const newPos = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                    setSplitPos(newPos);
                  };
                  const handleUp = () => {
                    window.removeEventListener('mousemove', handleMove);
                    window.removeEventListener('mouseup', handleUp);
                  };
                  window.addEventListener('mousemove', handleMove);
                  window.addEventListener('mouseup', handleUp);
                }}
              >
                <div className="h-7 w-7 rounded-full bg-white text-slate-900 shadow-xl border-2 border-purple-500 flex items-center justify-center">
                  <Split className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>
            )}

            {/* Interactive Crop Overlay */}
            {isCropping && (
              <CropOverlay
                imageWidth={currentCanvas.width}
                imageHeight={currentCanvas.height}
                containerWidth={viewportDims.width}
                containerHeight={viewportDims.height}
                onApplyCrop={handleApplyCrop}
                onCancel={() => setIsCropping(false)}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar Control & Export Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 text-slate-100">
          <div className="space-y-6">
            {/* 1. Quick Editing Tools Bar */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Image Adjustments
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setIsCropping(true)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                    isCropping
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                  title="Crop Image"
                >
                  <Crop className="w-4 h-4 text-indigo-400" />
                  <span>Crop</span>
                </button>

                <button
                  onClick={() => setShowResizeModal(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                  title="Resize Dimensions"
                >
                  <Scaling className="w-4 h-4 text-cyan-400" />
                  <span>Resize</span>
                </button>

                <button
                  onClick={() => handleRotate(90)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-4 h-4 text-amber-400" />
                  <span>Rotate</span>
                </button>

                <button
                  onClick={() => handleFlip(true, false)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                  title="Flip Horizontally"
                >
                  <FlipHorizontal className="w-4 h-4 text-purple-400" />
                  <span>Flip</span>
                </button>
              </div>
            </div>

            {/* 2. WebP Compression & Quality Toggle */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">WebP Compression Quality</span>
                </div>
                <span className="font-mono text-xs font-semibold text-indigo-400">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              {/* Quality Preset Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {QUALITY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setQuality(preset.value)}
                    className={`rounded-xl py-1.5 text-xs font-semibold transition cursor-pointer ${
                      Math.abs(quality - preset.value) < 0.02
                        ? 'bg-indigo-600 text-white shadow'
                        : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.10"
                max="1.0"
                step="0.01"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              {/* Real-time calculated file size info */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 p-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Output:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {estimatedWebpSize ? formatBytes(estimatedWebpSize) : 'Computing...'}
                  </span>
                </div>
                {sizeSavingsPct !== null && sizeSavingsPct > 0 && (
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Space Saved:</span>
                    <span className="font-semibold text-emerald-400">
                      -{sizeSavingsPct}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Icon Generator Shortcut Callout */}
            <div
              onClick={() => setShowIcoModal(true)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-950/20 to-purple-950/20 p-3.5 hover:border-pink-500/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 group-hover:scale-105 transition">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition">
                    Windows .ICO & Icon Studio
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bundle 16px to 256px multi-size icon
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Export Action Buttons at Bottom of Sidebar */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
            {/* Primary Download: Compressed .WebP */}
            <button
              onClick={handleDownloadWebp}
              disabled={isExporting}
              className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-indigo-600/25 hover:from-indigo-600 hover:to-pink-700 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Export Compressed .WebP</span>
              </div>
              <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {estimatedWebpSize ? formatBytes(estimatedWebpSize) : 'WebP'}
              </span>
            </button>

            {/* Secondary Option: Save as Windows .ICO */}
            <button
              onClick={() => setShowIcoModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-[0.98] cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Export as .ICO (Multi-Resolution)</span>
            </button>

            {/* Secondary Option: Export as PNG */}
            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Lossless PNG (Full Alpha)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resize Modal */}
      {showResizeModal && (
        <ResizeModal
          currentWidth={currentCanvas.width}
          currentHeight={currentCanvas.height}
          onApplyResize={handleApplyResize}
          onClose={() => setShowResizeModal(false)}
        />
      )}

      {/* ICO Generator Modal */}
      {showIcoModal && (
        <IcoExportModal
          canvas={currentCanvas}
          baseFilename={originalFilename}
          onClose={() => setShowIcoModal(false)}
        />
      )}
    </div>
  );
};
