/**
 * Room Namespace
 * Handles Socket.IO connections for specific rooms (/{roomId})
 */

import { container } from 'tsyringe';
import { BaseNamespace, TypedSocket } from './base.namespace.js';
import { ChatService } from '@/application/services/chat.service.js';
import { LinkService } from '@/application/services/link.service.js';
import { log as logger } from '@shared/utils/index.js';

export class RoomNamespace extends BaseNamespace {
  private chatService: ChatService;
  private linkService: LinkService;

  constructor(namespace: any) {
    super(namespace);
    this.chatService = container.resolve('ChatService' as any);
    this.linkService = container.resolve('LinkService' as any);
  }

  protected onConnection(socket: TypedSocket): void {
    const roomId = this.extractRoomId(socket);
    
    if (!roomId) {
      logger.error('No room ID in socket connection');
      socket.disconnect();
      return;
    }

    // Store room in socket data
    socket.data.room = roomId;

    // Join the room
    socket.join(roomId);

    logger.info('Socket joined room', {
      socketId: socket.id,
      room: roomId,
    });

    // Setup event handlers
    this.setupChatHandlers(socket);
    this.setupConferenceHandlers(socket);
    this.setupRecordingHandlers(socket);
    this.setupPositionHandlers(socket);
  }

  protected onDisconnect(socket: TypedSocket, _reason: string): void {
    const room = socket.data.room;
    const identity = socket.data.identity;

    if (room && identity) {
      // Notify others that user left
      this.broadcastToRoom(room, 'participant-left', {
        room,
        identity,
        name: socket.data.userId || identity,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Setup chat event handlers
   */
  private setupChatHandlers(socket: TypedSocket): void {
    // Send message
    socket.on('send-message', async (data) => {
      try {
        const result = await this.chatService.sendMessage({
          room: data.room,
          identity: data.identity,
          message: data.message,
          name: data.name ?? 'Unknown',
        });

        if (result.isSuccess) {
          // Broadcast to all in room
          this.broadcastToRoom(data.room, 'new-message', {
            id: result.value.id,
            room: data.room,
            identity: data.identity,
            name: data.name || data.identity,
            message: data.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          socket.emit('error', {
            code: result.error.code,
            message: result.error.message,
          });
        }
      } catch (error: any) {
        logger.error('Error sending message', { error, data });
        socket.emit('error', {
          code: 'MESSAGE_ERROR',
          message: error.message,
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.room).emit('user-typing', {
        room: data.room,
        identity: data.identity,
        name: data.name,
        isTyping: data.isTyping,
      });
    });
  }

  /**
   * Setup conference event handlers
   */
  private setupConferenceHandlers(socket: TypedSocket): void {
    // User joined conference
    socket.on('join-conference', async (data) => {
      try {
        socket.data.identity = data.identity;
        socket.data.userId = data.name;
        socket.data.userType = data.userType;

        // Join room
        await socket.join(data.room);

        // Notify others
        this.broadcastToRoom(data.room, 'participant-joined', {
          room: data.room,
          identity: data.identity,
          name: data.name,
          userType: data.userType,
          timestamp: new Date().toISOString(),
        });

        logger.info('User joined conference', {
          room: data.room,
          identity: data.identity,
        });
      } catch (error: any) {
        logger.error('Error joining conference', { error, data });
        socket.emit('error', {
          code: 'JOIN_ERROR',
          message: error.message,
        });
      }
    });

    // User left conference
    socket.on('leave-conference', async (data) => {
      try {
        // Leave room
        await socket.leave(data.room);

        // Notify others
        this.broadcastToRoom(data.room, 'participant-left', {
          room: data.room,
          identity: data.identity,
          name: socket.data.userId || data.identity,
          timestamp: new Date().toISOString(),
        });

        logger.info('User left conference', {
          room: data.room,
          identity: data.identity,
        });
      } catch (error: any) {
        logger.error('Error leaving conference', { error, data });
      }
    });
  }

  /**
   * Setup recording event handlers
   */
  private setupRecordingHandlers(socket: TypedSocket): void {
    // Start recording
    socket.on('start-recording', (data) => {
      this.broadcastToRoom(data.room, 'recording-started', {
        room: data.room,
        recordingId: data.recordingId,
        status: 'recording',
      });
    });

    // Stop recording
    socket.on('stop-recording', (data) => {
      this.broadcastToRoom(data.room, 'recording-stopped', {
        room: data.room,
        recordingId: data.recordingId,
        status: 'stopped',
      });
    });
  }

  /**
   * Setup position update handlers
   */
  private setupPositionHandlers(socket: TypedSocket): void {
    socket.on('update-position', async (data) => {
      try {
        const result = await this.linkService.updateLinkLocation({
          linkId: data.linkId,
          latitude: data.latitude,
          longitude: data.longitude,
        });

        if (result.isSuccess) {
          // Broadcast position update
          this.namespace.emit('position-updated', {
            linkId: data.linkId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        logger.error('Error updating position', { error, data });
      }
    });
  }

  /**
   * Extract room ID from socket namespace
   */
  private extractRoomId(socket: TypedSocket): string | null {
    const namespace = socket.nsp.name;
    const match = namespace.match(/^\/(.+)$/);
    return match ? (match[1] ?? null) : null;
  }
}
