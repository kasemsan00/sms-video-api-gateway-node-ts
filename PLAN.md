# API Gateway Backend - Migration Plan

## Project Overview

**Project Name:** ts-api-gateway-backend
**Current State:** JavaScript with ES6 Modules
**Target State:** TypeScript with Clean Architecture
**Migration Type:** Incremental (Parallel Development)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Shared Types & Interfaces](#4-shared-types--interfaces)
5. [Design Patterns](#5-design-patterns)
6. [Migration Phases](#6-migration-phases)
7. [Implementation Details](#7-implementation-details)
8. [Testing Strategy](#8-testing-strategy)
9. [Dependencies](#9-dependencies)
10. [Checklist](#10-checklist)
11. [Database Schema Reference](#11-database-schema-reference)

---

## 1. Current State Analysis

### 1.1 Problems Identified

| Category | Issue | Severity | Files Affected |
|----------|-------|----------|----------------|
| **Security** | SQL Injection - String interpolation in queries | Critical | All service files |
| **Type Safety** | No TypeScript, no type definitions | High | All files |
| **Architecture** | Tight coupling between layers | High | Controllers, Services |
| **Error Handling** | No centralized error handling | High | All files |
| **Validation** | No input validation layer | High | Controllers |
| **Global State** | `global.io` usage | Medium | Socket handlers |
| **Code Duplication** | Repeated patterns across services | Medium | Services |
| **Testing** | Difficult to test due to coupling | Medium | All files |

### 1.2 Current File Statistics

```
Total Files: ~60+ JavaScript files
├── Controllers: 18 files
├── Services: 25+ files
├── Routes: 12 files
├── Socket Handlers: 4 files
├── Middlewares: 2 files
├── Seed/Migration: 2 files
└── Others: Various config and utility files
```

### 1.3 Current Dependencies

```json
{
  "express": "^5.1.0",
  "socket.io": "^4.8.1",
  "mysql2": "^3.12.0",
  "livekit-server-sdk": "^2.13.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "dayjs": "^1.11.13"
}
```

---

## 2. Target Architecture

### 2.1 Architecture Overview: Clean Architecture + DDD

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  HTTP/REST   │  │  WebSocket   │  │     Middlewares        │ │
│  │  Controllers │  │   Handlers   │  │  (Auth, Validation,    │ │
│  │              │  │              │  │   Error, RateLimit)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      USE CASES                               ││
│  │  CreateRoom, JoinConference, SendMessage, GenerateLink...   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    DTOs + Validators                         ││
│  │  Request/Response objects with Zod schema validation        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────────┐ │
│  │  Entities  │  │   Value    │  │     Domain Services        │ │
│  │  Room,User │  │  Objects   │  │  RoomDomainService,        │ │
│  │  Link,Chat │  │  LinkId,   │  │  AuthDomainService         │ │
│  │            │  │  Position  │  │                            │ │
│  └────────────┘  └────────────┘  └────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              REPOSITORY INTERFACES (Ports)                   ││
│  │  IRoomRepository, IUserRepository, ILinkRepository...       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │   MySQL    │  │  LiveKit   │  │    SMS     │  │   Redis    │ │
│  │   Repos    │  │   Client   │  │  Adapter   │  │   Cache    │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| **Presentation** | HTTP/WebSocket handling, request/response | Application Layer |
| **Application** | Use cases, orchestration, DTOs | Domain Layer |
| **Domain** | Business logic, entities, rules | None (Pure) |
| **Infrastructure** | External services, database, adapters | Domain Interfaces |

---

## 3. Folder Structure

```
src/
├── index.ts                              # Application entry point
├── server.ts                             # Express/Socket.IO server setup
│
├── config/                               # Configuration
│   ├── index.ts                          # Config aggregator & export
│   ├── database.config.ts                # MySQL configuration
│   ├── livekit.config.ts                 # LiveKit SDK configuration
│   ├── socket.config.ts                  # Socket.IO configuration
│   ├── app.config.ts                     # General app configuration
│   └── env.validation.ts                 # Environment variable validation (Zod)
│
├── shared/                               # Shared Kernel
│   ├── types/
│   │   ├── index.ts                      # Type exports
│   │   ├── common.types.ts               # UUID, DateTime, Nullable, etc.
│   │   ├── result.type.ts                # Result<T, E> monad
│   │   ├── pagination.type.ts            # PaginatedResult<T>
│   │   └── api-response.type.ts          # ApiResponse<T>
│   │
│   ├── errors/
│   │   ├── index.ts                      # Error exports
│   │   ├── base.error.ts                 # AppError base class
│   │   ├── domain.errors.ts              # Business rule errors
│   │   ├── validation.errors.ts          # Input validation errors
│   │   └── http.errors.ts                # HTTP-specific errors
│   │
│   ├── utils/
│   │   ├── index.ts                      # Utility exports
│   │   ├── id-generator.util.ts          # nanoid wrapper
│   │   ├── date.util.ts                  # dayjs wrapper
│   │   ├── crypto.util.ts                # Hashing utilities
│   │   ├── string.util.ts                # String manipulation
│   │   └── logger.util.ts                # Winston logger wrapper
│   │
│   └── constants/
│       ├── index.ts                      # Constants exports
│       ├── user-types.constant.ts        # UserType enum
│       ├── room-status.constant.ts       # RoomStatus enum
│       ├── link-types.constant.ts        # LinkType enum
│       └── error-codes.constant.ts       # Error code definitions
│
├── domain/                               # Domain Layer (Business Core)
│   ├── entities/
│   │   ├── index.ts                      # Entity exports
│   │   ├── room.entity.ts                # Room aggregate root
│   │   ├── user.entity.ts                # User entity
│   │   ├── link.entity.ts                # Link entity
│   │   ├── message.entity.ts             # Chat message entity
│   │   ├── case.entity.ts                # Case entity
│   │   └── service.entity.ts             # Service configuration entity
│   │
│   ├── value-objects/
│   │   ├── index.ts                      # Value object exports
│   │   ├── link-id.vo.ts                 # LinkId value object
│   │   ├── room-name.vo.ts               # RoomName value object
│   │   ├── user-identity.vo.ts           # UserIdentity value object
│   │   ├── position.vo.ts                # GPS Position value object
│   │   ├── phone-number.vo.ts            # PhoneNumber value object
│   │   └── color.vo.ts                   # Color hex value object
│   │
│   ├── repositories/                     # Repository Interfaces (Ports)
│   │   ├── index.ts                      # Repository exports
│   │   ├── room.repository.interface.ts
│   │   ├── user.repository.interface.ts
│   │   ├── link.repository.interface.ts
│   │   ├── message.repository.interface.ts
│   │   ├── case.repository.interface.ts
│   │   └── service.repository.interface.ts
│   │
│   ├── services/                         # Domain Services
│   │   ├── index.ts                      # Domain service exports
│   │   ├── room-domain.service.ts        # Room business rules
│   │   └── user-domain.service.ts        # User business rules
│   │
│   └── events/                           # Domain Events
│       ├── index.ts                      # Event exports
│       ├── base.event.ts                 # Base domain event
│       ├── room-created.event.ts
│       ├── room-closed.event.ts
│       ├── user-joined.event.ts
│       └── message-sent.event.ts
│
├── application/                          # Application Layer
│   ├── use-cases/
│   │   ├── room/
│   │   │   ├── index.ts                  # Room use case exports
│   │   │   ├── create-room.use-case.ts
│   │   │   ├── close-room.use-case.ts
│   │   │   ├── get-room-detail.use-case.ts
│   │   │   ├── update-room-status.use-case.ts
│   │   │   └── list-rooms.use-case.ts
│   │   │
│   │   ├── user/
│   │   │   ├── index.ts                  # User use case exports
│   │   │   ├── generate-user-token.use-case.ts
│   │   │   ├── join-conference.use-case.ts
│   │   │   ├── update-user.use-case.ts
│   │   │   ├── get-user-detail.use-case.ts
│   │   │   └── remove-participant.use-case.ts
│   │   │
│   │   ├── link/
│   │   │   ├── index.ts                  # Link use case exports
│   │   │   ├── create-link.use-case.ts
│   │   │   ├── get-link-detail.use-case.ts
│   │   │   ├── update-location.use-case.ts
│   │   │   └── send-sms-link.use-case.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── index.ts                  # Chat use case exports
│   │   │   ├── send-message.use-case.ts
│   │   │   ├── get-chat-history.use-case.ts
│   │   │   └── delete-message.use-case.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── index.ts                  # Auth use case exports
│   │   │   ├── create-token.use-case.ts
│   │   │   ├── verify-token.use-case.ts
│   │   │   └── verify-password.use-case.ts
│   │   │
│   │   ├── record/
│   │   │   ├── index.ts                  # Record use case exports
│   │   │   ├── start-recording.use-case.ts
│   │   │   └── stop-recording.use-case.ts
│   │   │
│   │   └── notification/
│   │       ├── index.ts                  # Notification use case exports
│   │       └── send-notification.use-case.ts
│   │
│   ├── dtos/
│   │   ├── room/
│   │   │   ├── create-room.dto.ts        # Input + validation schema
│   │   │   ├── update-room.dto.ts
│   │   │   └── room-response.dto.ts      # Output transformation
│   │   │
│   │   ├── user/
│   │   │   ├── generate-token.dto.ts
│   │   │   ├── join-conference.dto.ts
│   │   │   └── user-response.dto.ts
│   │   │
│   │   ├── link/
│   │   │   ├── create-link.dto.ts
│   │   │   ├── update-location.dto.ts
│   │   │   └── link-response.dto.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── send-message.dto.ts
│   │   │   └── message-response.dto.ts
│   │   │
│   │   └── auth/
│   │       ├── create-token.dto.ts
│   │       └── verify-token.dto.ts
│   │
│   └── interfaces/                       # External Service Interfaces (Ports)
│       ├── index.ts                      # Interface exports
│       ├── livekit.interface.ts          # LiveKit service port
│       ├── sms.interface.ts              # SMS service port
│       ├── notification.interface.ts     # Notification service port
│       └── event-emitter.interface.ts    # Event emitter port
│
├── infrastructure/                       # Infrastructure Layer
│   ├── database/
│   │   ├── mysql/
│   │   │   ├── connection.ts             # MySQL pool management
│   │   │   ├── query-builder.ts          # Safe query builder
│   │   │   ├── base.repository.ts        # Base repository class
│   │   │   └── repositories/
│   │   │       ├── index.ts              # Repository exports
│   │   │       ├── mysql-room.repository.ts
│   │   │       ├── mysql-user.repository.ts
│   │   │       ├── mysql-link.repository.ts
│   │   │       ├── mysql-message.repository.ts
│   │   │       ├── mysql-case.repository.ts
│   │   │       └── mysql-service.repository.ts
│   │   │
│   │   └── seeds/
│   │       ├── index.ts                  # Seed orchestrator
│   │       ├── color-scheme.seed.ts
│   │       └── services.seed.ts
│   │
│   ├── external/
│   │   ├── livekit/
│   │   │   ├── livekit.client.ts         # LiveKit SDK wrapper
│   │   │   └── livekit.adapter.ts        # Implements ILivekitService
│   │   │
│   │   ├── sms/
│   │   │   ├── sms.client.ts             # SMS API client
│   │   │   └── sms.adapter.ts            # Implements ISmsService
│   │   │
│   │   └── notification/
│   │       └── notification.adapter.ts   # Implements INotificationService
│   │
│   ├── cache/
│   │   ├── redis.client.ts               # Redis connection (optional)
│   │   └── cache.service.ts              # Cache abstraction
│   │
│   └── logging/
│       ├── winston.config.ts             # Winston configuration
│       └── logger.service.ts             # Logger service
│
├── presentation/                         # Presentation Layer
│   ├── http/
│   │   ├── controllers/
│   │   │   ├── index.ts                  # Controller exports
│   │   │   ├── base.controller.ts        # Base controller class
│   │   │   ├── room.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── link.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── record.controller.ts
│   │   │   ├── upload.controller.ts
│   │   │   ├── stats.controller.ts
│   │   │   └── health.controller.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts                  # Route aggregator
│   │   │   ├── room.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── link.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── record.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   └── health.routes.ts
│   │   │
│   │   ├── middlewares/
│   │   │   ├── index.ts                  # Middleware exports
│   │   │   ├── auth.middleware.ts        # JWT verification
│   │   │   ├── validation.middleware.ts  # Zod validation
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── rate-limiter.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   └── file-upload.middleware.ts
│   │   │
│   │   └── validators/
│   │       ├── index.ts                  # Validator exports
│   │       ├── room.validator.ts
│   │       ├── user.validator.ts
│   │       ├── link.validator.ts
│   │       └── common.validator.ts
│   │
│   └── websocket/
│       ├── socket.server.ts              # Socket.IO server setup
│       ├── socket.types.ts               # Socket event types
│       │
│       ├── namespaces/
│       │   ├── index.ts                  # Namespace exports
│       │   ├── base.namespace.ts         # Base namespace class
│       │   ├── room.namespace.ts         # /{roomId} namespace
│       │   ├── queue.namespace.ts        # /queue namespace
│       │   ├── newqueue.namespace.ts     # /newqueue namespace
│       │   └── mobile.namespace.ts       # /mobile namespace
│       │
│       ├── handlers/
│       │   ├── index.ts                  # Handler exports
│       │   ├── chat.handler.ts           # Chat event handlers
│       │   ├── position.handler.ts       # Position event handlers
│       │   ├── conference.handler.ts     # Conference event handlers
│       │   ├── recording.handler.ts      # Recording event handlers
│       │   └── user.handler.ts           # User event handlers
│       │
│       └── middlewares/
│           ├── socket-auth.middleware.ts
│           └── socket-logger.middleware.ts
│
├── jobs/                                 # Background Jobs
│   ├── cron/
│   │   ├── index.ts                      # Cron job orchestrator
│   │   ├── room-expiry.job.ts            # Auto-close expired rooms
│   │   └── socket-cleanup.job.ts         # Clean up stale sockets
│   │
│   └── queue/                            # Async job queue (optional)
│       ├── index.ts
│       └── notification.job.ts
│
├── container/                            # Dependency Injection
│   ├── index.ts                          # Container setup
│   ├── types.ts                          # Injection tokens
│   └── modules/
│       ├── repository.module.ts
│       ├── service.module.ts
│       ├── use-case.module.ts
│       └── controller.module.ts
│
└── tests/                                # Tests
    ├── unit/
    │   ├── domain/
    │   │   ├── entities/
    │   │   └── value-objects/
    │   ├── application/
    │   │   └── use-cases/
    │   └── infrastructure/
    │       └── repositories/
    │
    ├── integration/
    │   ├── repositories/
    │   └── api/
    │
    ├── e2e/
    │   └── flows/
    │
    └── fixtures/
        ├── room.fixture.ts
        ├── user.fixture.ts
        └── link.fixture.ts
```

---

## 4. Shared Types & Interfaces

### 4.1 Common Types (`shared/types/common.types.ts`)

```typescript
/**
 * Common type definitions used throughout the application
 */

// Primitive type aliases
export type UUID = string;
export type DateTimeString = string; // ISO 8601 format
export type Timestamp = number;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// ID types for type safety
export type RoomId = string & { readonly brand: unique symbol };
export type UserId = string & { readonly brand: unique symbol };
export type LinkId = string & { readonly brand: unique symbol };
export type MessageId = number & { readonly brand: unique symbol };
export type ServiceId = number & { readonly brand: unique symbol };

// Generic record type
export type Dictionary<T> = Record<string, T>;

// Function types
export type AsyncFunction<T = void> = () => Promise<T>;
export type Callback<T = void> = (result: T) => void;
```

### 4.2 Result Type (`shared/types/result.type.ts`)

```typescript
/**
 * Result monad for explicit error handling
 * Eliminates try-catch spreading and makes errors explicit in function signatures
 */

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(public readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  getOrThrow(): T {
    return this.value;
  }
}

export class Failure<T, E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(public readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure(this.error);
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure(this.error);
  }

  getOrElse(defaultValue: T): T {
    return defaultValue;
  }

  getOrThrow(): never {
    throw this.error;
  }
}

// Factory functions
export const success = <T, E = Error>(value: T): Result<T, E> =>
  new Success(value);

export const failure = <T, E = Error>(error: E): Result<T, E> =>
  new Failure(error);

// Type guards
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T, E> =>
  result.isSuccess;

export const isFailure = <T, E>(result: Result<T, E>): result is Failure<T, E> =>
  result.isFailure;
```

### 4.3 Pagination Type (`shared/types/pagination.type.ts`)

```typescript
/**
 * Pagination types for list operations
 */

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Factory function
export const createPaginatedResult = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
};
```

### 4.4 API Response Type (`shared/types/api-response.type.ts`)

```typescript
/**
 * Standardized API response types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string; // Only in development
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

// Factory functions
export const successResponse = <T>(
  data: T,
  meta?: Partial<ResponseMeta>
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

export const errorResponse = (
  error: ApiError,
  meta?: Partial<ResponseMeta>
): ApiResponse<never> => ({
  success: false,
  error,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});
```

### 4.5 Domain Constants (`shared/constants/`)

```typescript
// user-types.constant.ts
export enum UserType {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export const USER_TYPE_VALUES = Object.values(UserType);

// room-status.constant.ts
export enum RoomStatus {
  OPEN = 'open',
  CLOSE = 'close',
}

export const ROOM_STATUS_VALUES = Object.values(RoomStatus);

// link-types.constant.ts
export enum LinkType {
  VIDEO = 'video',
  LOCATION = 'location',
}

export const LINK_TYPE_VALUES = Object.values(LinkType);

// room-types.constant.ts
export enum RoomType {
  CONFERENCE = 'conference',
  LOCATION = 'location',
}

// error-codes.constant.ts
export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not Found Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',

  // Conflict Errors (409)
  CONFLICT = 'CONFLICT',
  ROOM_ALREADY_EXISTS = 'ROOM_ALREADY_EXISTS',
  USER_ALREADY_IN_ROOM = 'USER_ALREADY_IN_ROOM',

  // Business Logic Errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  ROOM_EXPIRED = 'ROOM_EXPIRED',
  ROOM_CLOSED = 'ROOM_CLOSED',
  ONE_TIME_LINK_USED = 'ONE_TIME_LINK_USED',

  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}
```

### 4.6 Error Classes (`shared/errors/`)

```typescript
// base.error.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: Date;
  readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// domain.errors.ts
export class DomainError extends AppError {
  readonly statusCode = 422;
  constructor(
    public readonly code: string,
    message: string,
    details?: unknown
  ) {
    super(message, details);
  }
}

export class RoomNotFoundError extends DomainError {
  constructor(roomId: string) {
    super(ErrorCode.ROOM_NOT_FOUND, `Room with ID '${roomId}' not found`);
  }
}

export class RoomExpiredError extends DomainError {
  constructor(roomId: string) {
    super(ErrorCode.ROOM_EXPIRED, `Room '${roomId}' has expired`);
  }
}

export class RoomClosedError extends DomainError {
  constructor(roomId: string) {
    super(ErrorCode.ROOM_CLOSED, `Room '${roomId}' is closed`);
  }
}

// validation.errors.ts
export class ValidationError extends AppError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly statusCode = 400;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

// http.errors.ts
export class UnauthorizedError extends AppError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string) {
    super(identifier
      ? `${resource} '${identifier}' not found`
      : `${resource} not found`
    );
  }
}
```

---

## 5. Design Patterns

### 5.1 Repository Pattern

```typescript
// domain/repositories/room.repository.interface.ts
import { Room } from '../entities/room.entity';
import { RoomStatus } from '@/shared/constants';
import { PaginatedResult, PaginationParams } from '@/shared/types';

export interface IRoomRepository {
  // Read operations
  findById(id: string): Promise<Room | null>;
  findByName(name: string): Promise<Room | null>;
  findByStatus(status: RoomStatus): Promise<Room[]>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Room>>;
  findExpired(): Promise<Room[]>;

  // Write operations
  create(room: Room): Promise<Room>;
  update(room: Room): Promise<Room>;
  delete(id: string): Promise<void>;

  // Specific operations
  updateStatus(id: string, status: RoomStatus): Promise<void>;
  updateExpiry(id: string, expiryDate: Date): Promise<void>;
  countByStatus(status: RoomStatus): Promise<number>;
}
```

### 5.2 Use Case Pattern

```typescript
// application/use-cases/room/create-room.use-case.ts
import { injectable, inject } from 'tsyringe';
import { Result, success, failure } from '@/shared/types/result.type';
import { Room } from '@/domain/entities/room.entity';
import { IRoomRepository } from '@/domain/repositories/room.repository.interface';
import { ILivekitService } from '@/application/interfaces/livekit.interface';
import { CreateRoomDto, CreateRoomResponseDto } from '@/application/dtos/room';
import { DomainError } from '@/shared/errors';
import { INJECTION_TOKENS } from '@/container/types';

export interface ICreateRoomUseCase {
  execute(dto: CreateRoomDto): Promise<Result<CreateRoomResponseDto, DomainError>>;
}

@injectable()
export class CreateRoomUseCase implements ICreateRoomUseCase {
  constructor(
    @inject(INJECTION_TOKENS.RoomRepository)
    private readonly roomRepository: IRoomRepository,

    @inject(INJECTION_TOKENS.LivekitService)
    private readonly livekitService: ILivekitService,
  ) {}

  async execute(dto: CreateRoomDto): Promise<Result<CreateRoomResponseDto, DomainError>> {
    // 1. Create domain entity
    const roomResult = Room.create({
      name: dto.room,
      service: dto.service,
      linkType: dto.linkType,
      autoRecord: dto.autoRecord,
      chatEnabled: dto.chatEnabled,
    });

    if (roomResult.isFailure) {
      return failure(roomResult.error);
    }

    const room = roomResult.value;

    // 2. Create room in LiveKit
    const livekitResult = await this.livekitService.createRoom({
      name: room.name,
      emptyTimeout: 10 * 60,
      maxParticipants: 100,
    });

    if (livekitResult.isFailure) {
      return failure(livekitResult.error);
    }

    // 3. Persist to database
    const savedRoom = await this.roomRepository.create(room);

    // 4. Return response DTO
    return success({
      id: savedRoom.id,
      room: savedRoom.name,
      status: savedRoom.status,
      roomType: savedRoom.roomType,
      autoRecord: savedRoom.autoRecord,
      chatEnabled: savedRoom.chatEnabled,
      dtmCreated: savedRoom.createdAt.toISOString(),
      dtmExpired: savedRoom.expiresAt.toISOString(),
    });
  }
}
```

### 5.3 Value Object Pattern

```typescript
// domain/value-objects/link-id.vo.ts
import { Result, success, failure } from '@/shared/types/result.type';
import { ValidationError } from '@/shared/errors';
import { generateId } from '@/shared/utils/id-generator.util';

export class LinkId {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(value?: string): Result<LinkId, ValidationError> {
    const id = value ?? generateId(6);

    if (!LinkId.isValid(id)) {
      return failure(new ValidationError(
        'Invalid LinkId format',
        { value: id, expectedLength: 6 }
      ));
    }

    return success(new LinkId(id));
  }

  private static isValid(value: string): boolean {
    return typeof value === 'string'
      && value.length === 6
      && /^[a-zA-Z0-9]+$/.test(value);
  }

  equals(other: LinkId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}

// domain/value-objects/position.vo.ts
export class Position {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _accuracy?: number
  ) {}

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  get accuracy(): number | undefined {
    return this._accuracy;
  }

  static create(
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Result<Position, ValidationError> {
    if (!Position.isValidLatitude(latitude)) {
      return failure(new ValidationError(
        'Invalid latitude',
        { value: latitude, range: '-90 to 90' }
      ));
    }

    if (!Position.isValidLongitude(longitude)) {
      return failure(new ValidationError(
        'Invalid longitude',
        { value: longitude, range: '-180 to 180' }
      ));
    }

    return success(new Position(latitude, longitude, accuracy));
  }

  private static isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private static isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  distanceTo(other: Position): number {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this._latitude * Math.PI) / 180;
    const φ2 = (other._latitude * Math.PI) / 180;
    const Δφ = ((other._latitude - this._latitude) * Math.PI) / 180;
    const Δλ = ((other._longitude - this._longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  toJSON(): { latitude: number; longitude: number; accuracy?: number } {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
      accuracy: this._accuracy,
    };
  }
}
```

### 5.4 Entity Pattern

```typescript
// domain/entities/room.entity.ts
import { Result, success, failure } from '@/shared/types/result.type';
import { DomainError } from '@/shared/errors';
import { RoomStatus, RoomType } from '@/shared/constants';
import { generateId } from '@/shared/utils/id-generator.util';

interface RoomProps {
  id?: string;
  name?: string;
  status?: RoomStatus;
  roomType?: RoomType;
  service?: number;
  autoRecord?: boolean;
  chatEnabled?: boolean;
  recordId?: string;
  messageUnread?: number;
  webSocketURL?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

interface CreateRoomProps {
  name?: string;
  service?: number;
  linkType?: string;
  autoRecord?: boolean;
  chatEnabled?: boolean;
  webSocketURL?: string;
  userAgent?: string;
}

export class Room {
  private constructor(private props: RoomProps) {}

  // Getters
  get id(): string {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name!;
  }

  get status(): RoomStatus {
    return this.props.status!;
  }

  get roomType(): RoomType {
    return this.props.roomType!;
  }

  get service(): number {
    return this.props.service!;
  }

  get autoRecord(): boolean {
    return this.props.autoRecord!;
  }

  get chatEnabled(): boolean {
    return this.props.chatEnabled!;
  }

  get recordId(): string | undefined {
    return this.props.recordId;
  }

  get messageUnread(): number {
    return this.props.messageUnread ?? 0;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get expiresAt(): Date {
    return this.props.expiresAt!;
  }

  // Factory method
  static create(props: CreateRoomProps): Result<Room, DomainError> {
    const defaultTimeout = parseInt(process.env.ROOM_DAY_DEFAULT_TIMEOUT || '7');
    const now = new Date();

    const status = props.linkType === 'location' ? RoomStatus.CLOSE : RoomStatus.OPEN;
    const roomType = props.linkType === 'location' ? RoomType.LOCATION : RoomType.CONFERENCE;

    const room = new Room({
      id: undefined, // Will be set by database
      name: props.name ?? generateId(6, 'alphabetic'),
      status,
      roomType,
      service: props.service ?? 999,
      autoRecord: props.autoRecord ?? true,
      chatEnabled: props.chatEnabled ?? true,
      webSocketURL: props.webSocketURL ?? '',
      userAgent: props.userAgent ?? '',
      messageUnread: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + defaultTimeout * 24 * 60 * 60 * 1000),
    });

    return success(room);
  }

  // Reconstitute from database
  static fromPersistence(data: RoomProps): Room {
    return new Room(data);
  }

  // Business methods
  close(): Result<void, DomainError> {
    if (this.props.status === RoomStatus.CLOSE) {
      return failure(new DomainError('ROOM_ALREADY_CLOSED', 'Room is already closed'));
    }

    this.props.status = RoomStatus.CLOSE;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  reopen(): Result<void, DomainError> {
    if (this.isExpired()) {
      return failure(new DomainError('ROOM_EXPIRED', 'Cannot reopen expired room'));
    }

    this.props.status = RoomStatus.OPEN;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt!;
  }

  isOpen(): boolean {
    return this.props.status === RoomStatus.OPEN;
  }

  markMessageAsUnread(): void {
    this.props.messageUnread = 1;
    this.props.updatedAt = new Date();
  }

  clearUnreadMessages(): void {
    this.props.messageUnread = 0;
    this.props.updatedAt = new Date();
  }

  extendExpiry(days: number): Result<void, DomainError> {
    if (days <= 0) {
      return failure(new DomainError('INVALID_DAYS', 'Days must be positive'));
    }

    this.props.expiresAt = new Date(
      this.props.expiresAt!.getTime() + days * 24 * 60 * 60 * 1000
    );
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  // Serialization
  toPersistence(): Record<string, unknown> {
    return {
      id: this.props.id,
      room: this.props.name,
      status: this.props.status,
      roomType: this.props.roomType,
      service: this.props.service,
      autoRecord: this.props.autoRecord ? 1 : 0,
      chatEnabled: this.props.chatEnabled ? 1 : 0,
      recordId: this.props.recordId ?? '',
      messageUnread: this.props.messageUnread,
      webSocketURL: this.props.webSocketURL,
      userAgent: this.props.userAgent,
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
      dtmExpired: this.props.expiresAt,
    };
  }
}
```

### 5.5 DTO with Zod Validation

```typescript
// application/dtos/room/create-room.dto.ts
import { z } from 'zod';
import { LinkType } from '@/shared/constants';

export const CreateRoomDtoSchema = z.object({
  service: z.number().int().positive().default(999),
  room: z.string().min(1).max(50).regex(/^[a-zA-Z0-9]+$/).optional(),
  linkType: z.nativeEnum(LinkType).optional(),
  autoRecord: z.boolean().default(true),
  recordType: z.string().max(50).optional(),
  encodingOptionsPreset: z.string().max(50).optional(),
  chatEnabled: z.boolean().default(true),
  webSocketURL: z.string().url().optional().or(z.literal('')),
  userAgent: z.string().max(500).optional(),
});

export type CreateRoomDto = z.infer<typeof CreateRoomDtoSchema>;

// Response DTO
export interface CreateRoomResponseDto {
  id: number;
  room: string;
  status: string;
  roomType: string;
  autoRecord: boolean;
  chatEnabled: boolean;
  dtmCreated: string;
  dtmExpired: string;
}

// application/dtos/link/create-link.dto.ts
export const CreateLinkDtoSchema = z.object({
  room: z.string().min(1).max(50),
  mobile: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal('')),
  userType: z.enum(['admin', 'user', 'viewer']).default('user'),
  linkType: z.nativeEnum(LinkType).default(LinkType.VIDEO),
  userName: z.string().max(100).optional(),
  isAdmin: z.boolean().default(false),
  requireJoinPermission: z.boolean().default(false),
  requireUserName: z.boolean().default(false),
  password: z.string().max(50).optional(),
  oneTimeLink: z.boolean().default(false),
  dtmExpired: z.string().datetime().optional(),
});

export type CreateLinkDto = z.infer<typeof CreateLinkDtoSchema>;
```

### 5.6 Dependency Injection Setup

```typescript
// container/types.ts
export const INJECTION_TOKENS = {
  // Repositories
  RoomRepository: Symbol.for('RoomRepository'),
  UserRepository: Symbol.for('UserRepository'),
  LinkRepository: Symbol.for('LinkRepository'),
  MessageRepository: Symbol.for('MessageRepository'),
  CaseRepository: Symbol.for('CaseRepository'),
  ServiceRepository: Symbol.for('ServiceRepository'),

  // External Services
  LivekitService: Symbol.for('LivekitService'),
  SmsService: Symbol.for('SmsService'),
  NotificationService: Symbol.for('NotificationService'),

  // Use Cases - Room
  CreateRoomUseCase: Symbol.for('CreateRoomUseCase'),
  CloseRoomUseCase: Symbol.for('CloseRoomUseCase'),
  GetRoomDetailUseCase: Symbol.for('GetRoomDetailUseCase'),

  // Use Cases - User
  GenerateUserTokenUseCase: Symbol.for('GenerateUserTokenUseCase'),
  JoinConferenceUseCase: Symbol.for('JoinConferenceUseCase'),

  // Use Cases - Link
  CreateLinkUseCase: Symbol.for('CreateLinkUseCase'),
  GetLinkDetailUseCase: Symbol.for('GetLinkDetailUseCase'),

  // Infrastructure
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  Logger: Symbol.for('Logger'),
  EventEmitter: Symbol.for('EventEmitter'),
} as const;

// container/index.ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import { INJECTION_TOKENS } from './types';

// Register repositories
import { MySqlRoomRepository } from '@/infrastructure/database/mysql/repositories';
container.register(INJECTION_TOKENS.RoomRepository, { useClass: MySqlRoomRepository });

// Register external services
import { LivekitAdapter } from '@/infrastructure/external/livekit/livekit.adapter';
container.register(INJECTION_TOKENS.LivekitService, { useClass: LivekitAdapter });

// Register use cases
import { CreateRoomUseCase } from '@/application/use-cases/room';
container.register(INJECTION_TOKENS.CreateRoomUseCase, { useClass: CreateRoomUseCase });

export { container };
```

---

## 6. Migration Phases

### Phase 1: Foundation Setup (Week 1-2)

#### Tasks
- [ ] Initialize TypeScript configuration
- [ ] Setup project structure
- [ ] Create shared types and interfaces
- [ ] Setup dependency injection (tsyringe)
- [ ] Create base classes (Result, AppError)
- [ ] Setup linting and formatting
- [ ] Create environment validation

#### Files to Create
```
tsconfig.json
src/shared/types/*.ts
src/shared/errors/*.ts
src/shared/constants/*.ts
src/shared/utils/*.ts
src/config/*.ts
src/container/*.ts
```

#### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@presentation/*": ["./src/presentation/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

### Phase 2: Domain Layer (Week 3-4) ✅ COMPLETED

#### Tasks
- [x] Create Room entity
- [x] Create User entity
- [x] Create Link entity
- [x] Create Message entity
- [x] Create Case entity
- [x] Create Service entity
- [x] Create Value Objects (LinkId, Position, etc.)
- [x] Create Repository interfaces
- [x] Create Domain services
- [ ] Write unit tests for domain (Ready for implementation)

#### Priority Order
1. ✅ Value Objects (foundation for entities)
2. ✅ Room Entity (core aggregate)
3. ✅ User Entity
4. ✅ Link Entity
5. ✅ Message Entity
6. ✅ Repository Interfaces
7. ✅ Domain Services

#### Completion Summary
- **Status**: ✅ COMPLETED
- **Date**: December 10, 2024
- **Files Created**: 36 files
- **Lines of Code**: ~2,500 lines
- **Documentation**: See `PHASE2-COMPLETE.md` for details

---

### Phase 3: Infrastructure Layer (Week 5-6) ✅ COMPLETED

#### Tasks
- [x] Create MySQL connection manager
- [x] Create base repository class
- [x] Implement MySqlRoomRepository
- [x] Implement MySqlUserRepository
- [x] Implement MySqlLinkRepository
- [x] Implement MySqlMessageRepository
- [x] Implement MySqlCaseRepository
- [x] Implement MySqlServiceRepository
- [x] Create LiveKit adapter
- [x] Create SMS adapter
- [ ] Create migration system (Optional)
- [ ] Write integration tests (Ready for implementation)

#### Completion Summary
- **Status**: ✅ COMPLETED
- **Date**: December 10, 2024
- **Files Created**: 18 files
- **Lines of Code**: ~3,500 lines
- **Documentation**: See `PHASE3-COMPLETE.md` for details

#### SQL Injection Fix - Query Builder
```typescript
// infrastructure/database/mysql/query-builder.ts
import mysql from 'mysql2/promise';

export class QueryBuilder {
  private query: string = '';
  private params: unknown[] = [];

  select(columns: string[] = ['*']): this {
    this.query = `SELECT ${columns.join(', ')}`;
    return this;
  }

  from(table: string): this {
    this.query += ` FROM ${this.escapeIdentifier(table)}`;
    return this;
  }

  where(conditions: Record<string, unknown>): this {
    const clauses = Object.entries(conditions).map(([key, value]) => {
      this.params.push(value);
      return `${this.escapeIdentifier(key)} = ?`;
    });

    if (clauses.length > 0) {
      this.query += ` WHERE ${clauses.join(' AND ')}`;
    }
    return this;
  }

  insert(table: string, data: Record<string, unknown>): this {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    this.params = Object.values(data);

    this.query = `INSERT INTO ${this.escapeIdentifier(table)} (${columns.map(c => this.escapeIdentifier(c)).join(', ')}) VALUES (${placeholders})`;
    return this;
  }

  update(table: string, data: Record<string, unknown>): this {
    const setClauses = Object.entries(data).map(([key, value]) => {
      this.params.push(value);
      return `${this.escapeIdentifier(key)} = ?`;
    });

    this.query = `UPDATE ${this.escapeIdentifier(table)} SET ${setClauses.join(', ')}`;
    return this;
  }

  private escapeIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  build(): { query: string; params: unknown[] } {
    return { query: this.query, params: this.params };
  }
}
```

---

### Phase 4: Application Layer (Week 7-8) ✅ COMPLETED

#### Tasks
- [x] Create DTOs with Zod schemas (6 categories: Room, User, Link, Chat, Auth, Record)
- [x] Implement Room use cases (6 use cases)
- [x] Implement User use cases (5 use cases)
- [x] Implement Link use cases (6 use cases)
- [x] Implement Chat use cases (4 use cases)
- [x] Implement Auth use cases (3 use cases)
- [x] Implement Record use cases (4 use cases)
- [x] Create Application Services (6 services)
- [ ] Write unit tests for use cases (Ready for implementation)

#### Completion Summary
- **Status**: ✅ COMPLETED
- **Date**: December 10, 2024
- **Files Created**: 48 files
- **Lines of Code**: ~5,000 lines
- **Documentation**: See `PHASE4-COMPLETE.md` for details
- **DTOs**: 6 categories with Zod validation
- **Use Cases**: 28 use cases total
- **Services**: 6 application services

---

### Phase 5: Presentation Layer (Week 9-10)

#### Tasks
- [ ] Create base controller
- [ ] Implement HTTP controllers
- [ ] Create routes
- [ ] Implement middlewares
- [ ] Migrate Socket.IO handlers
- [ ] Create socket namespaces
- [ ] Write E2E tests

#### Middleware Implementation
```typescript
// presentation/http/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/shared/errors';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// presentation/http/middlewares/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors';
import { errorResponse } from '@/shared/types/api-response.type';
import { logger } from '@/shared/utils/logger.util';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error caught by handler:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      errorResponse({
        code: error.code,
        message: error.message,
        details: error.details,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    );
  }

  // Unknown errors
  return res.status(500).json(
    errorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  );
};
```

---

### Phase 6: Integration & Cleanup (Week 11-12)

#### Tasks
- [ ] Integrate all layers
- [ ] Remove old JavaScript files
- [ ] Update package.json scripts
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Final testing
- [ ] Deployment preparation

---

## 7. Implementation Details

### 7.1 Database Connection

```typescript
// infrastructure/database/mysql/connection.ts
import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { logger } from '@/shared/utils/logger.util';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    const config: PoolOptions = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      charset: 'utf8mb4',
      connectionLimit: 20,
      waitForConnections: true,
      queueLimit: 0,
    };

    this.pool = mysql.createPool(config);
    this.setupEventHandlers();
    this.startKeepAlive();
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  getPool(): Pool {
    return this.pool;
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private setupEventHandlers(): void {
    this.pool.on('connection', (connection) => {
      logger.debug(`Database connected: threadId ${connection.threadId}`);
    });

    this.pool.on('error', (error) => {
      logger.error('Database pool error:', error);
    });
  }

  private startKeepAlive(): void {
    setInterval(async () => {
      try {
        await this.pool.execute('SELECT 1');
      } catch (error) {
        logger.error('Database keep-alive failed:', error);
      }
    }, 30000);
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}

export const db = DatabaseConnection.getInstance();
```

### 7.2 Repository Implementation

```typescript
// infrastructure/database/mysql/repositories/mysql-room.repository.ts
import { injectable } from 'tsyringe';
import { IRoomRepository } from '@/domain/repositories/room.repository.interface';
import { Room } from '@/domain/entities/room.entity';
import { RoomStatus } from '@/shared/constants';
import { PaginatedResult, PaginationParams, createPaginatedResult } from '@/shared/types';
import { db } from '../connection';

interface RoomRow {
  id: number;
  room: string;
  status: string;
  roomType: string;
  service: number;
  autoRecord: number;
  chatEnabled: number;
  recordId: string;
  messageUnread: number;
  webSocketURL: string;
  userAgent: string;
  dtmCreated: Date;
  dtmUpdated: Date;
  dtmExpired: Date;
}

@injectable()
export class MySqlRoomRepository implements IRoomRepository {

  async findById(id: string): Promise<Room | null> {
    const sql = `
      SELECT id, room, status, roomType, service, autoRecord, chatEnabled,
             recordId, messageUnread, webSocketURL, userAgent,
             dtmCreated, dtmUpdated, dtmExpired
      FROM room_conference
      WHERE id = ?
      LIMIT 1
    `;

    const rows = await db.query<RoomRow[]>(sql, [id]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapToEntity(rows[0]);
  }

  async findByName(name: string): Promise<Room | null> {
    const sql = `
      SELECT id, room, status, roomType, service, autoRecord, chatEnabled,
             recordId, messageUnread, webSocketURL, userAgent,
             dtmCreated, dtmUpdated, dtmExpired
      FROM room_conference
      WHERE room = ?
      LIMIT 1
    `;

    const rows = await db.query<RoomRow[]>(sql, [name]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapToEntity(rows[0]);
  }

  async findByStatus(status: RoomStatus): Promise<Room[]> {
    const sql = `
      SELECT id, room, status, roomType, service, autoRecord, chatEnabled,
             recordId, messageUnread, webSocketURL, userAgent,
             dtmCreated, dtmUpdated, dtmExpired
      FROM room_conference
      WHERE status = ?
    `;

    const rows = await db.query<RoomRow[]>(sql, [status]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Room>> {
    const offset = (params.page - 1) * params.limit;
    const sortBy = params.sortBy || 'dtmCreated';
    const sortOrder = params.sortOrder || 'DESC';

    const countSql = 'SELECT COUNT(*) as total FROM room_conference';
    const dataSql = `
      SELECT id, room, status, roomType, service, autoRecord, chatEnabled,
             recordId, messageUnread, webSocketURL, userAgent,
             dtmCreated, dtmUpdated, dtmExpired
      FROM room_conference
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [countResult, rows] = await Promise.all([
      db.query<[{ total: number }]>(countSql),
      db.query<RoomRow[]>(dataSql, [params.limit, offset]),
    ]);

    const rooms = rows.map(row => this.mapToEntity(row));
    return createPaginatedResult(rooms, countResult[0].total, params);
  }

  async findExpired(): Promise<Room[]> {
    const sql = `
      SELECT id, room, status, roomType, service, autoRecord, chatEnabled,
             recordId, messageUnread, webSocketURL, userAgent,
             dtmCreated, dtmUpdated, dtmExpired
      FROM room_conference
      WHERE status = 'open' AND dtmExpired < NOW()
    `;

    const rows = await db.query<RoomRow[]>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  async create(room: Room): Promise<Room> {
    const data = room.toPersistence();

    const sql = `
      INSERT INTO room_conference (
        room, status, roomType, service, autoRecord, chatEnabled,
        recordId, messageUnread, webSocketURL, userAgent,
        dtmCreated, dtmUpdated, dtmExpired
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query<{ insertId: number }>(sql, [
      data.room,
      data.status,
      data.roomType,
      data.service,
      data.autoRecord,
      data.chatEnabled,
      data.recordId,
      data.messageUnread,
      data.webSocketURL,
      data.userAgent,
      data.dtmCreated,
      data.dtmUpdated,
      data.dtmExpired,
    ]);

    return this.findById(result.insertId.toString()) as Promise<Room>;
  }

  async update(room: Room): Promise<Room> {
    const data = room.toPersistence();

    const sql = `
      UPDATE room_conference SET
        status = ?,
        roomType = ?,
        autoRecord = ?,
        chatEnabled = ?,
        recordId = ?,
        messageUnread = ?,
        webSocketURL = ?,
        userAgent = ?,
        dtmUpdated = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      data.status,
      data.roomType,
      data.autoRecord,
      data.chatEnabled,
      data.recordId,
      data.messageUnread,
      data.webSocketURL,
      data.userAgent,
      new Date(),
      data.id,
    ]);

    return room;
  }

  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM room_conference WHERE id = ?';
    await db.query(sql, [id]);
  }

  async updateStatus(id: string, status: RoomStatus): Promise<void> {
    const sql = `
      UPDATE room_conference
      SET status = ?, dtmUpdated = NOW()
      WHERE id = ?
    `;
    await db.query(sql, [status, id]);
  }

  async updateExpiry(id: string, expiryDate: Date): Promise<void> {
    const sql = `
      UPDATE room_conference
      SET dtmExpired = ?, dtmUpdated = NOW()
      WHERE id = ?
    `;
    await db.query(sql, [expiryDate, id]);
  }

  async countByStatus(status: RoomStatus): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM room_conference WHERE status = ?';
    const result = await db.query<[{ count: number }]>(sql, [status]);
    return result[0].count;
  }

  private mapToEntity(row: RoomRow): Room {
    return Room.fromPersistence({
      id: row.id.toString(),
      name: row.room,
      status: row.status as RoomStatus,
      roomType: row.roomType as RoomType,
      service: row.service,
      autoRecord: row.autoRecord === 1,
      chatEnabled: row.chatEnabled === 1,
      recordId: row.recordId,
      messageUnread: row.messageUnread,
      webSocketURL: row.webSocketURL,
      userAgent: row.userAgent,
      createdAt: row.dtmCreated,
      updatedAt: row.dtmUpdated,
      expiresAt: row.dtmExpired,
    });
  }
}
```

### 7.3 Controller Implementation

```typescript
// presentation/http/controllers/room.controller.ts
import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { INJECTION_TOKENS } from '@/container/types';
import { ICreateRoomUseCase } from '@/application/use-cases/room/create-room.use-case';
import { IGetRoomDetailUseCase } from '@/application/use-cases/room/get-room-detail.use-case';
import { ICloseRoomUseCase } from '@/application/use-cases/room/close-room.use-case';
import { successResponse, errorResponse } from '@/shared/types/api-response.type';
import { NotFoundError } from '@/shared/errors';

@injectable()
export class RoomController {
  constructor(
    @inject(INJECTION_TOKENS.CreateRoomUseCase)
    private readonly createRoomUseCase: ICreateRoomUseCase,

    @inject(INJECTION_TOKENS.GetRoomDetailUseCase)
    private readonly getRoomDetailUseCase: IGetRoomDetailUseCase,

    @inject(INJECTION_TOKENS.CloseRoomUseCase)
    private readonly closeRoomUseCase: ICloseRoomUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.createRoomUseCase.execute(req.body);

      if (result.isFailure) {
        return next(result.error);
      }

      res.status(201).json(successResponse(result.value));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { room } = req.query;

      const result = await this.getRoomDetailUseCase.execute({
        roomName: room as string,
      });

      if (result.isFailure) {
        return next(result.error);
      }

      if (!result.value) {
        return next(new NotFoundError('Room', room as string));
      }

      res.json(successResponse(result.value));
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { room } = req.body;

      const result = await this.closeRoomUseCase.execute({ roomName: room });

      if (result.isFailure) {
        return next(result.error);
      }

      res.json(successResponse({ room, status: 'closed' }));
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/unit/domain/entities/room.entity.test.ts
import { describe, it, expect } from 'vitest';
import { Room } from '@/domain/entities/room.entity';
import { RoomStatus, RoomType } from '@/shared/constants';

describe('Room Entity', () => {
  describe('create', () => {
    it('should create a room with default values', () => {
      const result = Room.create({});

      expect(result.isSuccess).toBe(true);

      const room = result.value;
      expect(room.name).toBeDefined();
      expect(room.status).toBe(RoomStatus.OPEN);
      expect(room.roomType).toBe(RoomType.CONFERENCE);
      expect(room.service).toBe(999);
      expect(room.autoRecord).toBe(true);
      expect(room.chatEnabled).toBe(true);
    });

    it('should create a location room when linkType is location', () => {
      const result = Room.create({ linkType: 'location' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(RoomStatus.CLOSE);
      expect(result.value.roomType).toBe(RoomType.LOCATION);
    });
  });

  describe('close', () => {
    it('should close an open room', () => {
      const createResult = Room.create({});
      const room = createResult.value;

      const closeResult = room.close();

      expect(closeResult.isSuccess).toBe(true);
      expect(room.status).toBe(RoomStatus.CLOSE);
    });

    it('should fail when closing already closed room', () => {
      const createResult = Room.create({ linkType: 'location' });
      const room = createResult.value;

      const closeResult = room.close();

      expect(closeResult.isFailure).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired room', () => {
      const result = Room.create({});
      expect(result.value.isExpired()).toBe(false);
    });
  });
});

// tests/unit/application/use-cases/create-room.use-case.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRoomUseCase } from '@/application/use-cases/room/create-room.use-case';
import { success } from '@/shared/types/result.type';

describe('CreateRoomUseCase', () => {
  let useCase: CreateRoomUseCase;
  let mockRoomRepository: any;
  let mockLivekitService: any;

  beforeEach(() => {
    mockRoomRepository = {
      create: vi.fn(),
    };

    mockLivekitService = {
      createRoom: vi.fn().mockResolvedValue(success({})),
    };

    useCase = new CreateRoomUseCase(mockRoomRepository, mockLivekitService);
  });

  it('should create a room successfully', async () => {
    const mockRoom = {
      id: '1',
      name: 'ABCDEF',
      status: 'open',
    };

    mockRoomRepository.create.mockResolvedValue(mockRoom);

    const result = await useCase.execute({
      service: 999,
      autoRecord: true,
      chatEnabled: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockLivekitService.createRoom).toHaveBeenCalled();
    expect(mockRoomRepository.create).toHaveBeenCalled();
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/integration/repositories/mysql-room.repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MySqlRoomRepository } from '@/infrastructure/database/mysql/repositories';
import { Room } from '@/domain/entities/room.entity';
import { RoomStatus } from '@/shared/constants';
import { db } from '@/infrastructure/database/mysql/connection';

describe('MySqlRoomRepository Integration', () => {
  let repository: MySqlRoomRepository;

  beforeAll(async () => {
    // Setup test database connection
    repository = new MySqlRoomRepository();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM room_conference WHERE room LIKE "TEST_%"');
  });

  describe('create', () => {
    it('should persist room to database', async () => {
      const roomResult = Room.create({ name: 'TEST_ROOM1' });
      const room = roomResult.value;

      const created = await repository.create(room);

      expect(created.id).toBeDefined();
      expect(created.name).toBe('TEST_ROOM1');
    });
  });

  describe('findByName', () => {
    it('should find room by name', async () => {
      const roomResult = Room.create({ name: 'TEST_ROOM2' });
      await repository.create(roomResult.value);

      const found = await repository.findByName('TEST_ROOM2');

      expect(found).not.toBeNull();
      expect(found!.name).toBe('TEST_ROOM2');
    });

    it('should return null for non-existent room', async () => {
      const found = await repository.findByName('NON_EXISTENT');
      expect(found).toBeNull();
    });
  });
});
```

### 8.3 E2E Tests

```typescript
// tests/e2e/flows/room-lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '@/server';

describe('Room Lifecycle E2E', () => {
  let request: supertest.SuperTest<supertest.Test>;
  let createdRoomName: string;

  beforeAll(() => {
    request = supertest(app);
  });

  it('should create a new room', async () => {
    const response = await request
      .post('/room/create')
      .send({
        service: 999,
        autoRecord: true,
        chatEnabled: true,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.room).toBeDefined();

    createdRoomName = response.body.data.room;
  });

  it('should get room details', async () => {
    const response = await request
      .get('/room/detail')
      .query({ room: createdRoomName })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.room).toBe(createdRoomName);
    expect(response.body.data.status).toBe('open');
  });

  it('should close the room', async () => {
    const response = await request
      .post('/room/close')
      .send({ room: createdRoomName })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should show room as closed', async () => {
    const response = await request
      .get('/room/detail')
      .query({ room: createdRoomName })
      .expect(200);

    expect(response.body.data.status).toBe('close');
  });
});
```

---

## 9. Dependencies

### 9.1 Production Dependencies

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.8.1",
    "mysql2": "^3.12.0",
    "livekit-server-sdk": "^2.13.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "dayjs": "^1.11.13",
    "zod": "^3.22.4",
    "tsyringe": "^4.8.0",
    "reflect-metadata": "^0.2.1",
    "nanoid": "^5.0.9",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "winston": "^3.17.0",
    "morgan": "^1.10.0",
    "cron": "^3.5.0",
    "sharp": "^0.33.5",
    "ua-parser-js": "^2.0.0"
  }
}
```

### 9.2 Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "tsx": "^4.7.0",
    "tsup": "^8.0.1",
    "vitest": "^1.1.3",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.18.0",
    "@typescript-eslint/parser": "^6.18.0",
    "prettier": "^3.2.2",
    "nodemon": "^3.1.9",
    "tsc-alias": "^1.8.8"
  }
}
```

### 9.3 Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --dts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 10. Checklist

### Phase 1: Foundation ✅ COMPLETED
- [x] Create `tsconfig.json`
- [x] Setup path aliases
- [x] Install TypeScript dependencies (typescript, tsx, tsup, vitest, etc.)
- [x] Install production dependencies (zod, tsyringe, reflect-metadata)
- [x] Create `src/shared/types/common.types.ts`
- [x] Create `src/shared/types/result.type.ts`
- [x] Create `src/shared/types/pagination.type.ts`
- [x] Create `src/shared/types/api-response.type.ts`
- [x] Create `src/shared/types/index.ts`
- [x] Create `src/shared/errors/base.error.ts`
- [x] Create `src/shared/errors/domain.errors.ts`
- [x] Create `src/shared/errors/validation.errors.ts`
- [x] Create `src/shared/errors/http.errors.ts`
- [x] Create `src/shared/errors/index.ts`
- [x] Create `src/shared/constants/user-types.constant.ts`
- [x] Create `src/shared/constants/room-status.constant.ts`
- [x] Create `src/shared/constants/room-types.constant.ts`
- [x] Create `src/shared/constants/link-types.constant.ts`
- [x] Create `src/shared/constants/error-codes.constant.ts`
- [x] Create `src/shared/constants/index.ts`
- [x] Create `src/shared/utils/id-generator.util.ts`
- [x] Create `src/shared/utils/date.util.ts`
- [x] Create `src/shared/utils/crypto.util.ts`
- [x] Create `src/shared/utils/logger.util.ts`
- [x] Create `src/shared/utils/index.ts`
- [x] Create `src/shared/index.ts`
- [x] Create `src/config/env.validation.ts`
- [x] Create `src/config/database.config.ts`
- [x] Create `src/config/livekit.config.ts`
- [x] Create `src/config/socket.config.ts`
- [x] Create `src/config/app.config.ts`
- [x] Create `src/config/index.ts`
- [x] Create `src/container/types.ts`
- [x] Create `src/container/index.ts`
- [x] Update `package.json` scripts (dev, build, test, lint, format)
- [x] Create `PHASE1-COMPLETE.md` documentation

**Phase 1 Completed**: December 10, 2024
**Files Created**: 33 TypeScript files
**Next Phase**: Phase 2 - Domain Layer

### Phase 2: Domain Layer
- [ ] Create `src/domain/value-objects/link-id.vo.ts`
- [ ] Create `src/domain/value-objects/position.vo.ts`
- [ ] Create `src/domain/value-objects/phone-number.vo.ts`
- [ ] Create `src/domain/entities/room.entity.ts`
- [ ] Create `src/domain/entities/user.entity.ts`
- [ ] Create `src/domain/entities/link.entity.ts`
- [ ] Create `src/domain/entities/message.entity.ts`
- [ ] Create `src/domain/repositories/room.repository.interface.ts`
- [ ] Create `src/domain/repositories/user.repository.interface.ts`
- [ ] Create `src/domain/repositories/link.repository.interface.ts`
- [ ] Write unit tests for entities
- [ ] Write unit tests for value objects

### Phase 3: Infrastructure Layer
- [ ] Create `src/infrastructure/database/mysql/connection.ts`
- [ ] Create `src/infrastructure/database/mysql/query-builder.ts`
- [ ] Create `src/infrastructure/database/mysql/base.repository.ts`
- [ ] Create `src/infrastructure/database/mysql/repositories/mysql-room.repository.ts`
- [ ] Create `src/infrastructure/database/mysql/repositories/mysql-user.repository.ts`
- [ ] Create `src/infrastructure/database/mysql/repositories/mysql-link.repository.ts`
- [ ] Create `src/infrastructure/external/livekit/livekit.adapter.ts`
- [ ] Create `src/infrastructure/external/sms/sms.adapter.ts`
- [ ] Write integration tests for repositories

### Phase 4: Application Layer
- [ ] Create DTOs with Zod validation
- [ ] Create `src/application/use-cases/room/create-room.use-case.ts`
- [ ] Create `src/application/use-cases/room/close-room.use-case.ts`
- [ ] Create `src/application/use-cases/room/get-room-detail.use-case.ts`
- [ ] Create `src/application/use-cases/user/generate-user-token.use-case.ts`
- [ ] Create `src/application/use-cases/user/join-conference.use-case.ts`
- [ ] Create `src/application/use-cases/link/create-link.use-case.ts`
- [ ] Create `src/application/use-cases/link/get-link-detail.use-case.ts`
- [ ] Create `src/application/use-cases/auth/create-token.use-case.ts`
- [ ] Create `src/application/use-cases/auth/verify-token.use-case.ts`
- [ ] Write unit tests for use cases

### Phase 5: Presentation Layer
- [ ] Create `src/presentation/http/middlewares/error-handler.middleware.ts`
- [ ] Create `src/presentation/http/middlewares/validation.middleware.ts`
- [ ] Create `src/presentation/http/middlewares/auth.middleware.ts`
- [ ] Create `src/presentation/http/controllers/room.controller.ts`
- [ ] Create `src/presentation/http/controllers/user.controller.ts`
- [ ] Create `src/presentation/http/controllers/link.controller.ts`
- [ ] Create `src/presentation/http/controllers/auth.controller.ts`
- [ ] Create `src/presentation/http/routes/*.ts`
- [ ] Create `src/presentation/websocket/socket.server.ts`
- [ ] Create `src/presentation/websocket/namespaces/*.ts`
- [ ] Create `src/presentation/websocket/handlers/*.ts`
- [ ] Write E2E tests

### Phase 6: Integration & Cleanup
- [ ] Wire up DI container
- [ ] Create `src/index.ts` entry point
- [ ] Create `src/server.ts`
- [ ] Update `package.json`
- [ ] Remove old JavaScript files
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 11. Database Schema Reference

โครงสร้างฐานข้อมูลจริงจากไฟล์ `init.sql` (MySQL 9.4.0)

> ⚠️ **หมายเหตุสำคัญ:**
> - ไฟล์ `init.sql` ใช้เป็น **Reference สำหรับสร้าง Models และ Types** เท่านั้น
> - **ไม่ต้องเขียน Migration** - การเปลี่ยนแปลงฐานข้อมูลจะจัดการแยกต่างหาก
> - **ไม่ต้องเขียน CRUD SQL** (CREATE, DELETE, UPDATE) ในโปรเจคนี้ - ใช้ Repository Pattern สำหรับ Read operations เป็นหลัก
> - เมื่อมีการเปลี่ยนแปลง schema จะอัพเดท `init.sql` โดยตรง

### 11.1 Database Overview

```
Database: conference
Charset: utf8mb4
Collation: utf8mb4_unicode_ci
```

### 11.2 Tables Summary

| Table Name | Description | Primary Key | Key Relationships |
|------------|-------------|-------------|-------------------|
| `room_conference` | ห้องประชุมหลัก | `id` (auto increment) | FK → `node_livekit.id` |
| `room_user` | ผู้ใช้ในห้อง | `id` (auto increment) | — |
| `link_connect` | ลิงก์สำหรับเชื่อมต่อ | `id` (auto increment) | FK → `room_user.id` |
| `chat_message` | ข้อความแชท | `id` (auto increment) | — |
| `case_data` | ข้อมูลเคส | `id` (auto increment) | — |
| `car_track` | ติดตามรถ | `id` (auto increment) | — |
| `record_media` | บันทึกวิดีโอ | `id` (auto increment) | — |
| `files` | ไฟล์แนบ | `id` (auto increment) | — |
| `services` | การตั้งค่าบริการ | `id` (auto increment) | — |
| `color_scheme` | สี | `id` (auto increment) | — |
| `node_livekit` | LiveKit Server Nodes | `id` (auto increment) | — |
| `notification` | การแจ้งเตือน | `notificationId` (auto increment) | — |
| `usage_status_log` | ล็อกสถานะการใช้งาน | `id` (auto increment) | — |
| `data_log` | ล็อกข้อมูลทั่วไป | `id` (auto increment) | — |
| `radio_devices` | อุปกรณ์วิทยุ | `id` (auto increment) | — |
| `radio_locations` | ตำแหน่งวิทยุ | `id` (auto increment) | — |

### 11.3 Core Tables Schema

#### 11.3.1 `room_conference` - ห้องประชุม (Aggregate Root)

```sql
CREATE TABLE IF NOT EXISTS `room_conference` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nodeLivekitId` int DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,            -- 'open' | 'close'
  `roomType` varchar(10) DEFAULT NULL,          -- 'conference' | 'location'
  `room` varchar(50) DEFAULT NULL,               -- Room name/ID
  `service` int DEFAULT NULL,                    -- FK to services
  `recordStatus` int DEFAULT '0',                -- Recording status
  `recordId` varchar(50) DEFAULT NULL,
  `autoRecord` int DEFAULT '0',
  `recordType` varchar(50) DEFAULT NULL,
  `encodingOptionsPreset` varchar(50) DEFAULT NULL,
  `chatEnabled` int DEFAULT '0',
  `messageUnread` int DEFAULT '0',
  `agentSeen` datetime DEFAULT NULL,
  `userAgent` tinytext,
  `webSocketURL` tinytext,
  `dtmCreated` datetime DEFAULT NULL,
  `dtmUpdated` datetime DEFAULT NULL,
  `dtmClosed` datetime DEFAULT NULL,
  `dtmExpired` datetime DEFAULT NULL,
  `dtmRoomStarted` datetime DEFAULT NULL,
  `dtmRoomFinished` datetime DEFAULT NULL,
  `dtmStartRecord` datetime DEFAULT NULL,
  `dtmStopRecord` datetime DEFAULT NULL,
  `sync_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_room_conference_status_dtmexpired` (`status`,`dtmExpired`),
  KEY `idx_room_conference_room` (`room`),
  KEY `idx_room_conference_service` (`service`),
  CONSTRAINT `FK_room_conference_node_livekit` FOREIGN KEY (`nodeLivekitId`) REFERENCES `node_livekit` (`id`)
);
```

**Entity Mapping**: `Room` entity

#### 11.3.2 `room_user` - ผู้ใช้ในห้อง

```sql
CREATE TABLE IF NOT EXISTS `room_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room` varchar(100) DEFAULT NULL,
  `identity` varchar(50) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `userType` varchar(50) DEFAULT NULL,          -- 'admin' | 'user' | 'viewer'
  `status` varchar(11) DEFAULT NULL,
  `socketId` varchar(50) DEFAULT NULL,
  `conference` int DEFAULT '1',
  `cameraMicrophoneStatus` varchar(100) DEFAULT NULL,
  `camera` tinyint(1) DEFAULT '1',
  `microphone` tinyint(1) DEFAULT '1',
  `latitude` varchar(100) DEFAULT NULL,
  `longitude` varchar(100) DEFAULT NULL,
  `accuracy` varchar(100) DEFAULT NULL,
  `userAgent` text,
  `dtmcreated` datetime DEFAULT NULL,
  `dtmupdated` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_room_user_identity` (`identity`),
  KEY `idx_room_user_socketId` (`socketId`)
);
```

**Entity Mapping**: `User` entity

#### 11.3.3 `link_connect` - ลิงก์เชื่อมต่อ

```sql
CREATE TABLE IF NOT EXISTS `link_connect` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `roomUserId` int DEFAULT NULL,
  `sms` int DEFAULT '1',
  `recordId` int DEFAULT NULL,
  `mobile` varchar(20) NOT NULL DEFAULT '',
  `linkID` varchar(50) DEFAULT NULL,             -- 6-character link ID
  `domainIndex` int DEFAULT '0',
  `share` int DEFAULT '0',
  `enabled` int DEFAULT '1',
  `userName` varchar(100) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `userType` varchar(10) DEFAULT NULL,
  `linkType` varchar(100) DEFAULT NULL,          -- 'video' | 'location'
  `crmSender` varchar(100) DEFAULT NULL,
  `accuracy` varchar(50) DEFAULT NULL,
  `latitude` decimal(12,9) DEFAULT NULL,
  `longitude` decimal(12,9) DEFAULT NULL,
  `patientLatitude` decimal(12,9) unsigned DEFAULT NULL,
  `patientLongitude` decimal(12,9) unsigned DEFAULT NULL,
  `patientUpdated` datetime DEFAULT NULL,
  `service` int DEFAULT NULL,
  `errorVideo` text,
  `errorLocation` text,
  `os` text,
  `userAgent` text,
  `requireJoinPermission` int DEFAULT '0',
  `requireUserName` int DEFAULT '0',
  `requirePassword` int DEFAULT '0',
  `oneTimeLink` int DEFAULT '0',
  `password` tinytext,
  `isAdmin` varchar(11) DEFAULT '0',
  `dtmConnection` datetime DEFAULT NULL,
  `dtmDisconnect` datetime DEFAULT NULL,
  `dtmCreated` datetime DEFAULT NULL,
  `dtmExpired` datetime DEFAULT NULL,
  `sync_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_link_connect_expired_enabled` (`dtmExpired`,`enabled`),
  KEY `idx_link_connect_room` (`room`),
  KEY `idx_link_connect_linkID` (`linkID`),
  CONSTRAINT `FK_link_connect_room_user` FOREIGN KEY (`roomUserId`) REFERENCES `room_user` (`id`)
);
```

**Entity Mapping**: `Link` entity

#### 11.3.4 `chat_message` - ข้อความแชท

```sql
CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room` tinytext,
  `identity` varchar(100) DEFAULT NULL,
  `chat_identity` varchar(100) DEFAULT NULL,
  `userName` tinytext,
  `text` text,
  `color` varchar(100) DEFAULT NULL,
  `files` text,                                  -- JSON array of file objects
  `replyToMessageId` int DEFAULT NULL,
  `replyToUserName` tinytext,
  `replyToText` tinytext,
  `dtmCreated` datetime DEFAULT NULL,
  `userType` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `Message` entity

### 11.4 Supporting Tables Schema

#### 11.4.1 `services` - การตั้งค่าบริการ

```sql
CREATE TABLE IF NOT EXISTS `services` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `webTitle` varchar(100) DEFAULT NULL,
  `prefixHLSRecordVideoSMS` varchar(50) DEFAULT NULL,
  `prefixTextVideoSMS` varchar(50) DEFAULT NULL,
  `prefixTextLocationSMS` varchar(50) DEFAULT NULL,
  `domainsVideo` text,                           -- JSON array
  `domainsLocation` text,                        -- JSON array
  `smsSenderName` text,
  `logo` varchar(200) DEFAULT NULL,
  `titleColor` varchar(100) DEFAULT NULL,
  `latitude` decimal(12,9) DEFAULT NULL,
  `longitude` decimal(12,9) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `Service` entity

#### 11.4.2 `case_data` - ข้อมูลเคส

```sql
CREATE TABLE IF NOT EXISTS `case_data` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `caseId` int NOT NULL,
  `service` int DEFAULT NULL,
  `roomId` int DEFAULT NULL,
  `operationNumber` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `hn` varchar(50) DEFAULT NULL,
  `patientMobile` varchar(20) DEFAULT NULL,
  `mobileCreated` varchar(50) DEFAULT NULL,
  `caseType` varchar(50) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `dtmCreated` datetime DEFAULT NULL,
  `organization` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `Case` entity

#### 11.4.3 `record_media` - บันทึกวิดีโอ

```sql
CREATE TABLE IF NOT EXISTS `record_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `egressId` varchar(50) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `filePath` varchar(500) DEFAULT NULL,
  `fileSize` int DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `recordType` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'completed',
  `dtmCreated` datetime DEFAULT NULL,
  `dtmCompleted` datetime DEFAULT NULL,
  `hls` varchar(100) DEFAULT NULL,
  `encode` int DEFAULT NULL,                     -- 0=EncodeRo, 1=EncodeComplete, 2=EncodeFailed, 3=PackFile
  `uploader` varchar(100) DEFAULT NULL,
  `startRecord` datetime DEFAULT NULL,
  `endRecord` datetime DEFAULT NULL,
  `dtmUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `RecordMedia` entity

#### 11.4.4 `files` - ไฟล์แนบ

```sql
CREATE TABLE IF NOT EXISTS `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `linkId` text,
  `elementId` varchar(50) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `url` varchar(512) NOT NULL,
  `thumbnail` varchar(512) DEFAULT NULL,
  `fileType` varchar(50) DEFAULT NULL,
  `size` bigint NOT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT (now()),
  `updatedAt` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `File` entity

#### 11.4.5 `car_track` - ติดตามรถ

```sql
CREATE TABLE IF NOT EXISTS `car_track` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(10) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open',
  `mobile` varchar(20) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `latitude` decimal(12,9) DEFAULT NULL,
  `longitude` decimal(12,9) DEFAULT NULL,
  `accuracy` decimal(20,6) DEFAULT NULL,
  `speed` int DEFAULT NULL,
  `heading` int DEFAULT NULL,
  `altitude` float DEFAULT NULL,
  `altitudeAccuracy` float DEFAULT NULL,
  `dtmUpdated` datetime DEFAULT (now()),
  `dtmCreated` datetime DEFAULT (now()),
  `dtmStarted` datetime DEFAULT NULL,
  `dtmArrived` datetime DEFAULT NULL,
  `dtmCanceled` datetime DEFAULT NULL,
  `dtmCompleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room` (`room`)
);
```

**Entity Mapping**: `CarTrack` entity

### 11.5 Configuration Tables

#### 11.5.1 `node_livekit` - LiveKit Server Configuration

```sql
CREATE TABLE IF NOT EXISTS `node_livekit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nodeName` varchar(50) DEFAULT NULL,
  `livekitHost` varchar(100) DEFAULT NULL,
  `livekitLocal` varchar(100) DEFAULT NULL,
  `livekitApiKey` varchar(100) DEFAULT NULL,
  `livekitApiSecret` varchar(100) DEFAULT NULL,
  `lastHealthCheck` datetime DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`)
);
```

**Entity Mapping**: `NodeLivekit` entity

#### 11.5.2 `color_scheme` - Color Configuration

```sql
CREATE TABLE IF NOT EXISTS `color_scheme` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `color_hex` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### 11.6 Logging Tables

#### 11.6.1 `notification` - การแจ้งเตือน

```sql
CREATE TABLE IF NOT EXISTS `notification` (
  `notificationId` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `message` varchar(500) DEFAULT NULL,
  `caseId` int DEFAULT NULL,
  `read` tinyint NOT NULL DEFAULT '0',
  `notificationType` varchar(50) DEFAULT NULL,
  `relatedUrl` varchar(500) DEFAULT NULL,
  `dtmRead` datetime DEFAULT NULL,
  `dtmCreated` datetime NOT NULL DEFAULT (now()),
  PRIMARY KEY (`notificationId`)
);
```

#### 11.6.2 `usage_status_log` - สถานะการใช้งาน

```sql
CREATE TABLE IF NOT EXISTS `usage_status_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `linkID` varchar(100) DEFAULT '',
  `room` varchar(100) DEFAULT '',
  `mobile` varchar(100) DEFAULT NULL,
  `linkType` varchar(100) DEFAULT NULL,
  `latitude` decimal(12,9) DEFAULT NULL,
  `longitude` decimal(12,9) DEFAULT NULL,
  `identity` varchar(100) DEFAULT '',
  `userName` text,
  `userType` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `userAgent` text,
  `data` mediumtext,
  `dtmCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_usage_status_log_linkid` (`linkID`),
  KEY `idx_usage_status_log_room` (`room`)
);
```

#### 11.6.3 `data_log` - ล็อกข้อมูลทั่วไป

```sql
CREATE TABLE IF NOT EXISTS `data_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data` text,
  `dtmCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### 11.7 Radio Module Tables

#### 11.7.1 `radio_devices`

```sql
CREATE TABLE IF NOT EXISTS `radio_devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deviceId` varchar(100) DEFAULT NULL,
  `deviceName` varchar(200) DEFAULT NULL,
  `deviceType` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `locationId` int DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `radioNo` varchar(50) DEFAULT NULL,
  `radioName` varchar(50) DEFAULT NULL,
  `serialNo` varchar(50) DEFAULT NULL,
  `channel` varchar(50) DEFAULT NULL,
  `dtmCreated` datetime DEFAULT NULL,
  `dtmUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

#### 11.7.2 `radio_locations`

```sql
CREATE TABLE IF NOT EXISTS `radio_locations` (
  `logId` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `locationName` varchar(200) DEFAULT NULL,
  `latitude` decimal(12,9) DEFAULT NULL,
  `longitude` decimal(12,9) DEFAULT NULL,
  `address` text,
  `description` text,
  `status` varchar(20) DEFAULT 'active',
  `dtmCreated` datetime DEFAULT NULL,
  `dtmUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### 11.8 Database Indexes

| Table | Index Name | Columns | Type |
|-------|-----------|---------|------|
| `room_conference` | `idx_room_conference_status_dtmexpired` | `status`, `dtmExpired` | INDEX |
| `room_conference` | `idx_room_conference_room` | `room` | INDEX |
| `room_conference` | `idx_room_conference_service` | `service` | INDEX |
| `room_user` | `idx_room_user_identity` | `identity` | INDEX |
| `room_user` | `idx_room_user_socketId` | `socketId` | INDEX |
| `link_connect` | `idx_link_connect_expired_enabled` | `dtmExpired`, `enabled` | INDEX |
| `link_connect` | `idx_link_connect_room` | `room` | INDEX |
| `link_connect` | `idx_link_connect_linkID` | `linkID` | INDEX |
| `usage_status_log` | `idx_usage_status_log_linkid` | `linkID` | INDEX |
| `usage_status_log` | `idx_usage_status_log_room` | `room` | INDEX |
| `car_track` | `room` | `room` | INDEX |

### 11.9 Foreign Key Relationships

```
room_conference.nodeLivekitId → node_livekit.id
link_connect.roomUserId → room_user.id
```

### 11.10 Entity to Table Mapping

| Domain Entity | Database Table | Repository Interface |
|--------------|----------------|----------------------|
| `Room` | `room_conference` | `IRoomRepository` |
| `User` | `room_user` | `IUserRepository` |
| `Link` | `link_connect` | `ILinkRepository` |
| `Message` | `chat_message` | `IMessageRepository` |
| `Case` | `case_data` | `ICaseRepository` |
| `Service` | `services` | `IServiceRepository` |
| `File` | `files` | `IFileRepository` |
| `RecordMedia` | `record_media` | `IRecordMediaRepository` |
| `CarTrack` | `car_track` | `ICarTrackRepository` |
| `NodeLivekit` | `node_livekit` | `INodeLivekitRepository` |
| `Notification` | `notification` | `INotificationRepository` |

---

## Notes

### Critical Security Fixes (Priority)

1. **SQL Injection** - Replace all string interpolation with parameterized queries
2. **Input Validation** - Add Zod schemas to all endpoints
3. **Error Messages** - Don't expose internal errors to clients
4. **Password Hashing** - Use bcrypt instead of MD5

### Performance Considerations

1. Add database connection pooling (already exists)
2. Implement Redis caching for frequently accessed data
3. Add rate limiting middleware
4. Use database indexes for common queries

### Monitoring

1. Add request/response logging
2. Add error tracking (Sentry or similar)
3. Add health check endpoints
4. Add metrics collection (Prometheus)

---

*Last Updated: 2024*
*Version: 1.0.0*
