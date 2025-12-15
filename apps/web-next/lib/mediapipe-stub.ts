// Stub for @mediapipe/face_mesh module
// The application uses tfjs runtime instead of mediapipe WASM runtime

interface FaceMeshConfig {
  locateFile?: (file: string, prefix: string) => string;
}

interface FaceMeshOptions {
  selfieMode?: boolean;
  maxNumFaces?: number;
  refineLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

interface FaceMeshResults {
  image: any;
  multiFaceLandmarks?: any[];
}

/**
 * Stub implementation of MediaPipe FaceMesh
 * This is never actually used since we use the tfjs runtime
 */
export class FaceMesh {
  constructor(config?: FaceMeshConfig) {
    // Stub constructor - never called at runtime
  }

  async initialize(): Promise<void> {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }

  setOptions(options: FaceMeshOptions): void {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }

  async send(inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void> {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }

  onResults(callback: (results: FaceMeshResults) => void): void {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }

  close(): void {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }

  reset(): void {
    throw new Error('@mediapipe/face_mesh stub should not be called. Using tfjs runtime.');
  }
}

export default FaceMesh;
