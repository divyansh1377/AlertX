/**
 * AlertX - Frontend Application Orchestrator
 * Module: team1-frontend/scripts/main.js
 * Author: Person 1 (Frontend, UI/UX & 3D Visualization)
 * 
 * Wires Webcam Ingestion -> WebSocket Client -> Three.js Visualizer -> Dashboard UI -> Audio Synthesizer.
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
    this.wsClient = new AlertXWebSocketClient('ws://localhost:8000/ws/telemetry');

    this.isCalibrating = false;
    this.calibrationTimer = null;
  }

  async init() {
    console.log('[AlertX App] Initializing Master Client Application...');

    // 1. Mount Three.js Environment
    this.visualizer.init('#threejs-mount');

    // 2. Setup WebSocket Listeners
    this.wsClient.onTelemetryCallback = this.handleTelemetryUpdate.bind(this);
    this.wsClient.onStatusChangeCallback = this.handleWsStatusChange.bind(this);
    this.wsClient.connect();

    // 3. Bind UI Controls
    this._bindEvents();

    // 4. Start Camera Feed & Stream Frames
    const camSuccess = await this.webcam.startCamera(640, 480);
    if (camSuccess) {
      this.webcam.startFrameStream((frameBase64) => {
        this.wsClient.sendFrame(frameBase64);
        this.dashboard.updateFps(this.webcam.getFps());
      });
    }

    console.log('[AlertX App] System ready.');
  }

  handleTelemetryUpdate(data) {
    if (!data) return;

    // 1. Update HUD Gauges
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

    // 3. Audio Alarm Trigger
    if (decision.alert_level) {
      this.audioAlert.setAlertLevel(decision.alert_level);
    }

    // 4. Calibration Progress Sync
    if (this.isCalibrating && data.calibration_event) {
      const ev = data.calibration_event;
      const remainingSec = Math.max(0, 15.0 - (ev.elapsed_sec || 0));
      this.dashboard.updateCalibrationProgress(
        remainingSec,
        ev.progress_pct || 0,
        ev.current_ear,
        ev.current_mar
      );

      if (ev.status === 'CALIBRATION_COMPLETED' || remainingSec <= 0) {
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
      pulseDot.style.backgroundColor = 'var(--color-normal)';
      pulseDot.style.boxShadow = '0 0 8px var(--color-normal)';
    } else if (status === 'CONNECTING') {
      wsText.textContent = 'CONNECTING...';
      pulseDot.style.backgroundColor = 'var(--color-advisory)';
    } else {
      wsText.textContent = 'OFFLINE';
      pulseDot.style.backgroundColor = 'var(--color-critical)';
      pulseDot.style.boxShadow = '0 0 8px var(--color-critical)';
    }
  }

  _bindEvents() {
    // Calibration Start Button
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
        } else {
          await this.webcam.startCamera(640, 480);
          this.webcam.startFrameStream((frame) => this.wsClient.sendFrame(frame));
          btnCam.textContent = 'Camera ON';
        }
      });
    }
  }

  startCalibrationRoutine() {
    this.isCalibrating = true;
    this.dashboard.showCalibrationModal(true);
    this.wsClient.send({ type: 'START_CALIBRATION', driver_id: 'driver_alpha' });

    let remaining = 15.0;
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
      console.log('[AlertX App] Calibration finished.');
    }, 800);
  }

  _cancelCalibration() {
    this.isCalibrating = false;
    if (this.calibrationTimer) clearInterval(this.calibrationTimer);
    this.dashboard.showCalibrationModal(false);
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new AlertXApp();
  app.init();
});

