"""
AlertX - Biometric & Geometric Feature Extractor
Module: team3-ml-simulation/feature_extractor.py
Author: Person 3 (Computer Vision & AI Modeling)

Calculates:
1. Eye Aspect Ratio (EAR) for micro-sleep / blink detection.
2. Mouth Aspect Ratio (MAR) for yawn aperture detection.
3. 3D Head Pose (Pitch/Yaw/Roll) via SolvePnP for nodding off and gaze distraction.
4. PERCLOS (Percentage of Eye Closure over rolling 30-frame window).
"""

from collections import deque
from typing import Dict, Any, Tuple, Optional
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False



class BiometricFeatureExtractor:
    """
    Extracts geometric fatigue metrics from 468 MediaPipe facial landmarks.
    """

    # Landmark indices based on Google MediaPipe Face Mesh topology
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]   # [p1, p2, p3, p4, p5, p6]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] # [p1, p2, p3, p4, p5, p6]
    
    # Outer mouth landmarks for MAR
    MOUTH_INDICES = [61, 291, 0, 17, 84, 314, 78, 308]

    # Canonical 3D Face Model Points for SolvePnP Head Pose Estimation (in mm)
    MODEL_3D_POINTS = np.array([
        (0.0, 0.0, 0.0),          # Nose tip (index 1)
        (0.0, -330.0, -65.0),     # Chin (index 199)
        (-225.0, 170.0, -135.0),  # Left eye outer corner (index 33)
        (225.0, 170.0, -135.0),   # Right eye outer corner (index 263)
        (-150.0, -150.0, -125.0), # Left mouth corner (index 61)
        (150.0, -150.0, -125.0)   # Right mouth corner (index 291)
    ], dtype=np.float64)

    POSE_LANDMARK_INDICES = [1, 199, 33, 263, 61, 291]

    def __init__(
        self,
        ear_threshold: float = 0.22,
        mar_threshold: float = 0.65,
        perclos_window_size: int = 30,
        fps: float = 30.0
    ):
        self.ear_threshold = ear_threshold
        self.mar_threshold = mar_threshold
        self.perclos_window_size = perclos_window_size
        self.fps = fps

        # Rolling buffer for eye state (1 = closed, 0 = open) over 30 frames
        self.eye_closed_buffer = deque(maxlen=perclos_window_size)

        # State tracking for duration calculations
        self.consecutive_closed_frames: int = 0
        self.consecutive_yawn_frames: int = 0
        self.total_blinks: int = 0
        self.total_yawns: int = 0
        self._was_eyes_closed: bool = False
        self._was_yawning: bool = False

    @staticmethod
    def _euclidean_distance(pt1: np.ndarray, pt2: np.ndarray) -> float:
        """Calculates 2D or 3D Euclidean distance between two points."""
        return float(np.linalg.norm(pt1 - pt2))

    def calculate_ear(self, landmarks_3d: np.ndarray, eye_indices: list) -> float:
        """
        Calculates Eye Aspect Ratio (EAR) based on Soukupová and Čech formula:
        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
        """
        p1 = landmarks_3d[eye_indices[0], :2]
        p2 = landmarks_3d[eye_indices[1], :2]
        p3 = landmarks_3d[eye_indices[2], :2]
        p4 = landmarks_3d[eye_indices[3], :2]
        p5 = landmarks_3d[eye_indices[4], :2]
        p6 = landmarks_3d[eye_indices[5], :2]

        v1 = self._euclidean_distance(p2, p6)
        v2 = self._euclidean_distance(p3, p5)
        h = self._euclidean_distance(p1, p4)

        if h < 1e-6:
            return 0.0

        ear = (v1 + v2) / (2.0 * h)
        return float(ear)

    def calculate_mar(self, landmarks_3d: np.ndarray) -> float:
        """
        Calculates Mouth Aspect Ratio (MAR) for yawn aperture detection:
        MAR = (||p_top - p_bottom||) / (||p_left - p_right||)
        Using landmarks: Top (0), Bottom (17), Left Corner (61), Right Corner (291)
        """
        p_left = landmarks_3d[61, :2]
        p_right = landmarks_3d[291, :2]
        p_top = landmarks_3d[0, :2]
        p_bottom = landmarks_3d[17, :2]
        
        # Additional vertical mouth pairs for stability
        p_top2 = landmarks_3d[84, :2]
        p_bottom2 = landmarks_3d[314, :2]
        p_top3 = landmarks_3d[78, :2]
        p_bottom3 = landmarks_3d[308, :2]

        horizontal = self._euclidean_distance(p_left, p_right)
        if horizontal < 1e-6:
            return 0.0

        v1 = self._euclidean_distance(p_top, p_bottom)
        v2 = self._euclidean_distance(p_top2, p_bottom2)
        v3 = self._euclidean_distance(p_top3, p_bottom3)

        mar = (v1 + v2 + v3) / (3.0 * horizontal)
        return float(mar)

    def estimate_head_pose(
        self, landmarks_3d: np.ndarray, image_width: int, image_height: int
    ) -> Tuple[float, float, float]:
        """
        Estimates 3D Head Pose Euler angles (Pitch, Yaw, Roll) via cv2.solvePnP.

        Returns:
            Tuple[float, float, float]: (pitch_deg, yaw_deg, roll_deg)
            - Pitch: Positive = Looking Up, Negative = Nodding Down
            - Yaw: Positive = Turning Right, Negative = Turning Left
            - Roll: Lateral tilt
        """
        if not CV2_AVAILABLE:
            # Synthetic head pose calculation fallback based on relative 3D landmark displacements
            nose = landmarks_3d[1]
            chin = landmarks_3d[199]
            pitch_deg = float((chin[1] - nose[1] - 0.15) * -100.0)
            yaw_deg = float((landmarks_3d[263, 0] - landmarks_3d[33, 0] - 0.20) * 100.0)
            return round(pitch_deg, 2), round(yaw_deg, 2), 0.0

        # Extract 2D image coordinates of the 6 key reference points
        image_points = np.zeros((6, 2), dtype=np.float64)
        for i, idx in enumerate(self.POSE_LANDMARK_INDICES):
            image_points[i] = [
                landmarks_3d[idx, 0] * image_width,
                landmarks_3d[idx, 1] * image_height
            ]

        # Approximate camera intrinsic matrix (pinhole model)
        focal_length = image_width
        center = (image_width / 2.0, image_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)  # Assume zero lens distortion

        success, rot_vec, trans_vec = cv2.solvePnP(
            self.MODEL_3D_POINTS,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return 0.0, 0.0, 0.0

        # Convert rotation vector to rotation matrix
        rot_mat, _ = cv2.Rodrigues(rot_vec)

        # Decompose rotation matrix to Euler angles
        sy = np.sqrt(rot_mat[0, 0] * rot_mat[0, 0] + rot_mat[1, 0] * rot_mat[1, 0])
        singular = sy < 1e-6

        if not singular:
            pitch = np.arctan2(rot_mat[2, 1], rot_mat[2, 2])
            yaw = np.arctan2(-rot_mat[2, 0], sy)
            roll = np.arctan2(rot_mat[1, 0], rot_mat[0, 0])
        else:
            pitch = np.arctan2(-rot_mat[1, 2], rot_mat[1, 1])
            yaw = np.arctan2(-rot_mat[2, 0], sy)
            roll = 0.0

        # Convert radians to degrees
        pitch_deg = float(np.degrees(pitch))
        yaw_deg = float(np.degrees(yaw))
        roll_deg = float(np.degrees(roll))

        return pitch_deg, yaw_deg, roll_deg

    def calculate_perclos(self, is_closed: bool) -> float:
        """
        Updates the 30-frame rolling buffer and returns PERCLOS percentage (0.0 to 100.0%).
        """
        self.eye_closed_buffer.append(1 if is_closed else 0)
        if len(self.eye_closed_buffer) == 0:
            return 0.0
        
        perclos = (sum(self.eye_closed_buffer) / len(self.eye_closed_buffer)) * 100.0
        return float(perclos)

    def extract_features(
        self,
        landmarks_3d: np.ndarray,
        image_width: int = 640,
        image_height: int = 480,
        custom_ear_threshold: Optional[float] = None,
        custom_mar_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Runs comprehensive biometric extraction on 468-point landmarks.

        Returns:
            Dict containing EAR, MAR, PERCLOS, Head Pose, and Event Flags.
        """
        active_ear_threshold = custom_ear_threshold or self.ear_threshold
        active_mar_threshold = custom_mar_threshold or self.mar_threshold

        # 1. EAR Calculations
        ear_left = self.calculate_ear(landmarks_3d, self.LEFT_EYE_INDICES)
        ear_right = self.calculate_ear(landmarks_3d, self.RIGHT_EYE_INDICES)
        ear_avg = (ear_left + ear_right) / 2.0

        is_eyes_closed = ear_avg < active_ear_threshold

        # 2. State & Blink Tracking
        if is_eyes_closed:
            self.consecutive_closed_frames += 1
        else:
            if self._was_eyes_closed and self.consecutive_closed_frames >= 2:
                self.total_blinks += 1
            self.consecutive_closed_frames = 0
        self._was_eyes_closed = is_eyes_closed

        eye_closure_duration_sec = self.consecutive_closed_frames / max(self.fps, 1.0)

        # 3. PERCLOS
        perclos_30f = self.calculate_perclos(is_eyes_closed)

        # 4. MAR & Yawn Tracking
        mar = self.calculate_mar(landmarks_3d)
        is_yawning = mar > active_mar_threshold

        if is_yawning:
            self.consecutive_yawn_frames += 1
        else:
            if self._was_yawning and self.consecutive_yawn_frames >= 15:  # ~0.5s of yawning
                self.total_yawns += 1
            self.consecutive_yawn_frames = 0
        self._was_yawning = is_yawning

        yawn_duration_sec = self.consecutive_yawn_frames / max(self.fps, 1.0)

        # 5. Head Pose Estimation
        pitch, yaw, roll = self.estimate_head_pose(landmarks_3d, image_width, image_height)
        is_head_nodding = pitch < -18.0  # Significant pitch down
        is_distracted = abs(yaw) > 30.0  # Looking sideways

        return {
            "ear_left": round(ear_left, 4),
            "ear_right": round(ear_right, 4),
            "ear_avg": round(ear_avg, 4),
            "mar": round(mar, 4),
            "perclos_30f": round(perclos_30f, 2),
            "is_eyes_closed": is_eyes_closed,
            "is_yawning": is_yawning,
            "eye_closure_duration_sec": round(eye_closure_duration_sec, 2),
            "yawn_duration_sec": round(yawn_duration_sec, 2),
            "head_pose": {
                "pitch_deg": round(pitch, 2),
                "yaw_deg": round(yaw, 2),
                "roll_deg": round(roll, 2),
                "is_head_nodding": is_head_nodding,
                "is_distracted": is_distracted
            },
            "counters": {
                "total_blinks": self.total_blinks,
                "total_yawns": self.total_yawns
            }
        }
