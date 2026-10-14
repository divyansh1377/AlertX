/**
 * AlertX / DriveWatch V1 - Real-Time Telemetry Cards
 * Module: src/features/telemetry/TelemetryCards.tsx
 *
 * Displays raw biometric telemetry with precision metrics:
 * - Left EAR / Right EAR / Average EAR (target normal > 0.25)
 * - MAR (Mouth Aspect Ratio)
 * - PERCLOS (30-second rolling window, fixed 0.20 threshold)
 * - Head Pose: Pitch, Yaw, Roll (in degrees)
 *
 * Audited and calibrated internal spacing:
 * - Unified 20px padding (--metric-card-padding) across all cards
 * - Standardized 16px corner radius (--radius-card)
 * - Matched vertical rhythm: Header -> Primary Metric -> Sub-readings -> Progress Indicator
 * - Zero collision or border crowding, powered by Plus Jakarta Sans tabular typography.
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

  const isEarCaution = earAvg < 0.25;
  const isPerclosCaution = perclosPercentage >= 15;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Eye Aspect Ratio (EAR) Card */}
      <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[16px] p-5 shadow-sm flex flex-col justify-between transition-colors duration-200">
        <div>
          {/* Header row: Label + Badge */}
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <span className="text-[11px] font-medium tracking-wider text-[#858589] uppercase truncate">
              Eye Aspect Ratio (EAR)
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-[8px] bg-[#252528] text-[#B5B5B8] border border-white/[0.08] shrink-0">
              Target &gt; 0.25
            </span>
          </div>

          {/* Primary Average EAR Value */}
          <div className="flex items-baseline space-x-2 mt-3 mb-3.5">
            <span
              className={`text-3xl sm:text-[32px] leading-none font-medium tracking-tight metric-number ${
                isEarCaution ? 'text-yellow-400' : 'text-[#F5F5F5]'
              }`}
            >
              {earAvg.toFixed(3)}
            </span>
            <span className="text-xs text-[#858589] font-normal">avg</span>
          </div>
        </div>

        <div>
          {/* Sub-readings: Left & Right EAR Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 pb-2.5 border-t border-white/[0.08] min-h-[40px] items-center text-xs text-[#858589]">
            <div className="flex items-center space-x-1.5 truncate">
              <span>L:</span>
              <span className="text-[#F5F5F5] font-medium metric-number">{earLeft.toFixed(3)}</span>
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <span>R:</span>
              <span className="text-[#F5F5F5] font-medium metric-number">{earRight.toFixed(3)}</span>
            </div>
          </div>

          {/* Level Track Bar */}
          <div className="w-full bg-[#252528] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-180 ${
                isEarCaution ? 'bg-yellow-400' : 'bg-[#F5F5F5]'
              }`}
              style={{ width: `${earBarWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Mouth Aspect Ratio (MAR) Card */}
      <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[16px] p-5 shadow-sm flex flex-col justify-between transition-colors duration-200">
        <div>
          {/* Header row: Label + Badge */}
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <span className="text-[11px] font-medium tracking-wider text-[#858589] uppercase truncate">
              Mouth Aspect Ratio (MAR)
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-[8px] bg-[#252528] text-[#B5B5B8] border border-white/[0.08] shrink-0">
              Aperture
            </span>
          </div>

          {/* Primary MAR Value */}
          <div className="flex items-baseline space-x-2 mt-3 mb-3.5">
            <span className="text-3xl sm:text-[32px] leading-none font-medium tracking-tight metric-number text-[#F5F5F5]">
              {mar.toFixed(3)}
            </span>
            <span className="text-xs text-[#858589] font-normal">ratio</span>
          </div>
        </div>

        <div>
          {/* Sub-readings: Nominal Range Indicator */}
          <div className="flex items-center justify-between pt-2.5 pb-2.5 border-t border-white/[0.08] min-h-[40px] text-xs text-[#858589]">
            <span>Nominal Range:</span>
            <span className="text-[#B5B5B8] font-medium metric-number">0.12 – 0.45</span>
          </div>

          {/* Level Track Bar */}
          <div className="w-full bg-[#252528] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F5F5F5] transition-all duration-180"
              style={{ width: `${marBarWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. PERCLOS Card (30-second rolling window) */}
      <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[16px] p-5 shadow-sm flex flex-col justify-between transition-colors duration-200">
        <div>
          {/* Header row: Label + Badge */}
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <span className="text-[11px] font-medium tracking-wider text-[#858589] uppercase truncate">
              PERCLOS (30s Window)
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-[8px] bg-[#252528] text-[#B5B5B8] border border-white/[0.08] shrink-0">
              Fixed 0.20
            </span>
          </div>

          {/* Primary PERCLOS Percentage */}
          <div className="flex items-baseline space-x-2 mt-3 mb-3.5">
            <span
              className={`text-3xl sm:text-[32px] leading-none font-medium tracking-tight metric-number ${
                isPerclosCaution ? 'text-yellow-400' : 'text-[#F5F5F5]'
              }`}
            >
              {perclosPercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-[#858589] font-normal">closed</span>
          </div>
        </div>

        <div>
          {/* Sub-readings: Rolling Window Duration */}
          <div className="flex items-center justify-between pt-2.5 pb-2.5 border-t border-white/[0.08] min-h-[40px] text-xs text-[#858589]">
            <span>Rolling Window:</span>
            <span className="text-[#B5B5B8] font-medium metric-number">30.0s window</span>
          </div>

          {/* Level Track Bar */}
          <div className="w-full bg-[#252528] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-180 ${
                isPerclosCaution ? 'bg-yellow-400' : 'bg-[#F5F5F5]'
              }`}
              style={{ width: `${perclosBarWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Head Pose Card (Pitch, Yaw, Roll) */}
      <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[16px] p-5 shadow-sm flex flex-col justify-between transition-colors duration-200">
        <div>
          {/* Header row: Label + Badge */}
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <span className="text-[11px] font-medium tracking-wider text-[#858589] uppercase truncate">
              Head Pose (3D)
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-[8px] bg-[#252528] text-[#B5B5B8] border border-white/[0.08] shrink-0">
              Euler Angles
            </span>
          </div>

          {/* Primary Pitch Angle */}
          <div className="flex items-baseline space-x-2 mt-3 mb-3.5">
            <span className="text-3xl sm:text-[32px] leading-none font-medium tracking-tight metric-number text-[#F5F5F5]">
              {headPose.pitch > 0 ? `+${headPose.pitch}` : headPose.pitch}°
            </span>
            <span className="text-xs text-[#858589] font-normal">pitch</span>
          </div>
        </div>

        <div>
          {/* Sub-readings: Yaw and Roll Angles */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 pb-2.5 border-t border-white/[0.08] min-h-[40px] items-center text-xs text-[#858589]">
            <div className="flex items-center space-x-1.5 truncate">
              <span>Yaw:</span>
              <span className="text-[#F5F5F5] font-medium metric-number">
                {headPose.yaw > 0 ? `+${headPose.yaw}` : headPose.yaw}°
              </span>
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <span>Roll:</span>
              <span className="text-[#F5F5F5] font-medium metric-number">
                {headPose.roll > 0 ? `+${headPose.roll}` : headPose.roll}°
              </span>
            </div>
          </div>

          {/* Level Pitch Horizon Track Guide */}
          <div className="w-full bg-[#252528] rounded-full h-1.5 mt-2 relative overflow-hidden">
            {/* Center Zero Tick */}
            <div className="w-[1px] h-full bg-white/25 absolute left-1/2 -translate-x-1/2 z-0" />
            {/* Pitch Position Slider Indicator */}
            <div
              className="h-full bg-[#F5F5F5] rounded-full transition-all duration-180 absolute z-10"
              style={{
                left: `${Math.max(0, Math.min(100, 50 + (headPose.pitch / 60) * 50))}%`,
                width: '8px',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
