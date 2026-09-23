"""
AlertX - FastAPI Backend & Decision Gateway
Module: team2-backend/main.py
Author: Person 2 (Backend, Data Fusion & Routing)

Main entry point integrating:
1. REST API endpoints for Calibration, Context, Health & Metrics
2. Bidirectional WebSocket channels for 30 FPS Telemetry & Alert streaming
3. Real-time pipeline connecting Fusion Engine -> Context Analyzer -> Mamdani FIS
"""

import time
import asyncio
import logging
from typing import Dict, Any
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, RELOAD, CORS_ORIGINS
from models import CalibrationStartRequest, ContextUpdateRequest, TelemetryFrame
from fusion_engine import ConfidenceAdaptiveFeatureFusion
from context_analyzer import ContextRiskAnalyzer
from fuzzy_engine import MamdaniFuzzyEngine
from websocket_manager import WebSocketConnectionManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("alertx.gateway")

app = FastAPI(
    title="AlertX Backend API & Fusion Gateway",
    version="1.0.0",
    description="Real-time driver fatigue telemetry, confidence-adaptive fusion, and Mamdani fuzzy decision engine."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Decision Engine Singletons
fusion_engine = ConfidenceAdaptiveFeatureFusion()
context_analyzer = ContextRiskAnalyzer()
fuzzy_engine = MamdaniFuzzyEngine()
ws_manager = WebSocketConnectionManager()

# Runtime state storage
calibration_status_store = {
    "driver_id": "driver_01",
    "state": "IDLE",
    "progress_percent": 0.0,
    "baseline": {
        "baseline_ear": 0.30,
        "baseline_mar": 0.18,
        "adaptive_ear_threshold": 0.22,
        "adaptive_mar_threshold": 0.65
    }
}


# ============================================================================
# REST Endpoints
# ============================================================================

@app.get("/api/v1/health", tags=["Diagnostics"])
async def health_check():
    """Health check endpoint reporting pipeline latency and worker status."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp_ms": int(time.time() * 1000),
        "pipeline": {
            "active_frontend_clients": len(ws_manager.frontend_clients),
            "active_ml_workers": len(ws_manager.ml_workers),
            "current_context_risk": context_analyzer.calculate_risk_multiplier()
        }
    }


@app.post("/api/v1/calibrate/start", status_code=status.HTTP_202_ACCEPTED, tags=["Calibration"])
async def start_calibration(req: CalibrationStartRequest):
    """Triggers the 15-second personalized driver calibration routine."""
    calibration_status_store["driver_id"] = req.driver_id
    calibration_status_store["state"] = "IN_PROGRESS"
    calibration_status_store["progress_percent"] = 0.0
    
    logger.info(f"Starting calibration for driver '{req.driver_id}' ({req.calibration_duration_sec}s)")
    return {
        "status": "CALIBRATION_STARTED",
        "driver_id": req.driver_id,
        "duration_sec": req.calibration_duration_sec,
        "timestamp_ms": int(time.time() * 1000)
    }


@app.get("/api/v1/calibrate/status", tags=["Calibration"])
async def get_calibration_status():
    """Returns the current driver calibration state and baselines."""
    return calibration_status_store


@app.post("/api/v1/context/update", tags=["Context Risk"])
async def update_context(req: ContextUpdateRequest):
    """Updates vehicle telemetry (GPS speed) and OSM road classification."""
    summary = context_analyzer.update_context(
        speed_kmh=req.speed_kmh,
        road_type=req.road_type,
        weather=req.weather or "clear",
        time_of_day=req.time_of_day or "day"
    )
    logger.info(f"Context updated: {req.speed_kmh} km/h on {req.road_type} (Risk: {summary['risk_multiplier']}x)")
    return {
        "status": "UPDATED",
        "effective_context": summary
    }


@app.post("/api/v1/simulate/frame", tags=["Simulation"])
async def simulate_frame_telemetry(raw_payload: Dict[str, Any]):
    """Processes a single raw telemetry frame directly via REST for headless benchmark testing."""
    processed = process_and_fuse_telemetry(raw_payload)
    return processed


# ============================================================================
# Telemetry Processing & Decision Pipeline
# ============================================================================

def process_and_fuse_telemetry(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes Stages 6, 7, and 8 of the pipeline:
    1. Confidence-Adaptive Feature Fusion
    2. Context-Aware Risk Modulation
    3. Mamdani Fuzzy Inference Alert Classification
    """
    t_start = time.perf_counter()

    biometrics = raw_data.get("biometrics", {})
    head_pose = raw_data.get("head_pose", {})
    landmarks_meta = raw_data.get("facial_landmarks_summary", {})
    calib = raw_data.get("calibration", calibration_status_store["baseline"])

    # 1. Feature Fusion (<2ms)
    fused_fatigue, overall_conf, fusion_diag = fusion_engine.fuse_features(
        biometrics=biometrics,
        head_pose=head_pose,
        landmarks_meta=landmarks_meta,
        calibration_state=calib
    )

    # 2. Context Risk Multiplier (<2ms)
    context_summary = context_analyzer.get_context_summary()
    context_risk = context_summary["risk_multiplier"]

    # 3. Mamdani Fuzzy Inference Engine (<3ms)
    alert_level, defuzzified_score, triggers = fuzzy_engine.evaluate_decision(
        fused_fatigue=fused_fatigue,
        perclos=biometrics.get("perclos_30f", 0.0),
        is_yawning=biometrics.get("is_yawning", False),
        is_head_nodding=head_pose.get("is_head_nodding", False),
        eye_closure_sec=biometrics.get("eye_closure_duration_sec", 0.0),
        context_risk=context_risk
    )

    total_pipeline_latency = raw_data.get("pipeline_latency_ms", 0.0) + ((time.perf_counter() - t_start) * 1000.0)

    # Construct complete unified telemetry packet
    telemetry_packet = {
        "type": "TELEMETRY_UPDATE",
        "frame_id": raw_data.get("frame_id", 1),
        "timestamp_ms": int(time.time() * 1000),
        "processing_latency_ms": round(total_pipeline_latency, 2),
        "biometrics": biometrics,
        "head_pose": head_pose,
        "facial_landmarks_summary": landmarks_meta,
        "decision": {
            "alert_level": alert_level,
            "fatigue_index": defuzzified_score,
            "confidence_score": overall_conf,
            "trigger_factors": triggers,
            "fusion_diagnostics": fusion_diag
        },
        "context": context_summary,
        "calibration": calib
    }

    return telemetry_packet


# ============================================================================
# WebSocket Streaming Endpoints
# ============================================================================

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for Frontend UI Clients (Cockpit HUD & 3D Visualizer).
    Receives video frames or control commands, broadcasts 30 FPS telemetry.
    """
    await ws_manager.connect_frontend(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "FRAME_FEED":
                # Forward to connected ML processing worker
                await ws_manager.forward_to_ml_workers(data)
            elif msg_type == "START_CALIBRATION":
                calibration_status_store["state"] = "IN_PROGRESS"
                logger.info("Calibration requested via WebSocket.")
            elif msg_type == "PING":
                await websocket.send_json({"type": "PONG", "timestamp_ms": int(time.time() * 1000)})

    except WebSocketDisconnect:
        ws_manager.disconnect_frontend(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {e}")
        ws_manager.disconnect_frontend(websocket)


@app.websocket("/ws/ml-feed")
async def websocket_ml_feed_endpoint(websocket: WebSocket):
    """
    WebSocket uplink for Team 3's CV/ML simulation pipeline node.
    Receives raw extracted facial metrics, executes fusion + fuzzy engine,
    and broadcasts the final alert decision to all frontend HUD clients.
    """
    await ws_manager.connect_ml_worker(websocket)
    try:
        while True:
            raw_ml_payload = await websocket.receive_json()
            
            # Process and broadcast to frontend
            fused_packet = process_and_fuse_telemetry(raw_ml_payload)
            await ws_manager.broadcast_to_frontend(fused_packet)

    except WebSocketDisconnect:
        ws_manager.disconnect_ml_worker(websocket)
    except Exception as e:
        logger.error(f"ML Worker WebSocket error: {e}")
        ws_manager.disconnect_ml_worker(websocket)


# ============================================================================
# Standalone Runner
# ============================================================================

if __name__ == "__main__":
    print(f"[*] Starting AlertX Backend on http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=RELOAD)

