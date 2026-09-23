"""
AlertX - Backend Server Configuration & Constants
Module: team2-backend/config.py
Author: Person 2 (Backend, Data Fusion & Routing)
"""

from typing import List, Dict
import os

HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", 8000))
RELOAD: bool = os.getenv("RELOAD", "true").lower() == "true"

CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

# OpenStreetMap Road Type Risk Multipliers
ROAD_TYPE_RISK_MAP: Dict[str, float] = {
    "motorway": 1.35,     # High speed, monotony, high fatality risk
    "highway": 1.35,
    "trunk": 1.20,
    "primary": 1.15,
    "secondary": 1.00,
    "tertiary": 1.00,
    "residential": 0.80,  # Slower speed, frequent stops
    "urban": 0.85,
    "rural": 1.10,        # Unlit, winding roads
    "unknown": 1.00
}

# Default Vehicle & Context Parameters
DEFAULT_SPEED_KMH: float = 80.0
HIGH_SPEED_THRESHOLD_KMH: float = 100.0

# Mamdani Fuzzy System Alert Boundaries (0-100 scale)
ALERT_BOUNDARIES = {
    "Normal": (0.0, 25.0),
    "Advisory": (25.0, 50.0),
    "Warning": (50.0, 75.0),
    "Critical": (75.0, 100.0)
}

