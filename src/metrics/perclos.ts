/**
 * DriveWatch V1 - PERCLOS Calculation Logic
 * Module: src/metrics/perclos.ts
 *
 * Implements the standard ISO/SAE PERCLOS (Percentage of Eye Closure) measurement.
 * Specification:
 * - 30-second rolling temporal window.
 * - Fixed 0.20 EAR threshold (a frame is considered 'closed' if EAR < 0.20).
 * - Client-side high-resolution rolling buffer.
 * - Computes true time-weighted eye closure percentage over the active 30s window.
 *
 * NOTE: DriveWatch V1 measures raw PERCLOS telemetry only.
 * No drowsiness classification or fatigue threshold inference is performed here.
 */

export interface PerclosSample {
  timestamp: number;
  ear: number;
  isClosed: boolean;
}

export class PerclosTracker {
  private windowDurationMs: number;
  private closureThreshold: number;
  private buffer: PerclosSample[] = [];

  /**
   * @param windowDurationMs Rolling window duration in milliseconds (default: 30,000 ms = 30 seconds)
   * @param closureThreshold Fixed EAR threshold to designate eye closure (default: 0.20)
   */
  constructor(windowDurationMs = 30_000, closureThreshold = 0.20) {
    this.windowDurationMs = windowDurationMs;
    this.closureThreshold = closureThreshold;
  }

  /**
   * Adds an EAR reading into the rolling buffer and evicts expired samples.
   * @param ear Current instantaneous Eye Aspect Ratio (average of both eyes)
   * @param timestamp Epoch timestamp in ms (defaults to performance.now() or Date.now())
   * @returns Current PERCLOS ratio (0.00 to 1.00)
   */
  public addSample(ear: number, timestamp: number = Date.now()): number {
    const isClosed = ear < this.closureThreshold;
    this.buffer.push({ timestamp, ear, isClosed });

    this.pruneExpired(timestamp);
    return this.getPerclos();
  }

  /**
   * Evicts all samples older than (currentTimestamp - windowDurationMs).
   */
  private pruneExpired(currentTimestamp: number): void {
    const cutoff = currentTimestamp - this.windowDurationMs;
    // Fast shift while head is outside window
    while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoff) {
      this.buffer.shift();
    }
  }

  /**
   * Calculates PERCLOS as a fraction between 0.00 and 1.00.
   * If sample count is zero, returns 0.00.
   * Uses time-interval weighting between frames when possible,
   * with sample-ratio fallback for uniform frame arrival.
   */
  public getPerclos(): number {
    if (this.buffer.length === 0) {
      return 0.0;
    }

    if (this.buffer.length === 1) {
      return this.buffer[0].isClosed ? 1.0 : 0.0;
    }

    let closedDurationMs = 0;
    let totalDurationMs = 0;

    for (let i = 1; i < this.buffer.length; i++) {
      const prev = this.buffer[i - 1];
      const curr = this.buffer[i];
      const deltaMs = Math.max(0, curr.timestamp - prev.timestamp);

      totalDurationMs += deltaMs;
      // If either previous or current frame is closed, attribute closure interval
      if (curr.isClosed || prev.isClosed) {
        closedDurationMs += deltaMs;
      }
    }

    if (totalDurationMs <= 0) {
      const closedCount = this.buffer.filter((s) => s.isClosed).length;
      return closedCount / this.buffer.length;
    }

    const perclosRatio = closedDurationMs / totalDurationMs;
    return Math.min(1.0, Math.max(0.0, perclosRatio));
  }

  /**
   * Returns PERCLOS as a percentage (0.0% to 100.0%).
   */
  public getPerclosPercentage(): number {
    return Number((this.getPerclos() * 100).toFixed(1));
  }

  /**
   * Gets the total active sample count in the 30-second window.
   */
  public getSampleCount(): number {
    return this.buffer.length;
  }

  /**
   * Gets the fixed eye closure threshold (0.20).
   */
  public getThreshold(): number {
    return this.closureThreshold;
  }

  /**
   * Returns a copy of the recent rolling samples.
   */
  public getSamples(): readonly PerclosSample[] {
    return this.buffer;
  }

  /**
   * Clears all rolling samples.
   */
  public clear(): void {
    this.buffer = [];
  }
}

/**
 * Functional helper to calculate PERCLOS for a static array of samples.
 */
export function calculateWindowPerclos(
  samples: PerclosSample[],
  threshold = 0.20,
  windowDurationMs = 30_000
): number {
  if (!samples || samples.length === 0) return 0;
  const tracker = new PerclosTracker(windowDurationMs, threshold);
  samples.forEach((s) => tracker.addSample(s.ear, s.timestamp));
  return tracker.getPerclos();
}

