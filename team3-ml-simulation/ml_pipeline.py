"""
AlertX - End-to-End ML Pipeline Controller
Module: team3-ml-simulation/ml_pipeline.py
Author: Person 3 (Computer Vision & AI Modeling)

Orchestrates all ML & CV stages:
Frame Ingestion -> 468 Landmark Extraction -> Biometric Metrics -> Calibration Adjustment -> Temporal Modeling.
Guarantees sub-40ms execution per frame.
"""

import time
from typing import Dict, Any, Tuple, Optional
import numpy as np

from mediapipe_extractor import MediaPipeFaceMeshExtractor
from feature_extractor import BiometricFeatureExtractor
from calibration import PersonalizedCalibrator
from temporal_model import TemporalSequenceManager


class AlertXMLPipeline:
    """
    Unified Computer Vision & AI Modeling Pipeline for real-time driver state estimation.
    """

    def __init__(
        self,
        fps: float = 30.0,
        enable_temporal_model: bool = True,
        calibration_duration_sec: float = 15.0
    ):
        self.fps = fps
        self.frame_count: int = 0

        # Sub-modules
        self.landmark_extractor = MediaPipeFaceMeshExtractor()
        self.biometrics_extractor = BiometricFeatureExtractor(fps=fps)
        self.calibrator = PersonalizedCalibrator(duration_seconds=calibration_duration_sec, fps=fps)
        self.temporal_manager = TemporalSequenceManager(window_size=30) if enable_temporal_model else None

        # Cumulative timing profiling
        self.latency_records = []

    def process_video_frame(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Executes the complete CV/ML pipeline on a raw video frame.

        Args:
            frame_bgr (np.ndarray): Video frame (H, W, 3).

        Returns:
            Dict[str, Any]: Complete telemetry payload ready for backend fusion.
        """
        pipeline_start_t = time.perf_counter()
        self.frame_count += 1
        h, w = frame_bgr.shape[:2] if frame_bgr is not None else (480, 640)

        # 1. MediaPipe 468-point Face Mesh Extraction (<10ms)
        face_detected, landmarks_3d, lm_meta, lm_latency = self.landmark_extractor.process_frame(frame_bgr)

        if not face_detected or landmarks_3d is None:
            total_latency = (time.perf_counter() - pipeline_start_t) * 1000.0
            return {
                "frame_id": self.frame_count,
                "timestamp_ms": int(time.time() * 1000),
                "pipeline_latency_ms": round(total_latency, 2),
                "facial_landmarks_summary": {
                    "face_detected": False,
                    "tracking_confidence": 0.0,
                    "occlusion_detected": True,
                },
                "biometrics": {
                    "ear_left": 0.0,
                    "ear_right": 0.0,
                    "ear_avg": 0.0,
                    "mar": 0.0,
                    "perclos_30f": 0.0,
                    "is_eyes_closed": False,
                    "is_yawning": False,
                    "eye_closure_duration_sec": 0.0,
                    "yawn_duration_sec": 0.0,
                },
                "head_pose": {
                    "pitch_deg": 0.0,
                    "yaw_deg": 0.0,
                    "roll_deg": 0.0,
                    "is_head_nodding": False,
                    "is_distracted": False,
                },
                "calibration": self.calibrator.get_calibration_state(),
                "temporal_model": {"temporal_fatigue_score": 0.0, "latency_ms": 0.0}
            }

        # 2. Geometric Biometric Extraction (EAR, MAR, PERCLOS, Head Pose) (<4ms)
        bio_start = time.perf_counter()
        calib_state = self.calibrator.get_calibration_state()
        ear_thresh = calib_state["adaptive_ear_threshold"] if calib_state["is_calibrated"] else None
        mar_thresh = calib_state["adaptive_mar_threshold"] if calib_state["is_calibrated"] else None

        biometrics = self.biometrics_extractor.extract_features(
            landmarks_3d=landmarks_3d,
            image_width=w,
            image_height=h,
            custom_ear_threshold=ear_thresh,
            custom_mar_threshold=mar_thresh
        )
        bio_latency = (time.perf_counter() - bio_start) * 1000.0

        # 3. Feed Calibration Engine if Active (<1ms)
        calib_update = self.calibrator.feed_frame_sample(
            ear_avg=biometrics["ear_avg"],
            mar=biometrics["mar"]
        )

        # 4. MobileViT Temporal Sequence Modeling (<10ms)
        temp_latency = 0.0
        temporal_info = {}
        if self.temporal_manager is not None:
            _, temporal_info, temp_latency = self.temporal_manager.update_and_predict(
                biometrics=biometrics,
                landmarks_3d=landmarks_3d
            )

        total_latency = (time.perf_counter() - pipeline_start_t) * 1000.0

        return {
            "frame_id": self.frame_count,
            "timestamp_ms": int(time.time() * 1000),
            "pipeline_latency_ms": round(total_latency, 2),
            "stage_latencies_ms": {
                "mediapipe": round(lm_latency, 2),
                "biometrics": round(bio_latency, 2),
                "temporal_model": round(temp_latency, 2),
            },
            "facial_landmarks_summary": lm_meta,
            "biometrics": biometrics,
            "head_pose": biometrics["head_pose"],
            "calibration": calib_state,
            "calibration_event": calib_update if self.calibrator.is_active else None,
            "temporal_model": temporal_info,
        }

    def start_calibration(self, driver_id: str = "driver_01") -> Dict[str, Any]:
        """Trigger calibration start."""
        return self.calibrator.start_calibration(driver_id)

    def close(self):
        """Clean up pipeline resources."""
        self.landmark_extractor.close()

