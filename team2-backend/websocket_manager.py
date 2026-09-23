"""
AlertX - Real-Time WebSocket Connection Manager
Module: team2-backend/websocket_manager.py
Author: Person 2 (Backend, Data Fusion & Routing)

Handles high-throughput bidirectional WebSocket streaming between:
1. Browser Frontend Clients (HUD / 3D Visualization)
2. ML Simulation Workers / CV Video Feeder
"""

import json
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("alertx.websocket")


class WebSocketConnectionManager:
    """
    Manages active WebSocket connections, channel segregation, and low-latency broadcasting.
    """

    def __init__(self):
        # Connected browser UI clients
        self.frontend_clients: Set[WebSocket] = set()
        # Connected CV/ML worker uplinks
        self.ml_workers: Set[WebSocket] = set()

    async def connect_frontend(self, websocket: WebSocket):
        """Accepts and registers a new frontend telemetry listener."""
        await websocket.accept()
        self.frontend_clients.add(websocket)
        logger.info(f"Frontend client connected. Total clients: {len(self.frontend_clients)}")

    def disconnect_frontend(self, websocket: WebSocket):
        """Removes a disconnected frontend client."""
        self.frontend_clients.discard(websocket)
        logger.info(f"Frontend client disconnected. Remaining clients: {len(self.frontend_clients)}")

    async def connect_ml_worker(self, websocket: WebSocket):
        """Accepts and registers an ML simulation worker uplink."""
        await websocket.accept()
        self.ml_workers.add(websocket)
        logger.info(f"ML worker uplink connected. Total workers: {len(self.ml_workers)}")

    def disconnect_ml_worker(self, websocket: WebSocket):
        """Removes a disconnected ML worker."""
        self.ml_workers.discard(websocket)
        logger.info(f"ML worker uplink disconnected. Remaining workers: {len(self.ml_workers)}")

    async def broadcast_to_frontend(self, payload: Dict[str, Any]):
        """
        Broadcasts a telemetry update or alert event to all connected UI clients.
        """
        if not self.frontend_clients:
            return

        message_str = json.dumps(payload)
        dead_connections = set()

        for client in self.frontend_clients:
            try:
                await client.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.add(client)

        for dead in dead_connections:
            self.frontend_clients.discard(dead)

    async def forward_to_ml_workers(self, frame_payload: Dict[str, Any]):
        """
        Forwards a video frame payload from the frontend to connected ML processing nodes.
        """
        if not self.ml_workers:
            return

        message_str = json.dumps(frame_payload)
        for worker in list(self.ml_workers):
            try:
                await worker.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to forward frame to worker: {e}")
                self.ml_workers.discard(worker)

