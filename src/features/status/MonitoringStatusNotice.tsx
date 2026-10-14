/**
 * DriveWatch V1 - Monitoring Status & Limitations Notice
 * Module: src/features/status/MonitoringStatusNotice.tsx
 *
 * CRITICAL GUARDRAIL COMPONENT:
 * Explicitly displays system operational status without ML classification:
 * - Active Status: `Monitoring Active`
 * - Prominent Notice: `Drowsiness Classification: Not Available in V1`
 * - Hardware Telemetry: FPS, Face Detection Status, Pipeline Latency
 */

import React from 'react';
import type { TelemetryMetrics } from '../../types';

interface MonitoringStatusNoticeProps {
  metrics: TelemetryMetrics;
  isCameraActive: boolean;
  isPaused: boolean;
}

export const MonitoringStatusNotice: React.FC<MonitoringStatusNoticeProps> = ({
  metrics,
  isCameraActive,
  isPaused,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: System Status & V1 Limitation Disclosure */}
        <div className="flex items-start space-x-3.5">
          <div className="mt-1">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                System Status:
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                {isPaused ? 'Monitoring Paused' : 'Monitoring Active'}
              </span>

              {/* Explicit Mandatory V1 Limitation Badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Drowsiness Classification: Not Available in V1
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              DriveWatch V1 is strictly an empirical telemetry measurement prototype (VIT Chennai IDP).
              It captures real-time biometric indicators (EAR, MAR, Head Pose, 30s PERCLOS) for experimental validation.
              Automated fatigue inference algorithms are not implemented in V1.
            </p>
          </div>
        </div>

        {/* Right: Hardware & Telemetry Diagnostics */}
        <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 text-xs font-mono">
          {/* Face Detection Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Target:</span>
            <span
              className={`font-semibold ${
                metrics.faceDetected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {metrics.faceDetected ? 'Face Detected' : 'Searching...'}
            </span>
          </div>

          {/* FPS Counter */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Stream:</span>
            <span className="font-semibold text-slate-200">
              {metrics.fps > 0 ? `${metrics.fps} FPS` : '--'}
            </span>
          </div>

          {/* Inference Latency */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Latency:</span>
            <span className="font-semibold text-cyan-400">
              {metrics.inferenceTimeMs > 0 ? `${metrics.inferenceTimeMs}ms` : '<10ms'}
            </span>
          </div>

          {/* Camera Feed Health */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Feed:</span>
            <span
              className={`font-semibold ${
                isCameraActive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isCameraActive ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

