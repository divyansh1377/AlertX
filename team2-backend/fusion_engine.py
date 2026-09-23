"""
AlertX - Confidence-Adaptive Feature Fusion Engine
Module: team2-backend/fusion_engine.py
Author: Person 2 (Backend, Data Fusion & Routing)

Dynamically weights facial biometrics (EAR, MAR, PERCLOS, Head Pose) based on
real-time landmark tracking confidence, head orientation extremity, and occlusion signals.
Avoids false positives caused by head rotation, partial occlusion, or lighting variance.
"""

from typing import Dict, Any, Tuple
import numpy as np


class ConfidenceAdaptiveFeatureFusion:
    """
    Multimodal sensor fusion engine that computes dynamic confidence-adjusted fatigue scores.
    """

    def __init__(self):
        # Baseline static weights under ideal frontal gaze conditions
        self.base_weights = {
            "ear": 0.35,
            "perclos": 0.30,
            "mar": 0.20,
            "head_pose": 0.15
        }

    def compute_dynamic_weights(
        self,
        tracking_confidence: float,
        yaw_deg: float,
        pitch_deg: float,
        is_occluded: bool = False
    ) -> Dict[str, float]:
        """
        Calculates adaptive reliability weights based on geometric driver orientation.

        Logic:
        1. As Yaw increases (driver looking away/mirror), EAR landmark precision degrades -> Reduce EAR weight.
        2. As tracking confidence drops, shift weight to temporal/PERCLOS consistency.
        3. If pitch is extreme downward, amplify head pose nod weight.
        """
        w_ear = self.base_weights["ear"]
        w_perclos = self.base_weights["perclos"]
        w_mar = self.base_weights["mar"]
        w_head = self.base_weights["head_pose"]

        # 1. Orientation Penalty Factor (Yaw attenuation)
        yaw_abs = abs(yaw_deg)
        if yaw_abs > 15.0:
            attenuation = max(0.2, 1.0 - ((yaw_abs - 15.0) / 45.0))
            w_ear *= attenuation  # Reduce eye weight when side-facing
            w_mar *= (attenuation * 0.9)
            w_head += (1.0 - attenuation) * 0.25  # Increase head pose relevance

        # 2. Downward Nod Amplification
        if pitch_deg < -15.0:
            w_head *= 1.8  # Nodding down is a dominant sleep indicator

        # 3. Tracking Confidence & Occlusion Dampening
        overall_reliability = tracking_confidence * (0.3 if is_occluded else 1.0)
        w_ear *= overall_reliability
        w_mar *= overall_reliability

        # Normalize weights to sum to 1.0
        total_w = w_ear + w_perclos + w_mar + w_head
        if total_w < 1e-6:
            return {"ear": 0.25, "perclos": 0.25, "mar": 0.25, "head_pose": 0.25}

        return {
            "ear": w_ear / total_w,
            "perclos": w_perclos / total_w,
            "mar": w_mar / total_w,
            "head_pose": w_head / total_w
        }

    def fuse_features(
        self,
        biometrics: Dict[str, Any],
        head_pose: Dict[str, Any],
        landmarks_meta: Dict[str, Any],
        calibration_state: Dict[str, Any]
    ) -> Tuple[float, float, Dict[str, Any]]:
        """
        Fuses biometric metrics into a singular fatigue index [0.0 - 100.0] and overall confidence.

        Returns:
            Tuple[float, float, dict]:
                - fused_fatigue_score (0.0 - 100.0)
                - overall_confidence (0.0 - 1.0)
                - fusion_diagnostics (dict)
        """
        tracking_conf = landmarks_meta.get("tracking_confidence", 0.9)
        is_occluded = landmarks_meta.get("occlusion_detected", False)

        yaw = head_pose.get("yaw_deg", 0.0)
        pitch = head_pose.get("pitch_deg", 0.0)

        # 1. Compute dynamic weights
        weights = self.compute_dynamic_weights(
            tracking_confidence=tracking_conf,
            yaw_deg=yaw,
            pitch_deg=pitch,
            is_occluded=is_occluded
        )

        # 2. Normalize individual feature severity scores to [0.0, 100.0]
        # EAR component: Lower EAR -> higher fatigue
        baseline_ear = calibration_state.get("baseline_ear", 0.30)
        ear_avg = biometrics.get("ear_avg", 0.30)
        ear_score = max(0.0, min(100.0, ((baseline_ear - ear_avg) / max(baseline_ear * 0.4, 0.05)) * 100.0))

        # PERCLOS component: Directly 0-100%
        perclos_score = max(0.0, min(100.0, biometrics.get("perclos_30f", 0.0) * 2.5))  # 40% PERCLOS -> 100 score

        # MAR component: Higher MAR -> higher fatigue/yawning
        mar = biometrics.get("mar", 0.18)
        mar_score = max(0.0, min(100.0, ((mar - 0.25) / 0.45) * 100.0)) if mar > 0.25 else 0.0

        # Head Pose component: Negative pitch indicates nodding
        head_nod_score = max(0.0, min(100.0, (abs(min(0.0, pitch)) / 25.0) * 100.0))

        # 3. Weighted Fusion
        fused_fatigue = (
            weights["ear"] * ear_score +
            weights["perclos"] * perclos_score +
            weights["mar"] * mar_score +
            weights["head_pose"] * head_nod_score
        )

        overall_confidence = float(np.clip(tracking_conf * (0.5 if is_occluded else 1.0), 0.1, 1.0))

        diagnostics = {
            "dynamic_weights": {k: round(v, 3) for k, v in weights.items()},
            "sub_scores": {
                "ear_score": round(ear_score, 1),
                "perclos_score": round(perclos_score, 1),
                "mar_score": round(mar_score, 1),
                "head_nod_score": round(head_nod_score, 1),
            },
            "overall_confidence": round(overall_confidence, 2)
        }

        return float(np.clip(fused_fatigue, 0.0, 100.0)), overall_confidence, diagnostics

