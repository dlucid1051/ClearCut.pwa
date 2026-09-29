import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { CropRect } from '../utils/imageProcessing';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  onApplyCrop: (crop: CropRect) => void;
  onCancel: () => void;
}

type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16';

export const CropOverlay: React.FC<CropOverlayProps> = ({
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  onApplyCrop,
  onCancel,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');

  // Scale factor between original image pixels and displayed container pixels
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const dispW = imageWidth * scale;
  const dispH = imageHeight * scale;
  const offsetX = (containerWidth - dispW) / 2;
  const offsetY = (containerHeight - dispH) / 2;

  // Crop rectangle in normalized image coordinates (0 to imageWidth/imageHeight)
  const [crop, setCrop] = useState<CropRect>(() => {
    const pad = 0.1;
    return {
      x: imageWidth * pad,
      y: imageHeight * pad,
      width: imageWidth * (1 - pad * 2),
      height: imageHeight * (1 - pad * 2),
    };
  });

  const isDraggingRef = useRef<string | null>(null);
  const startPosRef = useRef<{ mouseX: number; mouseY: number; initialCrop: CropRect }>({
    mouseX: 0,
    mouseY: 0,
    initialCrop: crop,
  });

  // Update crop when aspect ratio changes
  const applyAspectRatio = useCallback((ratio: AspectRatio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === '1:1') targetRatio = 1;
    else if (ratio === '4:3') targetRatio = 4 / 3;
    else if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '3:2') targetRatio = 3 / 2;
    else if (ratio === '9:16') targetRatio = 9 / 16;

    setCrop((prev) => {
      let newW = prev.width;
      let newH = newW / targetRatio;

      if (newH > imageHeight) {
        newH = imageHeight * 0.8;
        newW = newH * targetRatio;
      }
      if (newW > imageWidth) {
        newW = imageWidth * 0.8;
        newH = newW / targetRatio;
      }

      const newX = Math.max(0, Math.min(imageWidth - newW, prev.x + (prev.width - newW) / 2));
      const newY = Math.max(0, Math.min(imageHeight - newH, prev.y + (prev.height - newH) / 2));

      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [imageWidth, imageHeight]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = handle;
    startPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialCrop: { ...crop },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dxImg = (e.clientX - startPosRef.current.mouseX) / scale;
      const dyImg = (e.clientY - startPosRef.current.mouseY) / scale;
      const init = startPosRef.current.initialCrop;
      const handle = isDraggingRef.current;

      setCrop(() => {
        let { x, y, width, height } = init;

        if (handle === 'move') {
          x = Math.max(0, Math.min(imageWidth - width, init.x + dxImg));
          y = Math.max(0, Math.min(imageHeight - height, init.y + dyImg));
        } else {
          // Resizing handles
          if (handle.includes('e')) {
            width = Math.max(20, Math.min(imageWidth - x, init.width + dxImg));
          }
          if (handle.includes('s')) {
            height = Math.max(20, Math.min(imageHeight - y, init.height + dyImg));
          }
          if (handle.includes('w')) {
            const proposedX = Math.max(0, Math.min(init.x + init.width - 20, init.x + dxImg));
            width = init.width + (init.x - proposedX);
            x = proposedX;
          }
          if (handle.includes('n')) {
            const proposedY = Math.max(0, Math.min(init.y + init.height - 20, init.y + dyImg));
            height = init.height + (init.y - proposedY);
            y = proposedY;
          }

          // Maintain aspect ratio if set
          if (aspectRatio !== 'free') {
            let targetRatio = 1;
            if (aspectRatio === '1:1') targetRatio = 1;
            else if (aspectRatio === '4:3') targetRatio = 4 / 3;
            else if (aspectRatio === '16:9') targetRatio = 16 / 9;
            else if (aspectRatio === '3:2') targetRatio = 3 / 2;
            else if (aspectRatio === '9:16') targetRatio = 9 / 16;

            if (handle === 'e' || handle === 'w') {
              height = width / targetRatio;
            } else {
              width = height * targetRatio;
            }
          }
        }

        return {
          x: Math.max(0, Math.min(imageWidth - 10, x)),
          y: Math.max(0, Math.min(imageHeight - 10, y)),
          width: Math.max(10, Math.min(imageWidth - x, width)),
          height: Math.max(10, Math.min(imageHeight - y, height)),
        };
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [scale, imageWidth, imageHeight, aspectRatio]);

  // Display coordinates
  const dispCropX = offsetX + crop.x * scale;
  const dispCropY = offsetY + crop.y * scale;
  const dispCropW = crop.width * scale;
  const dispCropH = crop.height * scale;

  return (
    <div className="absolute inset-0 pointer-events-auto select-none overflow-hidden z-20">
      {/* Dark Dim Overlay around the crop box */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={dispCropX}
              y={dispCropY}
              width={dispCropW}
              height={dispCropH}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* Draggable & Resizable Box */}
      <div
        style={{
          left: `${dispCropX}px`,
          top: `${dispCropY}px`,
          width: `${dispCropW}px`,
          height: `${dispCropH}px`,
        }}
        className="absolute border-2 border-indigo-400 cursor-move shadow-2xl"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Rule of Thirds Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        {/* 8 Resize Handles */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
          className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-indigo-500 border-2 border-white cursor-nwse-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
          className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-indigo-500 border-2 border-white cursor-nesw-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
          className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-indigo-500 border-2 border-white cursor-nesw-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'se')}
          className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-indigo-500 border-2 border-white cursor-nwse-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'n')}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-8 rounded-full bg-indigo-400 border border-white cursor-ns-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 's')}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-8 rounded-full bg-indigo-400 border border-white cursor-ns-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'w')}
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-indigo-400 border border-white cursor-ew-resize shadow"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'e')}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-indigo-400 border border-white cursor-ew-resize shadow"
        />

        {/* Live crop pixel dimensions tag */}
        <div className="absolute -top-7 left-0 rounded bg-slate-900/90 border border-slate-700 px-2 py-0.5 text-[11px] font-mono text-indigo-300 pointer-events-none shadow">
          {Math.round(crop.width)} × {Math.round(crop.height)} px
        </div>
      </div>

      {/* Floating Toolbar at Bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-2 shadow-2xl">
        {/* Aspect ratio buttons */}
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          {(['free', '1:1', '4:3', '16:9', '3:2', '9:16'] as AspectRatio[]).map((r) => (
            <button
              key={r}
              onClick={() => applyAspectRatio(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                aspectRatio === r
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === '1:1' ? '1:1 (Icon)' : r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              applyAspectRatio('free');
              setCrop({
                x: 0,
                y: 0,
                width: imageWidth,
                height: imageHeight,
              });
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Reset crop to full image"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            onClick={() => onApplyCrop(crop)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
