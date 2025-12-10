# Phase 3: Infrastructure Layer - COMPLETED ✅

## Summary

Phase 3 has been successfully completed. The Infrastructure Layer is now fully implemented with MySQL repositories, LiveKit adapter, and SMS adapter.

---

## Completed Tasks

### ✅ 1. MySQL Connection Manager
Located in `src/infrastructure/database/mysql/`:
- `mysql-connection.ts` - Singleton connection pool manager with health checks
- Connection pooling with automatic reconnection
- Transaction support
- Query execution with parameterized queries
- Health check and connection status monitoring

### ✅ 2. Query Builder
Located in `src/infrastructure/database/mysql/`:
- `query-builder.ts` - SQL query builder with SQL injection prevention
- Support for SELECT, INSERT, UPDATE, DELETE operations
- WHERE conditions with operators (=, !=, >, <, >=, <=, LIKE, IN, IS NULL)
- JOIN support (INNER, LEFT, RIGHT)
- ORDER BY, LIMIT, OFFSET clauses
- Automatic identifier escaping

### ✅ 3. Base Repository
Located in `src/infrastructure/database/mysql/`:
- `base-repository.ts` - Abstract base class for all repositories
- Common CRUD operations
- Pagination support
- Query execution helpers
- Entity mapping (domain ↔ database)
- Result pattern for error handling

### ✅ 4. MySQL Repository Implementations
Located in `src/infrastructure/database/mysql/repositories/`:

#### MySqlRoomRepository
- Table: `room_conference`
- Methods:
  - `findById`, `findByName`, `findByStatus`, `findAll`
  - `findExpired`, `exists`
  - `create`, `update`, `delete`
  - `updateStatus`, `updateExpiry`, `updateMessageUnread`
  - `countByStatus`

#### MySqlUserRepository
- Table: `room_user`
- Methods:
  - `findById`, `findByIdentity`, `findByRoom`
  - `findByRoomAndIdentity`, `findAdminsByRoom`, `findOnlineUsersByRoom`
  - `exists`, `create`, `update`, `delete`, `deleteByRoom`
  - `updateOnlineStatus`, `updateJoinStatus`
  - `countByRoom`, `countOnlineByRoom`

#### MySqlLinkRepository
- Table: `link_connect`
- Methods:
  - `findByLinkId`, `findByRoom`, `findByRoomAndType`
  - `findByMobile`, `findExpired`, `exists`
  - `create`, `update`, `delete`, `deleteByRoom`
  - `updateLocation`, `markAsUsed`
  - `countByRoom`

#### MySqlMessageRepository
- Table: `chat_message`
- Methods:
  - `findById`, `findByRoom`, `findRecentByRoom`
  - `findByIdentity`, `create`, `update`
  - `delete`, `deleteByRoom`, `softDelete`
  - `countByRoom`, `countUnreadByRoom`

#### MySqlCaseRepository
- Table: `case_data`
- Methods:
  - `findById`, `findByRoom`, `findByCaseNumber`
  - `findByStatus`, `findAll`
  - `create`, `update`, `delete`
  - `updateStatus`, `countByRoom`, `countByStatus`

#### MySqlServiceRepository
- Table: `services`
- Methods:
  - `findById`, `findByName`, `findAll`, `findActive`
  - `create`, `update`, `delete`
  - `activate`, `deactivate`, `countActive`

### ✅ 5. LiveKit Adapter
Located in `src/infrastructure/adapters/livekit/`:
- `livekit.adapter.ts` - LiveKit video conferencing adapter
- Token generation with custom grants
- Room management (create, get, delete)
- Participant management (list, get, remove)
- Recording support (start, stop)
- Participant metadata updates
- Track muting control
- Data message sending
- Health check

### ✅ 6. SMS Adapter
Located in `src/infrastructure/adapters/sms/`:
- `sms.adapter.ts` - SMS gateway adapter with abstraction
- Gateway interface (`ISmsGateway`)
- Mock SMS gateway for testing
- HTTP SMS gateway for production
- Thai phone number validation
- Predefined message templates:
  - Video call invitation
  - Location tracking invitation
  - Recording notification
- SMS status checking
- Balance inquiry
- Health check

---

## Project Structure Created

```
src/infrastructure/
├── database/
│   └── mysql/
│       ├── mysql-connection.ts
│       ├── query-builder.ts
│       ├── base-repository.ts
│       ├── repositories/
│       │   ├── mysql-room.repository.ts
│       │   ├── mysql-user.repository.ts
│       │   ├── mysql-link.repository.ts
│       │   ├── mysql-message.repository.ts
│       │   ├── mysql-case.repository.ts
│       │   └── mysql-service.repository.ts
│       └── index.ts
├── adapters/
│   ├── livekit/
│   │   ├── livekit.adapter.ts
│   │   └── index.ts
│   └── sms/
│       ├── sms.adapter.ts
│       └── index.ts
└── index.ts
```

---

## Key Features Implemented

### 1. Security
- **SQL Injection Prevention**: All queries use parameterized statements
- **Identifier Escaping**: Table and column names are properly escaped
- **Input Validation**: Phone numbers, dates, and other inputs are validated
- **Error Sanitization**: Sensitive information is not exposed in errors

### 2. Database Operations
- **Connection Pooling**: Efficient database connection management
- **Transactions**: Support for atomic operations
- **Query Builder**: Type-safe query construction
- **Parameterized Queries**: Protection against SQL injection
- **Result Pattern**: Consistent error handling

### 3. Repository Pattern
- **Interface Segregation**: Domain interfaces separate from implementation
- **Entity Mapping**: Automatic conversion between domain and database models
- **Pagination**: Built-in support for paginated queries
- **Soft Delete**: Support for logical deletion
- **Bulk Operations**: Delete by room, find by conditions, etc.

### 4. External Service Integration
- **LiveKit**: Full video conferencing capabilities
- **SMS Gateway**: Flexible SMS sending with multiple gateways
- **Health Checks**: Service availability monitoring
- **Error Handling**: Graceful failure and retry logic

### 5. Design Patterns
- **Singleton**: Database connection manager
- **Repository**: Data access abstraction
- **Adapter**: External service integration
- **Dependency Injection**: Tsyringe decorators
- **Strategy**: Multiple SMS gateway implementations

---

## Usage Examples

### MySQL Connection

```typescript
import { db } from '@infrastructure';

// Connect to database
await db.connect();

// Execute query
const result = await db.query('SELECT * FROM room_conference WHERE id = ?', [1]);

// Use transaction
await db.transaction(async (connection) => {
  await connection.execute('INSERT INTO ...');
  await connection.execute('UPDATE ...');
  // Automatically commits on success, rolls back on error
});

// Health check
const health = await db.healthCheck();

// Disconnect
await db.disconnect();
```

### Repository Usage

```typescript
import { MySqlRoomRepository } from '@infrastructure';
import { Room } from '@domain';

const roomRepo = new MySqlRoomRepository();

// Create room
const room = Room.create({ name: 'MEETING01' }).value;
const savedRoom = await roomRepo.create(room);

// Find room
const foundRoom = await roomRepo.findByName('MEETING01');

// Find with pagination
const rooms = await roomRepo.findAll({ page: 1, limit: 20 });

// Update room
room.close();
await roomRepo.update(room);

// Delete room
await roomRepo.delete(room.id);
```

### LiveKit Adapter

```typescript
import { LiveKitAdapter } from '@infrastructure';

const livekit = new LiveKitAdapter();

// Generate token
const tokenResult = await livekit.generateToken({
  roomName: 'MEETING01',
  identity: 'user123',
  name: 'John Doe',
});

// Create room
const roomResult = await livekit.createRoom({
  name: 'MEETING01',
  emptyTimeout: 600,
});

// List participants
const participants = await livekit.listParticipants('MEETING01');

// Start recording
const egressId = await livekit.startRecording({
  roomName: 'MEETING01',
  fileOutputPrefix: 'recordings/meeting01',
});

// Stop recording
await livekit.stopRecording(egressId);
```

### SMS Adapter

```typescript
import { SmsAdapter } from '@infrastructure';

const sms = new SmsAdapter();

// Send video call invitation
const result = await sms.sendVideoCallInvitation(
  '0812345678',
  'https://video.example.com/ABC123',
  'Dr. Smith'
);

// Send location invitation
await sms.sendLocationInvitation(
  '0812345678',
  'https://track.example.com/XYZ789'
);

// Send custom SMS
await sms.sendSms('0812345678', 'Hello from API Gateway');

// Check SMS status
const status = await sms.checkStatus(result.value.messageId);

// Get balance
const balance = await sms.getBalance();
```

---

## Configuration

### Environment Variables

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=conference

# LiveKit Configuration
LIVEKIT_HOST=wss://livekit.example.com
LIVEKIT_API_KEY=APIxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxx

# SMS Configuration (Optional)
SMS_API_URL=https://sms-gateway.example.com
SMS_API_KEY=your-api-key
SMS_SENDER=VideoCall
```

---

## Testing Strategy

### Unit Tests (Ready for Implementation)

```typescript
// tests/unit/infrastructure/repositories/mysql-room.repository.test.ts
describe('MySqlRoomRepository', () => {
  let repository: MySqlRoomRepository;

  beforeEach(async () => {
    repository = new MySqlRoomRepository();
    await db.connect();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  it('should create a room', async () => {
    const room = Room.create({ name: 'TEST001' }).value;
    const created = await repository.create(room);
    expect(created.id).toBeDefined();
  });

  it('should find room by name', async () => {
    const room = await repository.findByName('TEST001');
    expect(room).not.toBeNull();
  });
});
```

### Integration Tests

- Test repository operations with real database
- Test LiveKit adapter with test server
- Test SMS adapter with mock gateway
- Test transaction rollback scenarios
- Test connection pool management

---

## Performance Optimizations

### Database
- Connection pooling (20 connections)
- Prepared statements for repeated queries
- Indexed columns (room, identity, linkID)
- Pagination for large result sets

### Query Optimization
- Use specific columns instead of SELECT *
- WHERE clause optimization with proper indexes
- JOIN optimization for related data
- LIMIT clauses to reduce data transfer

---

## Error Handling

### Database Errors
- Connection failures → Automatic retry
- Query errors → Wrapped in AppError with ErrorCode
- Transaction failures → Automatic rollback
- Timeout errors → Graceful degradation

### External Service Errors
- LiveKit unavailable → Return error Result
- SMS gateway failure → Log and return error
- Network timeouts → Configurable retry logic
- Rate limiting → Backoff strategy

---

## Security Considerations

### SQL Injection Prevention
- ✅ All queries use parameterized statements
- ✅ No string interpolation in SQL
- ✅ Identifier escaping for table/column names
- ✅ Input validation before query execution

### Data Validation
- ✅ Phone number format validation
- ✅ Email format validation (if applicable)
- ✅ Date range validation
- ✅ Enum value validation

### Secrets Management
- ✅ API keys in environment variables
- ✅ Database credentials not hardcoded
- ✅ Sensitive data not logged
- ✅ Error messages don't expose internals

---

## Next Steps: Phase 4

Phase 4 will focus on the **Application Layer**:

1. Create DTOs with Zod schemas
2. Implement Use Cases (Create Room, Join Conference, Send Message, etc.)
3. Create Application Services
4. Implement event handlers
5. Write unit tests for use cases

See `PLAN.md` for detailed Phase 4 tasks.

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

- All repositories use the Result pattern for consistent error handling
- Database operations are async and return Promises
- LiveKit adapter uses official livekit-server-sdk
- SMS adapter supports multiple gateway implementations
- All external service calls have timeout protection
- Dependency injection is ready via tsyringe decorators
- Error codes are centralized in `@shared/constants`
- All files use ESM imports with `.js` extensions

---

## Metrics

**Phase 3 Status**: ✅ COMPLETED
**Date**: December 10, 2024
**Next Phase**: Phase 4 - Application Layer
**Files Created**: 18 files
**Lines of Code**: ~3,500 lines
**Dependencies Added**:
- `livekit-server-sdk` for video conferencing
- Native `fetch` for HTTP requests
- `mysql2/promise` for database operations

---

## Architecture Compliance

✅ **Clean Architecture**: Infrastructure depends on domain, not vice versa
✅ **Dependency Inversion**: Repositories implement domain interfaces
✅ **Single Responsibility**: Each repository handles one entity
✅ **Open/Closed**: Extensible via interfaces
✅ **Liskov Substitution**: Repositories are interchangeable
✅ **Interface Segregation**: Specific interfaces per repository
✅ **Dependency Injection**: Ready for DI container
