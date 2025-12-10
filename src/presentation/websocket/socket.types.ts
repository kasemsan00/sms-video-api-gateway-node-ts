/**
 * Socket Event Types
 * Defines all Socket.IO event names and payloads
 */

// Client to Server Events
export interface ClientToServerEvents {
  // Chat events
  'send-message': (data: SendMessagePayload) => void;
  'typing': (data: TypingPayload) => void;

  // Position events
  'update-position': (data: UpdatePositionPayload) => void;

  // Conference events
  'join-conference': (data: JoinConferencePayload) => void;
  'leave-conference': (data: LeaveConferencePayload) => void;
  'participant-joined': (data: ParticipantPayload) => void;
  'participant-left': (data: ParticipantPayload) => void;

  // Recording events
  'start-recording': (data: RecordingPayload) => void;
  'stop-recording': (data: RecordingPayload) => void;

  // User events
  'user-update': (data: UserUpdatePayload) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Chat events
  'new-message': (data: MessagePayload) => void;
  'message-deleted': (data: MessageDeletedPayload) => void;
  'user-typing': (data: TypingPayload) => void;

  // Position events
  'position-updated': (data: PositionPayload) => void;

  // Conference events
  'participant-joined': (data: ParticipantPayload) => void;
  'participant-left': (data: ParticipantPayload) => void;
  'conference-started': (data: ConferencePayload) => void;
  'conference-ended': (data: ConferencePayload) => void;

  // Recording events
  'recording-started': (data: RecordingPayload) => void;
  'recording-stopped': (data: RecordingPayload) => void;

  // User events
  'user-updated': (data: UserPayload) => void;

  // System events
  'error': (data: ErrorPayload) => void;
  'notification': (data: NotificationPayload) => void;
}

// Inter-server Events
export interface InterServerEvents {
  ping: () => void;
}

// Socket Data
export interface SocketData {
  userId?: string;
  identity?: string;
  room?: string;
  userType?: string;
}

// Event Payloads
export interface SendMessagePayload {
  room: string;
  identity: string;
  message: string;
  name?: string;
}

export interface MessagePayload {
  id: number;
  room: string;
  identity: string;
  name: string;
  message: string;
  timestamp: string;
}

export interface MessageDeletedPayload {
  id: number;
  room: string;
}

export interface TypingPayload {
  room: string;
  identity: string;
  name: string;
  isTyping: boolean;
}

export interface UpdatePositionPayload {
  linkId: string;
  latitude: number;
  longitude: number;
}

export interface PositionPayload {
  linkId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface JoinConferencePayload {
  room: string;
  identity: string;
  name: string;
  userType?: string;
}

export interface LeaveConferencePayload {
  room: string;
  identity: string;
}

export interface ParticipantPayload {
  room: string;
  identity: string;
  name: string;
  userType?: string;
  timestamp: string;
}

export interface ConferencePayload {
  room: string;
  timestamp: string;
}

export interface RecordingPayload {
  room: string;
  recordingId?: string;
  status?: string;
}

export interface UserUpdatePayload {
  identity: string;
  room: string;
  name?: string;
  userType?: string;
}

export interface UserPayload {
  identity: string;
  room: string;
  name: string;
  userType: string;
  timestamp: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export interface NotificationPayload {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}
