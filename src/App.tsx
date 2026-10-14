/**
 * DriveWatch V1 - Main Application Component
 * Module: src/App.tsx
 *
 * Manages client-side authentication transition between
 * Login View and Personalized Driver Dashboard.
 */

import React, { useState, useEffect } from 'react';
import type { DriverProfile } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

export const App: React.FC = () => {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Check existing cached session from localStorage on startup
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('drivewatch_v1_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as DriverProfile;
        if (parsed && parsed.driverId) {
          setDriver(parsed);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (profile: DriverProfile) => {
    setDriver(profile);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('drivewatch_v1_profile');
    } catch {
      // Fallback
    }
    setDriver(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-cyan-400 text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span>INITIALIZING DRIVEWATCH V1...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {driver ? (
        <Dashboard driver={driver} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;

