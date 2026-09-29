/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { EditorWorkspace } from './components/EditorWorkspace';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  loadImage,
  imageToCanvas,
  fallbackSmartBackgroundRemoval,
} from './utils/imageProcessing';
import { removeBackground } from '@imgly/background-removal';

export default function App() {
  const [originalFile, setOriginalFile] = useState<File | Blob | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('image.png');
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cutoutCanvas, setCutoutCanvas] = useState<HTMLCanvasElement | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Model Quality
  const [modelQuality, setModelQuality] = useState<'isnet_fp16' | 'isnet_quint8'>('isnet_fp16');

  const processImageWithAi = useCallback(
    async (file: File | Blob, loadedImg: HTMLImageElement, qualityMode: 'isnet_fp16' | 'isnet_quint8') => {
      setIsProcessing(true);
      setError(null);
      setProgress(5);
      setStage('Initializing client-side AI engine...');

      try {
        const resultBlob = await removeBackground(file, {
          model: qualityMode,
          device: 'gpu',
          progress: (key: string, current: number, total: number) => {
            const pct = total > 0 ? Math.min(95, Math.round((current / total) * 100)) : 40;
            setProgress(pct);

            if (key.includes('fetch')) {
              setStage(`Loading neural model weights (${pct}%)...`);
            } else if (key.includes('compute') || key.includes('inference')) {
              setStage(`Segmenting foreground subject (${pct}%)...`);
            } else {
              setStage(`Refining transparency matting (${pct}%)...`);
            }
          },
        });

        setProgress(98);
        setStage('Rendering transparent output...');

        const resultImg = await loadImage(resultBlob);
        const resultCanvas = imageToCanvas(resultImg);

        setCutoutCanvas(resultCanvas);
        setIsProcessing(false);
      } catch (err: unknown) {
        console.warn('AI segmentation encounter, attempting graceful handling:', err);
        const errMessage = err instanceof Error ? err.message : String(err);

        setError(
          `Local AI model execution failed (${errMessage.slice(0, 100)}). You can retry or use the smart edge matting fallback.`
        );
      }
    },
    []
  );

  const handleImageSelected = useCallback(
    async (file: File | Blob, filename = 'image.png') => {
      setOriginalFile(file);
      setOriginalFilename(filename);
      setOriginalFileSize(file.size || 500 * 1024);
      setCutoutCanvas(null);

      try {
        const img = await loadImage(file);
        setOriginalImage(img);
        await processImageWithAi(file, img, modelQuality);
      } catch (err) {
        console.error('Failed to load selected image:', err);
        setError('Could not decode the selected image file. Please try another JPG or PNG.');
      }
    },
    [modelQuality, processImageWithAi]
  );

  const handleRetryAi = () => {
    if (originalFile && originalImage) {
      processImageWithAi(originalFile, originalImage, modelQuality);
    }
  };

  const handleUseFallback = () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setStage('Running smart edge-matting algorithm...');
    setTimeout(() => {
      try {
        const initialCanvas = imageToCanvas(originalImage);
        const fallbackCanvas = fallbackSmartBackgroundRemoval(initialCanvas);
        setCutoutCanvas(fallbackCanvas);
        setIsProcessing(false);
        setError(null);
      } catch (err) {
        console.error('Fallback failed:', err);
        setError('Failed to extract foreground with fallback.');
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalImage(null);
    setCutoutCanvas(null);
    setIsProcessing(false);
    setError(null);
    setProgress(0);
    setStage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & App Bar */}
      <Header
        hasImage={!!cutoutCanvas}
        onReset={handleReset}
        modelQuality={modelQuality}
        setModelQuality={setModelQuality}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!cutoutCanvas ? (
          <DropZone
            onImageSelected={handleImageSelected}
            modelQuality={modelQuality}
            setModelQuality={setModelQuality}
          />
        ) : (
          <EditorWorkspace
            originalImage={originalImage!}
            initialCutoutCanvas={cutoutCanvas}
            originalFilename={originalFilename}
            originalFileSize={originalFileSize}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Processing Loader & Error Overlay */}
      {isProcessing && (
        <ProcessingOverlay
          progress={progress}
          stage={stage}
          error={error}
          onRetry={handleRetryAi}
          onUseFallback={handleUseFallback}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
