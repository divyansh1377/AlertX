"""
AlertX - Mamdani Fuzzy Logic Decision Engine
Module: team2-backend/fuzzy_engine.py
Author: Person 2 (Backend, Data Fusion & Routing)

Mamdani Fuzzy Inference System (FIS) for final driver alert classification.
Takes Fused Fatigue Index, PERCLOS, Yawn Intensity, and Context Risk Multiplier as inputs,
evaluates fuzzy rules, and applies Centroid Defuzzification to classify into:
  - Normal    (0 - 25)
  - Advisory  (25 - 50)
  - Warning   (50 - 75)
  - Critical  (75 - 100)
"""

from typing import Dict, Any, Tuple, List
import numpy as np


class TriangularMF:
    """Triangular Membership Function: (a, b, c) where b is peak."""
    def __init__(self, a: float, b: float, c: float):
        self.a, self.b, self.c = a, b, c

    def __call__(self, x: float) -> float:
        if x <= self.a or x >= self.c:
            return 0.0
        elif self.a < x <= self.b:
            return (x - self.a) / (self.b - self.a + 1e-9)
        elif self.b < x < self.c:
            return (self.c - x) / (self.c - self.b + 1e-9)
        return 0.0


class TrapezoidalMF:
    """Trapezoidal Membership Function: (a, b, c, d) with flat plateau between b and c."""
    def __init__(self, a: float, b: float, c: float, d: float):
        self.a, self.b, self.c, self.d = a, b, c, d

    def __call__(self, x: float) -> float:
        if x <= self.a or x >= self.d:
            return 0.0
        elif self.a < x < self.b:
            return (x - self.a) / (self.b - self.a + 1e-9)
        elif self.b <= x <= self.c:
            return 1.0
        elif self.c < x < self.d:
            return (self.d - x) / (self.d - self.c + 1e-9)
        return 0.0


class MamdaniFuzzyEngine:
    """
    Complete Mamdani Fuzzy Inference System for real-time driver fatigue risk assessment.
    """

    def __init__(self):
        # 1. Input Variable 1: Fused Fatigue (0 - 100)
        self.mf_fatigue_low = TrapezoidalMF(-10, 0, 15, 35)
        self.mf_fatigue_med = TriangularMF(20, 45, 70)
        self.mf_fatigue_high = TriangularMF(55, 75, 90)
        self.mf_fatigue_extreme = TrapezoidalMF(75, 88, 100, 110)

        # 2. Input Variable 2: PERCLOS (0 - 100%)
        self.mf_perclos_normal = TrapezoidalMF(-5, 0, 8, 18)
        self.mf_perclos_elevated = TriangularMF(12, 25, 40)
        self.mf_perclos_critical = TrapezoidalMF(30, 45, 100, 105)

        # 3. Input Variable 3: Context Risk Multiplier (0.7 - 1.8)
        self.mf_risk_low = TrapezoidalMF(0.5, 0.7, 0.9, 1.1)
        self.mf_risk_med = TriangularMF(0.95, 1.2, 1.45)
        self.mf_risk_high = TrapezoidalMF(1.3, 1.5, 2.0, 2.5)

        # 4. Output Variable: Alert Severity Scale (0 - 100)
        self.output_x = np.linspace(0, 100, 201)
        self.mf_out_normal = TrapezoidalMF(-10, 0, 15, 30)
        self.mf_out_advisory = TriangularMF(20, 38, 55)
        self.mf_out_warning = TriangularMF(45, 65, 80)
        self.mf_out_critical = TrapezoidalMF(70, 85, 100, 110)

    def evaluate_decision(
        self,
        fused_fatigue: float,
        perclos: float,
        is_yawning: bool,
        is_head_nodding: bool,
        eye_closure_sec: float,
        context_risk: float
    ) -> Tuple[str, float, List[str]]:
        """
        Executes Mamdani inference and centroid defuzzification.

        Returns:
            Tuple[str, float, List[str]]:
                - alert_level ('Normal' | 'Advisory' | 'Warning' | 'Critical')
                - defuzzified_score (0.0 - 100.0)
                - trigger_factors (list of reason strings)
        """
        trigger_factors = []

        # Fuzzify inputs
        f_low = self.mf_fatigue_low(fused_fatigue)
        f_med = self.mf_fatigue_med(fused_fatigue)
        f_high = self.mf_fatigue_high(fused_fatigue)
        f_ext = self.mf_fatigue_extreme(fused_fatigue)

        p_norm = self.mf_perclos_normal(perclos)
        p_elev = self.mf_perclos_elevated(perclos)
        p_crit = self.mf_perclos_critical(perclos)

        r_low = self.mf_risk_low(context_risk)
        r_med = self.mf_risk_med(context_risk)
        r_high = self.mf_risk_high(context_risk)

        # Evaluate Mamdani Rules (Min for AND, Max for OR, Implication via clipping)
        # Rule 1: IF Fatigue is Low AND PERCLOS is Normal -> Output is Normal
        w_normal = min(f_low, p_norm)

        # Rule 2: IF Yawning OR (Fatigue is Med AND Context is Low) -> Output is Advisory
        w_advisory = max(
            0.7 if is_yawning else 0.0,
            min(f_med, r_low),
            min(f_low, p_elev)
        )

        # Rule 3: IF (Fatigue is High) OR (PERCLOS is Elevated AND Context is High) -> Output is Warning
        w_warning = max(
            min(f_high, max(r_med, r_high)),
            min(p_elev, r_high),
            min(f_med, p_elev)
        )

        # Rule 4: IF (Fatigue is Extreme) OR (PERCLOS is Critical) OR (Head Nodding AND Context >= Med) -> Output Critical
        w_critical = max(
            f_ext,
            p_crit,
            min(0.9 if is_head_nodding else 0.0, max(r_med, r_high)),
            1.0 if eye_closure_sec >= 1.8 else 0.0
        )

        # Aggregate output membership curves (Max aggregation)
        aggregated_mf = np.zeros_like(self.output_x)
        for i, x_val in enumerate(self.output_x):
            mu_norm = min(w_normal, self.mf_out_normal(x_val))
            mu_adv = min(w_advisory, self.mf_out_advisory(x_val))
            mu_warn = min(w_warning, self.mf_out_warning(x_val))
            mu_crit = min(w_critical, self.mf_out_critical(x_val))
            aggregated_mf[i] = max(mu_norm, mu_adv, mu_warn, mu_crit)

        # Defuzzify using Center of Gravity (Centroid)
        sum_mu = np.sum(aggregated_mf)
        if sum_mu < 1e-6:
            defuzzified_score = fused_fatigue  # Fallback
        else:
            defuzzified_score = float(np.sum(self.output_x * aggregated_mf) / sum_mu)

        # Determine discrete classification label
        if defuzzified_score < 25.0:
            alert_level = "Normal"
        elif defuzzified_score < 50.0:
            alert_level = "Advisory"
        elif defuzzified_score < 75.0:
            alert_level = "Warning"
        else:
            alert_level = "Critical"

        # Record human-readable trigger factors
        if eye_closure_sec >= 1.5:
            trigger_factors.append(f"Prolonged eye closure ({eye_closure_sec:.1f}s)")
        if perclos >= 25.0:
            trigger_factors.append(f"High PERCLOS ({perclos:.1f}%)")
        if is_yawning:
            trigger_factors.append("Frequent yawn detected")
        if is_head_nodding:
            trigger_factors.append("Head pitch nodding detected")
        if context_risk > 1.25 and defuzzified_score >= 50.0:
            trigger_factors.append("High speed context escalation")

        return alert_level, round(defuzzified_score, 2), trigger_factors

