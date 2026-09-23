/**
 * AlertX - Telemetry WebSocket Client
 * Module: team1-frontend/js/websocket_client.js
 * 
 * Manages resilient full-duplex communication with the backend gateway (ws://localhost:8000/ws/telemetry).
 */

export class AlertXWebSocketClient {
  constructor(url) {
    if (!url) {
      const host = window.location.hostname || 'localhost';
      url = `ws://${host}:8000/ws/telemetry`;
    }
    this.url = url;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectIntervalMs = 2000;
    this.pingIntervalId = null;

    // Callbacks
    this.onTelemetryCallback = null;
    this.onStatusChangeCallback = null;
  }

  connect() {
    console.log(`[WS Client] Connecting to ${this.url}...`);
    this._updateStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this._onOpen.bind(this);
      this.ws.onmessage = this._onMessage.bind(this);
      this.ws.onclose = this._onClose.bind(this);
      this.ws.onerror = this._onError.bind(this);
    } catch (e) {
      console.error('[WS Client] Initialization error:', e);
      this._scheduleReconnect();
    }
  }

  _onOpen() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this._updateStatus('CONNECTED');
    console.log('[WS Client] Connected to AlertX Gateway.');

    // Start 5s heartbeat
    this.pingIntervalId = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', timestamp: Date.now() });
      }
    }, 5000);
  }

  _onMessage(event) {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'PONG') return;

      if (this.onTelemetryCallback) {
        this.onTelemetryCallback(payload);
      }
    } catch (err) {
      console.warn('[WS Client] Failed to parse message:', err);
    }
  }

  _onClose(event) {
    this.isConnected = false;
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    this._updateStatus('DISCONNECTED');
    console.warn(`[WS Client] Disconnected (code: ${event.code}). Scheduling reconnect...`);
    this._scheduleReconnect();
  }

  _onError(err) {
    console.error('[WS Client] WebSocket encountered an error:', err);
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectIntervalMs * Math.min(this.reconnectAttempts, 4);
      setTimeout(() => this.connect(), delay);
    } else {
      this._updateStatus('FAILED');
      console.error('[WS Client] Max reconnection attempts reached.');
    }
  }

  send(data) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  sendFrame(base64Frame) {
    return this.send({
      type: 'FRAME_FEED',
      timestamp_ms: Date.now(),
      image_base64: base64Frame
    });
  }

  _updateStatus(status) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }
}
