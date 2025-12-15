/**
 * Quick Start Guide - Driver Monitoring System
 */

// 1. NAVIGATE TO THE MONITORING PAGE
// Open your browser to: http://localhost:3000/driver/monitor

// 2. GRANT CAMERA PERMISSION
// Click "Grant Camera Permission" button
// Allow camera access when browser prompts

// 3. START MONITORING
// Click "Start Trip" button
// System will begin detecting your face

// 4. TEST DROWSINESS DETECTION
// Test Case 1: Normal Operation
//   - Keep your eyes open and look at camera
//   - Status should show "Active"
//   - No alerts should trigger

// Test Case 2: Warning Alert
//   - Close your eyes for 3+ seconds
//   - Visual warning should appear
//   - Check MongoDB for saved alert

// Test Case 3: Critical Alert
//   - Keep eyes closed for 5+ seconds
//   - Alarm sound should play
//   - Check MongoDB for critical alert

// 5. CHECK DATABASE
// Open MongoDB Compass or use mongo shell:
db.driver_alerts.find().sort({ timestamp: -1 }).limit(10)

// 6. VERIFY API
// Test GET endpoint:
curl http://localhost:3000/api/driver-alerts?limit=10

// Test POST endpoint:
curl -X POST http://localhost:3000/api/driver-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "507f1f77bcf86cd799439011",
    "alertType": "warning",
    "timestamp": "2025-12-15T10:00:00Z",
    "driverState": "Sleeping",
    "eyeClosedDuration": 3.5
  }'

// 7. TROUBLESHOOTING

// Problem: Camera not working
// Solution: 
//   - Check HTTPS (required for getUserMedia)
//   - Verify camera permissions in browser
//   - Try different browser

// Problem: Face not detected
// Solution:
//   - Ensure good lighting
//   - Position face directly in front of camera
//   - Check console for TensorFlow errors

// Problem: False alerts
// Solution:
//   - Adjust lighting to avoid glare
//   - Adjust EAR_THRESHOLDS in drowsinessDetection.ts
//   - Keep face centered in frame

// Problem: Performance issues
// Solution:
//   - Close other tabs
//   - Ensure WebGL is enabled
//   - Check GPU acceleration in browser settings

// 8. INTEGRATION WITH YOUR APP

// Step 1: Update driverId in page.tsx (line ~120)
// Replace 'driver-001' with actual driver ID from auth:
const { user } = useAuth();
const driverId = user?.id || user?._id;

// Step 2: Add trip context (optional)
// When starting a trip, pass tripId to alerts:
const sendAlert = async (alertType) => {
  await fetch('/api/driver-alerts', {
    method: 'POST',
    body: JSON.stringify({
      driverId: user?.id,
      alertType,
      tripId: currentTrip?.id,
      busId: currentBus?.id,
      routeId: currentRoute?.id,
      timestamp: new Date(),
    })
  });
};

// Step 3: Add GPS location (optional)
useEffect(() => {
  navigator.geolocation.watchPosition(position => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  });
}, []);

// 9. DEPLOYMENT CHECKLIST
// [ ] Install dependencies: pnpm install
// [ ] Set up MongoDB connection (MONGODB_URI in .env)
// [ ] Ensure HTTPS in production
// [ ] Test camera permissions flow
// [ ] Verify TensorFlow.js loads from CDN
// [ ] Test on target devices/browsers
// [ ] Configure alert thresholds
// [ ] Set up monitoring/logging

// 10. NEXT STEPS
// - Integrate with authentication system
// - Add trip tracking
// - Create supervisor dashboard
// - Add real-time Socket.IO notifications
// - Implement alert resolution workflow
// - Add analytics and reporting
