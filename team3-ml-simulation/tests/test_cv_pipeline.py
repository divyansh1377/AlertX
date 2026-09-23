"""
Unit tests for Team 3: CV & AI Modeling Pipeline
"""

import numpy as np

from feature_extractor import BiometricFeatureExtractor
from calibration import PersonalizedCalibrator
from temporal_model import TemporalSequenceManager, TORCH_AVAILABLE


def test_ear_calculation():
    """Verifies EAR decreases when eye coordinates close vertically."""
    extractor = BiometricFeatureExtractor()
    
    # Mock open eye landmarks
    landmarks_open = np.zeros((468, 3), dtype=np.float32)
    landmarks_open[33] = [0.1, 0.5, 0.0]   # p1 (outer)
    landmarks_open[160] = [0.15, 0.45, 0.0] # p2 (top-left)
    landmarks_open[158] = [0.25, 0.45, 0.0] # p3 (top-right)
    landmarks_open[133] = [0.3, 0.5, 0.0]   # p4 (inner)
    landmarks_open[153] = [0.25, 0.55, 0.0] # p5 (bottom-right)
    landmarks_open[144] = [0.15, 0.55, 0.0] # p6 (bottom-left)
    
    ear_open = extractor.calculate_ear(landmarks_open, extractor.LEFT_EYE_INDICES)
    assert ear_open > 0.20, f"Expected open eye EAR > 0.20, got {ear_open}"

    # Mock closed eye landmarks (vertical collapse)
    landmarks_closed = landmarks_open.copy()
    landmarks_closed[160, 1] = 0.50
    landmarks_closed[158, 1] = 0.50
    landmarks_closed[153, 1] = 0.50
    landmarks_closed[144, 1] = 0.50
    
    ear_closed = extractor.calculate_ear(landmarks_closed, extractor.LEFT_EYE_INDICES)
    assert ear_closed < 0.05, f"Expected closed eye EAR < 0.05, got {ear_closed}"
    assert ear_closed < ear_open


def test_calibration_routine():
    """Verifies baseline computation and adaptive threshold scaling."""
    calibrator = PersonalizedCalibrator(duration_seconds=0.1, fps=30.0)
    calibrator.start_calibration(driver_id="test_driver")

    # Feed 60 open-eye samples (calibrator requires >= 50 samples)
    for _ in range(60):
        calibrator.feed_frame_sample(ear_avg=0.32, mar=0.18)

    state = calibrator._finalize_calibration()
    assert state["status"] == "CALIBRATION_COMPLETED"
    assert abs(state["baseline_ear"] - 0.32) < 1e-3
    assert state["adaptive_ear_threshold"] < state["baseline_ear"]


def test_temporal_sequence_manager():
    """Verifies 30-frame sequence buffer and forward pass."""
    mgr = TemporalSequenceManager(window_size=30, feature_dim=16)
    
    dummy_bio = {
        "ear_left": 0.30,
        "ear_right": 0.30,
        "ear_avg": 0.30,
        "mar": 0.20,
        "perclos_30f": 5.0,
        "head_pose": {"pitch_deg": -2.0, "yaw_deg": 1.0, "roll_deg": 0.0},
        "counters": {"total_blinks": 2, "total_yawns": 0}
    }

    score, diag, lat = mgr.update_and_predict(dummy_bio)
    assert 0.0 <= score <= 100.0
    assert lat < 25.0  # Latency well within frame budget
