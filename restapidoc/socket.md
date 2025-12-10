## การเชื่อมต่อ Socket.IO

ระบบใช้ Socket.IO ในการส่งข้อมูลพิกัดแบบเรียลไทม์โค๊ดตัวอย่าง

```javascript
const socket = io("wss://example.com", {
  transports: ["websocket", "polling"],
  query: {
    task: "1234", // ใช้ task หรือ id ก็ได้
    id: "1234",
  },
});

socket.on("connection", (data) => {
  // "task": 1,
  // "status": "cancel",
  // "dtmCreated": null,
  // "dtmUpdated": "2025-01-17T08:28:32.000Z",
  // "room": "oHrWkzGQL",
  // "destination": {
  //     "latitude": 0,
  //     "longitude": 0
  // }
});
socket.on("status", (data) => {
  // "status": "connection-success"
});
socket.on("message", (data) => {
  E;
  // สำหรับรับข้อความจาก server เช่น
  // "message": "connection success"
});
socket.on("destination", (data) => {
  // latitude: 13.734,
  // longitude: 100.567,
  // accuracy: 100
  // speed: 0
  // heading: 0
  // altitude: 0
  // altitudeAccuracy: 0
});
```

### ส่งข้อมูลพิกัดของรถ

```javascript
socket.emit("location", {
  latitude: 13.734,
  longitude: 100.567,
  accuracy: 100
  speed: 0
  heading: 0
  altitude: 0
  altitudeAccuracy: 0
});
```
