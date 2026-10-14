/**
 * AlertX / DriveWatch V1 - Real-Time Telemetry Sparklines Panel
 * Module: src/features/telemetry/SparklinePanel.tsx
 *
 * Lightweight, high-performance SVG trend charts for:
 * 1. EAR Trend (with 0.25 target baseline guide)
 * 2. MAR Trend (mouth movement trend)
 * 3. PERCLOS Trend (with fixed 0.20 threshold guideline)
 * 4. Head-Pose Stability Trend (Pitch / Nodding angle trend)
 *
 * Refined 20px rounded panel with 14px rounded sparkline cards,
 * Plus Jakarta Sans tabular numbers, and zero layout shift.
 */

import React from 'react';
import type { TelemetryHistory } from '../../types';

interface SparklinePanelProps {
  history: TelemetryHistory;
}

interface MiniSparklineProps {
  title: string;
  data: { timestamp: number; value: number }[];
  minVal: number;
  maxVal: number;
  unit: string;
  currentValue: number | string;
  referenceLine?: {
    value: number;
    label: string;
  };
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({
  title,
  data,
  minVal,
  maxVal,
  unit,
  currentValue,
  referenceLine,
}) => {
  const width = 280;
  const height = 62;
  const paddingY = 6;

  // Convert data points to SVG coordinate path
  const points = data.map((d, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
    const clampedVal = Math.max(minVal, Math.min(maxVal, d.value));
    const normalizedY = (clampedVal - minVal) / Math.max(0.001, maxVal - minVal);
    const y = height - paddingY - normalizedY * (height - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD =
    points.length > 0
      ? `M ${points.join(' L ')} L ${width},${height} L 0,${height} Z`
      : '';

  // Calculate reference line Y coordinate
  let refY: number | null = null;
  if (referenceLine) {
    const clampedRef = Math.max(minVal, Math.min(maxVal, referenceLine.value));
    const norm = (clampedRef - minVal) / Math.max(0.001, maxVal - minVal);
    refY = height - paddingY - norm * (height - paddingY * 2);
  }

  const gradId = `spark-grad-${title.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="bg-[#141416] border border-white/[0.10] rounded-[14px] p-3.5 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[#858589] uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-baseline space-x-1">
          <span className="text-sm font-medium text-[#F5F5F5] metric-number">{currentValue}</span>
          <span className="text-[10px] text-[#858589]">{unit}</span>
        </div>
      </div>

      <div className="relative w-full h-16 overflow-hidden bg-[#0B0B0C] rounded-[10px] border border-white/[0.06]">
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#858589] font-medium">
            Buffering telemetry...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full block"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Base grid line */}
            <line
              x1="0"
              y1={height - paddingY}
              x2={width}
              y2={height - paddingY}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            {/* Reference guideline if specified */}
            {refY !== null && referenceLine && (
              <line
                x1="0"
                y1={refY}
                x2={width}
                y2={refY}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Area gradient */}
            <path d={areaD} fill={`url(#${gradId})`} />

            {/* Main Sparkline stroke */}
            <path
              d={pathD}
              fill="none"
              stroke="#F5F5F5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Reference label */}
        {referenceLine && (
          <div className="absolute right-2 bottom-1.5 text-[9px] text-[#858589] font-medium metric-number">
            Ref: {referenceLine.label}
          </div>
        )}
      </div>
    </div>
  );
};

export const SparklinePanel: React.FC<SparklinePanelProps> = ({ history }) => {
  const currentEar =
    history.ear.length > 0 ? history.ear[history.ear.length - 1].value.toFixed(3) : '--';
  const currentMar =
    history.mar.length > 0 ? history.mar[history.mar.length - 1].value.toFixed(3) : '--';
  const currentPerclos =
    history.perclos.length > 0
      ? `${history.perclos[history.perclos.length - 1].value.toFixed(1)}%`
      : '--';
  const currentPitch =
    history.pitch.length > 0
      ? `${history.pitch[history.pitch.length - 1].value > 0 ? '+' : ''}${history.pitch[
          history.pitch.length - 1
        ].value.toFixed(1)}°`
      : '--';

  return (
    <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[20px] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F5F5F5]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#F5F5F5]">
            Real-Time Telemetry Trends (Rolling 60s)
          </h3>
        </div>
        <span className="text-[11px] text-[#858589] font-medium metric-number">
          Sampling: ~30 FPS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* EAR Trend */}
        <MiniSparkline
          title="EAR Trend"
          data={history.ear}
          minVal={0.1}
          maxVal={0.42}
          unit="avg"
          currentValue={currentEar}
          referenceLine={{
            value: 0.25,
            label: '0.25 norm',
          }}
        />

        {/* MAR Trend */}
        <MiniSparkline
          title="MAR Trend"
          data={history.mar}
          minVal={0.1}
          maxVal={0.7}
          unit="ratio"
          currentValue={currentMar}
          referenceLine={{
            value: 0.55,
            label: '0.55 open',
          }}
        />

        {/* PERCLOS Trend */}
        <MiniSparkline
          title="PERCLOS Trend"
          data={history.perclos}
          minVal={0}
          maxVal={50}
          unit="pct"
          currentValue={currentPerclos}
          referenceLine={{
            value: 20,
            label: '20% ref',
          }}
        />

        {/* Head Pitch Stability Trend */}
        <MiniSparkline
          title="Head Pitch Angle"
          data={history.pitch}
          minVal={-35}
          maxVal={35}
          unit="deg"
          currentValue={currentPitch}
          referenceLine={{
            value: 0,
            label: '0° level',
          }}
        />
      </div>
    </div>
  );
};
