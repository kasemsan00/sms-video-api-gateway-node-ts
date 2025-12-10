/**
 * Dependency Injection Tokens
 * Symbols for injecting dependencies
 */

export const INJECTION_TOKENS = {
  // ==================== Repositories ====================
  RoomRepository: Symbol.for('RoomRepository'),
  UserRepository: Symbol.for('UserRepository'),
  LinkRepository: Symbol.for('LinkRepository'),
  MessageRepository: Symbol.for('MessageRepository'),
  CaseRepository: Symbol.for('CaseRepository'),
  ServiceRepository: Symbol.for('ServiceRepository'),
  FileRepository: Symbol.for('FileRepository'),
  RecordRepository: Symbol.for('RecordRepository'),
  NotificationRepository: Symbol.for('NotificationRepository'),

  // ==================== External Services ====================
  LivekitService: Symbol.for('LivekitService'),
  SmsService: Symbol.for('SmsService'),
  NotificationService: Symbol.for('NotificationService'),
  LocationService: Symbol.for('LocationService'),
  EncodeService: Symbol.for('EncodeService'),

  // ==================== Use Cases - Room ====================
  CreateRoomUseCase: Symbol.for('CreateRoomUseCase'),
  CloseRoomUseCase: Symbol.for('CloseRoomUseCase'),
  GetRoomDetailUseCase: Symbol.for('GetRoomDetailUseCase'),
  UpdateRoomStatusUseCase: Symbol.for('UpdateRoomStatusUseCase'),
  UpdateRoomTypeUseCase: Symbol.for('UpdateRoomTypeUseCase'),
  ListRoomsUseCase: Symbol.for('ListRoomsUseCase'),
  DeleteRoomUseCase: Symbol.for('DeleteRoomUseCase'),

  // ==================== Use Cases - User ====================
  GenerateUserTokenUseCase: Symbol.for('GenerateUserTokenUseCase'),
  JoinConferenceUseCase: Symbol.for('JoinConferenceUseCase'),
  UpdateUserUseCase: Symbol.for('UpdateUserUseCase'),
  GetUserDetailUseCase: Symbol.for('GetUserDetailUseCase'),
  ListParticipantsUseCase: Symbol.for('ListParticipantsUseCase'),
  RemoveParticipantUseCase: Symbol.for('RemoveParticipantUseCase'),

  // ==================== Use Cases - Link ====================
  CreateLinkUseCase: Symbol.for('CreateLinkUseCase'),
  GetLinkDetailUseCase: Symbol.for('GetLinkDetailUseCase'),
  UpdateLinkLocationUseCase: Symbol.for('UpdateLinkLocationUseCase'),
  SendSmsLinkUseCase: Symbol.for('SendSmsLinkUseCase'),
  GetLinkHistoryUseCase: Symbol.for('GetLinkHistoryUseCase'),

  // ==================== Use Cases - Chat ====================
  SendMessageUseCase: Symbol.for('SendMessageUseCase'),
  GetChatHistoryUseCase: Symbol.for('GetChatHistoryUseCase'),
  DeleteMessageUseCase: Symbol.for('DeleteMessageUseCase'),

  // ==================== Use Cases - Auth ====================
  CreateTokenUseCase: Symbol.for('CreateTokenUseCase'),
  VerifyTokenUseCase: Symbol.for('VerifyTokenUseCase'),
  VerifyPasswordUseCase: Symbol.for('VerifyPasswordUseCase'),

  // ==================== Use Cases - Record ====================
  StartRecordingUseCase: Symbol.for('StartRecordingUseCase'),
  StopRecordingUseCase: Symbol.for('StopRecordingUseCase'),
  GetRecordingStatusUseCase: Symbol.for('GetRecordingStatusUseCase'),

  // ==================== Use Cases - Upload ====================
  UploadFileUseCase: Symbol.for('UploadFileUseCase'),
  GetFileUseCase: Symbol.for('GetFileUseCase'),
  ListFilesUseCase: Symbol.for('ListFilesUseCase'),

  // ==================== Use Cases - Notification ====================
  SendNotificationUseCase: Symbol.for('SendNotificationUseCase'),
  GetNotificationsUseCase: Symbol.for('GetNotificationsUseCase'),
  MarkNotificationReadUseCase: Symbol.for('MarkNotificationReadUseCase'),

  // ==================== Infrastructure ====================
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  Logger: Symbol.for('Logger'),
  EventEmitter: Symbol.for('EventEmitter'),
  SocketIOServer: Symbol.for('SocketIOServer'),
} as const;

/**
 * Type for injection tokens
 */
export type InjectionToken = typeof INJECTION_TOKENS[keyof typeof INJECTION_TOKENS];
