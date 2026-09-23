"""
AlertX - Context-Aware Risk Assessment Module
Module: team2-backend/context_analyzer.py
Author: Person 2 (Backend, Data Fusion & Routing)

Integrates vehicle telemetry (GPS speed in km/h) and OpenStreetMap (OSM)
road topology classifications to dynamically modulate fatigue risk thresholds.
For example, a 1.5s micro-sleep at 120 km/h on a motorway is Critical,
while the same micro-sleep in stationary residential traffic is Advisory.
"""

from typing import Dict, Any
from config import ROAD_TYPE_RISK_MAP, HIGH_SPEED_THRESHOLD_KMH


class ContextRiskAnalyzer:
    """
    Modulates driver fatigue severity based on real-world situational context.
    """

    def __init__(self):
        self.current_speed_kmh: float = 60.0
        self.current_road_type: str = "primary"
        self.weather: str = "clear"
        self.time_of_day: str = "day"

    def update_context(
        self,
        speed_kmh: float,
        road_type: str,
        weather: str = "clear",
        time_of_day: str = "day"
    ) -> Dict[str, Any]:
        """Updates internal vehicle & environmental context state."""
        self.current_speed_kmh = max(0.0, speed_kmh)
        self.current_road_type = road_type.lower()
        self.weather = weather.lower()
        self.time_of_day = time_of_day.lower()

        return self.get_context_summary()

    def calculate_risk_multiplier(self) -> float:
        """
        Calculates a composite risk multiplier (typically 0.7x to 1.6x).
        
        Formula:
        Risk = BaseRoadRisk * SpeedFactor * EnvironmentalFactor
        """
        # 1. Base Road Type Risk
        base_road_risk = ROAD_TYPE_RISK_MAP.get(self.current_road_type, 1.0)

        # 2. Speed Scaling (Kinetic energy and braking distance growth)
        if self.current_speed_kmh <= 10.0:
            speed_factor = 0.75  # Near standstill / traffic jam
        elif self.current_speed_kmh <= 60.0:
            speed_factor = 0.95  # Moderate city speed
        elif self.current_speed_kmh <= 100.0:
            speed_factor = 1.15  # Highway cruise
        else:
            # High-speed exponential scaling above 100 km/h
            speed_factor = 1.15 + ((self.current_speed_kmh - 100.0) / 100.0) * 0.45

        # 3. Environmental Factor (Night / Low Visibility)
        env_factor = 1.0
        if self.time_of_day == "night":
            env_factor += 0.10  # Circadian dip / darkness hazard
        if self.weather in ["rain", "fog", "snow"]:
            env_factor += 0.15  # Reduced traction / stopping distance

        composite_risk = base_road_risk * speed_factor * env_factor
        return round(float(composite_risk), 3)

    def modulate_fatigue_score(self, raw_fatigue_score: float) -> float:
        """
        Applies context risk multiplier to the raw fused fatigue score.
        """
        multiplier = self.calculate_risk_multiplier()
        modulated_score = raw_fatigue_score * multiplier
        return round(float(min(100.0, max(0.0, modulated_score))), 2)

    def get_context_summary(self) -> Dict[str, Any]:
        """Returns the serialized context representation."""
        multiplier = self.calculate_risk_multiplier()
        return {
            "speed_kmh": self.current_speed_kmh,
            "road_type": self.current_road_type,
            "weather": self.weather,
            "time_of_day": self.time_of_day,
            "risk_multiplier": multiplier,
            "is_high_speed": self.current_speed_kmh >= HIGH_SPEED_THRESHOLD_KMH
        }

