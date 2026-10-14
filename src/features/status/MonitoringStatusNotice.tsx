/**
 * AlertX / DriveWatch V1 - Monitoring Status & Limitations Notice
 * Module: src/features/status/MonitoringStatusNotice.tsx
 *
 * CRITICAL GUARDRAIL COMPONENT:
 * Explicitly displays system operational status without ML classification:
 * - Active Status: `Monitoring Active`
 * - Prominent Notice: `Drowsiness Classification: Not Available in V1`
 * - Hardware Telemetry: FPS, Face Detection Status, Pipeline Latency, Camera Feed
 * - Refined 18px rounded container with 10px rounded diagnostic pills.
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
    <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[18px] p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: System Status & V1 Limitation Disclosure */}
        <div className="flex items-start space-x-3.5">
          <div className="mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPaused ? 'bg-yellow-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isPaused ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium tracking-wider text-[#858589] uppercase">
                System Status:
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-[10px] text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                {isPaused ? 'Monitoring Paused' : 'Monitoring Active'}
              </span>

              {/* Explicit Mandatory V1 Limitation Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-[10px] text-xs font-medium bg-[#252528] text-[#F5F5F5] border border-white/[0.12]">
                Drowsiness Classification: Not Available in V1
              </span>
            </div>

            <p className="text-xs text-[#858589] mt-2 max-w-2xl leading-relaxed">
              AlertX V1 is strictly an empirical telemetry measurement prototype.
              It captures real-time biometric indicators (EAR, MAR, Head Pose, 30s PERCLOS) for experimental validation.
              Automated fatigue inference algorithms are not implemented in V1.
            </p>
          </div>
        </div>

        {/* Right: Hardware & Telemetry Diagnostics */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.08] text-xs">
          {/* Face Detection Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-[10px] bg-[#141416] border border-white/[0.08]">
            <span className="text-[#858589]">Target:</span>
            <span
              className={`font-medium ${
                metrics.faceDetected ? 'text-emerald-400' : 'text-yellow-400'
              }`}
            >
              {metrics.faceDetected ? 'Face Detected' : 'Searching...'}
            </span>
          </div>

          {/* FPS Counter */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-[10px] bg-[#141416] border border-white/[0.08]">
            <span className="text-[#858589]">Stream:</span>
            <span className="text-[#F5F5F5] font-medium metric-number">
              {metrics.fps > 0 ? `${metrics.fps} FPS` : '--'}
            </span>
          </div>

          {/* Inference Latency */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-[10px] bg-[#141416] border border-white/[0.08]">
            <span className="text-[#858589]">Latency:</span>
            <span className="text-[#F5F5F5] font-medium metric-number">
              {metrics.inferenceTimeMs > 0 ? `${metrics.inferenceTimeMs}ms` : '<10ms'}
            </span>
          </div>

          {/* Camera Feed Health */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-[10px] bg-[#141416] border border-white/[0.08]">
            <span className="text-[#858589]">Feed:</span>
            <span
              className={`font-medium ${
                isCameraActive ? 'text-emerald-400' : 'text-red-400'
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
