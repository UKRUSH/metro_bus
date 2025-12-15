// Stub for @mediapipe/face_mesh
// We use tfjs runtime instead, so this module is not needed

// Export a FaceMesh class to satisfy imports from face-landmarks-detection
export class FaceMesh {
  constructor(config) {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  initialize() {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  setOptions(options) {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  send(input) {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  onResults(callback) {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  close() {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
  
  reset() {
    throw new Error('@mediapipe/face_mesh should not be used directly. The application uses tfjs runtime instead.');
  }
}

// Export default as well for different import patterns
export default FaceMesh;
