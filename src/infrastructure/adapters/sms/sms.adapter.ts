/**
 * SMS Adapter
 * Adapter for SMS gateway services
 */

import { injectable } from 'tsyringe';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError } from '@shared/errors/base.error.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';
import { log as logger } from '@shared/utils/index.js';

export interface SendSmsOptions {
  to: string;
  message: string;
  sender?: string;
}

export interface SmsResponse {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  cost?: number;
}

export interface ISmsGateway {
  send(options: SendSmsOptions): Promise<Result<SmsResponse, AppError>>;
  checkStatus(messageId: string): Promise<Result<string, AppError>>;
  getBalance(): Promise<Result<number, AppError>>;
}

/**
 * Mock SMS Gateway for testing
 */
export class MockSmsGateway implements ISmsGateway {
  async send(options: SendSmsOptions): Promise<Result<SmsResponse, AppError>> {
    logger.info('[MOCK SMS] Sending SMS', {
      to: options.to,
      message: options.message.substring(0, 50),
      sender: options.sender,
    });

    return success({
      messageId: `mock-${Date.now()}`,
      status: 'sent',
      cost: 0,
    });
  }

  async checkStatus(messageId: string): Promise<Result<string, AppError>> {
    logger.info('[MOCK SMS] Checking status', { messageId });
    return success('sent');
  }

  async getBalance(): Promise<Result<number, AppError>> {
    logger.info('[MOCK SMS] Getting balance');
    return success(1000);
  }
}

/**
 * HTTP-based SMS Gateway (Generic implementation)
 */
export class HttpSmsGateway implements ISmsGateway {
  private apiUrl: string;
  private apiKey: string;
  private sender: string;

  constructor(apiUrl: string, apiKey: string, sender: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.sender = sender;
  }

  async send(options: SendSmsOptions): Promise<Result<SmsResponse, AppError>> {
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: options.to,
          message: options.message,
          sender: options.sender || this.sender,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return failure(
          new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `SMS gateway error: ${errorText}`,
            response.status
          )
        );
      }

      const data = await response.json();

      logger.info('SMS sent successfully', {
        to: options.to,
        messageId: data.messageId || data.id,
      });

      return success({
        messageId: data.messageId || data.id,
        status: data.status === 'success' ? 'sent' : 'pending',
        cost: data.cost,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send SMS', { error: message, options });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to send SMS: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  async checkStatus(messageId: string): Promise<Result<string, AppError>> {
    try {
      const response = await fetch(`${this.apiUrl}/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return failure(
          new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to check SMS status: ${errorText}`,
            response.status
          )
        );
      }

      const data = await response.json();
      return success(data.status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to check SMS status', { error: message, messageId });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to check SMS status: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }

  async getBalance(): Promise<Result<number, AppError>> {
    try {
      const response = await fetch(`${this.apiUrl}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return failure(
          new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to get balance: ${errorText}`,
            response.status
          )
        );
      }

      const data = await response.json();
      return success(data.balance);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get SMS balance', { error: message });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to get SMS balance: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}

/**
 * Main SMS Adapter with gateway abstraction
 */
@injectable()
export class SmsAdapter {
  private gateway: ISmsGateway;

  constructor(gateway?: ISmsGateway) {
    // Use provided gateway or create mock gateway
    if (gateway) {
      this.gateway = gateway;
    } else {
      // Default to mock gateway if no gateway provided
      const smsApiUrl = process.env.SMS_API_URL;
      const smsApiKey = process.env.SMS_API_KEY;
      const smsSender = process.env.SMS_SENDER || 'VideoCall';

      if (smsApiUrl && smsApiKey) {
        this.gateway = new HttpSmsGateway(smsApiUrl, smsApiKey, smsSender);
        logger.info('Using HTTP SMS gateway', { apiUrl: smsApiUrl });
      } else {
        this.gateway = new MockSmsGateway();
        logger.warn('Using mock SMS gateway (no SMS_API_URL configured)');
      }
    }
  }

  /**
   * Send SMS message
   */
  async sendSms(to: string, message: string, sender?: string): Promise<Result<SmsResponse, AppError>> {
    // Validate phone number (Thai format: 10 digits starting with 0)
    const phonePattern = /^0\d{9}$/;
    if (!phonePattern.test(to)) {
      return failure(
        new AppError(
          ErrorCode.INVALID_INPUT,
          'Invalid phone number format. Expected Thai format: 0XXXXXXXXX',
          400,
          { phoneNumber: to }
        )
      );
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      return failure(
        new AppError(
          ErrorCode.INVALID_INPUT,
          'SMS message cannot be empty',
          400
        )
      );
    }

    // Truncate message if too long (SMS limit: 160 characters for single SMS)
    const truncatedMessage = message.length > 160 ? message.substring(0, 157) + '...' : message;

    logger.info('Sending SMS', {
      to,
      messageLength: truncatedMessage.length,
      sender,
    });

    return this.gateway.send({
      to,
      message: truncatedMessage,
      sender,
    });
  }

  /**
   * Send video call invitation SMS
   */
  async sendVideoCallInvitation(to: string, linkUrl: string, senderName?: string): Promise<Result<SmsResponse, AppError>> {
    const message = senderName
      ? `${senderName} กำลังเชิญคุณเข้าร่วมการโทรวิดีโอ กรุณาคลิกลิงก์: ${linkUrl}`
      : `คุณได้รับคำเชิญเข้าร่วมการโทรวิดีโอ กรุณาคลิกลิงก์: ${linkUrl}`;

    return this.sendSms(to, message);
  }

  /**
   * Send location tracking invitation SMS
   */
  async sendLocationInvitation(to: string, linkUrl: string, senderName?: string): Promise<Result<SmsResponse, AppError>> {
    const message = senderName
      ? `${senderName} ขอให้คุณแชร์ตำแหน่งที่อยู่ กรุณาคลิกลิงก์: ${linkUrl}`
      : `คุณได้รับคำขอแชร์ตำแหน่งที่อยู่ กรุณาคลิกลิงก์: ${linkUrl}`;

    return this.sendSms(to, message);
  }

  /**
   * Send recording notification SMS
   */
  async sendRecordingNotification(to: string, recordingUrl: string): Promise<Result<SmsResponse, AppError>> {
    const message = `การบันทึกวิดีโอของคุณพร้อมแล้ว ดูที่: ${recordingUrl}`;

    return this.sendSms(to, message);
  }

  /**
   * Check SMS delivery status
   */
  async checkStatus(messageId: string): Promise<Result<string, AppError>> {
    return this.gateway.checkStatus(messageId);
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<Result<number, AppError>> {
    return this.gateway.getBalance();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Result<boolean, AppError>> {
    try {
      // Try to get balance as a health check
      const balanceResult = await this.gateway.getBalance();

      if (balanceResult.isFailure) {
        return failure(balanceResult.error);
      }

      return success(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SMS health check failed', { error: message });

      return failure(
        new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `SMS health check failed: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
