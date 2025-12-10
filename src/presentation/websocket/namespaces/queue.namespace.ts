/**
 * Queue Namespace
 * Handles Socket.IO connections for queue management (/queue)
 */

import { BaseNamespace, TypedSocket } from './base.namespace.js';
import { logger } from '@/shared/utils/logger.util.js';

export class QueueNamespace extends BaseNamespace {
  protected onConnection(socket: TypedSocket): void {
    logger.info('Client connected to queue namespace', {
      socketId: socket.id,
    });

    // Setup queue event handlers
    this.setupQueueHandlers(socket);
  }

  protected onDisconnect(socket: TypedSocket, reason: string): void {
    logger.info('Client disconnected from queue namespace', {
      socketId: socket.id,
      reason,
    });
  }

  /**
   * Setup queue event handlers
   */
  private setupQueueHandlers(socket: TypedSocket): void {
    // Join queue room
    socket.on('join-queue' as any, (data: { queueId: string }) => {
      socket.join(`queue:${data.queueId}`);
      logger.info('Socket joined queue', {
        socketId: socket.id,
        queueId: data.queueId,
      });
    });

    // Leave queue room
    socket.on('leave-queue' as any, (data: { queueId: string }) => {
      socket.leave(`queue:${data.queueId}`);
      logger.info('Socket left queue', {
        socketId: socket.id,
        queueId: data.queueId,
      });
    });

    // Queue update
    socket.on('queue-update' as any, (data: any) => {
      this.broadcastToRoom(`queue:${data.queueId}`, 'queue-updated', data);
    });
  }
}
