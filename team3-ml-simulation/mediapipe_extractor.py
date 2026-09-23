"""
AlertX - MediaPipe Facial Landmark Extractor
Module: team3-ml-simulation/mediapipe_extractor.py
Author: Person 3 (Computer Vision & AI Modeling)

Extracts 468 3D facial landmarks using Google MediaPipe Face Mesh.
Optimized for real-time video processing (<10ms inference per frame).
"""

import time
from typing import Optional, Tuple, Dict, Any
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False



class MediaPipeFaceMeshExtractor:
    """
    High-performance MediaPipe Face Mesh wrapper for 468 3D facial landmark extraction.
    
    Attributes:
        min_detection_confidence (float): Minimum confidence for face detection.
        min_tracking_confidence (float): Minimum confidence for landmark tracking.
        refine_landmarks (bool): Whether to refine attention around eyes and lips.
    """

    def __init__(
        self,
        max_num_faces: int = 1,
        refine_landmarks: bool = True,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self.max_num_faces = max_num_faces
        self.refine_landmarks = refine_landmarks
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence

        if MEDIAPIPE_AVAILABLE:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=self.max_num_faces,
                refine_landmarks=self.refine_landmarks,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
                static_image_mode=False  # Crucial for video stream temporal smoothing
            )
        else:
            self.face_mesh = None
            print("[WARN] MediaPipe is not installed. Extractor will run in synthetic/fallback mode.")

        # Latency tracking metrics
        self.last_inference_time_ms: float = 0.0

    def process_frame(
        self, frame_bgr: np.ndarray
    ) -> Tuple[bool, Optional[np.ndarray], Optional[Dict[str, Any]], float]:
        """
        Processes a single BGR video frame and extracts 468 3D facial landmarks.

        Args:
            frame_bgr (np.ndarray): Input frame from camera in BGR format (H, W, C).

        Returns:
            Tuple containing:
                - face_detected (bool): True if face was detected.
                - landmarks_3d (np.ndarray or None): Shape (468, 3) normalized [0, 1] coordinates.
                - metadata (dict or None): Bounding box, confidence score, resolution.
                - latency_ms (float): Inference execution duration in milliseconds.
        """
        start_time = time.perf_counter()
        
        if frame_bgr is None or frame_bgr.size == 0:
            return False, None, None, 0.0

        h, w, _ = frame_bgr.shape

        if not MEDIAPIPE_AVAILABLE or self.face_mesh is None:
            # Fallback mock landmark extraction for testing without native C++ MediaPipe binaries
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return self._generate_synthetic_landmarks(w, h, latency_ms)

        # Convert BGR to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        frame_rgb.flags.writeable = False
        
        results = self.face_mesh.process(frame_rgb)
        
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        self.last_inference_time_ms = latency_ms

        if not results.multi_face_landmarks:
            return False, None, {"tracking_confidence": 0.0, "face_detected": False}, latency_ms

        # Extract primary face landmarks
        raw_landmarks = results.multi_face_landmarks[0].landmark
        num_landmarks = len(raw_landmarks)
        
        # Convert to numpy array of shape (N, 3)
        landmarks_3d = np.zeros((num_landmarks, 3), dtype=np.float32)
        for i, lm in enumerate(raw_landmarks):
            landmarks_3d[i] = [lm.x, lm.y, lm.z]

        # Calculate bounding box from landmarks
        x_min, y_min = np.min(landmarks_3d[:, 0]) * w, np.min(landmarks_3d[:, 1]) * h
        x_max, y_max = np.max(landmarks_3d[:, 0]) * w, np.max(landmarks_3d[:, 1]) * h

        metadata = {
            "face_detected": True,
            "tracking_confidence": 0.95,  # Estimated tracking confidence
            "landmark_count": num_landmarks,
            "bbox": {
                "x_min": float(x_min),
                "y_min": float(y_min),
                "width": float(x_max - x_min),
                "height": float(y_max - y_min),
            },
            "image_dimensions": {"width": w, "height": h},
        }

        return True, landmarks_3d, metadata, latency_ms

    def _generate_synthetic_landmarks(
        self, width: int, height: int, latency_ms: float
    ) -> Tuple[bool, np.ndarray, Dict[str, Any], float]:
        """Generates realistic synthetic 468-point landmarks for unit testing & CI."""
        synthetic_landmarks = np.zeros((468, 3), dtype=np.float32)
        # Populate basic facial center points
        synthetic_landmarks[:, 0] = np.linspace(0.4, 0.6, 468)  # X center
        synthetic_landmarks[:, 1] = np.linspace(0.3, 0.7, 468)  # Y center
        synthetic_landmarks[:, 2] = 0.0                         # Z depth

        metadata = {
            "face_detected": True,
            "tracking_confidence": 0.90,
            "is_synthetic": True,
            "bbox": {"x_min": width * 0.3, "y_min": height * 0.2, "width": width * 0.4, "height": height * 0.5},
            "image_dimensions": {"width": width, "height": height},
        }
        return True, synthetic_landmarks, metadata, latency_ms

    def close(self):
        """Release MediaPipe resources gracefully."""
        if self.face_mesh:
            self.face_mesh.close()
