# Driver Monitoring System Documentation

## Overview

The Driver Monitoring System is a real-time drowsiness and alertness detection feature built with Next.js, TensorFlow.js, and MediaPipe Face Mesh. It uses computer vision and facial landmark detection to monitor driver safety and prevent accidents caused by drowsiness.

## Features

### Core Capabilities

1. **Real-Time Face Detection**
   - Uses MediaPipe Face Mesh for accurate facial landmark detection
   - Detects 468 facial landmarks in real-time
   - Optimized for performance with WebGL backend

2. **Drowsiness Detection**
   - Eye Aspect Ratio (EAR) calculation to detect closed eyes
   - Automatic warning after 3 seconds of closed eyes
   - Loud alarm sound after 5 seconds of closed eyes
   - No video recording - only real-time processing

3. **Driver State Classification**
   - **Active**: Normal alertness and eye movements
   - **Tension**: Excessive facial movement indicating stress
   - **Sleeping**: Eyes closed with minimal facial movement

4. **Alert System**
   - Saves alerts to MongoDB with timestamps
   - Tracks alert type, severity, and driver state
   - API endpoint for retrieving historical alerts

5. **Privacy-Focused**
   - Camera only activates after explicit permission
   - No video recording or storage
   - Real-time processing only

## Technical Architecture

### Tech Stack

- **Frontend**: Next.js 16 with React 19
- **Face Detection**: MediaPipe Face Mesh with TensorFlow.js (tfjs backend)
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS

### Key Dependencies

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-core": "^4.22.0",
  "@tensorflow/tfjs-backend-webgl": "^4.22.0",
  "@tensorflow-models/face-landmarks-detection": "^1.0.2"
}
```

## File Structure

```
apps/web-next/
├── app/
│   ├── driver/
│   │   └── monitor/
│   │       └── page.tsx              # Main monitoring page
│   └── api/
│       └── driver-alerts/
│           └── route.ts              # Alert API endpoint
├── lib/
│   ├── models/
│   │   └── DriverAlert.ts            # MongoDB alert schema
│   └── utils/
│       └── drowsinessDetection.ts    # EAR & detection utilities
```

## How It Works

### 1. Eye Aspect Ratio (EAR) Calculation

The system uses the Eye Aspect Ratio formula from the paper "Real-Time Eye Blink Detection using Facial Landmarks" by Soukupová and Čech (2016):

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
```

Where:
- `p1-p6` are the 6 key landmarks around each eye
- Vertical distances: `||p2-p6||` and `||p3-p5||`
- Horizontal distance: `||p1-p4||`

**Thresholds:**
- Open eyes: EAR > 0.25
- Closing eyes: 0.18 < EAR < 0.25
- Closed eyes: EAR < 0.18

### 2. Driver State Detection

The system analyzes:
- **Eye Aspect Ratio**: Indicates eye openness
- **Facial Movement**: Tracks head and face motion between frames

Classification logic:
```typescript
if (EAR < 0.15) → Sleeping
if (movement > 2) → Tension (stress/distraction)
if (movement < 0.5 && EAR < 0.2) → Sleeping (drowsy)
else → Active (alert and focused)
```

### 3. Alert Timing

```
Eyes Closed
    ↓
  3 seconds → Visual Warning + API Alert
    ↓
  5 seconds → Audio Alarm + Critical Alert
```

### 4. MediaPipe Face Mesh Landmarks

The system uses specific landmark indices from MediaPipe's 468-point face mesh:

- **Left Eye**: Indices [33, 160, 158, 133, 153, 144]
- **Right Eye**: Indices [362, 385, 387, 263, 373, 380]
- **Face Movement Samples**: Indices [1, 33, 61, 199, 263, 291]

## Usage

### For Drivers

1. **Start Monitoring**
   ```
   Navigate to: /driver/monitor
   Click: "Grant Camera Permission"
   Click: "Start Trip"
   ```

2. **During Trip**
   - Keep face visible to camera
   - System monitors automatically
   - Alerts appear on screen
   - Audio alarm plays for critical drowsiness

3. **Stop Monitoring**
   ```
   Click: "Stop Trip"
   ```

### API Endpoints

#### POST /api/driver-alerts

Save a new driver alert.

**Request Body:**
```json
{
  "driverId": "string (ObjectId)",
  "alertType": "warning" | "alarm" | "sleeping" | "tension",
  "timestamp": "ISO date string",
  "driverState": "Active" | "Tension" | "Sleeping",
  "eyeClosedDuration": 3.5
}
```

**Response:**
```json
{
  "success": true,
  "alertId": "507f1f77bcf86cd799439011",
  "message": "Alert saved successfully"
}
```

#### GET /api/driver-alerts

Retrieve driver alerts.

**Query Parameters:**
- `driverId`: Filter by driver (optional)
- `alertType`: Filter by alert type (optional)
- `limit`: Max results (default: 50)

**Example:**
```
GET /api/driver-alerts?driverId=507f1f77bcf86cd799439011&limit=20
```

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "_id": "...",
      "driverId": "...",
      "alertType": "drowsiness_warning",
      "severity": "medium",
      "moodState": "sleeping",
      "eyeClosedDuration": 3.2,
      "timestamp": "2025-12-15T10:30:00Z",
      "resolved": false,
      "createdAt": "2025-12-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

## Database Schema

### DriverAlert Model

```typescript
{
  driverId: ObjectId,              // Reference to Driver
  alertType: enum [
    'drowsiness_warning',          // 3+ seconds eyes closed
    'drowsiness_critical',         // 5+ seconds eyes closed
    'sleeping_detected',           // Driver appears to be sleeping
    'tension_detected'             // Excessive movement/stress
  ],
  severity: enum [
    'low', 'medium', 'high', 'critical'
  ],
  eyeClosedDuration: number,       // Seconds eyes were closed
  moodState: enum [
    'active', 'tension', 'sleeping'
  ],
  timestamp: Date,                 // When alert occurred
  location: {
    latitude: number,
    longitude: number
  },
  tripId: ObjectId,                // Optional: current trip
  busId: ObjectId,                 // Optional: current bus
  routeId: ObjectId,               // Optional: current route
  resolved: boolean,               // Alert acknowledged
  resolvedAt: Date,
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Utility Functions

### drowsinessDetection.ts

#### calculateEAR(eyeLandmarks: number[][]): number
Calculates Eye Aspect Ratio from 6 eye landmark points.

#### getEyeLandmarks(keypoints, indices): number[][]
Extracts specific eye landmarks from MediaPipe keypoints.

#### areEyesClosed(ear, threshold): boolean
Determines if eyes are closed based on EAR threshold.

#### detectFacialMovement(current, previous, indices): number
Calculates average facial movement between frames.

#### classifyDriverState({ ear, facialMovement }): DriverState
Classifies driver state as Active, Tension, or Sleeping.

## Performance Optimization

1. **WebGL Backend**
   - Hardware-accelerated inference
   - ~30-60 FPS on modern devices

2. **Single Face Detection**
   - `maxFaces: 1` reduces processing overhead
   - Optimized for driver monitoring scenario

3. **Landmark Refinement**
   - `refineLandmarks: true` for accurate eye detection
   - Essential for reliable EAR calculation

4. **RequestAnimationFrame**
   - Synced with display refresh rate
   - Efficient rendering loop

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 14+ (with WebGL support)
- ✅ Firefox 88+

**Requirements:**
- WebRTC support (getUserMedia)
- WebGL 2.0
- ES2020 JavaScript

## Privacy & Security

1. **Camera Access**
   - Explicit user permission required
   - Visual indicator when camera is active
   - Can be stopped at any time

2. **Data Storage**
   - No video recording
   - No image capture
   - Only metadata stored (alerts, timestamps)

3. **Processing**
   - All face detection happens client-side
   - No video data sent to server
   - Only alert metadata sent to API

## Troubleshooting

### Camera Not Working

1. Check browser permissions
2. Ensure HTTPS connection (required for getUserMedia)
3. Verify camera is not in use by another app
4. Try different browser

### Low Performance

1. Close other tabs/applications
2. Ensure good lighting conditions
3. Check GPU/WebGL availability
4. Reduce video resolution if needed

### False Alerts

1. Adjust lighting (avoid glare)
2. Position camera at eye level
3. Keep face fully visible
4. Adjust EAR threshold if needed

## Configuration

### Thresholds (in drowsinessDetection.ts)

```typescript
export const EAR_THRESHOLDS = {
  CLOSED_EYE: 0.18,      // Adjust for sensitivity
  OPEN_EYE: 0.25,
  WARNING_DURATION: 3,    // Seconds until warning
  ALARM_DURATION: 5,      // Seconds until alarm
};
```

### MediaPipe Config (in page.tsx)

```typescript
const detectorConfig = {
  runtime: 'tfjs',           // Using TensorFlow.js backend
  refineLandmarks: true,      // true = more accurate, slightly slower
  maxFaces: 1,                // 1 = faster for single driver
};
```

## Future Enhancements

- [ ] Head pose estimation (looking away detection)
- [ ] Yawn detection
- [ ] Smartphone usage detection
- [ ] Integration with GPS for location-based alerts
- [ ] Dashboard for fleet managers
- [ ] Real-time alert notifications
- [ ] Driver fatigue scoring
- [ ] Scheduled break reminders

## Testing

### Manual Testing Checklist

- [ ] Camera permission flow
- [ ] Face detection accuracy
- [ ] Eye closure detection
- [ ] Warning appears at 3s
- [ ] Alarm sounds at 5s
- [ ] State changes (Active/Tension/Sleeping)
- [ ] Alerts saved to database
- [ ] Stop trip functionality
- [ ] Multiple monitoring sessions

### Test Scenarios

1. **Normal Driving**: Eyes open, minimal alerts
2. **Blinking**: Brief eye closures don't trigger alerts
3. **Drowsiness**: Prolonged eye closure triggers warning/alarm
4. **Looking Away**: Face not detected, no false alerts
5. **Glasses/Sunglasses**: Detection still works

## References

- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Eye Blink Detection Paper](http://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf) by Soukupová and Čech
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## Support

For issues or questions:
1. Check console for error messages
2. Verify all dependencies installed
3. Ensure MongoDB connection configured
4. Review browser compatibility

## License

Part of the Metro Bus Management System.
