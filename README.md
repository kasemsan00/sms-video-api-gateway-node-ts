# Video Conference API Gateway

A production-ready API Gateway for video conferencing built with TypeScript, Clean Architecture, and Domain-Driven Design.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with **Domain-Driven Design (DDD)** patterns:

- **Domain Layer**: Business logic, entities, value objects
- **Application Layer**: Use cases, DTOs, application services
- **Infrastructure Layer**: Database, external services, adapters
- **Presentation Layer**: HTTP REST API, WebSocket/Socket.IO

## 🚀 Features

### HTTP REST API
- ✅ 35 RESTful endpoints
- ✅ JWT authentication
- ✅ Zod validation
- ✅ Pagination support
- ✅ Error handling
- ✅ Request logging
- ✅ CORS support

### WebSocket/Real-time
- ✅ Socket.IO integration
- ✅ Multiple namespaces (Room, Queue, Mobile)
- ✅ 21 typed events
- ✅ Real-time chat
- ✅ Position tracking
- ✅ Conference management

### Core Features
- ✅ Room management (create, close, reopen, extend)
- ✅ User management (join, leave, tokens)
- ✅ Invitation links (create, verify, one-time links)
- ✅ Chat messaging (send, delete, history)
- ✅ LiveKit integration (video conferencing)
- ✅ Recording management (start, stop, list)
- ✅ GPS location tracking

## 📋 Prerequisites

- Node.js >= 18.x
- MySQL >= 8.0
- npm or yarn
- LiveKit server (for video conferencing)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ts-api-gateway-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE video_conference;"

# Run migrations (if any)
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Other Commands
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm test
npm run test:watch
npm run test:coverage

# Validate (typecheck + lint + format)
npm run validate
```

## 📁 Project Structure

```
src/
├── index.ts                      # Application entry point
├── shared/                       # Shared kernel
│   ├── types/                   # Common types
│   ├── errors/                  # Error classes
│   ├── utils/                   # Utilities
│   └── constants/               # Constants
├── domain/                       # Domain layer
│   ├── entities/                # Domain entities
│   ├── value-objects/           # Value objects
│   ├── repositories/            # Repository interfaces
│   ├── services/                # Domain services
│   └── events/                  # Domain events
├── application/                  # Application layer
│   ├── use-cases/               # Use cases
│   ├── dtos/                    # Data transfer objects
│   └── services/                # Application services
├── infrastructure/               # Infrastructure layer
│   ├── database/                # Database (MySQL)
│   ├── external/                # External services
│   └── logging/                 # Logging
└── presentation/                 # Presentation layer
    ├── http/                    # HTTP REST API
    │   ├── controllers/         # Controllers
    │   ├── middlewares/         # Middlewares
    │   └── routes/              # Routes
    └── websocket/               # WebSocket
        ├── namespaces/          # Socket.IO namespaces
        └── socket.server.ts     # Socket.IO server
```

## 🔌 API Endpoints

### Room Endpoints
- `POST /api/rooms` - Create room
- `GET /api/rooms` - List rooms
- `GET /api/rooms/:roomName` - Get room details
- `PATCH /api/rooms/:roomName` - Update room
- `POST /api/rooms/:roomName/close` - Close room
- `POST /api/rooms/:roomName/reopen` - Reopen room
- `POST /api/rooms/:roomName/extend` - Extend expiry
- `DELETE /api/rooms/:roomName` - Delete room

### User Endpoints
- `POST /api/users/token` - Generate LiveKit token
- `POST /api/users/join` - Join room
- `POST /api/users/leave` - Leave room
- `GET /api/users/:identity` - Get user details
- `GET /api/rooms/:roomName/users` - List users in room

### Link Endpoints
- `POST /api/links` - Create invitation link
- `GET /api/links/:linkId` - Get link details
- `POST /api/links/:linkId/verify` - Verify link
- `PATCH /api/links/:linkId/location` - Update GPS location
- `GET /api/rooms/:roomName/links` - List links

### Chat Endpoints
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/:messageId` - Get message
- `GET /api/rooms/:roomName/messages` - Get chat history
- `DELETE /api/chat/messages/:messageId` - Delete message
- `POST /api/rooms/:roomName/messages/read` - Mark as read

### Auth Endpoints
- `POST /api/auth/token` - Create JWT token
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/refresh` - Refresh JWT token

### Recording Endpoints
- `POST /api/rooms/:roomName/recording/start` - Start recording
- `POST /api/rooms/:roomName/recording/stop` - Stop recording
- `GET /api/recordings/:recordingId` - Get recording
- `GET /api/rooms/:roomName/recordings` - List recordings

### Health Endpoints
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

## 🔌 WebSocket Events

### Client → Server
- `send-message` - Send chat message
- `typing` - Typing indicator
- `update-position` - Update GPS position
- `join-conference` - Join conference
- `leave-conference` - Leave conference
- `start-recording` - Start recording
- `stop-recording` - Stop recording

### Server → Client
- `new-message` - New chat message
- `user-typing` - User typing
- `position-updated` - Position updated
- `participant-joined` - Participant joined
- `participant-left` - Participant left
- `recording-started` - Recording started
- `recording-stopped` - Recording stopped
- `error` - Error notification

### Namespaces
- `/{roomId}` - Dynamic room namespaces
- `/queue` - Queue management
- `/mobile` - Mobile clients

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔒 Security

- ✅ JWT authentication
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Error masking in production
- ✅ Rate limiting (recommended)

## 📊 Performance

- ✅ Connection pooling (MySQL)
- ✅ Keep-alive mechanism
- ✅ Graceful shutdown
- ✅ Structured logging
- ✅ Health checks

## 🚢 Deployment

### Docker (Recommended)
```bash
# Build Docker image
docker build -t video-api-gateway .

# Run container
docker run -p 3000:3000 --env-file .env video-api-gateway
```

### PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name video-api-gateway

# Monitor
pm2 monit

# Logs
pm2 logs video-api-gateway
```

### Environment Variables
See `.env.example` for all required environment variables.

## 📝 Documentation

- [PLAN.md](./PLAN.md) - Complete migration plan
- [PHASE1-COMPLETE.md](./PHASE1-COMPLETE.md) - Foundation setup
- [PHASE2-COMPLETE.md](./PHASE2-COMPLETE.md) - Domain layer
- [PHASE3-COMPLETE.md](./PHASE3-COMPLETE.md) - Infrastructure layer
- [PHASE4-COMPLETE.md](./PHASE4-COMPLETE.md) - Application layer
- [PHASE5-COMPLETE.md](./PHASE5-COMPLETE.md) - Presentation layer

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- TypeScript community
- Express.js team
- Socket.IO team
- LiveKit team

## 📞 Support

For support, email support@example.com or open an issue.

---

**Built with ❤️ using TypeScript, Clean Architecture, and DDD**
