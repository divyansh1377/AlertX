/**
 * DriveWatch V1 - Driver Login View
 * Module: src/components/Login.tsx
 *
 * Samsara + Tesla inspired dark automotive cockpit aesthetic.
 * Client-side mock authentication with local state and localStorage persistence.
 */

import React, { useState } from 'react';
import type { DriverProfile } from '../types';

interface LoginProps {
  onLoginSuccess: (profile: DriverProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [driverIdentifier, setDriverIdentifier] = useState<string>('DRV-8492');
  const [driverName, setDriverName] = useState<string>('Capt. Alex Vance');
  const [vehicleId, setVehicleId] = useState<string>('TRK-VIT-01');
  const [password, setPassword] = useState<string>('drivewatch2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!driverIdentifier.trim()) {
      setErrorMessage('Please enter a Driver ID or Email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your security access password.');
      return;
    }

    setIsLoading(true);

    // Simulate fast edge-verification transition
    setTimeout(() => {
      const profile: DriverProfile = {
        driverId: driverIdentifier.trim().toUpperCase(),
        name: driverName.trim() || 'Driver Operator',
        vehicleId: vehicleId.trim() || 'UNIT-ALPHA',
        email: driverIdentifier.includes('@')
          ? driverIdentifier
          : `${driverIdentifier.toLowerCase()}@fleet.drivewatch.io`,
        loginTime: Date.now(),
      };

      if (rememberMe) {
        try {
          localStorage.setItem('drivewatch_v1_profile', JSON.stringify(profile));
        } catch {
          // LocalStorage fallback
        }
      }

      setIsLoading(false);
      onLoginSuccess(profile);
    }, 400);
  };

  // Quick fill preset drivers
  const applyPreset = (id: string, name: string, veh: string) => {
    setDriverIdentifier(id);
    setDriverName(name);
    setVehicleId(veh);
    setPassword('drivewatch2026');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Automotive ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[200px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Cybernetic grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Central Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top neon border accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Header & Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>AUTOMOTIVE SAFETY HUD</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              <span>DriveWatch</span>
              <span className="px-1.5 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                V1
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Real-time driver vigilance &amp; biometric telemetry prototype (VIT Chennai IDP)
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="mb-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick Driver Presets:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('DRV-8492', 'Capt. Alex Vance', 'TRK-VIT-01')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all text-xs font-mono"
              >
                <div className="text-slate-200 font-semibold truncate">Alex Vance</div>
                <div className="text-[10px] text-cyan-400">DRV-8492 (Truck 01)</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('DRV-1024', 'Elena Rostova', 'VAN-VIT-02')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all text-xs font-mono"
              >
                <div className="text-slate-200 font-semibold truncate">Elena Rostova</div>
                <div className="text-[10px] text-cyan-400">DRV-1024 (Van 02)</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Driver Identifier */}
            <div>
              <label
                htmlFor="driver-id"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono"
              >
                Driver Identifier / Email
              </label>
              <input
                id="driver-id"
                type="text"
                value={driverIdentifier}
                onChange={(e) => setDriverIdentifier(e.target.value)}
                placeholder="e.g. DRV-8492"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm transition-all"
              />
            </div>

            {/* Driver Name & Vehicle ID Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="driver-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono"
                >
                  Driver Name
                </label>
                <input
                  id="driver-name"
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Operator Name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="vehicle-id"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono"
                >
                  Vehicle ID
                </label>
                <input
                  id="vehicle-id"
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  placeholder="e.g. TRK-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono"
              >
                Security Access Key
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="font-mono">Remember on this vehicle</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-400/80">Local Auth V1</span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold font-mono text-sm bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.99] text-white shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all duration-150 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Initializing Cockpit...</span>
                </>
              ) : (
                <>
                  <span>Initialize Cockpit HUD</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] font-mono text-slate-400">
              🔒 Client-side biometric processing. Video frames never leave the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

