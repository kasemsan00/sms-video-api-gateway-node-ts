/**
 * LiveKit Adapter
 * Adapter for LiveKit video conferencing service
 */

import {
  AccessToken,
  RoomServiceClient,
  Room as LiveKitRoom,
  ParticipantInfo,
  EgressClient,
  EncodingOptionsPreset,
  EncodedFileOutput,
} from 'livekit-server-sdk';
import { injectable } from 'tsyringe';
import { getLivekitConfig, DEFAULT_TOKEN_GRANTS } from '@config/livekit.config.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, ExternalServiceError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';
import { log as logger } from '@shared/utils/index.js';

export interface TokenOptions {
  roomName: string;
  identity: string;
  name?: string;
  metadata?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
}

export interface RoomOptions {
  name: string;
  emptyTimeout?: number;
  maxParticipants?: number;
}

export interface RecordingOptions {
  roomName: string;
  fileOutputPrefix?: string;
  preset?: EncodingOptionsPreset;
}

@injectable()
export class LiveKitAdapter {
  private roomService: RoomServiceClient;
  private egressService: EgressClient;
  private config: ReturnType<typeof getLivekitConfig>;

  constructor() {
    this.config = getLivekitConfig();
    this.roomService = new RoomServiceClient(this.config.host, this.config.apiKey, this.config.apiSecret);
    this.egressService = new EgressClient(this.config.host, this.config.apiKey, this.config.apiSecret);
  }

  /**
   * Generate access token for participant
   */
  async generateToken(options: TokenOptions): Promise<Result<string, AppError>> {
    try {
      const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
        identity: options.identity,
        name: options.name,
        metadata: options.metadata,
      });

      token.addGrant({
        roomJoin: true,
        room: options.roomName,
        canPublish: options.canPublish ?? DEFAULT_TOKEN_GRANTS.canPublish,
        canSubscribe: options.canSubscribe ?? DEFAULT_TOKEN_GRANTS.canSubscribe,
        canPublishData: options.canPublishData ?? DEFAULT_TOKEN_GRANTS.canPublishData,
      });

      const jwt = await token.toJwt();

      logger.info('Generated LiveKit access token', {
        roomName: options.roomName,
        identity: options.identity,
      });

      return success(jwt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate LiveKit token', { error: message, options });

      return failure(
        new ExternalServiceError(
          'LiveKit',
          `Failed to generate LiveKit token: ${message}`,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Create a new room
   */
  async createRoom(options: RoomOptions): Promise<Result<LiveKitRoom, AppError>> {
    try {
      const room = await this.roomService.createRoom({
        name: options.name,
        emptyTimeout: options.emptyTimeout,
        maxParticipants: options.maxParticipants,
      });

      logger.info('Created LiveKit room', { roomName: options.name });

      return success(room);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create LiveKit room', { error: message, options });

      return failure(
        new ExternalServiceError(
          'LiveKit',
          `Failed to create LiveKit room: ${message}`,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<Result<LiveKitRoom | null, AppError>> {
    try {
      const rooms = await this.roomService.listRooms([roomName]);

      if (rooms.length === 0) {
        return success(null);
      }

      return success(rooms[0] ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get LiveKit room', { error: message, roomName });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to get LiveKit room: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<Result<void, AppError>> {
    try {
      await this.roomService.deleteRoom(roomName);

      logger.info('Deleted LiveKit room', { roomName });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete LiveKit room', { error: message, roomName });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to delete LiveKit room: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * List participants in a room
   */
  async listParticipants(roomName: string): Promise<Result<ParticipantInfo[], AppError>> {
    try {
      const participants = await this.roomService.listParticipants(roomName);

      return success(participants);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list participants', { error: message, roomName });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to list participants: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Get participant info
   */
  async getParticipant(roomName: string, identity: string): Promise<Result<ParticipantInfo | null, AppError>> {
    try {
      const participant = await this.roomService.getParticipant(roomName, identity);

      return success(participant);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Participant not found is not an error
      if (message.includes('not found') || message.includes('NotFound')) {
        return success(null);
      }

      logger.error('Failed to get participant', { error: message, roomName, identity });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to get participant: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomName: string, identity: string): Promise<Result<void, AppError>> {
    try {
      await this.roomService.removeParticipant(roomName, identity);

      logger.info('Removed participant from room', { roomName, identity });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to remove participant', { error: message, roomName, identity });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to remove participant: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Start room recording
   */
  async startRecording(options: RecordingOptions): Promise<Result<string, AppError>> {
    try {
      const fileOutput: EncodedFileOutput = {
        fileType: 1, // MP4
        filepath: options.fileOutputPrefix || `recordings/${options.roomName}`,
      };

      const egressInfo = await this.egressService.startRoomCompositeEgress(
        options.roomName,
        fileOutput,
        {
          encodingOptions: options.preset || EncodingOptionsPreset.H264_720P_30,
        }
      );

      logger.info('Started room recording', {
        roomName: options.roomName,
        egressId: egressInfo.egressId,
      });

      return success(egressInfo.egressId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to start recording', { error: message, options });

      return failure(
        new ExternalServiceError(
          'LiveKit',
          `Failed to start recording: ${message}`,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Stop room recording
   */
  async stopRecording(egressId: string): Promise<Result<void, AppError>> {
    try {
      await this.egressService.stopEgress(egressId);

      logger.info('Stopped room recording', { egressId });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to stop recording', { error: message, egressId });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to stop recording: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Update participant metadata
   */
  async updateParticipantMetadata(
    roomName: string,
    identity: string,
    metadata: string
  ): Promise<Result<void, AppError>> {
    try {
      await this.roomService.updateParticipant(roomName, identity, metadata);

      logger.info('Updated participant metadata', { roomName, identity });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update participant metadata', { error: message, roomName, identity });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to update participant metadata: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Mute/unmute participant track
   */
  async muteParticipantTrack(
    roomName: string,
    identity: string,
    trackSid: string,
    muted: boolean
  ): Promise<Result<void, AppError>> {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);

      logger.info('Updated participant track mute status', {
        roomName,
        identity,
        trackSid,
        muted,
      });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to mute participant track', {
        error: message,
        roomName,
        identity,
        trackSid,
      });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to mute participant track: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Send data message to room
   */
  async sendData(roomName: string, data: Uint8Array, destinationIdentities?: string[]): Promise<Result<void, AppError>> {
    try {
      await this.roomService.sendData(roomName, data, 1, { destinationIdentities });

      logger.info('Sent data to room', { roomName, dataSize: data.length });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send data', { error: message, roomName });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to send data: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Result<boolean, AppError>> {
    try {
      // Try to list rooms as a health check
      await this.roomService.listRooms();

      return success(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('LiveKit health check failed', { error: message });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `LiveKit health check failed: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
