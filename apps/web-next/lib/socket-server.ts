import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './auth/jwt';
import BusLocation from './models/BusLocation';
import dbConnect from './mongodb';

let io: SocketIOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', async (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Authentication middleware
    const token = socket.handshake.auth.token;
    let user = null;

    if (token) {
      try {
        user = verifyToken(token);
        socket.data.user = user;
        console.log('Authenticated user:', user.email, 'Role:', user.role);
      } catch (error) {
        console.error('Socket authentication failed:', error);
      }
    }

    // Join room based on user role
    if (user) {
      socket.join(`role:${user.role}`);
      
      // Drivers join their own room
      if (user.role === 'driver') {
        socket.join(`driver:${user.id}`);
      }
    }

    // Join specific bus tracking room
    socket.on('track:bus', async (busId: string) => {
      console.log(`Client ${socket.id} tracking bus ${busId}`);
      socket.join(`bus:${busId}`);
      
      // Send latest location immediately
      try {
        await dbConnect();
        const location = await BusLocation.findOne({ busId })
          .sort({ timestamp: -1 })
          .populate('busId', 'registrationNumber busType')
          .populate('driverId', 'fullName');
        
        if (location) {
          socket.emit('bus:location', location);
        }
      } catch (error) {
        console.error('Error fetching bus location:', error);
      }
    });

    // Stop tracking specific bus
    socket.on('untrack:bus', (busId: string) => {
      console.log(`Client ${socket.id} stopped tracking bus ${busId}`);
      socket.leave(`bus:${busId}`);
    });

    // Track all buses (admin/passenger view)
    socket.on('track:all', async () => {
      console.log(`Client ${socket.id} tracking all buses`);
      socket.join('track:all');
      
      // Send all active bus locations
      try {
        await dbConnect();
        const locations = await (BusLocation as any).getAllActiveBuses();
        socket.emit('buses:locations', locations);
      } catch (error) {
        console.error('Error fetching all bus locations:', error);
      }
    });

    // Stop tracking all buses
    socket.on('untrack:all', () => {
      console.log(`Client ${socket.id} stopped tracking all buses`);
      socket.leave('track:all');
    });

    // Driver broadcasts location update
    socket.on('driver:location', async (data: {
      busId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      passengers?: number;
    }) => {
      if (!user || user.role !== 'driver') {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      try {
        await dbConnect();
        
        // Determine status based on speed
        let status: 'moving' | 'stopped' | 'idle' = 'idle';
        if (data.speed !== undefined) {
          if (data.speed > 5) status = 'moving';
          else if (data.speed > 0) status = 'stopped';
        }

        const location = await BusLocation.create({
          busId: data.busId,
          driverId: user.id,
          location: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude],
          },
          heading: data.heading,
          speed: data.speed,
          accuracy: data.accuracy,
          timestamp: new Date(),
          status,
          passengers: data.passengers,
        });

        const populatedLocation = await BusLocation.findById(location._id)
          .populate('busId', 'registrationNumber busType')
          .populate('driverId', 'fullName');

        // Broadcast to all tracking this bus
        io?.to(`bus:${data.busId}`).emit('bus:location', populatedLocation);
        
        // Broadcast to all tracking all buses
        io?.to('track:all').emit('bus:location', populatedLocation);
        
        console.log(`Location update from driver for bus ${data.busId}`);
      } catch (error) {
        console.error('Error saving location:', error);
        socket.emit('error', { message: 'Failed to save location' });
      }
    });

    // Request nearby buses
    socket.on('buses:nearby', async (data: {
      latitude: number;
      longitude: number;
      radius?: number;
    }) => {
      try {
        await dbConnect();
        const nearby = await (BusLocation as any).findNearby(
          data.longitude,
          data.latitude,
          data.radius || 5000
        );
        socket.emit('buses:nearby', nearby);
      } catch (error) {
        console.error('Error finding nearby buses:', error);
        socket.emit('error', { message: 'Failed to find nearby buses' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
}

// Broadcast location update to all connected clients
export async function broadcastBusLocation(busId: string, location: any) {
  if (!io) return;
  
  io.to(`bus:${busId}`).emit('bus:location', location);
  io.to('track:all').emit('bus:location', location);
}

// Broadcast bus status change
export async function broadcastBusStatus(busId: string, status: string) {
  if (!io) return;
  
  io.to(`bus:${busId}`).emit('bus:status', { busId, status });
  io.to('track:all').emit('bus:status', { busId, status });
}
