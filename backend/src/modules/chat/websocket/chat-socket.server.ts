/**
 * WebSocket Server for Real-time Chat
 * Handles Socket.io connections for both admin panel and widget clients
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { ChatRoomService } from '../services/chat-room.service';
import { ChatMessageService } from '../services/chat-message.service';
import { ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatWidgetTokenService } from '../services/chat-widget-token.service';
import { logger } from '../../../utils/logger';
import jwt from 'jsonwebtoken';
import { loadEnv } from '../../../config/env';

interface SocketAuth {
  tenantId: string;
  userId?: string;
  visitorId?: string;
  type: 'admin' | 'visitor';
  publicKey?: string; // For widget authentication
}

interface JoinRoomPayload {
  roomId: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
  messageType?: string;
}

export class ChatSocketServer {
  private io: SocketServer;
  private config: ReturnType<typeof loadEnv>;

  constructor(httpServer: HttpServer) {
    this.config = loadEnv();
    
    // Allow all saastour360.com subdomains and tenant custom domains
    const allowedPatterns = [
      /^https?:\/\/[a-z0-9-]+\.saastour360\.com$/i,
      /^https?:\/\/[a-z0-9-]+\.local\.saastour360\.test$/i,
      /^https?:\/\/(www\.)?bergrentacar\.com$/i, // Tenant custom domain
      /^https?:\/\/(www\.)?sunsetcarrent\.com$/i, // Tenant custom domain
      'https://api.saastour360.com',
      'http://api.saastour360.com',
      'http://localhost:5001',
      'http://localhost:4001',
      'http://localhost:3000',
    ];
    
    // Known tenant custom domains
    const knownTenantDomains = [
      'www.bergrentacar.com',
      'bergrentacar.com',
      'www.sunsetcarrent.com',
      'sunsetcarrent.com',
    ];
    
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) {
            logger.info('[Socket.io CORS] No origin header, allowing request');
            return callback(null, true);
          }
          
          logger.info(`[Socket.io CORS] Checking origin: ${origin}`);
          
          // Extract hostname from origin
          let hostname: string;
          try {
            const url = new URL(origin);
            hostname = url.hostname;
          } catch (e) {
            logger.warn(`[Socket.io CORS] Invalid origin format: ${origin}`);
            return callback(new Error(`Invalid origin format: ${origin}`));
          }
          
          // Check against patterns
          const matchesPattern = allowedPatterns.some(pattern => {
            if (typeof pattern === 'string') {
              try {
                const patternUrl = new URL(pattern);
                const matches = hostname === patternUrl.hostname || origin.toLowerCase() === pattern.toLowerCase();
                if (matches) logger.info(`[Socket.io CORS] ✅ Matched string origin: ${pattern}`);
                return matches;
              } catch {
                const matches = origin.toLowerCase() === pattern.toLowerCase();
                if (matches) logger.info(`[Socket.io CORS] ✅ Matched string origin: ${pattern}`);
                return matches;
              }
            }
            const matches = pattern.test(origin);
            if (matches) logger.info(`[Socket.io CORS] ✅ Matched regex pattern for origin: ${origin}`);
            return matches;
          });
          
          if (matchesPattern) {
            logger.info(`[Socket.io CORS] ✅ Origin ALLOWED: ${origin}`);
            return callback(null, true);
          }
          
          // If pattern doesn't match, check if it's a known tenant custom domain
          const isKnownTenantDomain = knownTenantDomains.some(domain => {
            const matches = hostname === domain || hostname === `www.${domain}` || hostname.replace(/^www\./, '') === domain;
            if (matches) logger.info(`[Socket.io CORS] ✅ Matched known tenant domain: ${domain}`);
            return matches;
          });
          
          if (isKnownTenantDomain) {
            logger.info(`[Socket.io CORS] ✅ Origin ALLOWED (tenant domain): ${origin}`);
            return callback(null, true);
          }
          
          logger.warn(`[Socket.io CORS] ❌ Origin NOT ALLOWED: ${origin} (hostname: ${hostname})`);
          logger.warn(`[Socket.io CORS] Allowed patterns: ${allowedPatterns.map(p => typeof p === 'string' ? p : p.toString()).join(', ')}`);
          callback(new Error(`Not allowed by CORS: ${origin}`));
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Chat WebSocket server initialized');
  }

  /**
   * Socket.io authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        const auth = socket.handshake.auth as any;
        const authHeader = socket.handshake.headers.authorization;

        let socketAuth: SocketAuth | null = null;

        // Admin authentication (JWT token)
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            const decoded = jwt.verify(token, this.config.auth.jwtSecret) as any;
            socketAuth = {
              tenantId: decoded.tenantId,
              userId: decoded.userId,
              type: 'admin',
            };
          } catch (error) {
            logger.warn('Invalid JWT token in WebSocket connection', { error });
            return next(new Error('Authentication failed'));
          }
        }
        // Widget authentication (public key)
        else if (auth.tenantId && auth.publicKey) {
          const token = await ChatWidgetTokenService.validateToken(auth.tenantId, auth.publicKey);
          if (!token) {
            logger.warn('Invalid widget token in WebSocket connection', {
              tenantId: auth.tenantId,
              publicKey: auth.publicKey,
            });
            return next(new Error('Widget authentication failed'));
          }
          socketAuth = {
            tenantId: auth.tenantId,
            visitorId: auth.visitorId,
            type: 'visitor',
            publicKey: auth.publicKey,
          };
        } else {
          return next(new Error('Authentication required'));
        }

        socket.data.auth = socketAuth;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const auth = socket.data.auth as SocketAuth;
      logger.info(`Chat WebSocket client connected`, {
        type: auth.type,
        tenantId: auth.tenantId,
        socketId: socket.id,
      });

      // Join tenant room for admin (receives all tenant notifications)
      if (auth.type === 'admin') {
        socket.join(`tenant:${auth.tenantId}`);
      }

      // Join room
      socket.on('join_room', async (payload: JoinRoomPayload) => {
        try {
          const { roomId } = payload;
          
          // Verify room belongs to tenant
          const room = await ChatRoomService.getById(roomId, auth.tenantId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          socket.join(`room:${roomId}`);

          // Add admin participant if admin
          if (auth.type === 'admin' && auth.userId) {
            await ChatRoomService.addAdminParticipant(roomId, auth.userId);
            socket.emit('joined_room', { roomId });
            logger.info(`Admin joined room ${roomId}`, { userId: auth.userId });
          }

          // Load messages and send to client
          const messages = await ChatMessageService.getByRoomId(roomId, auth.tenantId, { limit: 100 });
          socket.emit('room_messages', { roomId, messages });
        } catch (error) {
          logger.error('Error joining room', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Send message
      socket.on('send_message', async (payload: SendMessagePayload) => {
        try {
          const { roomId, content, messageType } = payload;

          // Verify room belongs to tenant
          const room = await ChatRoomService.getById(roomId, auth.tenantId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          const senderType = auth.type === 'admin' ? ChatMessageSenderType.ADMIN : ChatMessageSenderType.VISITOR;

          const message = await ChatMessageService.create({
            roomId,
            senderType,
            adminUserId: auth.userId,
            content,
            messageType: messageType ? (messageType as ChatMessageType) : undefined,
          });

          // Broadcast message to all clients in the room
          this.io.to(`room:${roomId}`).emit('new_message', {
            roomId,
            message,
          });

          // Notify tenant admins if message is from visitor
          if (auth.type === 'visitor') {
            this.io.to(`tenant:${auth.tenantId}`).emit('room_new_message', {
              roomId,
              message,
            });
          }

          logger.info(`Message sent in room ${roomId}`, {
            senderType: auth.type,
            messageId: message.id,
          });
        } catch (error) {
          logger.error('Error sending message', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark as read
      socket.on('mark_read', async (payload: { roomId: string }) => {
        try {
          if (auth.type === 'admin') {
            await ChatMessageService.markAllAsRead(payload.roomId, auth.tenantId);
            socket.emit('marked_read', { roomId: payload.roomId });
          }
        } catch (error) {
          logger.error('Error marking as read', error);
        }
      });

      // Typing indicator
      socket.on('typing', (payload: { roomId: string; isTyping: boolean }) => {
        socket.to(`room:${payload.roomId}`).emit('user_typing', {
          roomId: payload.roomId,
          userId: auth.userId || auth.visitorId,
          type: auth.type,
          isTyping: payload.isTyping,
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`Chat WebSocket client disconnected`, {
          type: auth.type,
          tenantId: auth.tenantId,
          socketId: socket.id,
        });
      });
    });
  }

  /**
   * Get Socket.io instance (for external use)
   */
  getIO(): SocketServer {
    return this.io;
  }
}

