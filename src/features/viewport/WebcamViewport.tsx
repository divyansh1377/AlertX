/**
 * AlertX / DriveWatch V1 - Live Webcam Monitoring Viewport
 * Module: src/features/viewport/WebcamViewport.tsx
 *
 * Premium automotive camera HUD:
 * - HTML5 video streaming with mirror transformation
 * - Transparent canvas overlay for MediaPipe landmark tracking
 * - Refined 20px rounded viewport container with 12px rounded action buttons
 * - High-contrast monochromatic controls with 44px touch targets and smooth hover/press states
 * - Preserves video stream stability and landmark visibility without obscuring overlays
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
      className={`relative w-full rounded-[20px] overflow-hidden bg-[#141416] border border-white/[0.12] shadow-xl flex flex-col justify-between ${
        isFullscreen ? 'h-screen p-6' : 'aspect-video min-h-[360px] sm:min-h-[420px]'
      }`}
    >
      {/* 1. Viewport Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 p-3.5 sm:p-4 z-20 flex items-center justify-between pointer-events-none bg-gradient-to-b from-[#0B0B0C]/90 via-[#0B0B0C]/40 to-transparent">
        {/* Sensor Status Pill */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-[8px] bg-[#1C1C1F]/90 border border-white/[0.10] backdrop-blur-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                hasCameraError
                  ? 'bg-red-500'
                  : isPaused
                  ? 'bg-yellow-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] tracking-wider text-[#F5F5F5] uppercase font-medium">
              {hasCameraError
                ? 'Camera Error (Sim Active)'
                : isPaused
                ? 'Stream Paused'
                : 'Optical Sensor 01'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-[8px] bg-[#1C1C1F]/80 border border-white/[0.08] text-[11px] text-[#858589]">
            <span>RES:</span>
            <span className="text-[#B5B5B8] metric-number">640x480</span>
          </div>

          {isUsingSimulator && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-[8px] bg-[#252528] border border-white/[0.12] text-[#B5B5B8] font-medium">
              SYNTHETIC SIMULATOR
            </span>
          )}
        </div>

        {/* Real-time Tracking Badge */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1 rounded-[8px] text-[11px] font-medium tracking-wide uppercase border backdrop-blur-sm ${
              metrics.faceDetected
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-yellow-950/50 border-yellow-500/30 text-yellow-300 animate-pulse'
            }`}
          >
            {metrics.faceDetected ? '● Face Tracked' : '○ Searching Face'}
          </div>
        </div>
      </div>

      {/* 2. Video Feed and Landmarks Canvas Stack */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0B0B0C]">
        {/* HTML5 Video Element (mirrored for natural driver feedback) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
            isCameraActive && !isUsingSimulator ? 'opacity-90' : 'opacity-25'
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
            <div className="w-44 h-60 border border-dashed border-white/[0.20] rounded-[24px] flex flex-col items-center justify-center bg-[#1C1C1F]/40 backdrop-blur-[1px]">
              <div className="w-3 h-3 rounded-full bg-[#F5F5F5]/40 mb-3 animate-ping" />
              <span className="text-xs text-[#B5B5B8] font-medium tracking-wider">
                DRIVER TARGET RIG
              </span>
              <span className="text-[10px] text-[#858589] mt-1 metric-number">
                Pitch: {metrics.headPose.pitch}° | Yaw: {metrics.headPose.yaw}°
              </span>
            </div>
          </div>
        )}

        {/* Pause Overlay Mask */}
        {isPaused && (
          <div className="absolute inset-0 bg-[#0B0B0C]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="p-5 rounded-[18px] bg-[#1C1C1F] border border-white/[0.12] text-center shadow-xl max-w-xs">
              <svg
                className="w-7 h-7 text-yellow-400 mx-auto mb-2"
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
              <div className="text-xs font-medium text-[#F5F5F5] uppercase tracking-wider">
                Monitoring Stream Paused
              </div>
              <p className="text-[11px] text-[#858589] mt-1">
                Telemetry computation suspended
              </p>
            </div>
          </div>
        )}

        {/* Understated Reticle Corners */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-white/20 pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-white/20 pointer-events-none z-10" />
        <div className="absolute bottom-16 left-4 w-5 h-5 border-b border-l border-white/20 pointer-events-none z-10" />
        <div className="absolute bottom-16 right-4 w-5 h-5 border-b border-r border-white/20 pointer-events-none z-10" />

        {hasCameraError && (
          <details className="absolute top-14 left-4 right-4 z-20 p-3 rounded-[12px] bg-red-950/60 border border-red-500/30 text-red-200 text-xs cursor-pointer">
            <summary className="flex items-center justify-between">
              <span>⚠ Camera unavailable — using fallback simulator</span>
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">{cameraErrorMessage}</pre>
          </details>
        )}
      </div>

      {/* 3. Bottom Controls Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-20 flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/80 to-transparent">
        {/* Left Stats Indicator */}
        <div className="flex items-center space-x-3 text-xs text-[#858589]">
          <span>FPS: <strong className="text-[#F5F5F5] font-medium metric-number">{metrics.fps}</strong></span>
          <span className="hidden sm:inline text-white/10">|</span>
          <span className="hidden sm:inline">
            Inference: <strong className="text-[#F5F5F5] font-medium metric-number">{metrics.inferenceTimeMs}ms</strong>
          </span>
        </div>

        {/* Right Action Control Buttons */}
        <div className="flex items-center space-x-2">
          {/* Toggle Mesh Overlay */}
          <button
            type="button"
            onClick={onToggleMesh}
            title="Toggle Facial Landmark Mesh"
            className={`min-h-[44px] px-4 py-2 rounded-[12px] text-xs font-medium transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E5E5E5] active:scale-[0.98] ${
              showMeshOverlay
                ? 'bg-[#252528] border border-white/[0.22] text-[#F5F5F5] hover:bg-white/[0.12]'
                : 'bg-[#1C1C1F] border border-white/[0.10] text-[#858589] hover:text-[#F5F5F5] hover:border-white/[0.20]'
            }`}
          >
            Mesh {showMeshOverlay ? 'ON' : 'OFF'}
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            className={`min-h-[44px] px-4 py-2 rounded-[12px] text-xs font-medium border transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E5E5E5] active:scale-[0.98] ${
              isPaused
                ? 'bg-[#252528] border-yellow-500/40 text-yellow-300 hover:bg-yellow-950/40'
                : 'bg-[#252528] border-white/[0.12] text-[#F5F5F5] hover:bg-white/[0.12] hover:border-white/[0.25]'
            }`}
          >
            <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
          </button>

          {/* Reset Session */}
          <button
            type="button"
            onClick={onResetSession}
            title="Reset Rolling Window & Metrics"
            className="min-h-[44px] px-4 py-2 rounded-[12px] text-xs font-medium bg-[#1C1C1F] border border-white/[0.10] text-[#B5B5B8] hover:text-[#F5F5F5] hover:bg-white/[0.08] hover:border-white/[0.20] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E5E5E5] active:scale-[0.98]"
          >
            ↺ Reset
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#1C1C1F] border border-white/[0.10] text-[#B5B5B8] hover:text-[#F5F5F5] hover:bg-white/[0.08] hover:border-white/[0.20] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E5E5E5] active:scale-[0.98]"
            aria-label="Toggle Fullscreen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
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
