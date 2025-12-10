### ดึงข้อมูลงาน

URL: `GET /car/task?id=8`
Method: `GET`
Code: `200 OK`

```json
{
  "status": "OK",
  "message": "success",
  "data": {
    "task": 8,
    "status": "open",
    "dtmCreated": null,
    "dtmUpdated": "2024-12-06T07:21:23.000Z",
    "room": "UqshtVssH",
    "destination": {
      "latitude": "17.497507100",
      "longitude": "101.721786400"
    },
    "webSocket": "wss://dev-api-rama-emo.aat.in.th/mobile?task=8"
  }
}
```

### เมื่อเกิดข้อผิดพลาด

#### ลิ้งค์ไม่ถูกต้อง

Code: `404 NOT FOUND`

```json
{
  "status": "NOT FOUND",
  "message": "invalid task id"
}
```

#### งานถูกปิด

Code: `400 BAD REQUEST`

```json
{
  "status": "ERROR",
  "message": "task is cancel"
}
```
