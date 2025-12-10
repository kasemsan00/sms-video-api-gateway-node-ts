/**
 * Socket.IO Server Setup
 * Configures Socket.IO server with namespaces and middlewares
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './socket.types.js';
import { RoomNamespace, QueueNamespace, MobileNamespace } from './namespaces/index.js';
import { logger } from '@/shared/utils/logger.util.js';

export class SocketServer {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  constructor(httpServer: HttpServer) {
    // Create Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupGlobalMiddlewares();
    this.setupNamespaces();
    this.setupErrorHandlers();

    logger.info('Socket.IO server initialized');
  }

  /**
   * Setup global middlewares for all namespaces
   */
  private setupGlobalMiddlewares(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      // Optional: Add JWT verification here
      logger.debug('Socket authentication', {
        socketId: socket.id,
        hasToken: !!token,
      });

      next();
    });
  }

  /**
   * Setup Socket.IO namespaces
   */
  private setupNamespaces(): void {
    // Queue namespace
    const queueNamespace = this.io.of('/queue');
    new QueueNamespace(queueNamespace);
    logger.info('Queue namespace initialized');

    // Mobile namespace
    const mobileNamespace = this.io.of('/mobile');
    new MobileNamespace(mobileNamespace);
    logger.info('Mobile namespace initialized');

    // Dynamic room namespaces
    // Pattern: /{roomId}
    this.io.of(/^\/[a-zA-Z0-9]+$/).on('connection', (socket) => {
      const namespace = socket.nsp;
      new RoomNamespace(namespace);
    });
    logger.info('Dynamic room namespaces initialized');
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.io.engine.on('connection_error', (err) => {
      logger.error('Socket.IO connection error', {
        code: err.code,
        message: err.message,
        context: err.context,
      });
    });
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Broadcast to all clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event as any, data);
  }

  /**
   * Broadcast to specific room across all namespaces
   */
  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event as any, data);
  }

  /**
   * Get connected sockets count
   */
  public async getSocketsCount(): Promise<number> {
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Close Socket.IO server
   */
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        logger.info('Socket.IO server closed');
        resolve();
      });
    });
  }
}

/**
 * Create and configure Socket.IO server
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  return new SocketServer(httpServer);
}
