"""
AlertX - Data Models & Schemas
Module: team2-backend/models.py
Author: Person 2 (Backend, Data Fusion & Routing)
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class CalibrationStartRequest(BaseModel):
    driver_id: str = Field(default="driver_01", description="Unique identifier for driver")
    calibration_duration_sec: float = Field(default=15.0, ge=5.0, le=60.0)


class ContextUpdateRequest(BaseModel):
    speed_kmh: float = Field(default=80.0, ge=0.0, le=300.0, description="Vehicle speed in km/h")
    road_type: str = Field(default="motorway", description="OSM road category (motorway, primary, residential, etc.)")
    weather: Optional[str] = Field(default="clear", description="Current weather conditions")
    time_of_day: Optional[str] = Field(default="day", description="day or night")


class BiometricsPayload(BaseModel):
    ear_left: float = Field(default=0.30)
    ear_right: float = Field(default=0.30)
    ear_avg: float = Field(default=0.30)
    mar: float = Field(default=0.18)
    perclos_30f: float = Field(default=5.0)
    is_eyes_closed: bool = Field(default=False)
    is_yawning: bool = Field(default=False)
    eye_closure_duration_sec: float = Field(default=0.0)
    yawn_duration_sec: float = Field(default=0.0)


class HeadPosePayload(BaseModel):
    pitch_deg: float = Field(default=0.0)
    yaw_deg: float = Field(default=0.0)
    roll_deg: float = Field(default=0.0)
    is_head_nodding: bool = Field(default=False)
    is_distracted: bool = Field(default=False)


class DecisionPayload(BaseModel):
    alert_level: Literal["Normal", "Advisory", "Warning", "Critical"] = Field(default="Normal")
    fatigue_index: float = Field(default=10.0, ge=0.0, le=100.0)
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
    trigger_factors: List[str] = Field(default_factory=list)


class TelemetryFrame(BaseModel):
    type: str = Field(default="TELEMETRY_UPDATE")
    frame_id: int = Field(default=1)
    timestamp_ms: int = Field(default=0)
    processing_latency_ms: float = Field(default=0.0)
    biometrics: BiometricsPayload
    head_pose: HeadPosePayload
    facial_landmarks_summary: Dict[str, Any] = Field(default_factory=dict)
    decision: DecisionPayload
    context: Dict[str, Any] = Field(default_factory=dict)
    calibration: Dict[str, Any] = Field(default_factory=dict)


class AlertTriggerEvent(BaseModel):
    type: str = Field(default="ALERT_TRIGGER")
    timestamp_ms: int
    alert_level: Literal["Normal", "Advisory", "Warning", "Critical"]
    fatigue_index: float
    primary_triggers: List[str]
    recommended_actions: List[str]

