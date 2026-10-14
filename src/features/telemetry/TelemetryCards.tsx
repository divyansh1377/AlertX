/**
 * DriveWatch V1 - Real-Time Telemetry Cards
 * Module: src/features/telemetry/TelemetryCards.tsx
 *
 * Displays raw biometric telemetry with precision metrics:
 * - Left EAR / Right EAR / Average EAR (target normal > 0.25)
 * - MAR (Mouth Aspect Ratio)
 * - PERCLOS (30-second rolling window, fixed 0.20 threshold)
 * - Head Pose: Pitch, Yaw, Roll (in degrees)
 *
 * Strict Guardrail: Raw telemetry measurement only, no classification badges.
 */

import React from 'react';
import type { TelemetryMetrics } from '../../types';

interface TelemetryCardsProps {
  metrics: TelemetryMetrics;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ metrics }) => {
  const { earLeft, earRight, earAvg, mar, perclosPercentage, headPose } = metrics;

  // Normalized progress widths (0 - 100%)
  const earBarWidth = Math.min(100, Math.max(0, (earAvg / 0.40) * 100));
  const marBarWidth = Math.min(100, Math.max(0, (mar / 0.80) * 100));
  const perclosBarWidth = Math.min(100, Math.max(0, perclosPercentage));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Eye Aspect Ratio (EAR) Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Eye Aspect Ratio (EAR)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-400 border border-slate-700/60">
            Target &gt; 0.25
          </span>
        </div>

        {/* Primary Average EAR Value */}
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
            {earAvg.toFixed(3)}
          </span>
          <span className="text-xs text-slate-400 font-mono">avg</span>
        </div>

        {/* Left & Right Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2 pt-2 border-t border-slate-800/80 text-slate-400">
          <div>
            <span className="text-slate-400">L: </span>
            <span className="text-slate-200 font-medium">{earLeft.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-slate-400">R: </span>
            <span className="text-slate-200 font-medium">{earRight.toFixed(3)}</span>
          </div>
        </div>

        {/* Level Bar */}
        <div className="w-full bg-slate-800/90 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              earAvg >= 0.25 ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
            style={{ width: `${earBarWidth}%` }}
          />
        </div>
      </div>

      {/* 2. Mouth Aspect Ratio (MAR) Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Mouth Aspect Ratio (MAR)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
            Aperture
          </span>
        </div>

        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
            {mar.toFixed(3)}
          </span>
          <span className="text-xs text-slate-400 font-mono">ratio</span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono my-2 pt-2 border-t border-slate-800/80 text-slate-400">
          <span>Nominal Range:</span>
          <span className="text-slate-200">0.12 - 0.45</span>
        </div>

        {/* Level Bar */}
        <div className="w-full bg-slate-800/90 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-150"
            style={{ width: `${marBarWidth}%` }}
          />
        </div>
      </div>

      {/* 3. PERCLOS Card (30-second rolling window) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            PERCLOS (30s Window)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-amber-300/90 border border-slate-700/60">
            Threshold 0.20
          </span>
        </div>

        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
            {perclosPercentage.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 font-mono">closed</span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono my-2 pt-2 border-t border-slate-800/80 text-slate-400">
          <span>Window Period:</span>
          <span className="text-slate-200">30.0 sec rolling</span>
        </div>

        {/* Level Bar */}
        <div className="w-full bg-slate-800/90 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              perclosPercentage < 15 ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
            style={{ width: `${perclosBarWidth}%` }}
          />
        </div>
      </div>

      {/* 4. Head Pose Card (Pitch, Yaw, Roll) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-200 hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Head Pose (3D)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
            Euler Angles
          </span>
        </div>

        {/* Formatted angles */}
        <div className="my-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
              {headPose.pitch > 0 ? `+${headPose.pitch}` : headPose.pitch}°
            </span>
            <span className="text-xs text-slate-400 font-mono">pitch</span>
          </div>
        </div>

        {/* Sub-angles: Yaw and Roll */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2 pt-2 border-t border-slate-800/80 text-slate-400">
          <div>
            <span className="text-slate-400">Yaw: </span>
            <span className="text-slate-200 font-medium">
              {headPose.yaw > 0 ? `+${headPose.yaw}` : headPose.yaw}°
            </span>
          </div>
          <div>
            <span className="text-slate-400">Roll: </span>
            <span className="text-slate-200 font-medium">
              {headPose.roll > 0 ? `+${headPose.roll}` : headPose.roll}°
            </span>
          </div>
        </div>

        {/* Pitch tilt guide */}
        <div className="w-full bg-slate-800/90 rounded-full h-1.5 mt-1 relative overflow-hidden">
          {/* Centered zero mark */}
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-150 absolute"
            style={{
              left: `${Math.max(0, Math.min(100, 50 + (headPose.pitch / 60) * 50))}%`,
              width: '10px',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

