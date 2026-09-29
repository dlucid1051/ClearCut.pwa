import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Scissors, ShieldCheck, Cpu, Wifi, WifiOff, HelpCircle, X, Sparkles, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  hasImage: boolean;
  onReset: () => void;
  modelQuality: 'isnet_fp16' | 'isnet_quint8';
  setModelQuality: (q: 'isnet_fp16' | 'isnet_quint8') => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  onReset,
  modelQuality,
  setModelQuality,
}) => {
  const isOnline = useOnlineStatus();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20">
              <Scissors className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                  ClearCut<span className="text-indigo-400">.pwa</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  <Cpu className="w-2.5 h-2.5" /> Client AI
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">
                Offline Background Remover & Icon Studio
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline indicator badge */}
            <div
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border ${
                isOnline
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}
              title={isOnline ? 'Connected (Model caches locally)' : 'Offline mode active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden md:inline">Offline</span>
                </>
              )}
            </div>

            {/* Model Quality Selector Dropdown/Toggle */}
            <div className="hidden lg:flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setModelQuality('isnet_fp16')}
                className={`rounded-md px-2 py-1 font-medium transition ${
                  modelQuality === 'isnet_fp16'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Higher quality edge detection (FP16)"
              >
                High Precision
              </button>
              <button
                onClick={() => setModelQuality('isnet_quint8')}
                className={`rounded-md px-2 py-1 font-medium transition ${
                  modelQuality === 'isnet_quint8'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Faster processing & lower memory (Quantized UINT8)"
              >
                Fast / Low RAM
              </button>
            </div>

            {/* Reset / New Image Button */}
            {hasImage && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Image</span>
              </button>
            )}

            {/* Info / Privacy Guarantee */}
            <button
              onClick={() => setShowInfo(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
              title="About & Privacy"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* In-App PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Info & Privacy Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">100% Local & Private</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-300">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 flex gap-3">
                <Sparkles className="w-5 h-5 shrink-0 text-indigo-400" />
                <p className="text-xs text-indigo-200 leading-relaxed">
                  ClearCut uses <strong>client-side ONNX AI segmentation</strong> (@imgly/background-removal) running directly in your web browser via WebAssembly. Your photos <strong>never leave your device</strong>.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Zero Cloud Uploads:</strong> Absolute confidentiality for sensitive documents, personal photos, and proprietary assets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Offline PWA:</strong> Powered by a Service Worker that caches app assets and neural models in CacheStorage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Compressed WebP & Windows .ICO:</strong> Export lightweight assets with real-time compression control and multi-size icon generation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Built-in Crop & Resize:</strong> Interactive aspect ratios and custom pixel scaling on HTML5 Canvas.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
            >
              Continue Editing
            </button>
          </div>
        </div>
      )}
    </>
  );
};
