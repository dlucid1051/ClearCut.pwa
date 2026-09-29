import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Shield, Cpu, Zap, Crop, FileCode, CheckCircle2 } from 'lucide-react';
import { SAMPLE_IMAGES } from '../utils/sampleImages';

interface DropZoneProps {
  onImageSelected: (file: File | Blob, originalFilename?: string) => void;
  modelQuality: 'isnet_fp16' | 'isnet_quint8';
  setModelQuality: (q: 'isnet_fp16' | 'isnet_quint8') => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onImageSelected,
  modelQuality,
  setModelQuality,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            onImageSelected(file, 'pasted-image.png');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageSelected]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file, file.name);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onImageSelected(file, file.name);
    }
  };

  const handleSampleClick = async (sample: typeof SAMPLE_IMAGES[0]) => {
    const blob = await sample.generateBlob();
    onImageSelected(blob, `${sample.id}.png`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Hero Headline */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local Client-Side AI & Offline PWA</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Remove Backgrounds <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Directly in Your Browser
          </span>
        </h1>
        <p className="mt-3.5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Strip image backgrounds in seconds using neural network matting. Crop, resize, fine-tune WebP compression quality, and export multi-resolution Windows <code className="text-indigo-300">.ico</code> files — completely private and offline.
        </p>
      </div>

      {/* Main Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Icon circle */}
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl group-hover:scale-105 group-hover:text-indigo-300 transition duration-200">
          <UploadCloud className="h-10 w-10 animate-bounce group-hover:animate-none" />
          <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Call to action */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
          Drag & drop your JPG or PNG here
        </h3>
        <p className="text-sm text-slate-400 mb-4 max-w-md">
          or <span className="text-indigo-400 font-semibold underline underline-offset-4 group-hover:text-indigo-300">browse files from your device</span>
        </p>

        {/* Formats and Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1">JPG</span>
          <span className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1">PNG</span>
          <span className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1">WEBP</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">Supports paste (Ctrl+V / ⌘V)</span>
        </div>
      </div>

      {/* Model Mode Selector Box */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 sm:px-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>AI Neural Model Engine:</span>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModelQuality('isnet_fp16');
            }}
            className={`flex-1 sm:flex-initial text-xs py-1.5 px-3 rounded-xl font-medium transition cursor-pointer ${
              modelQuality === 'isnet_fp16'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            High Precision (FP16)
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModelQuality('isnet_quint8');
            }}
            className={`flex-1 sm:flex-initial text-xs py-1.5 px-3 rounded-xl font-medium transition cursor-pointer ${
              modelQuality === 'isnet_quint8'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            Fast / Low RAM (UINT8)
          </button>
        </div>
      </div>

      {/* Sample Images Section for Instant Testing */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Or Try A Sample Image
            </h4>
          </div>
          <span className="text-xs text-slate-500">Zero download required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-left transition hover:border-indigo-500/50 hover:bg-slate-800/80 active:scale-[0.98] cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                  {sample.name}
                </p>
                <p className="text-[11px] text-slate-400">{sample.category}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Zap className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="mb-2 text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <h5 className="text-xs font-semibold text-white">100% Private & Local</h5>
          <p className="text-[11px] text-slate-400 mt-0.5">Processed on-device in WebAssembly</p>
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="mb-2 text-purple-400">
            <FileCode className="w-5 h-5" />
          </div>
          <h5 className="text-xs font-semibold text-white">Compressed .WebP</h5>
          <p className="text-[11px] text-slate-400 mt-0.5">Toggle quality presets & live size</p>
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="mb-2 text-pink-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h5 className="text-xs font-semibold text-white">Windows .ICO Creator</h5>
          <p className="text-[11px] text-slate-400 mt-0.5">Multi-res 16px to 256px icon files</p>
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="mb-2 text-cyan-400">
            <Crop className="w-5 h-5" />
          </div>
          <h5 className="text-xs font-semibold text-white">Crop & Resize</h5>
          <p className="text-[11px] text-slate-400 mt-0.5">Aspect ratios & custom dimensions</p>
        </div>
      </div>
    </div>
  );
};
