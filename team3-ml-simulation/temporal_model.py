"""
AlertX - MobileViT 30-Frame Temporal Sequence Encoder
Module: team3-ml-simulation/temporal_model.py
Author: Person 3 (Computer Vision & AI Modeling)

PyTorch implementation of a lightweight temporal attention encoder designed to
process 30-frame sliding windows of facial landmark & biometric embeddings to detect
progressive micro-sleep transitions and cumulative fatigue dynamics in <10ms.
"""

import time
from collections import deque
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


if TORCH_AVAILABLE:
    class PositionalEncoding(nn.Module):
        """Standard sinusoidal positional encoding for temporal frame sequences."""
        def __init__(self, d_model: int, max_len: int = 60):
            super().__init__()
            pe = torch.zeros(max_len, d_model)
            position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
            div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
            pe[:, 0::2] = torch.sin(position * div_term)
            pe[:, 1::2] = torch.cos(position * div_term)
            self.register_buffer('pe', pe.unsqueeze(0))

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            return x + self.pe[:, :x.size(1), :]


    class MobileViTTemporalEncoder(nn.Module):
        """
        Lightweight MobileViT-inspired Temporal Transformer Encoder for sequence modeling.
        
        Ingests a sequence of 30-frame biometric & landmark feature vectors (e.g. EAR, MAR,
        Head Pose Euler angles, PERCLOS delta, landmark motion vectors) and outputs
        temporal fatigue trend scores and micro-sleep transition probabilities.
        """

        def __init__(
            self,
            input_dim: int = 16,
            hidden_dim: int = 64,
            num_heads: int = 4,
            num_layers: int = 2,
            window_size: int = 30,
            num_classes: int = 4,  # Normal, Advisory, Warning, Critical
            dropout: float = 0.1
        ):
            super().__init__()
            self.window_size = window_size
            self.input_dim = input_dim

            # 1. Feature projection layer
            self.input_proj = nn.Sequential(
                nn.Linear(input_dim, hidden_dim),
                nn.LayerNorm(hidden_dim),
                nn.GELU(),
                nn.Dropout(dropout)
            )

            # 2. Positional Encoding
            self.pos_encoder = PositionalEncoding(d_model=hidden_dim, max_len=window_size + 10)

            # 3. Multi-Head Transformer Encoder Stack
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=hidden_dim,
                nhead=num_heads,
                dim_feedforward=hidden_dim * 2,
                dropout=dropout,
                activation="gelu",
                batch_first=True
            )
            self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

            # 4. Temporal Global Pooling & Classification / Regression Heads
            self.norm = nn.LayerNorm(hidden_dim)
            self.fatigue_regressor = nn.Sequential(
                nn.Linear(hidden_dim, 32),
                nn.ReLU(),
                nn.Linear(32, 1),
                nn.Sigmoid()  # Normalized fatigue score [0.0, 1.0]
            )

            self.classifier_head = nn.Sequential(
                nn.Linear(hidden_dim, 32),
                nn.ReLU(),
                nn.Linear(32, num_classes)
            )

        def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
            """
            Args:
                x (torch.Tensor): Shape (Batch, Seq_Len=30, Input_Dim=16)

            Returns:
                Tuple[torch.Tensor, torch.Tensor]:
                    - fatigue_score: Shape (Batch, 1) in range [0, 1]
                    - class_logits: Shape (Batch, Num_Classes)
            """
            # Project input features
            feat = self.input_proj(x)  # (B, 30, H)
            feat = self.pos_encoder(feat)

            # Transformer temporal encoding
            out = self.transformer_encoder(feat)  # (B, 30, H)
            out = self.norm(out)

            # Global Temporal Average Pooling
            pooled = torch.mean(out, dim=1)  # (B, H)

            fatigue_score = self.fatigue_regressor(pooled) * 100.0  # Scale to [0, 100]
            class_logits = self.classifier_head(pooled)

            return fatigue_score, class_logits


class TemporalSequenceManager:
    """
    Manages the 30-frame rolling sequence buffer, transforms incoming frame biometrics
    into 16-dimensional feature representations, and executes temporal inference.
    """

    def __init__(
        self,
        window_size: int = 30,
        feature_dim: int = 16,
        device: str = "cpu"
    ):
        self.window_size = window_size
        self.feature_dim = feature_dim
        self.device = torch.device(device) if TORCH_AVAILABLE and torch.cuda.is_available() and device == "cuda" else "cpu"
        
        self.sequence_buffer: deque = deque(maxlen=window_size)
        self.model: Optional[Any] = None

        if TORCH_AVAILABLE:
            self.model = MobileViTTemporalEncoder(
                input_dim=feature_dim,
                window_size=window_size
            ).to(self.device)
            self.model.eval()

    def construct_feature_vector(self, biometrics: Dict[str, Any], landmarks_3d: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Packs frame metrics into a 16-dimensional normalized temporal vector:
        [0: EAR_L, 1: EAR_R, 2: EAR_Avg, 3: MAR, 4: PERCLOS/100, 5: Pitch/90,
         6: Yaw/90, 7: Roll/90, 8: EyeClosedFlag, 9: YawnFlag, 10: NodFlag,
         11: ClosureSec, 12: YawnSec, 13: BlinkRate, 14: Reserved1, 15: Reserved2]
        """
        hp = biometrics.get("head_pose", {})
        cnt = biometrics.get("counters", {})

        vec = np.zeros(self.feature_dim, dtype=np.float32)
        vec[0] = biometrics.get("ear_left", 0.3)
        vec[1] = biometrics.get("ear_right", 0.3)
        vec[2] = biometrics.get("ear_avg", 0.3)
        vec[3] = biometrics.get("mar", 0.2)
        vec[4] = biometrics.get("perclos_30f", 0.0) / 100.0
        vec[5] = hp.get("pitch_deg", 0.0) / 90.0
        vec[6] = hp.get("yaw_deg", 0.0) / 90.0
        vec[7] = hp.get("roll_deg", 0.0) / 90.0
        vec[8] = 1.0 if biometrics.get("is_eyes_closed", False) else 0.0
        vec[9] = 1.0 if biometrics.get("is_yawning", False) else 0.0
        vec[10] = 1.0 if hp.get("is_head_nodding", False) else 0.0
        vec[11] = min(1.0, biometrics.get("eye_closure_duration_sec", 0.0) / 3.0)
        vec[12] = min(1.0, biometrics.get("yawn_duration_sec", 0.0) / 3.0)
        vec[13] = min(1.0, cnt.get("total_blinks", 0) / 30.0)
        vec[14] = 0.0
        vec[15] = 0.0

        return vec

    def update_and_predict(
        self, biometrics: Dict[str, Any], landmarks_3d: Optional[np.ndarray] = None
    ) -> Tuple[float, Dict[str, Any], float]:
        """
        Appends new frame feature vector to rolling buffer and runs temporal sequence inference.

        Returns:
            Tuple[float, dict, float]:
                - temporal_fatigue_score (0.0 to 100.0)
                - temporal_diagnostics (dict)
                - latency_ms (float)
        """
        start_t = time.perf_counter()
        
        feature_vec = self.construct_feature_vector(biometrics, landmarks_3d)
        self.sequence_buffer.append(feature_vec)

        # Pad with identical frames if buffer is not full yet (< 30 frames)
        if len(self.sequence_buffer) < self.window_size:
            pad_count = self.window_size - len(self.sequence_buffer)
            seq_list = [feature_vec] * pad_count + list(self.sequence_buffer)
        else:
            seq_list = list(self.sequence_buffer)

        seq_tensor_np = np.array(seq_list, dtype=np.float32)  # (30, 16)

        if TORCH_AVAILABLE and self.model is not None:
            with torch.no_grad():
                tensor_in = torch.from_numpy(seq_tensor_np).unsqueeze(0).to(self.device)  # (1, 30, 16)
                fatigue_score_t, logits_t = self.model(tensor_in)
                
                fatigue_score = float(fatigue_score_t.squeeze().item())
                probs = torch.softmax(logits_t, dim=-1).squeeze().tolist()
        else:
            # Fallback heuristic calculation if PyTorch not present
            ear_mean = np.mean(seq_tensor_np[:, 2])
            perclos = seq_tensor_np[-1, 4] * 100.0
            fatigue_score = float(np.clip((1.0 - ear_mean / 0.3) * 50.0 + perclos * 0.5, 0.0, 100.0))
            probs = [0.7, 0.2, 0.1, 0.0]

        latency_ms = (time.perf_counter() - start_t) * 1000.0

        diagnostics = {
            "buffer_length": len(self.sequence_buffer),
            "temporal_fatigue_score": round(fatigue_score, 2),
            "class_probabilities": {
                "Normal": round(probs[0], 3),
                "Advisory": round(probs[1], 3),
                "Warning": round(probs[2], 3),
                "Critical": round(probs[3], 3),
            },
            "temporal_model_latency_ms": round(latency_ms, 2),
        }

        return fatigue_score, diagnostics, latency_ms

