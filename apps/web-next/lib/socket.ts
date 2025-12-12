import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

export interface NextApiRequestWithSocket {
  socket: {
    server: SocketServer;
  };
}

const verifyToken = async (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

interface LocationUpdate {
  busId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

let io: SocketIOServer | null = null;

export const initializeSocket = (server: SocketServer) => {
  if (!server.io) {
    console.log('🔌 Initializing Socket.IO server...');
    
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    server.io = io;

    io.on('connection', (socket: Socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = await verifyToken(token);
          socket.data.user = decoded;
          socket.emit('authenticated', { success: true, userId: decoded.userId });
          console.log(`🔐 User authenticated: ${decoded.userId}`);
        } catch (error) {
          socket.emit('authentication_error', { message: 'Invalid token' });
        }
      });

      // Subscribe to route updates
      socket.on('subscribe_route', (routeId: string) => {
        socket.join(`route:${routeId}`);
        console.log(`📍 Client ${socket.id} subscribed to route: ${routeId}`);
        socket.emit('subscribed', { routeId });
      });

      // Unsubscribe from route
      socket.on('unsubscribe_route', (routeId: string) => {
        socket.leave(`route:${routeId}`);
        console.log(`📍 Client ${socket.id} unsubscribed from route: ${routeId}`);
      });

      // Subscribe to specific bus
      socket.on('subscribe_bus', (busId: string) => {
        socket.join(`bus:${busId}`);
        console.log(`🚌 Client ${socket.id} subscribed to bus: ${busId}`);
        socket.emit('subscribed', { busId });
      });

      // Unsubscribe from bus
      socket.on('unsubscribe_bus', (busId: string) => {
        socket.leave(`bus:${busId}`);
        console.log(`🚌 Client ${socket.id} unsubscribed from bus: ${busId}`);
      });

      // Driver location update (only drivers can send this)
      socket.on('location_update', async (data: LocationUpdate) => {
        const user = socket.data.user;
        
        if (!user || user.role !== 'driver') {
          socket.emit('error', { message: 'Unauthorized. Only drivers can send location updates.' });
          return;
        }

        try {
          // Broadcast to route and bus subscribers
          if (data.busId) {
            io?.to(`bus:${data.busId}`).emit('bus_location_update', {
              busId: data.busId,
              location: {
                lat: data.latitude,
                lng: data.longitude,
              },
              speed: data.speed,
              heading: data.heading,
              timestamp: data.timestamp || new Date(),
            });

            console.log(`📍 Location update for bus ${data.busId}`);
          }
        } catch (error) {
          console.error('Error broadcasting location:', error);
          socket.emit('error', { message: 'Failed to update location' });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    console.log('✅ Socket.IO server initialized');
  }

  return server.io;
};

export const getIO = (): SocketIOServer | null => {
  if (!io) {
    console.warn('⚠️  Socket.IO not initialized yet');
  }
  return io;
};

// Helper function to broadcast bus location updates
export const broadcastBusLocation = (
  busId: string,
  routeId: string | undefined,
  location: { lat: number; lng: number },
  speed?: number,
  heading?: number
) => {
  if (!io) {
    console.warn('⚠️  Cannot broadcast: Socket.IO not initialized');
    return;
  }

  const data = {
    busId,
    location,
    speed,
    heading,
    timestamp: new Date(),
  };

  // Broadcast to bus subscribers
  io.to(`bus:${busId}`).emit('bus_location_update', data);

  // Broadcast to route subscribers if route is assigned
  if (routeId) {
    io.to(`route:${routeId}`).emit('bus_location_update', data);
  }

  console.log(`📡 Broadcasted location for bus ${busId}`);
};
