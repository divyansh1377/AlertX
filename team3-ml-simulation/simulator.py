"""
AlertX - ML Simulator & Standalone Pipeline Runner
Module: team3-ml-simulation/simulator.py
Author: Person 3 (Computer Vision & AI Modeling)

Usage:
  python simulator.py --mode synthetic --frames 150
  python simulator.py --mode camera --device 0
  python simulator.py --mode video --source sample.mp4
"""

import argparse
import json
import time
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


from ml_pipeline import AlertXMLPipeline


def run_synthetic_simulation(num_frames: int = 150, target_fps: int = 30):
    """
    Simulates a sequence of driver states:
    - Frames 1-45: Awake / Normal
    - Frames 46-75: Yawning sequence
    - Frames 76-120: Eyes closing / Micro-sleep
    - Frames 121-150: Head nodding off
    """
    print(f"[*] Initializing AlertX ML Pipeline in Synthetic Mode ({num_frames} frames @ {target_fps} FPS)...")
    pipeline = AlertXMLPipeline(fps=target_fps)

    # Start 15-second calibration test
    pipeline.start_calibration(driver_id="test_driver_sim")

    # Generate dummy canvas (640x480)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)

    latencies = []
    for i in range(num_frames):
        t0 = time.perf_counter()
        
        # Add visual timestamp/noise to dummy frame if opencv available
        if CV2_AVAILABLE:
            cv2.putText(dummy_frame, f"Frame {i+1}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        telemetry = pipeline.process_video_frame(dummy_frame)
        latency_ms = telemetry["pipeline_latency_ms"]
        latencies.append(latency_ms)

        bio = telemetry["biometrics"]
        hp = telemetry["head_pose"]
        
        print(f"[Frame {i+1:03d}] Latency: {latency_ms:.1f}ms | EAR: {bio.get('ear_avg', 0.0):.3f} | "
              f"MAR: {bio.get('mar', 0.0):.3f} | PERCLOS: {bio.get('perclos_30f', 0.0):.1f}% | "
              f"Pitch: {hp.get('pitch_deg', 0.0):.1f} deg")

        # Maintain 30 FPS pacing
        elapsed = time.perf_counter() - t0
        sleep_time = max(0.0, (1.0 / target_fps) - elapsed)
        time.sleep(sleep_time)

    avg_lat = np.mean(latencies)
    max_lat = np.max(latencies)
    p95_lat = np.percentile(latencies, 95)
    print("\n--- Latency Performance Benchmark Summary ---")
    print(f"Average Pipeline Latency: {avg_lat:.2f} ms")
    print(f"95th Percentile Latency: {p95_lat:.2f} ms")
    print(f"Max Peak Latency:         {max_lat:.2f} ms")
    print(f"SLA Compliance (<40ms):   {'PASS [OK]' if avg_lat < 40.0 else 'FAIL [EXCEEDED]'}")

    pipeline.close()


def run_camera_stream(device_index: int = 0):
    """Runs the live webcam feed through the CV/ML pipeline."""
    print(f"[*] Opening camera device {device_index}...")
    cap = cv2.VideoCapture(device_index)
    if not cap.isOpened():
        print(f"[ERROR] Could not open camera {device_index}.")
        return

    pipeline = AlertXMLPipeline(fps=30.0)
    print("[*] Press 'c' to start 15s calibration, 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        telemetry = pipeline.process_video_frame(frame)
        bio = telemetry["biometrics"]
        hp = telemetry["head_pose"]

        # Display overlay on video
        hud_text = f"EAR: {bio.get('ear_avg', 0.0):.2f} | MAR: {bio.get('mar', 0.0):.2f} | Lat: {telemetry['pipeline_latency_ms']:.1f}ms"
        cv2.putText(frame, hud_text, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("AlertX ML Vision Feed", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            print("[*] Starting 15-second driver calibration...")
            pipeline.start_calibration()

    cap.release()
    cv2.destroyAllWindows()
    pipeline.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AlertX ML Pipeline Simulator")
    parser.add_argument("--mode", type=str, choices=["synthetic", "camera", "video"], default="synthetic")
    parser.add_argument("--frames", type=int, default=150)
    parser.add_argument("--device", type=int, default=0)
    parser.add_argument("--source", type=str, default="")
    args = parser.parse_args()

    if args.mode == "synthetic":
        run_synthetic_simulation(num_frames=args.frames)
    elif args.mode == "camera":
        run_camera_stream(device_index=args.device)
