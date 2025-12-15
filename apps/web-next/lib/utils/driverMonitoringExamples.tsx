/**
 * Example: Integrating Driver Monitoring with Auth Context
 * 
 * This file shows how to connect the driver monitoring system
 * with your authentication system to use real driver IDs.
 */

import { useAuth } from '@/contexts/AuthContext';

// In your monitoring component:
export function DriverMonitorWithAuth() {
  const { user } = useAuth(); // Get authenticated user
  
  const sendAlert = async (alertType: string) => {
    // Use real driver ID from authenticated user
    const driverId = user?.id || user?._id;
    
    if (!driverId) {
      console.error('No driver ID available');
      return;
    }

    const alertData = {
      driverId,
      alertType,
      timestamp: new Date(),
      driverState: 'Active', // Your actual driver state
      eyeClosedDuration: 3.5
    };

    await fetch('/api/driver-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
  };

  // Rest of your monitoring logic...
}

/**
 * Example: Protected Route
 * Only allow drivers to access monitoring page
 */
export function ProtectedDriverMonitor() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== 'driver') {
    return <div>Access denied. Drivers only.</div>;
  }

  // Render monitoring component
  return <DriverMonitorPage />;
}

/**
 * Example: Adding Trip Context
 * Associate alerts with current active trip
 */
export function DriverMonitorWithTrip() {
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const startTrip = async (routeId: string, busId: string) => {
    // Create trip in database
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: user?.id,
        routeId,
        busId,
        startTime: new Date(),
      }),
    });

    const trip = await response.json();
    setActiveTripId(trip.id);

    // Start monitoring
    startCameraAndMonitoring();
  };

  const sendAlertWithTrip = async (alertType: string) => {
    const alertData = {
      driverId: user?.id,
      alertType,
      timestamp: new Date(),
      tripId: activeTripId, // Associate with active trip
      driverState: 'Sleeping',
    };

    await fetch('/api/driver-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
  };
}

/**
 * Example: Adding GPS Location
 * Include GPS coordinates with alerts
 */
export function DriverMonitorWithLocation() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    // Watch GPS position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => console.error('GPS error:', error)
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const sendAlertWithLocation = async (alertType: string) => {
    const alertData = {
      driverId: user?.id,
      alertType,
      timestamp: new Date(),
      location: currentLocation, // Include GPS coordinates
      driverState: 'Sleeping',
    };

    await fetch('/api/driver-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
  };
}

/**
 * Example: Alert Dashboard Query
 * Fetch and display driver alerts
 */
export async function fetchDriverAlerts(driverId: string) {
  const response = await fetch(
    `/api/driver-alerts?driverId=${driverId}&limit=50`
  );
  
  const data = await response.json();
  return data.alerts;
}

/**
 * Example: Real-time Alert Notifications
 * Use Socket.IO to notify supervisors
 */
import { io } from 'socket.io-client';

export function DriverMonitorWithSocketIO() {
  const socket = useRef(io());

  const sendAlertWithNotification = async (alertType: string) => {
    const alertData = {
      driverId: user?.id,
      alertType,
      timestamp: new Date(),
      driverState: 'Sleeping',
    };

    // Save to database
    await fetch('/api/driver-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });

    // Emit real-time notification to supervisors
    socket.current.emit('driver-alert', {
      driverId: user?.id,
      driverName: user?.name,
      alertType,
      timestamp: new Date(),
    });
  };
}

/**
 * Example: Supervisor Dashboard Listener
 */
export function SupervisorAlertDashboard() {
  const [alerts, setAlerts] = useState([]);
  const socket = useRef(io());

  useEffect(() => {
    socket.current.on('driver-alert', (alert) => {
      // Show notification
      showNotification(`Alert: ${alert.driverName} - ${alert.alertType}`);
      
      // Add to alert list
      setAlerts(prev => [alert, ...prev]);
    });

    return () => socket.current.disconnect();
  }, []);

  return (
    <div>
      <h2>Real-time Driver Alerts</h2>
      {alerts.map(alert => (
        <AlertCard key={alert.timestamp} alert={alert} />
      ))}
    </div>
  );
}
