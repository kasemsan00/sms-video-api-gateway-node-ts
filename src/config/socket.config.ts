/**
 * Socket.IO configuration
 */

import type { ServerOptions } from 'socket.io';

/**
 * Socket.IO server configuration
 */
export const getSocketConfig = (): Partial<ServerOptions> => {
  return {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  };
};

/**
 * Socket namespace configuration
 */
export const SOCKET_NAMESPACES = {
  QUEUE: '/queue',
  NEW_QUEUE: '/newqueue',
  MOBILE: '/mobile',
  ROOM_PREFIX: '/',
  DATA_PREFIX: '/data/',
} as const;

/**
 * Socket event names
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECTION_SUCCESS: 'connection-success',
  LOG: 'log',

  // User
  USER_CONNECTION: 'user-connection',
  USER_DISCONNECT: 'user-disconnect',
  USER_DETAIL: 'user-detail',
  USER_LIST: 'user-list',
  USER_POSITION: 'user-position',
  USER_POSITION_GROUP: 'user-position-group',
  USER_CONFERENCE: 'user-conference',
  UPDATE_USERNAME: 'update-username',
  UPDATE_ADMIN_USER: 'update-admin-user',
  UPDATE_CAMERA_STATUS: 'update-camera-status',
  UPDATE_MICROPHONE_STATUS: 'update-microphone-status',

  // Chat
  CHAT_MESSAGE: 'chat-message',
  CHAT_HISTORY: 'chat-history',
  JOIN_CHAT: 'joinChat',
  GET_CHAT_HISTORY: 'get-chat-history',

  // Room
  ROOM_DATA: 'room-data',
  ROOM_RECORD: 'room-record',
  AGENT_CLOSE_ROOM: 'agent-close-room',

  // Position
  POSITION: 'position',
  CAR_TRACKING: 'carTracking',
  AGENT_CAR: 'agentCar',
  DESTINATION: 'destination',

  // Conference
  AUTH_JOIN_CONFERENCE: 'auth-join-conference',
  AUTH_JOIN_CONFERENCE_ANSWER: 'auth-join-conference-answer',
  FORCE_LEAVE_CONFERENCE: 'force-leave-conference',
  FORCE_STOP_SHARESCREEN: 'force-stop-sharescreen',
  TRACK_MUTED_UNMUTED: 'track-muted-unmuted',
  CAMERA_MICROPHONE_STATUS: 'camera-microphone-status',

  // Queue
  QUEUE: 'queue',
  CASE_DATA: 'case-data',
  CASE_LIST_DATA: 'case-list-data',
  CASE_LIST_PAGE: 'case-list-page',

  // History
  HISTORY: 'history',
} as const;
