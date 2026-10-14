/**
 * AlertX / DriveWatch V1 - Personalized Driver Dashboard
 * Module: src/components/Dashboard.tsx
 *
 * Professional fleet-monitoring automotive cockpit layout:
 * - Top Bar: Driver Name & ID, Vehicle ID, Session ID, Active Session Timer, Status Indicator
 * - Webcam & Canvas Landmark Viewport (pause/resume, fullscreen, reset)
 * - Real-Time Telemetry Cards: EAR (Left, Right, Avg), MAR, PERCLOS (30s window), Head Pose
 * - Monitoring Status & V1 Limitations Notice (Strictly no ML classification)
 * - Rolling Telemetry Trends & Sparkline Panel
 *
 * Polished monochrome aesthetic with 20px rounded panels, 16px metric cards,
 * 12px controls, Plus Jakarta Sans typography, and audited grid alignment.
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
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#252528] selection:text-[#FFFFFF]">
      {/* =========================================================================
          A. HEADER / TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#141416]/95 border-b border-white/[0.10] backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & System Tag */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#252528] border border-white/[0.12] flex items-center justify-center font-medium text-[#F5F5F5] text-xs">
                AX
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-sm tracking-tight text-[#F5F5F5]">
                    AlertX
                  </span>
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] bg-[#252528] text-[#B5B5B8] border border-white/[0.10]">
                    V1
                  </span>
                </div>
                <div className="text-[10px] text-[#858589] tracking-wider uppercase font-medium">
                  Driver Safety Telemetry
                </div>
              </div>
            </div>

            {/* Mobile Exit Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[44px] px-3.5 py-2 rounded-[12px] text-xs font-medium bg-[#252528] text-[#B5B5B8] hover:text-[#F5F5F5] border border-white/[0.10] active:scale-[0.98] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Session & Status Telemetry Center */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
            {/* System Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1C1C1F] border border-white/[0.10]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-emerald-300 uppercase tracking-wider text-[11px]">
                Monitoring Active
              </span>
            </div>

            {/* Camera Status */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1F] border border-white/[0.10] text-[#B5B5B8]">
              <span className="text-[#858589]">FEED:</span>
              <span className={isCameraActive ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                {isCameraActive ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Session ID */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1F] border border-white/[0.10] text-[#858589]">
              <span>SESSION:</span>
              <span className="text-[#B5B5B8] metric-number">{sessionId}</span>
            </div>

            {/* Active Session Live Counter */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1F] border border-white/[0.10] text-[#B5B5B8]">
              <span className="text-[#858589]">TIMER:</span>
              <span className="text-[#F5F5F5] font-medium metric-number">{formatTimer(sessionSeconds)}</span>
            </div>
          </div>

          {/* Driver Profile Badge & Logout (Desktop) */}
          <div className="hidden md:flex items-center space-x-2.5">
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-[12px] bg-[#1C1C1F] border border-white/[0.10]">
              <div className="w-6 h-6 rounded-full bg-[#252528] text-[#F5F5F5] border border-white/[0.12] flex items-center justify-center font-medium text-[11px]">
                {driver.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-[#F5F5F5] leading-tight">
                  {driver.name}
                </div>
                <div className="text-[10px] text-[#858589] leading-tight mt-0.5">
                  {driver.driverId} • {driver.vehicleId}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sign Out of Driver Session"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-[12px] bg-[#1C1C1F] border border-white/[0.10] text-[#858589] hover:text-[#F5F5F5] hover:bg-white/[0.08] hover:border-white/[0.20] active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E5E5E5]"
              aria-label="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Monitoring Status & Limitations Notice */}
        <MonitoringStatusNotice
          metrics={metrics}
          isCameraActive={isCameraActive}
          isPaused={isPaused}
        />

        {/* Viewport & Fleet Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Live Camera Feed */}
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

          {/* Vehicle Profile & Telemetry Guidance Side Cards */}
          <div className="lg:col-span-4 flex flex-col space-y-4 sm:space-y-5">
            {/* Vehicle Profile Card with 20px radius */}
            <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[20px] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-white/[0.08]">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F5F5F5]">
                  Vehicle Unit Telemetry
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-[6px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium">
                  ONLINE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#858589]">Vehicle Unit:</span>
                  <span className="text-[#F5F5F5] font-medium">{driver.vehicleId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#858589]">Assigned Driver:</span>
                  <span className="text-[#F5F5F5] font-medium">{driver.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#858589]">Driver License ID:</span>
                  <span className="text-[#F5F5F5] font-medium metric-number">{driver.driverId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#858589]">Session Start:</span>
                  <span className="text-[#B5B5B8] metric-number">
                    {new Date(driver.loginTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Biometric Guidance Reference Card with 20px radius */}
            <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[20px] p-5 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-2.5 mb-3.5 border-b border-white/[0.08]">
                  <span className="text-xs font-medium uppercase tracking-wider text-[#F5F5F5]">
                    Baseline Reference Specs
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-[#858589]">
                  <li className="flex items-start space-x-2.5">
                    <span className="text-[#F5F5F5] leading-none mt-1">▪</span>
                    <span className="leading-relaxed">
                      <strong className="text-[#F5F5F5] font-medium">EAR Baseline:</strong> Nominal
                      range is &gt; 0.25. Frame dips under 0.20 designate eyelid closure.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-[#F5F5F5] leading-none mt-1">▪</span>
                    <span className="leading-relaxed">
                      <strong className="text-[#F5F5F5] font-medium">PERCLOS 30s:</strong> Proportion of
                      closed frames over 30s rolling window (0.20 fixed threshold).
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-[#F5F5F5] leading-none mt-1">▪</span>
                    <span className="leading-relaxed">
                      <strong className="text-[#F5F5F5] font-medium">Head Pose:</strong> Negative pitch
                      indicates downward nodding; lateral yaw indicates diversion.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-3 rounded-[12px] bg-[#141416] border border-white/[0.08] text-[11px] text-[#858589] leading-relaxed">
                Continuous client inference via MediaPipe WebAssembly.
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Telemetry Cards */}
        <TelemetryCards metrics={metrics} />

        {/* Trends / Sparkline Panel */}
        <SparklinePanel history={history} />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-white/[0.08] bg-[#0B0B0C] text-center text-xs text-[#858589]">
        AlertX V1 • Real-Time Driver Drowsiness Monitoring Prototype
      </footer>
    </div>
  );
};
