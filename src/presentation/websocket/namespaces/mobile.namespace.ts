/**
 * Mobile Namespace
 * Handles Socket.IO connections for mobile clients (/mobile)
 */

import { BaseNamespace, TypedSocket } from './base.namespace.js';
import { log as logger } from '@shared/utils/index.js';

export class MobileNamespace extends BaseNamespace {
  protected onConnection(socket: TypedSocket): void {
    logger.info('Mobile client connected', {
      socketId: socket.id,
    });

    // Setup mobile event handlers
    this.setupMobileHandlers(socket);
  }

  protected onDisconnect(socket: TypedSocket, reason: string): void {
    logger.info('Mobile client disconnected', {
      socketId: socket.id,
      reason,
    });
  }

  /**
   * Setup mobile-specific event handlers
   */
  private setupMobileHandlers(socket: TypedSocket): void {
    // Location tracking
    socket.on('update-position', (data) => {
      // Broadcast position to all connected clients
      this.broadcast(socket, 'position-updated', {
        linkId: data.linkId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date().toISOString(),
      });
    });

    // Mobile notification
    socket.on('mobile-notification' as any, (data: any) => {
      logger.info('Mobile notification received', {
        socketId: socket.id,
        data,
      });
    });

    // Background state change
    socket.on('background-state' as any, (data: { isBackground: boolean }) => {
      socket.data.userId = data.isBackground ? 'background' : 'foreground';
      logger.info('Mobile background state changed', {
        socketId: socket.id,
        isBackground: data.isBackground,
      });
    });
  }
}
