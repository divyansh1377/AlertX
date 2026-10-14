/**
 * DriveWatch V1 - Personalized Driver Dashboard
 * Module: src/components/Dashboard.tsx
 *
 * Professional fleet-monitoring automotive cockpit layout:
 * - Top Bar: Driver Name & ID, Vehicle ID, Session ID, Active Session Timer, Status Indicator
 * - Webcam & Canvas Landmark Viewport (pause/resume, fullscreen, reset)
 * - Real-Time Telemetry Cards: EAR (Left, Right, Avg), MAR, PERCLOS (30s window), Head Pose
 * - Monitoring Status & V1 Limitations Notice (Strictly no ML classification)
 * - Rolling Telemetry Trends & Sparkline Panel
 */

import React, { useState, useEffect } from 'react';
import type { DriverProfile } from '../types';
import { useDrowsinessPipeline } from '../hooks/useDrowsinessPipeline';
import { TelemetryCards } from '../features/telemetry/TelemetryCards';
import { SparklinePanel } from '../features/telemetry/SparklinePanel';
import { WebcamViewport } from '../features/viewport/WebcamViewport';
import { MonitoringStatusNotice } from '../features/status/MonitoringStatusNotice';

interface DashboardProps {
  driver: DriverProfile;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ driver, onLogout }) => {
  // Connect with the real-time processing pipeline hook
  const {
    videoRef,
    canvasRef,
    metrics,
    history,
    isCameraActive,
    isPaused,
    hasCameraError,
    cameraErrorMessage,
    isUsingSimulator,
    showMeshOverlay,
    toggleCameraPause,
    toggleMeshOverlay,
    resetSession,
  } = useDrowsinessPipeline();

  // Active Session State
  const [sessionId] = useState<string>(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `SES-${dateStr}-${randNum}`;
  });

  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Live session counter timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* =========================================================================
          A. HEADER / TOP BAR
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Fleet ID */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center font-extrabold text-slate-950 font-mono shadow-md shadow-cyan-900/40">
                DW
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    DriveWatch
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    V1
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  VIT Chennai IDP • Fleet Telemetry
                </div>
              </div>
            </div>

            {/* Mobile Exit Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Session & Status Telemetry Center */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono">
            {/* System Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                Monitoring Active
              </span>
            </div>

            {/* Camera Status */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300">
              <span className="text-slate-400">FEED:</span>
              <span className={isCameraActive ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                {isCameraActive ? 'Camera Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Session ID */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400">
              <span className="text-slate-400">SESSION:</span>
              <span className="text-slate-200">{sessionId}</span>
            </div>

            {/* Active Session Live Counter */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300">
              <span className="text-slate-400">TIMER:</span>
              <span className="text-cyan-400 font-bold">{formatTimer(sessionSeconds)}</span>
            </div>
          </div>

          {/* Driver Profile Badge & Logout */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center font-bold font-mono text-xs">
                {driver.name.charAt(0)}
              </div>
              <div className="text-left font-mono">
                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {driver.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {driver.driverId} • {driver.vehicleId}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sign Out of Driver Session"
              className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-colors"
              aria-label="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN FLEET COCKPIT DASHBOARD BODY
          ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* D. Monitoring Status & Limitations Notice */}
        <MonitoringStatusNotice
          metrics={metrics}
          isCameraActive={isCameraActive}
          isPaused={isPaused}
        />

        {/* Primary Viewport & Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* B. Live Webcam Viewport Wrapper */}
          <div className="lg:col-span-8 flex flex-col justify-start">
            <WebcamViewport
              videoRef={videoRef}
              canvasRef={canvasRef}
              metrics={metrics}
              isCameraActive={isCameraActive}
              isPaused={isPaused}
              hasCameraError={hasCameraError}
              cameraErrorMessage={cameraErrorMessage}
              isUsingSimulator={isUsingSimulator}
              showMeshOverlay={showMeshOverlay}
              onTogglePause={toggleCameraPause}
              onToggleMesh={toggleMeshOverlay}
              onResetSession={resetSession}
            />
          </div>

          {/* Quick Vehicle / Driver Overview Panel */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            {/* Vehicle Profile Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Vehicle Unit Telemetry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                  ONLINE
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Unit:</span>
                  <span className="text-slate-200 font-semibold">{driver.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Driver:</span>
                  <span className="text-slate-200 font-semibold">{driver.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver License ID:</span>
                  <span className="text-cyan-400 font-semibold">{driver.driverId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session Started:</span>
                  <span className="text-slate-200">
                    {new Date(driver.loginTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Biometric Guidance Reference Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Baseline Reference Specs
                  </span>
                </div>

                <ul className="space-y-2 text-xs font-mono text-slate-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-cyan-400">▪</span>
                    <span>
                      <strong className="text-slate-200">EAR Baseline:</strong> Standard nominal
                      alertness is &gt; 0.25. Blink dips under 0.20 designate closure.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-cyan-400">▪</span>
                    <span>
                      <strong className="text-slate-200">PERCLOS 30s:</strong> Proportion of
                      frames closed over rolling 30 seconds (fixed 0.20 threshold).
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-cyan-400">▪</span>
                    <span>
                      <strong className="text-slate-200">Head Pose:</strong> Negative pitch indicates
                      downward nodding; high yaw indicates lateral gaze diversion.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400">
                ⚡ Real-time client inference via MediaPipe CDN WebAssembly pipeline.
              </div>
            </div>
          </div>
        </div>

        {/* C. Real-Time Telemetry Cards */}
        <TelemetryCards metrics={metrics} />

        {/* E. Trends / Sparkline Panel */}
        <SparklinePanel history={history} />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-800/80 bg-slate-950 text-center text-xs font-mono text-slate-400">
        DriveWatch V1 • Real-Time Driver Drowsiness Measurement Prototype • VIT Chennai IDP 2026
      </footer>
    </div>
  );
};

