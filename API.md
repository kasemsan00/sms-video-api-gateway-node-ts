# API Documentation

Complete API reference for the Video Conference API Gateway.

## Base URL

```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-10T20:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-12-10T20:00:00.000Z"
  }
}
```

## Pagination

List endpoints support pagination:

### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `sortBy` (string): Field to sort by
- `sortOrder` (string): 'ASC' or 'DESC'

### Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Room Endpoints

### Create Room
Create a new video conference room.

**Endpoint:** `POST /api/rooms`

**Request Body:**
```json
{
  "name": "MEETING01",
  "service": 999,
  "linkType": "video",
  "autoRecord": true,
  "chatEnabled": true,
  "webSocketURL": "https://example.com",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "MEETING01",
    "status": "open",
    "roomType": "conference",
    "autoRecord": true,
    "chatEnabled": true,
    "dtmCreated": "2024-12-10T20:00:00.000Z",
    "dtmExpired": "2024-12-17T20:00:00.000Z"
  }
}
```

### List Rooms
Get a paginated list of rooms.

**Endpoint:** `GET /api/rooms`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status ('open' or 'close')

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "MEETING01",
      "status": "open",
      ...
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

### Get Room Details
Get details of a specific room.

**Endpoint:** `GET /api/rooms/:roomName`

**Response:** `200 OK`

### Update Room
Update room settings.

**Endpoint:** `PATCH /api/rooms/:roomName`

**Request Body:**
```json
{
  "autoRecord": false,
  "chatEnabled": true
}
```

**Response:** `200 OK`

### Close Room
Close an active room.

**Endpoint:** `POST /api/rooms/:roomName/close`

**Response:** `200 OK`

### Reopen Room
Reopen a closed room.

**Endpoint:** `POST /api/rooms/:roomName/reopen`

**Request Body:**
```json
{
  "expiryDays": 7
}
```

**Response:** `200 OK`

### Extend Room Expiry
Extend room expiration date.

**Endpoint:** `POST /api/rooms/:roomName/extend`

**Request Body:**
```json
{
  "days": 3
}
```

**Response:** `200 OK`

### Delete Room
Delete a room permanently.

**Endpoint:** `DELETE /api/rooms/:roomName`

**Response:** `204 No Content`

---

## User Endpoints

### Generate LiveKit Token
Generate an access token for LiveKit video conferencing.

**Endpoint:** `POST /api/users/token`

**Request Body:**
```json
{
  "room": "MEETING01",
  "identity": "user123",
  "name": "John Doe",
  "metadata": "{\"role\":\"participant\"}"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "identity": "user123",
    "room": "MEETING01"
  }
}
```

### Join Room
User joins a conference room.

**Endpoint:** `POST /api/users/join`

**Request Body:**
```json
{
  "room": "MEETING01",
  "identity": "user123",
  "name": "John Doe",
  "userType": "user"
}
```

**Response:** `201 Created`

### Leave Room
User leaves a conference room.

**Endpoint:** `POST /api/users/leave`

**Request Body:**
```json
{
  "room": "MEETING01",
  "identity": "user123"
}
```

**Response:** `200 OK`

### Get User Details
Get details of a specific user.

**Endpoint:** `GET /api/users/:identity?room=MEETING01`

**Response:** `200 OK`

### List Users in Room
Get all users in a specific room.

**Endpoint:** `GET /api/rooms/:roomName/users`

**Query Parameters:**
- `userType` (string): Filter by user type
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`

### Remove User from Room
Remove a user from a room.

**Endpoint:** `DELETE /api/rooms/:roomName/users/:identity`

**Response:** `204 No Content`

---

## Link Endpoints

### Create Invitation Link
Create an invitation link for a room.

**Endpoint:** `POST /api/links`

**Request Body:**
```json
{
  "room": "MEETING01",
  "mobile": "0812345678",
  "linkType": "video",
  "userName": "Guest User",
  "userType": "user",
  "oneTimeLink": false,
  "requirePassword": false,
  "password": "secret123",
  "sendSms": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "linkId": "abc123xyz",
    "url": "https://app.example.com/join/abc123xyz",
    "room": "MEETING01",
    "linkType": "video",
    "oneTimeLink": false,
    "dtmCreated": "2024-12-10T20:00:00.000Z"
  }
}
```

### Get Link Details
Get details of a specific link.

**Endpoint:** `GET /api/links/:linkId`

**Response:** `200 OK`

### Verify Link
Verify link access and password.

**Endpoint:** `POST /api/links/:linkId/verify`

**Request Body:**
```json
{
  "password": "secret123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "room": "MEETING01",
    "linkType": "video"
  }
}
```

### Update GPS Location
Update GPS coordinates for a location link.

**Endpoint:** `PATCH /api/links/:linkId/location`

**Request Body:**
```json
{
  "latitude": 13.7563,
  "longitude": 100.5018
}
```

**Response:** `200 OK`

### Mark Link as Used
Mark a one-time link as used.

**Endpoint:** `POST /api/links/:linkId/mark-used`

**Response:** `200 OK`

### List Links for Room
Get all links for a specific room.

**Endpoint:** `GET /api/rooms/:roomName/links`

**Query Parameters:**
- `linkType` (string): Filter by link type
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`

---

## Chat Endpoints

### Send Message
Send a chat message to a room.

**Endpoint:** `POST /api/chat/messages`

**Request Body:**
```json
{
  "room": "MEETING01",
  "identity": "user123",
  "name": "John Doe",
  "message": "Hello everyone!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 456,
    "room": "MEETING01",
    "identity": "user123",
    "name": "John Doe",
    "message": "Hello everyone!",
    "dtmCreated": "2024-12-10T20:00:00.000Z"
  }
}
```

### Get Message
Get a specific message by ID.

**Endpoint:** `GET /api/chat/messages/:messageId`

**Response:** `200 OK`

### Get Chat History
Get chat history for a room.

**Endpoint:** `GET /api/rooms/:roomName/messages`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page (default: 50)

**Response:** `200 OK`

### Delete Message
Delete a chat message.

**Endpoint:** `DELETE /api/chat/messages/:messageId`

**Request Body:**
```json
{
  "identity": "user123"
}
```

**Response:** `204 No Content`

### Mark Messages as Read
Clear unread message count for a room.

**Endpoint:** `POST /api/rooms/:roomName/messages/read`

**Response:** `200 OK`

---

## Auth Endpoints

### Create JWT Token
Create a JWT authentication token.

**Endpoint:** `POST /api/auth/token`

**Request Body:**
```json
{
  "identity": "user123",
  "room": "MEETING01",
  "expiresIn": "7d"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d",
    "expiresAt": "2024-12-17T20:00:00.000Z"
  }
}
```

### Verify Token
Verify a JWT token.

**Endpoint:** `POST /api/auth/verify`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "payload": {
      "identity": "user123",
      "room": "MEETING01"
    }
  }
}
```

### Refresh Token
Refresh an expired token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`

---

## Recording Endpoints

### Start Recording
Start recording a room.

**Endpoint:** `POST /api/rooms/:roomName/recording/start`

**Request Body:**
```json
{
  "recordType": "video",
  "encodingOptionsPreset": "HD"
}
```

**Response:** `201 Created`

### Stop Recording
Stop an active recording.

**Endpoint:** `POST /api/rooms/:roomName/recording/stop`

**Response:** `200 OK`

### Get Recording
Get details of a specific recording.

**Endpoint:** `GET /api/recordings/:recordingId`

**Response:** `200 OK`

### List Recordings
Get all recordings for a room.

**Endpoint:** `GET /api/rooms/:roomName/recordings`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`

---

## Health Endpoints

### Health Check
Basic health check.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-10T20:00:00.000Z",
    "uptime": 12345,
    "environment": "production"
  }
}
```

### Readiness Check
Kubernetes readiness probe.

**Endpoint:** `GET /health/ready`

**Response:** `200 OK`

### Liveness Check
Kubernetes liveness probe.

**Endpoint:** `GET /health/live`

**Response:** `200 OK`

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `ROOM_NOT_FOUND` | 404 | Room not found |
| `CONFLICT` | 409 | Resource already exists |
| `BUSINESS_RULE_VIOLATION` | 422 | Business rule violated |
| `ROOM_EXPIRED` | 422 | Room has expired |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

API requests are rate-limited:
- **Default:** 100 requests per 15 minutes per IP
- **Authenticated:** 1000 requests per 15 minutes per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702238400
```

---

## WebSocket Events

See [WebSocket Documentation](./WEBSOCKET.md) for real-time event details.

---

## Examples

### Complete Flow Example

```javascript
// 1. Create a room
const room = await fetch('http://localhost:3000/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'MEETING01',
    service: 999
  })
});

// 2. Create invitation link
const link = await fetch('http://localhost:3000/api/links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room: 'MEETING01',
    linkType: 'video',
    sendSms: true,
    mobile: '0812345678'
  })
});

// 3. Generate user token
const token = await fetch('http://localhost:3000/api/users/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room: 'MEETING01',
    identity: 'user123',
    name: 'John Doe'
  })
});

// 4. Join room
await fetch('http://localhost:3000/api/users/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room: 'MEETING01',
    identity: 'user123',
    name: 'John Doe'
  })
});
```

---

For more information, see the [README](./README.md) and [Deployment Guide](./DEPLOYMENT.md).
