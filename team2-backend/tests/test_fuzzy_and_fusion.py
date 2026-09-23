"""
Unit tests for Team 2: Feature Fusion, Context Risk & Mamdani Fuzzy Engine
"""

from fusion_engine import ConfidenceAdaptiveFeatureFusion
from context_analyzer import ContextRiskAnalyzer
from fuzzy_engine import MamdaniFuzzyEngine


def test_confidence_adaptive_fusion():
    """Verifies that tracking confidence degradation attenuates eye weight and overall score."""
    engine = ConfidenceAdaptiveFeatureFusion()

    dummy_bio = {
        "ear_avg": 0.15,  # Indicates closed eyes
        "mar": 0.18,
        "perclos_30f": 35.0,
    }
    dummy_hp = {"pitch_deg": 0.0, "yaw_deg": 0.0, "roll_deg": 0.0}
    dummy_calib = {"baseline_ear": 0.30}

    # High tracking confidence
    score_high_conf, conf_1, _ = engine.fuse_features(
        biometrics=dummy_bio,
        head_pose=dummy_hp,
        landmarks_meta={"tracking_confidence": 0.95, "occlusion_detected": False},
        calibration_state=dummy_calib
    )

    # Low tracking confidence / Occlusion
    score_low_conf, conf_2, _ = engine.fuse_features(
        biometrics=dummy_bio,
        head_pose=dummy_hp,
        landmarks_meta={"tracking_confidence": 0.20, "occlusion_detected": True},
        calibration_state=dummy_calib
    )

    assert conf_1 > conf_2
    assert 0.0 <= score_high_conf <= 100.0


def test_context_speed_and_road_multiplier():
    """Verifies motorway high speed increases risk factor over residential low speed."""
    analyzer = ContextRiskAnalyzer()

    analyzer.update_context(speed_kmh=120.0, road_type="motorway")
    high_risk = analyzer.calculate_risk_multiplier()

    analyzer.update_context(speed_kmh=30.0, road_type="residential")
    low_risk = analyzer.calculate_risk_multiplier()

    assert high_risk > low_risk
    assert high_risk > 1.2
    assert low_risk < 1.0


def test_mamdani_fuzzy_decision_tiers():
    """Verifies fuzzy logic maps distinct input combinations to expected severity levels."""
    fuzzy = MamdaniFuzzyEngine()

    # Case 1: Normal alert state
    alert_1, score_1, _ = fuzzy.evaluate_decision(
        fused_fatigue=10.0,
        perclos=2.0,
        is_yawning=False,
        is_head_nodding=False,
        eye_closure_sec=0.0,
        context_risk=1.0
    )
    assert alert_1 == "Normal"

    # Case 2: Advisory state from yawning
    alert_2, score_2, _ = fuzzy.evaluate_decision(
        fused_fatigue=35.0,
        perclos=10.0,
        is_yawning=True,
        is_head_nodding=False,
        eye_closure_sec=0.0,
        context_risk=1.0
    )
    assert alert_2 in ["Advisory", "Warning"]

    # Case 3: Critical alert state from prolonged eye closure + nodding on motorway
    alert_3, score_3, triggers = fuzzy.evaluate_decision(
        fused_fatigue=85.0,
        perclos=45.0,
        is_yawning=False,
        is_head_nodding=True,
        eye_closure_sec=2.2,
        context_risk=1.4
    )
    assert alert_3 == "Critical"
    assert len(triggers) > 0
