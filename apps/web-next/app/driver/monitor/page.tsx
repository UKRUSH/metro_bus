'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import {
  calculateEAR,
  getEyeLandmarks,
  EYE_LANDMARKS,
  EAR_THRESHOLDS,
  areEyesClosed,
  calculateAverageEAR,
  detectFacialMovement,
  classifyDriverState,
  type DriverState,
} from '@/lib/utils/drowsinessDetection';

interface AlertData {
  driverId: string;
  alertType: 'warning' | 'alarm' | 'sleeping' | 'tension';
  timestamp: Date;
  driverState: string;
  eyeClosedDuration?: number;
}

export default function DriverMonitorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [driverState, setDriverState] = useState<DriverState>('Active');
  const [eyesClosedDuration, setEyesClosedDuration] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentEAR, setCurrentEAR] = useState<number>(0);
  const [facialMovement, setFacialMovement] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const eyesClosedStartRef = useRef<number | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousLandmarksRef = useRef<any>(null);
  const warningShownRef = useRef(false);
  const alarmPlayedRef = useRef(false);
  const lastDetectionTimeRef = useRef<number>(0);
  const DETECTION_INTERVAL = 100; // Run detection every 100ms

  // Send alert to API
  const sendAlert = async (alertType: AlertData['alertType']) => {
    try {
      const alertData: AlertData = {
        driverId: 'driver-001', // Replace with actual driver ID from auth context
        alertType,
        timestamp: new Date(),
        driverState,
        eyeClosedDuration: eyesClosedDuration
      };

      console.log('📤 Alert triggered:', alertData);
      
      // Skip API call for now (requires authentication)
      // TODO: Implement when driver authentication is added
      /*
      const response = await fetch('/api/drivers/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        console.error('Failed to send alert:', response.status, response.statusText);
      }
      */
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  };

  // Initialize TensorFlow.js Face Mesh (using tfjs backend instead of mediapipe)
  const initializeDetector = async () => {
    if (detectorRef.current) {
      console.log('Detector already initialized');
      return true;
    }

    try {
      setModelLoading(true);
      setError('');
      
      console.log('🔄 Step 1: Initializing TensorFlow.js...');
      await tf.ready();
      console.log('✅ Step 1 Complete: TensorFlow.js ready');
      
      console.log('🔄 Step 2: Setting WebGL backend...');
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✅ Step 2 Complete: WebGL backend active');
      
      console.log('🔄 Step 3: Loading Face Detection Model...');
      console.log('Trying BlazeFace model for better detection...');
      
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 2,
          detectorModelUrl: undefined,
          landmarksModelUrl: undefined
        }
      );
      detectorRef.current = detector;
      
      console.log('✅ Step 3 Complete: Model loaded!');
      setModelLoaded(true);
      setModelLoading(false);
      return true;
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed to load model: ' + (error as Error).message);
      setModelLoading(false);
      return false;
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setPermissionGranted(true);
        setError('');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please grant permission.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPermissionGranted(false);
  };

  // Main detection loop
  const detectFaces = async () => {
    // Throttle detection to avoid overwhelming the model
    const now = Date.now();
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL) {
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    lastDetectionTimeRef.current = now;
    
    // Reduced logging - only log every 10th frame
    const shouldLog = (detectionCount % 10 === 0);
    if (shouldLog) console.log('🔁 detectFaces() called, frame:', detectionCount);
    
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      if (shouldLog) console.warn('⚠️ Detection skipped - missing references:', {
        detector: !!detectorRef.current,
        video: !!videoRef.current,
        canvas: !!canvasRef.current
      });
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      if (shouldLog) console.warn('⚠️ No canvas context');
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    
    if (video.readyState !== 4) {
      if (shouldLog) console.warn('⚠️ Video not ready, readyState:', video.readyState);
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    
    if (shouldLog) console.log('✅ All checks passed, running detection...');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas FIRST
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (shouldLog) console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);

    try {
      // Detect faces from CANVAS instead of video element
      if (shouldLog) console.log('🔍 Calling estimateFaces...');
      const startTime = performance.now();
      const faces = await detectorRef.current.estimateFaces(canvas, {
        flipHorizontal: true,  // Try with flip enabled
        staticImageMode: false
      });
      const detectionTime = performance.now() - startTime;
      if (shouldLog) console.log('⏱️ Detection took:', detectionTime.toFixed(2), 'ms, found', faces.length, 'faces');

      // Don't clear canvas here - already has video frame drawn
      
      // Update frame counter regardless of face detection
      setDetectionCount(prev => prev + 1);

      if (faces.length > 0) {
        console.log('✅ Face detected!', faces.length);
        setFaceDetected(true);
        
        const face = faces[0];
        const keypoints = face.keypoints;

        // Get eye landmarks using utility functions
        const leftEyeLandmarks = getEyeLandmarks(keypoints, EYE_LANDMARKS.LEFT_EYE);
        const rightEyeLandmarks = getEyeLandmarks(keypoints, EYE_LANDMARKS.RIGHT_EYE);

        // Calculate EAR for both eyes
        const leftEAR = calculateEAR(leftEyeLandmarks);
        const rightEAR = calculateEAR(rightEyeLandmarks);
        const avgEAR = calculateAverageEAR(leftEAR, rightEAR);

        if (shouldLog) console.log('EAR values - Left:', leftEAR.toFixed(3), 'Right:', rightEAR.toFixed(3), 'Avg:', avgEAR.toFixed(3));

        // Detect facial movement and driver state
        const facialMovement = detectFacialMovement(keypoints, previousLandmarksRef.current);
        previousLandmarksRef.current = keypoints;

        const state = classifyDriverState({
          ear: avgEAR,
          facialMovement
        });
        
        // Update state
        setDriverState(state);
        setCurrentEAR(avgEAR);
        setFacialMovement(facialMovement);

        // Check if eyes are closed using utility function
        const eyesClosed = areEyesClosed(avgEAR, EAR_THRESHOLDS.CLOSED_EYE);

        if (shouldLog) console.log('Eyes status:', eyesClosed ? 'CLOSED' : 'OPEN', 'Duration:', eyesClosedDuration.toFixed(1) + 's');

        if (eyesClosed) {
          if (eyesClosedStartRef.current === null) {
            eyesClosedStartRef.current = Date.now();
          }

          const duration = (Date.now() - eyesClosedStartRef.current) / 1000;
          setEyesClosedDuration(duration);

          // Warning after threshold
          if (duration > EAR_THRESHOLDS.WARNING_DURATION && !warningShownRef.current) {
            console.log('⚠️ WARNING: Eyes closed for', duration.toFixed(1), 'seconds');
            setShowWarning(true);
            warningShownRef.current = true;
            sendAlert('warning');
          }

          // Alarm after threshold
          if (duration > EAR_THRESHOLDS.ALARM_DURATION && !alarmPlayedRef.current) {
            console.log('🚨 ALARM: Eyes closed for', duration.toFixed(1), 'seconds');
            playAlarm();
            alarmPlayedRef.current = true;
            sendAlert('alarm');
          }
        } else {
          // Eyes are open - reset timers
          eyesClosedStartRef.current = null;
          setEyesClosedDuration(0);
          setShowWarning(false);
          warningShownRef.current = false;
          alarmPlayedRef.current = false;
          stopAlarm();
        }

        // Send alert for sleeping/tension states
        if (state === 'Sleeping' && !alarmPlayedRef.current) {
          console.log('🚨 DRIVER SLEEPING - PLAYING ALARM');
          playAlarm();
          alarmPlayedRef.current = true;
          sendAlert('sleeping');
        } else if (state === 'Tension') {
          sendAlert('tension');
        }
        
        // Also play alarm if eyes closed too long
        if (eyesClosed && eyesClosedDuration > EAR_THRESHOLDS.ALARM_DURATION && !alarmPlayedRef.current) {
          console.log('🚨 EYES CLOSED TOO LONG - PLAYING ALARM');
          playAlarm();
          alarmPlayedRef.current = true;
        }

        // Draw face mesh (optional - for visualization)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        keypoints.forEach((point: any) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Highlight eyes
        ctx.strokeStyle = eyesClosed ? 'red' : 'lime';
        ctx.lineWidth = 2;
        
        // Draw left eye
        ctx.beginPath();
        leftEyeLandmarks.forEach((point, idx) => {
          if (idx === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.stroke();

        // Draw right eye
        ctx.beginPath();
        rightEyeLandmarks.forEach((point, idx) => {
          if (idx === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.stroke();
      } else {
        if (shouldLog) console.log('❌ No face detected in frame');
        setFaceDetected(false);
      }
    } catch (error) {
      console.error('❌ Detection error:', error);
    }

    // Continue detection loop
    animationRef.current = requestAnimationFrame(detectFaces);
  };

  // Play alarm sound with beep-beep pattern
  const playAlarm = () => {
    if (alarmAudioRef.current) return; // Already playing

    console.log('🚨 PLAYING ALARM SOUND');
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create beep-beep pattern
    const playBeep = (startTime: number, duration: number, frequency: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth beep
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01); // Attack
      gainNode.gain.setValueAtTime(0.5, startTime + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Beep pattern: BEEP-BEEP pause BEEP-BEEP pause (repeating)
    const beepDuration = 0.2; // 200ms beep
    const gapBetweenBeeps = 0.15; // 150ms gap
    const pauseBetweenPatterns = 0.5; // 500ms pause
    const patternDuration = (beepDuration * 2) + gapBetweenBeeps + pauseBetweenPatterns;
    
    // Play 10 patterns (about 10 seconds of alarm)
    for (let i = 0; i < 10; i++) {
      const patternStart = audioContext.currentTime + (i * patternDuration);
      playBeep(patternStart, beepDuration, 800); // First beep
      playBeep(patternStart + beepDuration + gapBetweenBeeps, beepDuration, 800); // Second beep
    }
    
    // Store reference for stopping
    (alarmAudioRef.current as any) = { audioContext };
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
      stopAlarm();
    }, 10000);
  };

  // Stop alarm sound
  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      console.log('🔇 STOPPING ALARM');
      const { audioContext } = alarmAudioRef.current as any;
      try {
        audioContext.close();
      } catch (e) {
        // Ignore if already stopped
      }
      alarmAudioRef.current = null;
    }
  };

  // Start monitoring
  const handleStartTrip = async () => {
    console.log('\n=== 🚀 STARTING TRIP ===');
    
    if (!permissionGranted) {
      console.log('📷 Requesting camera permission...');
      await startCamera();
      return;
    }

    console.log('✅ Camera granted');
    console.log('🔄 Loading face detection model...');
    
    if (!detectorRef.current) {
      const success = await initializeDetector();
      if (!success) {
        console.error('❌ Failed to load model');
        return;
      }
    }

    console.log('✅ Model loaded');
    console.log('🔄 Starting detection...');
    
    setIsMonitoring(true);
    setError('');
    
    if (videoRef.current) {
      const startDetection = () => {
        console.log('✅ Video ready');
        console.log('👀 Look at camera now!');
        setTimeout(() => detectFaces(), 500);
      };
      
      if (videoRef.current.readyState >= 2) {
        startDetection();
      } else {
        videoRef.current.onloadeddata = startDetection;
      }
    }
  };

  // Stop monitoring
  const handleStopTrip = () => {
    setIsMonitoring(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    stopAlarm();
    stopCamera();
    setShowWarning(false);
    setEyesClosedDuration(0);
    eyesClosedStartRef.current = null;
    warningShownRef.current = false;
    alarmPlayedRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStopTrip();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Driver Monitoring System</h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video and Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {!permissionGranted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400">Camera access required</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-4">
                {!isMonitoring ? (
                  <button
                    onClick={handleStartTrip}
                    disabled={modelLoading}
                    className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors ${
                      modelLoading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {modelLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading Model...
                      </span>
                    ) : permissionGranted ? (
                      modelLoaded ? 'Start Monitoring' : 'Load Model & Start'
                    ) : (
                      'Grant Camera Permission'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleStopTrip}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Stop Trip
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            {/* Driver State */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Driver State</h2>
              <div className={`text-2xl font-bold text-center py-4 rounded-lg transition-colors ${
                driverState === 'Active' ? 'bg-green-600' :
                driverState === 'Tension' ? 'bg-yellow-600' :
                'bg-red-600'
              }`}>
                {driverState}
              </div>
              
              {/* Debug info */}
              {isMonitoring && (
                <div className="mt-3 p-2 bg-gray-700 rounded text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">EAR:</span>
                    <span className="font-mono text-gray-200">{currentEAR.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Movement:</span>
                    <span className="font-mono text-gray-200">{facialMovement.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Eyes Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Eyes Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold ${eyesClosedDuration > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {eyesClosedDuration > 0 ? 'CLOSED' : 'OPEN'}
                  </span>
                </div>
                {eyesClosedDuration > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-semibold text-red-500">
                      {eyesClosedDuration.toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Monitoring Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">System Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Monitoring:</span>
                  <span className={`font-semibold ${isMonitoring ? 'text-green-500' : 'text-gray-500'}`}>
                    {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Camera:</span>
                  <span className={`font-semibold ${permissionGranted ? 'text-green-500' : 'text-gray-500'}`}>
                    {permissionGranted ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Face:</span>
                  <span className={`font-semibold ${faceDetected ? 'text-green-500' : 'text-red-500'}`}>
                    {faceDetected ? 'DETECTED' : 'NOT FOUND'}
                  </span>
                </div>
                {isMonitoring && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Frames:</span>
                    <span className="font-semibold text-blue-400">
                      {detectionCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            {showWarning && (
              <div className="bg-red-600 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-bold">DROWSINESS ALERT!</h3>
                    <p className="text-sm">Please stay alert and focused</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-400 mb-1">Detection</h3>
              <p className="text-gray-300">MediaPipe Face Mesh</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-400 mb-1">Warning Threshold</h3>
              <p className="text-gray-300">3 seconds (eyes closed)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-400 mb-1">Alarm Threshold</h3>
              <p className="text-gray-300">5 seconds (eyes closed)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
