import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || "symposium-secret-key-change-in-production";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`WebSocket: User connected: ${user.username} (${user.role})`);

    // Join room based on role and event assignments
    if (user.role === 'super_admin') {
      socket.join('super_admin');
    } else if (user.role === 'event_admin') {
      // Join event-specific rooms
      storage.getEventsByAdmin(user.id).then(events => {
        events.forEach(event => {
          socket.join(`event:${event.id}`);
        });
      });
    } else if (user.role === 'participant') {
      // Join participant room
      socket.join(`participant:${user.id}`);
    } else if (user.role === 'registration_committee') {
      socket.join('registration_committee');
    }

    socket.on('disconnect', () => {
      console.log(`WebSocket: User disconnected: ${user.username}`);
    });
  });

  return io;
}

export let io: Server;

export function setIO(server: Server) {
  io = server;
}
