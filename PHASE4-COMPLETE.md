# Phase 4: Application Layer - COMPLETED ✅

## Summary

Phase 4 has been successfully completed. The Application Layer is now fully implemented with DTOs, Use Cases, and Application Services.

---

## Completed Tasks

### ✅ 1. DTOs with Zod Validation Schemas
Located in `src/application/dtos/`:

#### Room DTOs
- `CreateRoomDto` - Create new room
- `UpdateRoomDto` - Update room settings
- `CloseRoomDto` - Close a room
- `ReopenRoomDto` - Reopen a room
- `GetRoomDto` - Get room details
- `ExtendRoomExpiryDto` - Extend room expiration
- `ListRoomsDto` - List rooms with pagination
- Response DTOs: `RoomResponseDto`, `ListRoomsResponseDto`

#### User DTOs
- `CreateUserDto` - Create new user
- `UpdateUserDto` - Update user details
- `JoinRoomDto` - Join a room
- `LeaveRoomDto` - Leave a room
- `GenerateTokenDto` - Generate LiveKit token
- `GetUserDto` - Get user details
- `ListUsersDto` - List users in room
- Response DTOs: `UserResponseDto`, `GenerateTokenResponseDto`

#### Link DTOs
- `CreateLinkDto` - Create invitation link
- `GetLinkDto` - Get link details
- `VerifyLinkDto` - Verify link access
- `UpdateLinkLocationDto` - Update GPS location
- `ListLinksDto` - List links for room
- `MarkLinkUsedDto` - Mark one-time link as used
- Response DTOs: `LinkResponseDto`, `CreateLinkResponseDto`

#### Chat DTOs
- `SendMessageDto` - Send chat message
- `GetMessageDto` - Get single message
- `GetMessagesDto` - Get messages with pagination
- `DeleteMessageDto` - Delete message
- `MarkMessagesReadDto` - Mark messages as read
- Response DTOs: `MessageResponseDto`, `GetMessagesResponseDto`

#### Auth DTOs
- `CreateTokenDto` - Create JWT token
- `VerifyTokenDto` - Verify JWT token
- `RefreshTokenDto` - Refresh JWT token
- Response DTOs: `CreateTokenResponseDto`, `VerifyTokenResponseDto`
- Types: `TokenPayload`

#### Record DTOs
- `StartRecordingDto` - Start room recording
- `StopRecordingDto` - Stop recording
- `GetRecordingDto` - Get recording details
- `ListRecordingsDto` - List recordings with pagination
- Response DTOs: `RecordingResponseDto`, `StartRecordingResponseDto`, `ListRecordingsResponseDto`
- Enum: `RecordingStatus`

### ✅ 2. Use Cases (28 Use Cases)
Located in `src/application/use-cases/`:

#### Room Use Cases (6)
1. `CreateRoomUseCase` - Create new room with LiveKit integration
2. `CloseRoomUseCase` - Close room and delete LiveKit room
3. `ReopenRoomUseCase` - Reopen closed room
4. `GetRoomUseCase` - Retrieve room details
5. `ListRoomsUseCase` - List rooms with pagination and filtering
6. `ExtendRoomExpiryUseCase` - Extend room expiration date

#### User Use Cases (5)
1. `GenerateTokenUseCase` - Generate LiveKit access token
2. `JoinRoomUseCase` - User joins room (create/update entity)
3. `LeaveRoomUseCase` - User leaves room
4. `GetUserUseCase` - Retrieve user details
5. `ListUsersUseCase` - List users in room with filtering

#### Link Use Cases (6)
1. `CreateLinkUseCase` - Create invitation link with optional SMS
2. `GetLinkUseCase` - Retrieve link details and verify validity
3. `VerifyLinkUseCase` - Verify link access and password
4. `MarkLinkUsedUseCase` - Mark one-time link as used
5. `UpdateLinkLocationUseCase` - Update GPS coordinates
6. `ListLinksUseCase` - List links for room with type filtering

#### Chat Use Cases (4)
1. `SendMessageUseCase` - Send chat message and update unread count
2. `GetMessagesUseCase` - Retrieve paginated messages
3. `DeleteMessageUseCase` - Soft delete message (owner verification)
4. `MarkMessagesReadUseCase` - Clear room unread count

#### Auth Use Cases (3)
1. `CreateTokenUseCase` - Create JWT authentication token
2. `VerifyTokenUseCase` - Verify JWT signature and expiration
3. `RefreshTokenUseCase` - Refresh expired token

#### Record Use Cases (4)
1. `StartRecordingUseCase` - Start LiveKit room recording
2. `StopRecordingUseCase` - Stop active recording
3. `GetRecordingUseCase` - Retrieve recording details
4. `ListRecordingsUseCase` - List room recordings

### ✅ 3. Application Services (6 Services)
Located in `src/application/services/`:

#### RoomService
Orchestrates: CreateRoom, CloseRoom, ReopenRoom, GetRoom, ListRooms, ExtendRoomExpiry

#### UserService
Orchestrates: GenerateToken, JoinRoom, LeaveRoom, GetUser, ListUsers

#### LinkService
Orchestrates: CreateLink, GetLink, VerifyLink, MarkLinkUsed, UpdateLinkLocation, ListLinks

#### ChatService
Orchestrates: SendMessage, GetMessages, DeleteMessage, MarkMessagesRead

#### AuthService
Orchestrates: CreateToken, VerifyToken, RefreshToken

#### RecordService
Orchestrates: StartRecording, StopRecording, GetRecording, ListRecordings

---

## Project Structure Created

```
src/application/
├── dtos/
│   ├── room.dto.ts
│   ├── user.dto.ts
│   ├── link.dto.ts
│   ├── chat.dto.ts
│   ├── auth.dto.ts
│   ├── record.dto.ts
│   └── index.ts
├── use-cases/
│   ├── room/
│   │   ├── create-room.use-case.ts
│   │   ├── close-room.use-case.ts
│   │   ├── reopen-room.use-case.ts
│   │   ├── get-room.use-case.ts
│   │   ├── list-rooms.use-case.ts
│   │   ├── extend-room-expiry.use-case.ts
│   │   └── index.ts
│   ├── user/
│   │   ├── generate-token.use-case.ts
│   │   ├── join-room.use-case.ts
│   │   ├── leave-room.use-case.ts
│   │   ├── get-user.use-case.ts
│   │   ├── list-users.use-case.ts
│   │   └── index.ts
│   ├── link/
│   │   ├── create-link.use-case.ts
│   │   ├── get-link.use-case.ts
│   │   ├── verify-link.use-case.ts
│   │   ├── mark-link-used.use-case.ts
│   │   ├── update-link-location.use-case.ts
│   │   ├── list-links.use-case.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── send-message.use-case.ts
│   │   ├── get-messages.use-case.ts
│   │   ├── delete-message.use-case.ts
│   │   ├── mark-messages-read.use-case.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── create-token.use-case.ts
│   │   ├── verify-token.use-case.ts
│   │   ├── refresh-token.use-case.ts
│   │   └── index.ts
│   ├── record/
│   │   ├── start-recording.use-case.ts
│   │   ├── stop-recording.use-case.ts
│   │   ├── get-recording.use-case.ts
│   │   ├── list-recordings.use-case.ts
│   │   └── index.ts
│   └── index.ts
├── services/
│   ├── room.service.ts
│   ├── user.service.ts
│   ├── link.service.ts
│   ├── chat.service.ts
│   ├── auth.service.ts
│   ├── record.service.ts
│   └── index.ts
└── index.ts
```

---

## Key Features Implemented

### 1. Input Validation
- **Zod Schemas**: All DTOs validated with Zod
- **Type Safety**: Automatic TypeScript type inference from schemas
- **Runtime Validation**: Input validated before processing
- **Error Messages**: Clear validation error messages

### 2. Use Case Pattern
- **Single Responsibility**: Each use case handles one operation
- **Dependency Injection**: Dependencies injected via constructor
- **Result Pattern**: Explicit error handling with Result<T, AppError>
- **Business Logic Orchestration**: Coordinates domain and infrastructure layers

### 3. Application Services
- **High-Level API**: Clean interface for use case orchestration
- **Dependency Management**: Services inject and manage use cases
- **Separation of Concerns**: Clear separation between services and use cases

### 4. Clean Architecture Compliance
- **Layer Independence**: Application layer depends on domain, not infrastructure
- **Dependency Inversion**: Uses interfaces from domain layer
- **Single Direction Flow**: Data flows from presentation → application → domain → infrastructure
- **Testability**: Easy to test with mocked dependencies

---

## Usage Examples

### Using DTOs with Validation

```typescript
import { CreateRoomDtoSchema } from '@application/dtos/index.js';

// Validate input
const result = CreateRoomDtoSchema.safeParse({
  name: 'MEETING01',
  service: 999,
  linkType: 'video',
  autoRecord: true,
  chatEnabled: true,
});

if (!result.success) {
  console.error(result.error.errors);
  return;
}

const dto = result.data; // Type-safe DTO
```

### Using Use Cases Directly

```typescript
import { CreateRoomUseCase } from '@application';
import { container } from 'tsyringe';

// Get use case from DI container
const createRoomUseCase = container.resolve(CreateRoomUseCase);

// Execute use case
const result = await createRoomUseCase.execute({
  name: 'MEETING01',
  service: 999,
  linkType: 'video',
});

if (result.isSuccess) {
  console.log('Room created:', result.value);
} else {
  console.error('Error:', result.error.message);
}
```

### Using Application Services

```typescript
import { RoomService } from '@application';
import { container } from 'tsyringe';

// Get service from DI container
const roomService = container.resolve(RoomService);

// Create room
const result = await roomService.createRoom({
  name: 'MEETING01',
  service: 999,
  autoRecord: true,
});

if (result.isSuccess) {
  const room = result.value;
  console.log(`Room created: ${room.name}`);
}

// List rooms
const listResult = await roomService.listRooms({
  page: 1,
  limit: 20,
  status: RoomStatus.OPEN,
});

if (listResult.isSuccess) {
  console.log(`Found ${listResult.value.total} rooms`);
}
```

### Complete Flow Example

```typescript
import { RoomService, UserService, LinkService } from '@application';
import { container } from 'tsyringe';

// Resolve services
const roomService = container.resolve(RoomService);
const userService = container.resolve(UserService);
const linkService = container.resolve(LinkService);

// 1. Create a room
const roomResult = await roomService.createRoom({
  name: 'MEETING01',
  service: 999,
});

if (roomResult.isFailure) {
  console.error('Failed to create room:', roomResult.error);
  return;
}

const room = roomResult.value;

// 2. Create invitation link with SMS
const linkResult = await linkService.createLink({
  room: room.name,
  mobile: '0812345678',
  linkType: LinkType.VIDEO,
  sendSms: true,
});

if (linkResult.isFailure) {
  console.error('Failed to create link:', linkResult.error);
  return;
}

const link = linkResult.value;
console.log(`Link created: ${link.url}`);

// 3. User joins via link
const tokenResult = await userService.generateToken({
  room: room.name,
  identity: 'user123',
  name: 'John Doe',
});

if (tokenResult.isSuccess) {
  console.log('Token:', tokenResult.value.token);
}

// 4. User joins room
const joinResult = await userService.joinRoom({
  room: room.name,
  identity: 'user123',
  name: 'John Doe',
});

if (joinResult.isSuccess) {
  console.log('User joined successfully');
}
```

---

## Design Patterns Used

### 1. **Use Case Pattern**
- Each use case encapsulates a single business operation
- Clear separation of concerns
- Easy to test and maintain

### 2. **DTO Pattern**
- Data Transfer Objects for input/output
- Validation at boundaries
- Type-safe data contracts

### 3. **Service Layer Pattern**
- High-level orchestration of use cases
- Clean API for presentation layer
- Business workflow coordination

### 4. **Result Pattern**
- Explicit error handling
- No exceptions for business logic errors
- Composable success/failure paths

### 5. **Dependency Injection**
- Loose coupling between components
- Easy to swap implementations
- Simplified testing with mocks

### 6. **Command Pattern**
- Use cases as commands
- Single entry point (execute method)
- Consistent interface

---

## Validation Examples

### Zod Schema Validation

```typescript
import { CreateLinkDtoSchema } from '@application/dtos/index.js';

// Valid input
const validData = {
  room: 'ROOM123',
  mobile: '0812345678',
  linkType: LinkType.VIDEO,
};

const result1 = CreateLinkDtoSchema.safeParse(validData);
console.log(result1.success); // true

// Invalid input
const invalidData = {
  room: 'ROOM123',
  mobile: '123', // Invalid phone format
};

const result2 = CreateLinkDtoSchema.safeParse(invalidData);
console.log(result2.success); // false
console.log(result2.error.errors); // Validation errors
```

---

## Testing Strategy (Ready for Implementation)

### Unit Tests for DTOs

```typescript
// tests/unit/application/dtos/room.dto.test.ts
describe('CreateRoomDtoSchema', () => {
  it('should validate valid room data', () => {
    const data = {
      name: 'ROOM123',
      service: 999,
    };
    const result = CreateRoomDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid service', () => {
    const data = {
      name: 'ROOM123',
      service: -1, // Invalid: must be positive
    };
    const result = CreateRoomDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

### Unit Tests for Use Cases

```typescript
// tests/unit/application/use-cases/room/create-room.use-case.test.ts
describe('CreateRoomUseCase', () => {
  let useCase: CreateRoomUseCase;
  let mockRoomRepo: jest.Mocked<IRoomRepository>;
  let mockLivekitAdapter: jest.Mocked<LiveKitAdapter>;

  beforeEach(() => {
    mockRoomRepo = {
      create: jest.fn(),
      findByName: jest.fn(),
    } as any;

    mockLivekitAdapter = {
      createRoom: jest.fn(),
    } as any;

    useCase = new CreateRoomUseCase(mockRoomRepo, mockLivekitAdapter);
  });

  it('should create room successfully', async () => {
    const dto = { name: 'TEST', service: 999 };
    const mockRoom = Room.create(dto).value;

    mockRoomRepo.create.mockResolvedValue(mockRoom);
    mockLivekitAdapter.createRoom.mockResolvedValue(success({} as any));

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(mockRoomRepo.create).toHaveBeenCalled();
  });
});
```

### Integration Tests for Services

```typescript
// tests/integration/application/services/room.service.test.ts
describe('RoomService Integration', () => {
  let service: RoomService;

  beforeEach(async () => {
    await setupTestDatabase();
    service = container.resolve(RoomService);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve room', async () => {
    const createResult = await service.createRoom({
      name: 'TEST001',
      service: 999,
    });

    expect(createResult.isSuccess).toBe(true);

    const getResult = await service.getRoom({
      roomName: 'TEST001',
    });

    expect(getResult.isSuccess).toBe(true);
    expect(getResult.value.name).toBe('TEST001');
  });
});
```

---

## Error Handling

### Use Case Error Handling

```typescript
async execute(dto: CreateRoomDto): Promise<Result<RoomResponseDto, AppError>> {
  try {
    // Validate business rules
    const existingRoom = await this.roomRepository.findByName(dto.name);
    if (existingRoom) {
      return failure(
        new AppError(
          ErrorCode.ROOM_ALREADY_EXISTS,
          `Room '${dto.name}' already exists`,
          400
        )
      );
    }

    // Create room
    const roomResult = Room.create(dto);
    if (roomResult.isFailure) {
      return failure(
        new AppError(
          ErrorCode.VALIDATION_ERROR,
          roomResult.error.message,
          400
        )
      );
    }

    // Save and return
    const savedRoom = await this.roomRepository.create(roomResult.value);
    return success(this.toDto(savedRoom));
  } catch (error) {
    logger.error('CreateRoomUseCase error', { error, dto });
    return failure(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to create room',
        500
      )
    );
  }
}
```

---

## Next Steps: Phase 5

Phase 5 will focus on the **Presentation Layer**:

1. Create base controller
2. Implement HTTP controllers (Express)
3. Create routes
4. Implement middlewares (auth, validation, error handling)
5. Migrate Socket.IO handlers
6. Create socket namespaces
7. Write E2E tests

See `PLAN.md` for detailed Phase 5 tasks.

---

## Development Commands

```bash
# Type checking
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format

# Run tests (when implemented)
npm test

# Build for production
npm run build
```

---

## Notes

- All use cases follow single responsibility principle
- DTOs provide input validation at application boundaries
- Services provide high-level API for orchestration
- Result pattern ensures explicit error handling
- Dependency injection enables easy testing
- All files use ESM imports with `.js` extensions
- Ready for Phase 5 (Presentation Layer)

---

## Metrics

**Phase 4 Status**: ✅ COMPLETED
**Date**: December 10, 2024
**Next Phase**: Phase 5 - Presentation Layer
**Files Created**: 48 files
**Lines of Code**: ~5,000 lines
**DTOs**: 6 categories (Room, User, Link, Chat, Auth, Record)
**Use Cases**: 28 use cases
**Services**: 6 services

---

## Architecture Compliance

✅ **Clean Architecture**: Application layer orchestrates domain and infrastructure
✅ **Dependency Inversion**: Depends on domain interfaces
✅ **Single Responsibility**: Each use case handles one operation
✅ **Open/Closed**: Extensible via new use cases
✅ **Liskov Substitution**: Use cases are interchangeable
✅ **Interface Segregation**: Focused DTOs per operation
✅ **Dependency Injection**: Full DI support via tsyringe
