# Build Error Fix - MediaPipe Import Issue

## Problem
The original implementation used MediaPipe's WASM backend which caused build errors in Next.js:
```
Export FaceMesh doesn't exist in target module
```

## Solution
Switched from MediaPipe backend to TensorFlow.js backend, which is:
- ✅ Fully compatible with Next.js
- ✅ No WASM loading issues
- ✅ No CDN dependencies
- ✅ Still uses MediaPipe Face Mesh model
- ✅ Same accuracy and performance

## Changes Made

### 1. Updated Detector Configuration
**Before:**
```typescript
const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
  refineLandmarks: true,
  maxFaces: 1,
};
```

**After:**
```typescript
const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
  runtime: 'tfjs',
  refineLandmarks: true,
  maxFaces: 1,
};
```

### 2. Removed MediaPipe Dependency
**Removed from package.json:**
```json
"@mediapipe/face_mesh": "^0.4.1633559619"
```

**Kept (TensorFlow.js):**
```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-core": "^4.22.0",
  "@tensorflow/tfjs-backend-webgl": "^4.22.0",
  "@tensorflow-models/face-landmarks-detection": "^1.0.2"
}
```

## Key Points

1. **Same Model**: Still using MediaPipe Face Mesh model, just loaded via TensorFlow.js instead of MediaPipe WASM
2. **Same Accuracy**: Face detection accuracy remains identical
3. **Better Compatibility**: Works seamlessly in Next.js without webpack configuration
4. **Performance**: Comparable performance using WebGL acceleration

## Testing

After this fix:
```bash
pnpm install  # Reinstall dependencies
pnpm dev      # Start dev server
```

Navigate to `/driver/monitor` and the page should load without build errors.

## References

- [TensorFlow.js Face Landmarks Detection](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection)
- [MediaPipe Face Mesh Model](https://google.github.io/mediapipe/solutions/face_mesh.html)
