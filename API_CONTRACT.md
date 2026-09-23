# AlertX — API Contract & Telemetry Protocol Specification
**Version:** 1.0.0  
**Protocol:** REST (HTTP/1.1 or HTTP/2) + WebSocket (Full-Duplex Streaming)  
**Encoding:** JSON (`application/json`) / Binary ArrayBuffer for Raw Video Frames  

---

## 1. System Communication Overview

```
+---------------------+               +----------------------+               +------------------------+
|   team1-frontend    |   WebSocket   |    team2-backend     |   WebSocket   |  team3-ml-simulation   |
|   (Browser Client)  | <-----------> |  (FastAPI / Gateway) | <-----------> |   (CV / Model Node)    |
|  * Video Stream Tx  |               |  * Feature Fusion    |               |  * MediaPipe FaceMesh  |
|  * Telemetry Rx     |               |  * Context Risk Mod  |               |  * EAR/MAR/PERCLOS Ext |
|  * Alert Actions Rx |               |  * Mamdani Fuzzy FIS |               |  * MobileViT Sequence  |
+---------------------+               +----------------------+               +------------------------+
```

---

## 2. REST Endpoints

### 2.1 System Health & Diagnostics
* **Endpoint:** `GET /api/v1/health`
* **Description:** Check the operational status of the backend, ML worker connection, and pipeline latency.
* **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-09-22T10:05:00Z",
  "pipeline": {
    "cv_worker_connected": true,
    "average_latency_ms": 28.4,
    "target_fps": 30,
    "active_clients": 1
  }
}
```

---

### 2.2 Personalized Calibration Control
* **Endpoint:** `POST /api/v1/calibrate/start`
* **Description:** Triggers the 15-second driver calibration routine to compute personalized baseline EAR and MAR.
* **Request Body:**
```json
{
  "driver_id": "driver_alpha_01",
  "calibration_duration_sec": 15.0
}
```
* **Response (202 Accepted):**
```json
{
  "status": "CALIBRATION_STARTED",
  "driver_id": "driver_alpha_01",
  "duration_sec": 15.0,
  "start_time": "2026-09-22T10:05:10Z"
}
```

* **Endpoint:** `GET /api/v1/calibrate/status`
* **Description:** Query the progress and results of the calibration session.
* **Response (200 OK):**
```json
{
  "driver_id": "driver_alpha_01",
  "state": "COMPLETED",
  "progress_percent": 100.0,
  "baseline": {
    "baseline_ear": 0.315,
    "baseline_mar": 0.182,
    "ear_std_dev": 0.018,
    "mar_std_dev": 0.012,
    "samples_collected": 450
  }
}
```

---

### 2.3 Context Risk Ingestion (GPS & OSM Road Type)
* **Endpoint:** `POST /api/v1/context/update`
* **Description:** Updates vehicle telemetry (speed in km/h) and road classification retrieved from OpenStreetMap / Nominatim.
* **Request Body:**
```json
{
  "speed_kmh": 105.4,
  "road_type": "motorway",
  "weather": "clear",
  "time_of_day": "night"
}
```
* **Supported Road Types:**
  - `motorway` / `highway` (Risk Factor: 1.35)
  - `trunk` / `primary` (Risk Factor: 1.15)
  - `secondary` / `tertiary` (Risk Factor: 1.00)
  - `residential` / `urban` (Risk Factor: 0.85)
  - `rural` (Risk Factor: 1.10)
* **Response (200 OK):**
```json
{
  "status": "UPDATED",
  "effective_context_risk_factor": 1.42,
  "updated_at": "2026-09-22T10:05:15Z"
}
```

---

### 2.4 Headless / Simulation Frame Ingestion
* **Endpoint:** `POST /api/v1/simulate/frame`
* **Description:** Direct ingestion endpoint for test runners and benchmark scripts.
* **Request Body:**
```json
{
  "frame_id": 10842,
  "timestamp_ms": 1790071510250,
  "image_base64": "<base64_encoded_jpeg_or_png_frame>"
}
```
* **Response (200 OK):** Returns the full `TelemetryFrame` schema (see Section 3.2).

---

## 3. WebSocket Real-Time Protocols

### 3.1 Connection Channels
1. **Frontend Cockpit Stream:** `ws://localhost:8000/ws/telemetry`
2. **ML Worker Uplink:** `ws://localhost:8000/ws/ml-feed`

---

### 3.2 WebSocket Message Types

#### Message Type: `FRAME_FEED` (Frontend -> ML / Backend)
Sends compressed webcam frame to the processing engine.
```json
{
  "type": "FRAME_FEED",
  "frame_id": 4821,
  "timestamp_ms": 1790071510250,
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

#### Message Type: `TELEMETRY_UPDATE` (Backend -> Frontend HUD & 3D Rig)
Broadcast at 30 Hz with sub-40ms end-to-end processing metrics.
```json
{
  "type": "TELEMETRY_UPDATE",
  "frame_id": 4821,
  "timestamp_ms": 1790071510282,
  "processing_latency_ms": 32.4,
  
  "biometrics": {
    "ear_left": 0.284,
    "ear_right": 0.281,
    "ear_avg": 0.2825,
    "mar": 0.194,
    "perclos_30f": 12.5,
    "is_eyes_closed": false,
    "is_yawning": false,
    "eye_closure_duration_sec": 0.0,
    "yawn_duration_sec": 0.0
  },
  
  "head_pose": {
    "pitch_deg": -4.2,
    "yaw_deg": 1.8,
    "roll_deg": -0.5,
    "is_head_nodding": false,
    "is_distracted": false
  },
  
  "facial_landmarks_summary": {
    "face_detected": true,
    "tracking_confidence": 0.96,
    "occlusion_detected": false
  },
  
  "decision": {
    "alert_level": "Normal",
    "fatigue_index": 18.4,
    "confidence_score": 0.94,
    "trigger_factors": []
  },
  
  "context": {
    "speed_kmh": 90.0,
    "road_type": "motorway",
    "risk_multiplier": 1.25
  },
  
  "calibration": {
    "is_calibrated": true,
    "baseline_ear": 0.315,
    "baseline_mar": 0.182
  }
}
```

#### Message Type: `ALERT_TRIGGER` (Backend -> Frontend Urgent Event)
Pushed instantly whenever the alert level shifts or enters `Warning` or `Critical`.
```json
{
  "type": "ALERT_TRIGGER",
  "timestamp_ms": 1790071510285,
  "alert_level": "Critical",
  "fatigue_index": 88.5,
  "primary_triggers": [
    "EYE_CLOSURE_EXCEEDED_2_SEC",
    "PERCLOS_ABOVE_40_PERCENT",
    "HEAD_NOD_DETECTED_HIGH_SPEED"
  ],
  "recommended_actions": [
    "AUDIO_ALARM_MAX",
    "COCKPIT_HUD_PULSE_RED",
    "SEAT_HAPTIC_PULSE"
  ]
}
```

#### Message Type: `CALIBRATION_PROGRESS` (Backend -> Frontend)
Streamed during the 15-second driver calibration phase.
```json
{
  "type": "CALIBRATION_PROGRESS",
  "elapsed_sec": 8.5,
  "total_sec": 15.0,
  "progress_pct": 56.6,
  "current_ear": 0.312,
  "current_mar": 0.180,
  "samples_recorded": 255,
  "stability_score": 0.98
}
```

---

## 4. Alert Level State Enum Matrix

```
  FATIGUE SCORE
  0 ---------- 25 ---------- 50 ---------- 75 ---------- 100
  [   NORMAL   ] [ ADVISORY ] [  WARNING  ] [  CRITICAL  ]
       Green        Yellow        Orange          Red
      No chime     Soft chime    Dual-tone     Siren alarm
```

| Alert Level | Color Code | Visual HUD State | Audio State |
| :--- | :--- | :--- | :--- |
| `Normal` | `#00FF88` (Neon Green) | Solid green status badge, standard cockpit HUD | Silent |
| `Advisory` | `#FFDD00` (Amber Yellow) | Pulsing amber ring, notification toast | 440 Hz soft pulse chime |
| `Warning` | `#FF8800` (Vivid Orange) | Flashing orange header, warning icon | 880 Hz alternating dual beep |
| `Critical` | `#FF0044` (Laser Red) | Full screen red vignette strobing, urgent HUD banner | 1200 Hz continuous high-decibel siren |

---

## 5. Error Code Reference

| HTTP/WS Code | Error Key | Description |
| :--- | :--- | :--- |
| `400` | `INVALID_FRAME_FORMAT` | Frame is not valid Base64 JPEG/PNG or is corrupted |
| `422` | `UNPROCESSABLE_TELEMETRY` | Missing required biometric or context fields |
| `503` | `ML_ENGINE_UNAVAILABLE` | CV/ML simulation worker disconnected or unresponsive |
| `504` | `PIPELINE_TIMEOUT` | Frame processing exceeded 50ms timeout threshold |

