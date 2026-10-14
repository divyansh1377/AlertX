/**
 * DriveWatch V1 - Real-Time Telemetry Sparklines Panel
 * Module: src/features/telemetry/SparklinePanel.tsx
 *
 * Lightweight, high-performance SVG trend charts for:
 * 1. EAR Trend (with 0.25 target baseline guide)
 * 2. MAR Trend (mouth movement trend)
 * 3. PERCLOS Trend (with fixed 0.20 threshold guideline)
 * 4. Head-Pose Stability Trend (Pitch / Nodding angle trend)
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
  strokeColor: string;
  fillColor: string;
  unit: string;
  currentValue: number | string;
  referenceLine?: {
    value: number;
    label: string;
    color: string;
  };
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({
  title,
  data,
  minVal,
  maxVal,
  strokeColor,
  fillColor,
  unit,
  currentValue,
  referenceLine,
}) => {
  const width = 280;
  const height = 64;
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

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700/80 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-baseline space-x-1 font-mono">
          <span className="text-sm font-bold text-slate-100">{currentValue}</span>
          <span className="text-[10px] text-slate-400">{unit}</span>
        </div>
      </div>

      <div className="relative w-full h-16 overflow-hidden bg-slate-950/50 rounded border border-slate-900">
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-full text-[11px] font-mono text-slate-400">
            Collecting stream data...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full preserve-3d"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid baseline */}
            <line
              x1="0"
              y1={height - paddingY}
              x2={width}
              y2={height - paddingY}
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            {/* Reference guideline if specified */}
            {refY !== null && referenceLine && (
              <g>
                <line
                  x1="0"
                  y1={refY}
                  x2={width}
                  y2={refY}
                  stroke={referenceLine.color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            )}

            {/* Area gradient */}
            <path d={areaD} fill={`url(#grad-${title})`} />

            {/* Main Sparkline stroke */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Reference line tag */}
        {referenceLine && (
          <div className="absolute right-1 bottom-1 text-[9px] font-mono text-slate-400">
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Real-Time Telemetry Trends (Rolling 60s)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Sample rate: ~30 FPS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* EAR Trend */}
        <MiniSparkline
          title="EAR Trend"
          data={history.ear}
          minVal={0.1}
          maxVal={0.42}
          strokeColor="#38bdf8"
          fillColor="#38bdf8"
          unit="avg"
          currentValue={currentEar}
          referenceLine={{
            value: 0.25,
            label: '0.25 norm',
            color: 'rgba(56, 189, 248, 0.5)',
          }}
        />

        {/* MAR Trend */}
        <MiniSparkline
          title="MAR Trend"
          data={history.mar}
          minVal={0.1}
          maxVal={0.7}
          strokeColor="#06b6d4"
          fillColor="#06b6d4"
          unit="ratio"
          currentValue={currentMar}
          referenceLine={{
            value: 0.55,
            label: '0.55 open',
            color: 'rgba(245, 158, 11, 0.5)',
          }}
        />

        {/* PERCLOS Trend */}
        <MiniSparkline
          title="PERCLOS Trend"
          data={history.perclos}
          minVal={0}
          maxVal={50}
          strokeColor="#10b981"
          fillColor="#10b981"
          unit="pct"
          currentValue={currentPerclos}
          referenceLine={{
            value: 20,
            label: '20% ref',
            color: 'rgba(239, 68, 68, 0.5)',
          }}
        />

        {/* Head Pitch Stability Trend */}
        <MiniSparkline
          title="Head Pitch Angle"
          data={history.pitch}
          minVal={-35}
          maxVal={35}
          strokeColor="#a855f7"
          fillColor="#a855f7"
          unit="deg"
          currentValue={currentPitch}
          referenceLine={{
            value: 0,
            label: '0° level',
            color: 'rgba(168, 85, 247, 0.4)',
          }}
        />
      </div>
    </div>
  );
};

