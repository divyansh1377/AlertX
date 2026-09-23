"""
AlertX - Personalized Driver Calibration Module
Module: team3-ml-simulation/calibration.py
Author: Person 3 (Computer Vision & AI Modeling)

A 15-second startup module to establish driver-specific EAR and MAR baselines,
accounting for facial morphology, natural squint, and individual eye geometries.
"""

import time
from typing import Dict, Any, List, Optional
import numpy as np


class PersonalizedCalibrator:
    """
    Collects 15 seconds of steady-state facial telemetry to compute individualized
    EAR/MAR baselines and dynamic anomaly thresholds.
    """

    def __init__(
        self,
        duration_seconds: float = 15.0,
        fps: float = 30.0,
        ear_std_multiplier: float = 1.5,
        mar_std_multiplier: float = 2.0,
    ):
        self.duration_seconds = duration_seconds
        self.target_fps = fps
        self.expected_samples = int(duration_seconds * fps)
        self.ear_std_multiplier = ear_std_multiplier
        self.mar_std_multiplier = mar_std_multiplier

        self.is_active: bool = False
        self.is_calibrated: bool = False
        self.start_time: Optional[float] = None
        self.driver_id: str = "default_driver"

        # Buffer arrays for calibration samples
        self.ear_samples: List[float] = []
        self.mar_samples: List[float] = []

        # Calibrated baseline outputs
        self.baseline_ear: float = 0.30
        self.baseline_mar: float = 0.18
        self.adaptive_ear_threshold: float = 0.22
        self.adaptive_mar_threshold: float = 0.65
        self.stability_score: float = 1.0

    def start_calibration(self, driver_id: str = "driver_01") -> Dict[str, Any]:
        """Initiates the 15-second calibration window."""
        self.driver_id = driver_id
        self.is_active = True
        self.is_calibrated = False
        self.start_time = time.perf_counter()
        self.ear_samples.clear()
        self.mar_samples.clear()

        return {
            "status": "CALIBRATION_STARTED",
            "driver_id": self.driver_id,
            "duration_sec": self.duration_seconds,
            "target_samples": self.expected_samples,
        }

    def feed_frame_sample(self, ear_avg: float, mar: float) -> Dict[str, Any]:
        """
        Feeds a single frame's EAR and MAR measurements during calibration.

        Returns:
            Dict containing current calibration progress and status.
        """
        if not self.is_active or self.start_time is None:
            return {"status": "IDLE", "is_calibrated": self.is_calibrated}

        # Filter out extreme outliers (e.g. blinks during calibration)
        if 0.10 <= ear_avg <= 0.50:
            self.ear_samples.append(ear_avg)
        if 0.05 <= mar <= 0.80:
            self.mar_samples.append(mar)

        elapsed_sec = time.perf_counter() - self.start_time
        progress_pct = min(100.0, (elapsed_sec / self.duration_seconds) * 100.0)

        # Check if 15-second window has completed
        if elapsed_sec >= self.duration_seconds:
            return self._finalize_calibration()

        return {
            "status": "IN_PROGRESS",
            "elapsed_sec": round(elapsed_sec, 2),
            "progress_pct": round(progress_pct, 1),
            "samples_collected": len(self.ear_samples),
            "current_ear": round(ear_avg, 4),
            "current_mar": round(mar, 4),
        }

    def _finalize_calibration(self) -> Dict[str, Any]:
        """Computes statistical baselines and dynamic thresholds from collected buffer."""
        self.is_active = False

        if len(self.ear_samples) < 50:
            # Fallback if too few samples were collected
            self.is_calibrated = True
            self.baseline_ear = 0.30
            self.baseline_mar = 0.18
            self.adaptive_ear_threshold = 0.22
            self.adaptive_mar_threshold = 0.65
            self.stability_score = 0.50
            return {"status": "FAILED_INSUFFICIENT_SAMPLES", "fallback_used": True}

        ear_array = np.array(self.ear_samples)
        mar_array = np.array(self.mar_samples)

        # Statistical baseline calculations
        mean_ear = float(np.mean(ear_array))
        std_ear = float(np.std(ear_array))

        mean_mar = float(np.mean(mar_array))
        std_mar = float(np.std(mar_array))

        self.baseline_ear = mean_ear
        self.baseline_mar = mean_mar

        # Dynamic Adaptive Thresholds:
        # Personalized EAR threshold = Baseline EAR - (k * EAR_std) or 75% of baseline
        self.adaptive_ear_threshold = max(0.18, min(0.28, mean_ear - (self.ear_std_multiplier * std_ear)))
        
        # Personalized MAR threshold = Baseline MAR + (k * MAR_std) + offset
        self.adaptive_mar_threshold = max(0.50, min(0.85, mean_mar + 0.35 + (self.mar_std_multiplier * std_mar)))

        # Stability score based on variance of EAR during neutral gaze
        self.stability_score = max(0.0, min(1.0, 1.0 - (std_ear / (mean_ear + 1e-6))))
        self.is_calibrated = True

        return {
            "status": "CALIBRATION_COMPLETED",
            "driver_id": self.driver_id,
            "baseline_ear": round(self.baseline_ear, 4),
            "baseline_mar": round(self.baseline_mar, 4),
            "adaptive_ear_threshold": round(self.adaptive_ear_threshold, 4),
            "adaptive_mar_threshold": round(self.adaptive_mar_threshold, 4),
            "stability_score": round(self.stability_score, 2),
            "total_samples": len(self.ear_samples),
        }

    def get_calibration_state(self) -> Dict[str, Any]:
        """Returns the current active calibration parameters."""
        return {
            "is_calibrated": self.is_calibrated,
            "is_active": self.is_active,
            "baseline_ear": round(self.baseline_ear, 4),
            "baseline_mar": round(self.baseline_mar, 4),
            "adaptive_ear_threshold": round(self.adaptive_ear_threshold, 4),
            "adaptive_mar_threshold": round(self.adaptive_mar_threshold, 4),
            "stability_score": round(self.stability_score, 2),
        }

