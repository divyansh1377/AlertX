/**
 * AlertX - HTML5 Webcam Stream & Video Ingestion Manager
 * Module: team1-frontend/js/webcam_manager.js
 * 
 * Manages getUserMedia camera access, canvas frame downsampling, and 30 FPS frame extraction.
 */

export class WebcamManager {
  constructor(videoElementId = 'webcam-feed', canvasElementId = 'capture-canvas') {
    this.videoElement = document.getElementById(videoElementId);
    this.canvasElement = document.getElementById(canvasElementId);
    this.ctx = this.canvasElement ? this.canvasElement.getContext('2d') : null;
    
    this.stream = null;
    this.isStreaming = false;
    this.targetFps = 30;
    this.captureIntervalId = null;

    // Dimensions
    this.captureWidth = 640;
    this.captureHeight = 480;

    // FPS Tracking
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsCalcTime = performance.now();
  }

  /**
   * Requests camera permissions and initializes video element.
   */
  async startCamera(width = 640, height = 480) {
    this.captureWidth = width;
    this.captureHeight = height;

    if (this.canvasElement) {
      this.canvasElement.width = width;
      this.canvasElement.height = height;
    }

    // Defensive check: navigator.mediaDevices is undefined in insecure contexts (HTTP over non-localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[WebcamManager] Camera access API is unsupported or blocked. Usually requires HTTPS or localhost context.');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: this.targetFps }
        },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }

      this.isStreaming = true;
      console.log(`[WebcamManager] Camera active (${width}x${height} @ ${this.targetFps} FPS).`);
      return true;
    } catch (err) {
      console.error('[WebcamManager] Failed to access webcam:', err);
      return false;
    }
  }

  /**
   * Captures the current video frame as a compressed Base64 JPEG string.
   * @returns {string|null} Base64 image data URI
   */
  captureFrameBase64(quality = 0.7) {
    if (!this.isStreaming || !this.videoElement || !this.ctx) {
      return null;
    }

    this.ctx.drawImage(this.videoElement, 0, 0, this.captureWidth, this.captureHeight);
    
    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsCalcTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    return this.canvasElement.toDataURL('image/jpeg', quality);
  }

  /**
   * Starts a periodic frame capture loop to feed backend WebSocket.
   * @param {function} onFrameCallback - Function receiving base64 frame
   */
  startFrameStream(onFrameCallback) {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
    }

    const intervalMs = Math.round(1000 / this.targetFps);
    this.captureIntervalId = setInterval(() => {
      const frameData = this.captureFrameBase64();
      if (frameData && onFrameCallback) {
        onFrameCallback(frameData);
      }
    }, intervalMs);
  }

  stopCamera() {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
      this.captureIntervalId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.isStreaming = false;
    console.log('[WebcamManager] Camera stopped.');
  }

  getFps() {
    return this.fps;
  }
}
