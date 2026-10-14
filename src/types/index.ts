/**
 * DriveWatch V1 - Types & Interfaces
 * Real-Time Driver Drowsiness Measurement Prototype
 * VIT Chennai IDP Project
 */

export interface DriverProfile {
  driverId: string;
  name: string;
  vehicleId: string;
  email: string;
  avatarUrl?: string;
  loginTime: number;
}

export interface HeadPose {
  pitch: number; // Positive = Looking Up, Negative = Nodding Down (degrees)
  yaw: number;   // Positive = Turning Right, Negative = Turning Left (degrees)
  roll: number;  // Lateral Head Tilt (degrees)
}

export interface TelemetryMetrics {
  // Eye Aspect Ratio
  earLeft: number;
  earRight: number;
  earAvg: number;
  isEyeClosed: boolean;

  // Mouth Aspect Ratio
  mar: number;
  isMouthOpen: boolean;

  // Percentage of Eye Closure (30-second rolling window, fixed 0.20 threshold)
  perclos: number; // 0.00 to 1.00 (or 0% - 100%)
  perclosPercentage: number; // 0 - 100%

  // Head Pose
  headPose: HeadPose;

  // Pipeline telemetry
  fps: number;
  inferenceTimeMs: number;
  faceDetected: boolean;
  trackingConfidence: number;
  timestamp: number;
}

export interface MetricSample {
  timestamp: number;
  value: number;
}

export interface TelemetryHistory {
  ear: MetricSample[];
  mar: MetricSample[];
  perclos: MetricSample[];
  pitch: MetricSample[];
  yaw: MetricSample[];
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export type ViewportMode = 'standard' | 'fullscreen';

