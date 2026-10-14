/**
 * DriveWatch V1 - Live Webcam Monitoring Viewport
 * Module: src/features/viewport/WebcamViewport.tsx
 *
 * Provides a high aspect-ratio automotive camera HUD:
 * - HTML5 video streaming with mirror transformation
 * - Transparent canvas overlay for MediaPipe 468 landmark tracking
 * - Controls: Camera Pause/Resume, Mesh Overlay Toggle, Fullscreen, Reset Session
 * - Hardware corner reticles and status badges
 */

import React, { useRef, useState, useEffect } from 'react';
import type { TelemetryMetrics } from '../../types';

interface WebcamViewportProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  metrics: TelemetryMetrics;
  isCameraActive: boolean;
  isPaused: boolean;
  hasCameraError: boolean;
  cameraErrorMessage: string;
  isUsingSimulator: boolean;
  showMeshOverlay: boolean;
  onTogglePause: () => void;
  onToggleMesh: () => void;
  onResetSession: () => void;
}

export const WebcamViewport: React.FC<WebcamViewportProps> = ({
  videoRef,
  canvasRef,
  metrics,
  isCameraActive,
  isPaused,
  hasCameraError,
  cameraErrorMessage,
  isUsingSimulator,
  showMeshOverlay,
  onTogglePause,
  onToggleMesh,
  onResetSession,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Handle Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or blocked
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between ${
        isFullscreen ? 'h-screen p-6' : 'aspect-video min-h-[380px] sm:min-h-[440px]'
      }`}
    >
      {/* 1. Viewport Top HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between pointer-events-none bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        {/* Sensor Status Pill */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                hasCameraError
                  ? 'bg-rose-500'
                  : isPaused
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono tracking-wider font-semibold text-slate-200 uppercase">
              {hasCameraError
                ? 'Camera Error (Sim Active)'
                : isPaused
                ? 'Stream Paused'
                : 'Optical Sensor 01'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span>RES:</span>
            <span className="text-slate-200">640x480</span>
          </div>

          {isUsingSimulator && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              SYNTHETIC SIMULATOR
            </span>
          )}
        </div>

        {/* Real-time Tracking Badge */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider uppercase border backdrop-blur-md ${
              metrics.faceDetected
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-400'
                : 'bg-amber-950/70 border-amber-700 text-amber-400 animate-pulse'
            }`}
          >
            {metrics.faceDetected ? '● Face Tracked' : '○ Searching Face'}
          </div>
        </div>
      </div>

      {/* 2. Video Feed and Landmarks Canvas Stack */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
        {/* HTML5 Video Element (mirrored for natural driver feedback) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
            isCameraActive && !isUsingSimulator ? 'opacity-90' : 'opacity-20'
          }`}
        />

        {/* MediaPipe Transparent Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10"
        />

        {/* Simulated Camera Backdrop if camera is unavailable or in synthetic mode */}
        {isUsingSimulator && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="w-48 h-64 border-2 border-dashed border-cyan-500/30 rounded-full flex flex-col items-center justify-center bg-cyan-950/10 backdrop-blur-[1px]">
              <div className="w-4 h-4 rounded-full bg-cyan-400/40 mb-3 animate-ping" />
              <span className="text-xs font-mono text-cyan-300 tracking-wider">
                DRIVER TARGET RIG
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                Pitch: {metrics.headPose.pitch}° | Yaw: {metrics.headPose.yaw}°
              </span>
            </div>
          </div>
        )}

        {/* Pause Overlay Mask */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-xl">
              <svg
                className="w-8 h-8 text-amber-400 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
                Monitoring Stream Paused
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Telemetry computation suspended
              </p>
            </div>
          </div>
        )}

        {/* Hardware Frame Reticles (Samsara/Automotive Cockpit Design) */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-slate-600 pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-slate-600 pointer-events-none z-10" />
        <div className="absolute bottom-16 left-4 w-6 h-6 border-b-2 border-l-2 border-slate-600 pointer-events-none z-10" />
        <div className="absolute bottom-16 right-4 w-6 h-6 border-b-2 border-r-2 border-slate-600 pointer-events-none z-10" />

        {/* Warning notification banner if camera permission issue */}
        {hasCameraError && (
          <div className="absolute top-16 left-4 right-4 z-20 p-2.5 rounded-lg bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs font-mono flex items-center justify-between">
            <span>⚠ Camera Notice: {cameraErrorMessage} (Active in Demo Mode)</span>
          </div>
        )}
      </div>

      {/* 3. Viewport Bottom Controls Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        {/* Left Stats Indicator */}
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span>FPS: <strong className="text-slate-200">{metrics.fps}</strong></span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            Inference: <strong className="text-slate-200">{metrics.inferenceTimeMs}ms</strong>
          </span>
        </div>

        {/* Right Action Control Buttons */}
        <div className="flex items-center space-x-2">
          {/* Toggle Mesh Overlay */}
          <button
            type="button"
            onClick={onToggleMesh}
            title="Toggle Facial Landmark Mesh"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all duration-150 ${
              showMeshOverlay
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 hover:bg-cyan-900/80'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Mesh {showMeshOverlay ? 'ON' : 'OFF'}
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all duration-150 flex items-center space-x-1.5 ${
              isPaused
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 hover:bg-emerald-900'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
          </button>

          {/* Reset Session */}
          <button
            type="button"
            onClick={onResetSession}
            title="Reset Rolling Window & Metrics"
            className="px-3 py-1.5 rounded-lg text-xs font-medium font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
          >
            ↺ Reset
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
            aria-label="Toggle Fullscreen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

