/**
 * AlertX - Real-Time Cockpit Dashboard UI Controller
 * Module: team1-frontend/js/dashboard.js
 * 
 * Manages luxury automotive HUD telemetry gauges, alert state styling,
 * biometric meters, event history log, and calibration modal.
 */

export class DashboardUI {
  constructor() {
    // 1. Alert Banner DOM
    this.masterBanner = document.getElementById('master-alert-banner');
    this.alertStateText = document.getElementById('alert-state-text');
    this.alertTriggersText = document.getElementById('alert-triggers-text');
    this.fatigueIndexValue = document.getElementById('fatigue-index-value');

    // 2. Biometrics DOM
    this.earValue = document.getElementById('ear-value');
    this.earBaselineText = document.getElementById('ear-baseline-text');
    this.earProgress = document.getElementById('ear-progress');

    this.marValue = document.getElementById('mar-value');
    this.marProgress = document.getElementById('mar-progress');
    this.yawnBadge = document.getElementById('yawn-badge');

    this.perclosValue = document.getElementById('perclos-value');
    this.perclosProgress = document.getElementById('perclos-progress');

    this.headPoseValue = document.getElementById('head-pose-value');
    this.headNodBadge = document.getElementById('head-nod-badge');
    this.headPitchProgress = document.getElementById('head-pitch-progress');

    // 3. Diagnostics & Context DOM
    this.confidencePill = document.getElementById('landmark-confidence-pill');
    this.fpsCounter = document.getElementById('fps-counter');
    this.latencyCounter = document.getElementById('latency-counter');
    this.contextRoadPill = document.getElementById('context-road-pill');
    this.contextSpeedValue = document.getElementById('context-speed-value');

    // 4. Alert History List
    this.alertHistoryList = document.getElementById('alert-history-list');
    this.lastAlertLevel = 'Normal';
    this.maxHistoryItems = 8;

    // 5. Calibration Modal DOM
    this.calibrationModal = document.getElementById('calibration-modal');
    this.calibrationCountdown = document.getElementById('calibration-countdown');
    this.calibrationProgressBar = document.getElementById('calibration-progress-bar');
    this.calibEarCurrent = document.getElementById('calib-ear-current');
    this.calibMarCurrent = document.getElementById('calib-mar-current');

    // Initial fallback reset
    this.resetToFallback();
  }

  resetToFallback() {
    if (this.earValue) this.earValue.textContent = '--';
    if (this.marValue) this.marValue.textContent = '--';
    if (this.perclosValue) this.perclosValue.textContent = '--%';
    if (this.headPoseValue) this.headPoseValue.textContent = '--° / --° / --°';
    if (this.contextSpeedValue) this.contextSpeedValue.textContent = '-- KM/H';
    if (this.latencyCounter) this.latencyCounter.textContent = '-- ms';
  }

  /**
   * Updates all HUD telemetry elements with an incoming TelemetryFrame payload.
   * @param {object} data - Telemetry packet matching API_CONTRACT.md
   */
  updateTelemetry(data) {
    if (!data) return;

    const biometrics = data.biometrics || {};
    const headPose = data.head_pose || {};
    const decision = data.decision || {};
    const landmarks = data.facial_landmarks_summary || {};
    const context = data.context || {};
    const calib = data.calibration || {};

    // 1. Alert Level & Master Banner
    const alertLevel = decision.alert_level || 'Normal';
    const fatigueIndex = decision.fatigue_index !== undefined ? decision.fatigue_index.toFixed(1) : '0.0';
    const triggers = decision.trigger_factors || [];

    this._updateAlertBanner(alertLevel, fatigueIndex, triggers);

    // Track Alert Shift in Event History
    if (alertLevel !== this.lastAlertLevel) {
      this.addAlertHistoryEntry(alertLevel, triggers);
      this.lastAlertLevel = alertLevel;
    }

    // 2. EAR Biometric Card
    const earAvg = biometrics.ear_avg !== undefined ? biometrics.ear_avg.toFixed(3) : '--';
    const earBase = calib.baseline_ear ? calib.baseline_ear.toFixed(3) : '0.315';
    if (this.earValue) this.earValue.textContent = earAvg;
    if (this.earBaselineText) this.earBaselineText.textContent = `Base: ${earBase}`;
    if (this.earProgress && biometrics.ear_avg !== undefined) {
      const earPct = Math.min(100, Math.max(0, (biometrics.ear_avg / 0.40) * 100));
      this.earProgress.style.width = `${earPct}%`;
      this.earProgress.style.backgroundColor = biometrics.is_eyes_closed ? 'var(--color-critical)' : 'var(--color-normal)';
    }

    // 3. MAR & Yawn Status
    const mar = biometrics.mar !== undefined ? biometrics.mar.toFixed(3) : '--';
    if (this.marValue) this.marValue.textContent = mar;
    if (this.marProgress && biometrics.mar !== undefined) {
      const marPct = Math.min(100, Math.max(0, (biometrics.mar / 0.80) * 100));
      this.marProgress.style.width = `${marPct}%`;
      this.marProgress.style.backgroundColor = biometrics.is_yawning ? 'var(--color-warning)' : 'var(--color-normal)';
    }
    if (this.yawnBadge) {
      if (biometrics.is_yawning) {
        this.yawnBadge.textContent = 'YAWN DETECTED';
        this.yawnBadge.style.color = 'var(--color-warning)';
      } else {
        this.yawnBadge.textContent = 'MOUTH CLOSED';
        this.yawnBadge.style.color = 'var(--color-normal)';
      }
    }

    // 4. PERCLOS
    const perclos = biometrics.perclos_30f !== undefined ? biometrics.perclos_30f.toFixed(1) : '--';
    if (this.perclosValue) this.perclosValue.textContent = `${perclos}%`;
    if (this.perclosProgress && biometrics.perclos_30f !== undefined) {
      this.perclosProgress.style.width = `${Math.min(100, biometrics.perclos_30f)}%`;
      this.perclosProgress.style.backgroundColor = biometrics.perclos_30f > 25.0 ? 'var(--color-warning)' : 'var(--color-normal)';
    }

    // 5. 3D Head Pose
    const pitch = headPose.pitch_deg || 0;
    const yaw = headPose.yaw_deg || 0;
    const roll = headPose.roll_deg || 0;
    if (this.headPoseValue) {
      this.headPoseValue.textContent = `${pitch.toFixed(0)}° / ${yaw.toFixed(0)}° / ${roll.toFixed(0)}°`;
    }
    if (this.headPitchProgress) {
      // Map pitch -30° to +30° to 0-100%
      const pitchPct = Math.min(100, Math.max(0, ((pitch + 30) / 60) * 100));
      this.headPitchProgress.style.width = `${pitchPct}%`;
    }
    if (this.headNodBadge) {
      if (headPose.is_head_nodding) {
        this.headNodBadge.textContent = 'HEAD NOD (SLEEP)';
        this.headNodBadge.style.color = 'var(--color-critical)';
      } else if (headPose.is_distracted) {
        this.headNodBadge.textContent = 'GAZE DISTRACTED';
        this.headNodBadge.style.color = 'var(--color-warning)';
      } else {
        this.headNodBadge.textContent = 'STABLE';
        this.headNodBadge.style.color = 'var(--color-normal)';
      }
    }

    // 6. Confidence & Pipeline Latency
    const confPct = Math.round((landmarks.tracking_confidence || 0.96) * 100);
    if (this.confidencePill) {
      this.confidencePill.textContent = `CONFIDENCE: ${confPct}%`;
    }
    if (this.latencyCounter && data.processing_latency_ms !== undefined) {
      this.latencyCounter.textContent = `${data.processing_latency_ms.toFixed(1)} ms`;
    }

    // 7. Context & Speed
    if (this.contextRoadPill && context.road_type) {
      const riskMult = context.risk_multiplier ? `${context.risk_multiplier.toFixed(2)}x` : '1.00x';
      this.contextRoadPill.textContent = `${context.road_type.toUpperCase()} (${riskMult} Risk)`;
    }
    if (this.contextSpeedValue && context.speed_kmh !== undefined) {
      this.contextSpeedValue.textContent = `${Math.round(context.speed_kmh)} KM/H`;
    }
  }

  _updateAlertBanner(alertLevel, fatigueIndex, triggers) {
    if (!this.masterBanner) return;

    const levelLower = alertLevel.toLowerCase();
    this.masterBanner.className = `master-alert-banner ${levelLower}`;

    if (this.alertStateText) {
      this.alertStateText.textContent = alertLevel;
      const colorVar = `var(--color-${levelLower})`;
      this.alertStateText.style.color = colorVar;
      document.documentElement.style.setProperty('--active-alert-color', colorVar);
    }

    if (this.fatigueIndexValue) {
      this.fatigueIndexValue.textContent = fatigueIndex;
    }

    if (this.alertTriggersText) {
      if (triggers && triggers.length > 0) {
        this.alertTriggersText.textContent = `Triggers: ${triggers.join(' • ')}`;
      } else {
        this.alertTriggersText.textContent = 'Driver fully attentive. Baseline biometrics stable.';
      }
    }
  }

  addAlertHistoryEntry(level, triggers = []) {
    if (!this.alertHistoryList) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const desc = triggers.length > 0 ? triggers.join(', ') : `Vigilance transitioned to ${level}`;

    const item = document.createElement('li');
    item.className = 'alert-history-item';
    item.innerHTML = `
      <span class="alert-history-time">${timeStr}</span>
      <span class="alert-history-desc">${desc}</span>
      <span class="alert-tag ${level.toLowerCase()}">${level}</span>
    `;

    this.alertHistoryList.insertBefore(item, this.alertHistoryList.firstChild);

    // Keep list bounded to max items
    while (this.alertHistoryList.children.length > this.maxHistoryItems) {
      this.alertHistoryList.removeChild(this.alertHistoryList.lastChild);
    }
  }

  updateFps(fps) {
    if (this.fpsCounter) {
      this.fpsCounter.textContent = fps;
    }
  }

  showCalibrationModal(show = true) {
    if (this.calibrationModal) {
      this.calibrationModal.classList.toggle('active', show);
    }
  }

  updateCalibrationProgress(remainingSec, progressPct, ear, mar) {
    if (this.calibrationCountdown) {
      this.calibrationCountdown.textContent = `${remainingSec.toFixed(1)}s`;
    }
    if (this.calibrationProgressBar) {
      this.calibrationProgressBar.style.width = `${progressPct}%`;
    }
    if (this.calibEarCurrent) this.calibEarCurrent.textContent = ear !== undefined ? Number(ear).toFixed(3) : '--';
    if (this.calibMarCurrent) this.calibMarCurrent.textContent = mar !== undefined ? Number(mar).toFixed(3) : '--';
  }
}

