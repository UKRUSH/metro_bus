/**
 * Eye Aspect Ratio (EAR) Calculation Utilities
 * Used for drowsiness detection in driver monitoring
 */

/**
 * Calculate the Euclidean distance between two points
 */
export function calculateDistance(p1: [number, number], p2: [number, number]): number {
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
}

/**
 * Calculate Eye Aspect Ratio (EAR) from eye landmarks
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * 
 * Based on the paper "Real-Time Eye Blink Detection using Facial Landmarks"
 * by Soukupová and Čech (2016)
 * 
 * @param eyeLandmarks Array of [x, y] coordinates for 6 eye landmark points
 * @returns EAR value (typically 0.15-0.35 for open eyes, <0.2 for closed)
 */
export function calculateEAR(eyeLandmarks: number[][]): number {
  if (eyeLandmarks.length < 6) {
    console.warn('Insufficient eye landmarks for EAR calculation');
    return 0;
  }

  // Vertical eye distances
  const v1 = calculateDistance(
    [eyeLandmarks[1][0], eyeLandmarks[1][1]],
    [eyeLandmarks[5][0], eyeLandmarks[5][1]]
  );
  
  const v2 = calculateDistance(
    [eyeLandmarks[2][0], eyeLandmarks[2][1]],
    [eyeLandmarks[4][0], eyeLandmarks[4][1]]
  );

  // Horizontal eye distance
  const h = calculateDistance(
    [eyeLandmarks[0][0], eyeLandmarks[0][1]],
    [eyeLandmarks[3][0], eyeLandmarks[3][1]]
  );

  // Avoid division by zero
  if (h === 0) return 0;

  // EAR formula
  const ear = (v1 + v2) / (2.0 * h);
  return ear;
}

/**
 * Extract specific eye landmarks from MediaPipe Face Mesh keypoints
 * 
 * @param keypoints Full array of face keypoints from MediaPipe
 * @param indices Indices of the eye landmarks to extract
 * @returns Array of [x, y] coordinates
 */
export function getEyeLandmarks(
  keypoints: Array<{ x: number; y: number; z?: number }>,
  indices: number[]
): number[][] {
  return indices.map(index => {
    const point = keypoints[index];
    return [point.x, point.y];
  });
}

/**
 * MediaPipe Face Mesh landmark indices for eyes
 */
export const EYE_LANDMARKS = {
  // Left eye landmarks (6 points)
  LEFT_EYE: [33, 160, 158, 133, 153, 144],
  
  // Right eye landmarks (6 points)
  RIGHT_EYE: [362, 385, 387, 263, 373, 380],
  
  // All eye-related landmarks (full contour)
  LEFT_EYE_FULL: [
    33, 246, 161, 160, 159, 158, 157, 173,
    133, 155, 154, 153, 145, 144, 163, 7
  ],
  RIGHT_EYE_FULL: [
    362, 398, 384, 385, 386, 387, 388, 466,
    263, 249, 390, 373, 374, 380, 381, 382
  ],
};

/**
 * Thresholds for drowsiness detection
 */
export const EAR_THRESHOLDS = {
  // EAR below this value indicates closed eyes
  CLOSED_EYE: 0.18,
  
  // EAR above this value indicates fully open eyes
  OPEN_EYE: 0.25,
  
  // Time thresholds for alerts (in seconds)
  WARNING_DURATION: 3,
  ALARM_DURATION: 5,
};

/**
 * Check if eyes are closed based on EAR
 */
export function areEyesClosed(ear: number, threshold = EAR_THRESHOLDS.CLOSED_EYE): boolean {
  return ear < threshold;
}

/**
 * Calculate average EAR from both eyes
 */
export function calculateAverageEAR(leftEAR: number, rightEAR: number): number {
  return (leftEAR + rightEAR) / 2;
}

/**
 * Detect facial movement between frames
 * Used for mood/state detection
 * 
 * @param currentLandmarks Current frame landmarks
 * @param previousLandmarks Previous frame landmarks
 * @param sampleIndices Indices of landmarks to sample for movement
 * @returns Average movement magnitude
 */
export function detectFacialMovement(
  currentLandmarks: Array<{ x: number; y: number }>,
  previousLandmarks: Array<{ x: number; y: number }> | null,
  sampleIndices = [1, 33, 61, 199, 263, 291] // Sample key facial points
): number {
  if (!previousLandmarks) return 0;

  let totalMovement = 0;
  
  sampleIndices.forEach(idx => {
    const curr = currentLandmarks[idx];
    const prev = previousLandmarks[idx];
    
    if (curr && prev) {
      const movement = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      totalMovement += movement;
    }
  });

  return totalMovement / sampleIndices.length;
}

/**
 * Driver state classification based on EAR and facial movement
 */
export type DriverState = 'Active' | 'Tension' | 'Sleeping';

export interface StateDetectionParams {
  ear: number;
  facialMovement: number;
}

export function classifyDriverState({
  ear,
  facialMovement,
}: StateDetectionParams): DriverState {
  // Sleeping: Very low EAR (eyes nearly/fully closed)
  if (ear < 0.15) {
    return 'Sleeping';
  }

  // Tension: Excessive facial movement with somewhat low EAR
  if (facialMovement > 2) {
    return 'Tension';
  }

  // Drowsy: Little movement with low EAR
  if (facialMovement < 0.5 && ear < 0.2) {
    return 'Sleeping';
  }

  // Active: Normal state
  return 'Active';
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}
