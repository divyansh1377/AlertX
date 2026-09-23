/**
 * AlertX - Master Frontend Application Orchestrator & Auth Router
 * Module: team1-frontend/js/main.js
 * 
 * Orchestrates:
 * 1. Atmospheric Three.js Background & Parallax.
 * 2. Glassmorphic Auth Landing Flow & Form Validation.
 * 3. Driver Safety Cockpit Dashboard & Real-Time Biometric Streams.
 * 4. WebSocket Telemetry, Webcam Streaming & Web Audio Synthesizer.
 */

import { ThreeVisualizer } from './three_visualizer.js';
import { WebcamManager } from './webcam_manager.js';
import { DashboardUI } from './dashboard.js';
import { AudioAlertSystem } from './audio_alert.js';
import { AlertXWebSocketClient } from './websocket_client.js';

class AlertXApp {
  constructor() {
    this.visualizer = new ThreeVisualizer();
    this.webcam = new WebcamManager('webcam-feed', 'capture-canvas');
    this.dashboard = new DashboardUI();
    this.audioAlert = new AudioAlertSystem();
    
    // Dynamic WebSocket URL handling for external network access
    const host = window.location.hostname || 'localhost';
    this.wsClient = new AlertXWebSocketClient(`ws://${host}:8000/ws/telemetry`);

    this.currentView = 'auth'; // 'auth' | 'dashboard'
    this.currentDriver = {
      id: 'driver_alpha_01',
      name: 'Driver Alpha'
    };

    this.isCalibrating = false;
    this.calibrationTimer = null;
    this.isDashboardInitialized = false;
  }

  init() {
    console.log('[AlertX App] Initializing master client application...');

    // 1. Initialize Atmospheric 3D Background
    this.visualizer.initBackground('#threejs-bg-canvas');

    // 2. Bind Auth & Navigation Events
    this._bindAuthEvents();
    this._bindDashboardEvents();

    // 3. Check for Saved Session robustly (avoid cross-origin or incognito crash)
    try {
      const savedAuth = localStorage.getItem('alertx_auth_session');
      if (savedAuth) {
        const session = JSON.parse(savedAuth);
        if (session && session.driverId) {
          this.currentDriver.id = session.driverId;
          this.currentDriver.name = session.driverName || 'Driver ' + session.driverId;
          this._switchView('dashboard');
          return;
        }
      }
    } catch (e) {
      console.warn('[AlertX App] LocalStorage is not accessible (Privacy mode or cross-origin)', e);
    }

    // Default to Auth Landing
    this._switchView('auth');
  }

  // =========================================================================
  // VIEW SWITCHER & AUTHENTICATION
  // =========================================================================
  _switchView(targetView) {
    const authView = document.getElementById('view-auth');
    const dashView = document.getElementById('view-dashboard');

    if (targetView === 'dashboard') {
      if (authView) authView.classList.add('hidden');
      if (dashView) dashView.classList.remove('hidden');
      this.currentView = 'dashboard';

      // Update Profile Snippets in Header
      const profileName = document.getElementById('driver-profile-name');
      const profileId = document.getElementById('driver-profile-id');
      if (profileName) profileName.textContent = this.currentDriver.name;
      if (profileId) profileId.textContent = `ID: ${this.currentDriver.id}`;

      // Initialize Cockpit Hardware / Services once
      this._activateDashboardServices();
    } else {
      if (dashView) dashView.classList.add('hidden');
      if (authView) authView.classList.remove('hidden');
      this.currentView = 'auth';
    }
  }

  _bindAuthEvents() {
    const authForm = document.getElementById('auth-form');
    const driverInput = document.getElementById('auth-driver-id');
    const passInput = document.getElementById('auth-password');
    const btnTogglePass = document.getElementById('btn-toggle-password');
    const rememberMeCheck = document.getElementById('auth-remember-me');
    const btnSubmit = document.getElementById('btn-sign-in');

    // Toggle Password Visibility
    if (btnTogglePass && passInput) {
      btnTogglePass.addEventListener('click', () => {
        const isPass = passInput.getAttribute('type') === 'password';
        passInput.setAttribute('type', isPass ? 'text' : 'password');
        btnTogglePass.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
        btnTogglePass.innerHTML = isPass
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    }

    // Form Submission
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const driverVal = driverInput ? driverInput.value.trim() : '';
          const passVal = passInput ? passInput.value.trim() : '';

          // Inline Validation Checks
          let isValid = true;
          const driverError = document.getElementById('auth-driver-error');
          const passError = document.getElementById('auth-password-error');

          if (!driverVal || driverVal.length < 3) {
            if (driverError) {
              driverError.textContent = 'Please enter a valid Driver ID or Email (min 3 characters).';
              driverError.classList.add('visible');
            }
            if (driverInput) driverInput.classList.add('error');
            isValid = false;
          } else {
            if (driverError) driverError.classList.remove('visible');
            if (driverInput) driverInput.classList.remove('error');
          }

          if (!passVal || passVal.length < 4) {
            if (passError) {
              passError.textContent = 'Password must be at least 4 characters.';
              passError.classList.add('visible');
            }
            if (passInput) passInput.classList.add('error');
            isValid = false;
          } else {
            if (passError) passError.classList.remove('visible');
            if (passInput) passInput.classList.remove('error');
          }

          if (!isValid) return;

          // Animate Button Loading State
          if (btnSubmit) btnSubmit.classList.add('loading');

          const success = await this._mockAuthenticate(driverVal, passVal);
          if (btnSubmit) btnSubmit.classList.remove('loading');

          if (success) {
            this.currentDriver.id = driverVal;
            this.currentDriver.name = driverVal.includes('@')
              ? driverVal.split('@')[0]
              : (driverVal.startsWith('driver_') ? driverVal.replace('driver_', 'Driver ') : driverVal);

            try {
              if (rememberMeCheck && rememberMeCheck.checked) {
                localStorage.setItem('alertx_auth_session', JSON.stringify({
                  driverId: this.currentDriver.id,
                  driverName: this.currentDriver.name,
                  timestamp: Date.now()
                }));
              }
            } catch (storageError) {
              console.warn('[AlertX App] Unable to save session to localStorage.');
            }

            this._switchView('dashboard');
          }
        } catch (submitErr) {
          console.error('[AlertX App] Error during form submission:', submitErr);
          if (btnSubmit) btnSubmit.classList.remove('loading');
        }
      });
    }
  }

  async _mockAuthenticate(driverId, password) {
    // Isolated Mock Authenticate handler: validates format and provides smooth delay
    await new Promise((res) => setTimeout(res, 500));
    return Boolean(driverId && password);
  }

  _bindDashboardEvents() {
    // Logout Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        try {
          localStorage.removeItem('alertx_auth_session');
        } catch (e) {}
        this.webcam.stopCamera();
        const btnCam = document.getElementById('btn-toggle-camera');
        if (btnCam) btnCam.textContent = 'Camera OFF';
        this._switchView('auth');
      });
    }

    // Start Calibration
    const btnCalib = document.getElementById('btn-start-calibration');
    if (btnCalib) {
      btnCalib.addEventListener('click', () => this.startCalibrationRoutine());
    }

    const btnCancelCalib = document.getElementById('btn-cancel-calibration');
    if (btnCancelCalib) {
      btnCancelCalib.addEventListener('click', () => this._cancelCalibration());
    }

    // Audio Toggle
    const btnAudio = document.getElementById('btn-toggle-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const enabled = this.audioAlert.toggleAudio();
        btnAudio.textContent = enabled ? '🔊 Audio: ON' : '🔇 Audio: MUTED';
        btnAudio.classList.toggle('btn-primary', enabled);
      });
    }

    // Camera Toggle
    const btnCam = document.getElementById('btn-toggle-camera');
    if (btnCam) {
      btnCam.addEventListener('click', async () => {
        if (this.webcam.isStreaming) {
          this.webcam.stopCamera();
          btnCam.textContent = 'Camera OFF';
          const indicator = document.getElementById('camera-scan-status');
          if (indicator) indicator.textContent = 'PAUSED';
        } else {
          await this.webcam.startCamera(640, 480);
          this.webcam.startFrameStream((frame) => this.wsClient.sendFrame(frame));
          btnCam.textContent = 'Camera ON';
          const indicator = document.getElementById('camera-scan-status');
          if (indicator) indicator.textContent = 'ACTIVE';
        }
      });
    }
  }

  async _activateDashboardServices() {
    if (this.isDashboardInitialized) return;
    this.isDashboardInitialized = true;

    // 1. Mount 3D Face Rig Digital Twin
    this.visualizer.initFaceTwin('#threejs-face-mount');

    // 2. Setup WebSocket Listeners & Connect
    this.wsClient.onTelemetryCallback = this.handleTelemetryUpdate.bind(this);
    this.wsClient.onStatusChangeCallback = this.handleWsStatusChange.bind(this);
    this.wsClient.connect();

    // 3. Start Camera Feed & Stream Frames
    const camSuccess = await this.webcam.startCamera(640, 480);
    if (camSuccess) {
      this.webcam.startFrameStream((frameBase64) => {
        this.wsClient.sendFrame(frameBase64);
        this.dashboard.updateFps(this.webcam.getFps());
      });
      const indicator = document.getElementById('camera-scan-status');
      if (indicator) indicator.textContent = 'SCANNING (30 FPS)';
    } else {
      const indicator = document.getElementById('camera-scan-status');
      if (indicator) {
        indicator.textContent = 'OFFLINE (NO SENSOR)';
        indicator.style.color = 'var(--color-critical)';
        indicator.style.borderColor = 'var(--color-critical)';
        indicator.style.background = 'rgba(239, 68, 68, 0.15)';
      }
    }
  }

  // =========================================================================
  // TELEMETRY & CALIBRATION ROUTINES
  // =========================================================================
  handleTelemetryUpdate(data) {
    if (!data) return;

    // 1. Update HUD Gauges & Cards
    this.dashboard.updateTelemetry(data);

    // 2. Update 3D Digital Twin Avatar Rig
    const headPose = data.head_pose || {};
    const biometrics = data.biometrics || {};
    const decision = data.decision || {};

    this.visualizer.updateHeadPose(
      headPose.pitch_deg || 0,
      headPose.yaw_deg || 0,
      headPose.roll_deg || 0
    );
    this.visualizer.updateBiometrics(
      biometrics.ear_avg || 0.3,
      biometrics.mar || 0.2
    );
    this.visualizer.setAlertState(decision.alert_level || 'Normal');

    // 3. Trigger Acoustic Warnings if Required
    if (decision.alert_level) {
      this.audioAlert.setAlertLevel(decision.alert_level);
    }

    // 4. Calibration Progress Update if Active
    if (this.isCalibrating && data.type === 'CALIBRATION_PROGRESS') {
      const remainingSec = Math.max(0, (data.total_sec || 15.0) - (data.elapsed_sec || 0));
      this.dashboard.updateCalibrationProgress(
        remainingSec,
        data.progress_pct || 0,
        data.current_ear,
        data.current_mar
      );

      if (remainingSec <= 0 || (data.progress_pct && data.progress_pct >= 100)) {
        this._finishCalibration();
      }
    }
  }

  handleWsStatusChange(status) {
    const wsText = document.getElementById('ws-status-text');
    const pulseDot = document.getElementById('system-pulse-dot');
    if (!wsText || !pulseDot) return;

    if (status === 'CONNECTED') {
      wsText.textContent = 'ONLINE (WS)';
      pulseDot.className = 'pulse-dot';
      pulseDot.style.backgroundColor = 'var(--color-normal)';
      pulseDot.style.boxShadow = '0 0 8px var(--color-normal)';
    } else if (status === 'CONNECTING') {
      wsText.textContent = 'CONNECTING...';
      pulseDot.className = 'pulse-dot dot-advisory';
    } else {
      wsText.textContent = 'OFFLINE';
      pulseDot.className = 'pulse-dot dot-critical';
    }
  }

  startCalibrationRoutine() {
    this.isCalibrating = true;
    this.dashboard.showCalibrationModal(true);
    this.wsClient.send({
      type: 'START_CALIBRATION',
      driver_id: this.currentDriver.id,
      calibration_duration_sec: 15.0
    });

    let remaining = 15.0;
    if (this.calibrationTimer) clearInterval(this.calibrationTimer);

    this.calibrationTimer = setInterval(() => {
      remaining -= 0.1;
      const progressPct = ((15.0 - remaining) / 15.0) * 100;
      this.dashboard.updateCalibrationProgress(remaining, progressPct);

      if (remaining <= 0) {
        this._finishCalibration();
      }
    }, 100);
  }

  _finishCalibration() {
    this.isCalibrating = false;
    if (this.calibrationTimer) clearInterval(this.calibrationTimer);
    setTimeout(() => {
      this.dashboard.showCalibrationModal(false);
      console.log('[AlertX App] Calibration completed.');
    }, 600);
  }

  _cancelCalibration() {
    this.isCalibrating = false;
    if (this.calibrationTimer) clearInterval(this.calibrationTimer);
    this.dashboard.showCalibrationModal(false);
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AlertXApp();
    app.init();
  } catch (err) {
    console.error('[AlertX App] Bootup error:', err);
  }
});
