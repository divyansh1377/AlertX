/**
 * AlertX - Web Audio API Procedural Acoustic Alert Synthesizer
 * Module: team1-frontend/scripts/audio_alert.js
 * Author: Person 1 (Frontend, UI/UX & 3D Visualization)
 * 
 * Synthesizes dynamic in-cabin audio alarms without external audio files:
 * - Advisory: Gentle 440 Hz sine chime
 * - Warning: 880 Hz alternating dual beep
 * - Critical: 1200 Hz pulsed alarm siren
 */

export class AudioAlertSystem {
  constructor() {
    this.audioCtx = null;
    this.isEnabled = true;
    this.currentAlertLevel = 'Normal';
    this.activeAlarmInterval = null;
  }

  _initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Updates audio alert state when severity changes.
   * @param {string} alertLevel - 'Normal' | 'Advisory' | 'Warning' | 'Critical'
   */
  setAlertLevel(alertLevel) {
    if (this.currentAlertLevel === alertLevel) return;
    this.currentAlertLevel = alertLevel;

    this._stopActiveAlarms();

    if (!this.isEnabled) return;
    this._initAudioContext();

    if (alertLevel === 'Advisory') {
      this._playAdvisoryChime();
    } else if (alertLevel === 'Warning') {
      this._startWarningLoop();
    } else if (alertLevel === 'Critical') {
      this._startCriticalSiren();
    }
  }

  _playTone(freq = 440, duration = 0.2, type = 'sine', gainVal = 0.15) {
    if (!this.audioCtx || !this.isEnabled) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('[AudioAlert] Web Audio error:', e);
    }
  }

  _playAdvisoryChime() {
    this._playTone(520, 0.35, 'sine', 0.12);
  }

  _startWarningLoop() {
    this._playTone(880, 0.15, 'triangle', 0.25);
    setTimeout(() => this._playTone(1050, 0.2, 'triangle', 0.25), 200);

    this.activeAlarmInterval = setInterval(() => {
      this._playTone(880, 0.15, 'triangle', 0.25);
      setTimeout(() => this._playTone(1050, 0.2, 'triangle', 0.25), 200);
    }, 1800);
  }

  _startCriticalSiren() {
    const playBurst = () => {
      this._playTone(1200, 0.12, 'sawtooth', 0.4);
      setTimeout(() => this._playTone(900, 0.12, 'sawtooth', 0.4), 130);
    };

    playBurst();
    this.activeAlarmInterval = setInterval(playBurst, 400);
  }

  _stopActiveAlarms() {
    if (this.activeAlarmInterval) {
      clearInterval(this.activeAlarmInterval);
      this.activeAlarmInterval = null;
    }
  }

  toggleAudio() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this._stopActiveAlarms();
    }
    return this.isEnabled;
  }
}

