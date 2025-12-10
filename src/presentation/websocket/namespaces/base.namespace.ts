/**
 * Base Namespace
 * Abstract base class for all Socket.IO namespaces
 */

import { Namespace, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../socket.types.js';
import { logger } from '@/shared/utils/logger.util.js';

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export abstract class BaseNamespace {
  protected namespace: TypedNamespace;

  constructor(namespace: TypedNamespace) {
    this.namespace = namespace;
    this.setupMiddlewares();
    this.setupConnectionHandler();
  }

  /**
   * Setup namespace middlewares (authentication, etc.)
   */
  protected setupMiddlewares(): void {
    this.namespace.use((socket, next) => {
      logger.debug(`Socket connecting to ${this.namespace.name}`, {
        socketId: socket.id,
        handshake: socket.handshake.query,
      });
      next();
    });
  }

  /**
   * Setup connection handler
   */
  protected setupConnectionHandler(): void {
    this.namespace.on('connection', (socket: TypedSocket) => {
      logger.info(`Client connected to ${this.namespace.name}`, {
        socketId: socket.id,
        room: socket.data.room,
      });

      this.onConnection(socket);

      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected from ${this.namespace.name}`, {
          socketId: socket.id,
          reason,
        });
        this.onDisconnect(socket, reason);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error in ${this.namespace.name}`, {
          socketId: socket.id,
          error,
        });
        this.onError(socket, error);
      });
    });
  }

  /**
   * Handle new socket connection
   */
  protected abstract onConnection(socket: TypedSocket): void;

  /**
   * Handle socket disconnection
   */
  protected abstract onDisconnect(socket: TypedSocket, reason: string): void;

  /**
   * Handle socket error
   */
  protected onError(socket: TypedSocket, error: Error): void {
    socket.emit('error', {
      code: 'SOCKET_ERROR',
      message: error.message,
    });
  }

  /**
   * Broadcast to all clients in namespace except sender
   */
  protected broadcast(socket: TypedSocket, event: string, data: any): void {
    socket.broadcast.emit(event as any, data);
  }

  /**
   * Broadcast to specific room
   */
  protected broadcastToRoom(room: string, event: string, data: any): void {
    this.namespace.to(room).emit(event as any, data);
  }

  /**
   * Send to specific socket
   */
  protected sendToSocket(socketId: string, event: string, data: any): void {
    this.namespace.to(socketId).emit(event as any, data);
  }

  /**
   * Get all sockets in a room
   */
  protected async getSocketsInRoom(room: string): Promise<Set<string>> {
    const sockets = await this.namespace.in(room).fetchSockets();
    return new Set(sockets.map((s) => s.id));
  }

  /**
   * Get socket count in room
   */
  protected async getRoomSize(room: string): Promise<number> {
    const sockets = await this.getSocketsInRoom(room);
    return sockets.size;
  }
}
