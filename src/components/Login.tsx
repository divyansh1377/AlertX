/**
 * AlertX / DriveWatch V1 - Driver Login View
 * Module: src/components/Login.tsx
 *
 * Premium automotive monochrome aesthetic with elegant 24px rounded glass surfaces,
 * Plus Jakarta Sans typography, and responsive touch/keyboard accessibility.
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
    }, 350);
  };

  // Quick fill preset drivers
  const applyPreset = (id: string, name: string, veh: string) => {
    setDriverIdentifier(id);
    setDriverName(name);
    setVehicleId(veh);
    setPassword('drivewatch2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0B0C] text-[#F5F5F5] flex items-center justify-center p-4 sm:p-6">
      {/* Central Login Card with refined 24px radius */}
      <div className="w-full max-w-md">
        <div className="bg-[#1C1C1F] border border-white/[0.12] rounded-[24px] p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden transition-all duration-220">
          
          {/* Header & Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[8px] bg-[#252528] border border-white/[0.10] text-[#B5B5B8] text-xs tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5F5F5]" />
              <span className="font-medium">DRIVER SAFETY TELEMETRY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F5F5F5] flex items-center justify-center gap-2">
              <span>AlertX</span>
              <span className="px-2 py-0.5 text-xs font-normal bg-[#252528] text-[#B5B5B8] rounded-[8px] border border-white/[0.12]">
                V1
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#858589] mt-1.5 max-w-xs mx-auto leading-relaxed">
              Real-time driver vigilance &amp; biometric telemetry prototype
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-wider text-[#858589] mb-2 text-center font-medium">
              Quick Driver Presets
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset('DRV-8492', 'Capt. Alex Vance', 'TRK-VIT-01')}
                className="min-h-[44px] p-2.5 rounded-[12px] bg-[#141416] border border-white/[0.10] text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.22] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#E5E5E5] focus-visible:outline-offset-1"
              >
                <div className="text-[#F5F5F5] font-medium text-xs truncate">Alex Vance</div>
                <div className="text-[10px] text-[#858589] mt-0.5">DRV-8492 • Truck 01</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('DRV-1024', 'Elena Rostova', 'VAN-VIT-02')}
                className="min-h-[44px] p-2.5 rounded-[12px] bg-[#141416] border border-white/[0.10] text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.22] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#E5E5E5] focus-visible:outline-offset-1"
              >
                <div className="text-[#F5F5F5] font-medium text-xs truncate">Elena Rostova</div>
                <div className="text-[10px] text-[#858589] mt-0.5">DRV-1024 • Van 02</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Driver Identifier */}
            <div>
              <label
                htmlFor="driver-id"
                className="block text-xs font-medium text-[#B5B5B8] mb-1.5"
              >
                Driver Identifier or Email
              </label>
              <input
                id="driver-id"
                type="text"
                value={driverIdentifier}
                onChange={(e) => setDriverIdentifier(e.target.value)}
                placeholder="e.g. DRV-8492"
                required
                className="automotive-input rounded-[12px]"
              />
            </div>

            {/* Driver Name & Vehicle ID Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="driver-name"
                  className="block text-xs font-medium text-[#B5B5B8] mb-1.5"
                >
                  Driver Name
                </label>
                <input
                  id="driver-name"
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Operator Name"
                  className="automotive-input rounded-[12px] text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="vehicle-id"
                  className="block text-xs font-medium text-[#B5B5B8] mb-1.5"
                >
                  Vehicle ID
                </label>
                <input
                  id="vehicle-id"
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  placeholder="e.g. TRK-01"
                  className="automotive-input rounded-[12px] text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#B5B5B8] mb-1.5"
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
                  className="automotive-input rounded-[12px] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#858589] hover:text-[#F5F5F5] transition-colors rounded-[8px] focus-visible:outline-2 focus-visible:outline-[#E5E5E5]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-[#858589] hover:text-[#B5B5B8] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[4px] bg-[#141416] border-white/[0.20] text-[#F5F5F5] focus:ring-0 focus:ring-offset-0 focus:outline-none"
                />
                <span>Remember on this vehicle</span>
              </label>
              <span className="text-[11px] text-[#858589]">Local Session</span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-[10px] bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 text-sm font-medium rounded-[12px]"
            >
              {isLoading ? (
                <span className="inline-flex items-center space-x-2">
                  <svg
                    className="animate-spin h-4 w-4 text-[#0B0B0C]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Connecting...</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-2">
                  <span>Initialize Dashboard</span>
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
                </span>
              )}
            </button>
          </form>

          {/* Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
            <p className="text-[11px] text-[#858589] leading-relaxed">
              Edge-processed optical monitoring. Telemetry is computed locally in browser memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
