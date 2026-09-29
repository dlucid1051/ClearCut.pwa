import React from 'react';
import { Loader2, Sparkles, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  stage: string;
  error?: string | null;
  onRetry?: () => void;
  onUseFallback?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  progress,
  stage,
  error,
  onRetry,
  onUseFallback,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-center text-slate-100">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">AI Processing Notice</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {error}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-indigo-500 transition active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry AI
                </button>
              )}
              {onUseFallback && (
                <button
                  onClick={onUseFallback}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition active:scale-95 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Use Smart Edge Matting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Animated Magic Icon */}
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-indigo-400" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <span>Removing Background</span>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                {stage || 'Processing image on your device...'}
              </p>
            </div>

            {/* Glowing Progress Bar */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Progress</span>
                <span className="text-indigo-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-sm shadow-indigo-500/50"
                  style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                />
              </div>
            </div>

            {/* Tip footnote */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-[11px] text-slate-400">
              ⚡ <strong>Client-side AI:</strong> Running neural inference locally in your browser. First run caches models for offline use.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
