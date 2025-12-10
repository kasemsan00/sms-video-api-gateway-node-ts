### อัพเดทข้อมูลงาน

URL: `PUT /car/task`

Method: `PUT`

Code: `200 OK`

Body: JSON

```json
{
  "task": "8",
  "status": "start || arrived || cancel || complete"
}
```

Response:

```json
{
  "status": "OK",
  "message": "update success",
  "data": {
    "task": "1234",
    "status": "open || arrive || cancel || complete"
  }
}
```

### เมื่อเกิดข้อผิดพลาด

#### ลิ้งค์ไม่ถูกต้อง

Code: `404 NOT FOUND`

Response:

```json
{
  "status": "NOT FOUND",
  "message": "invalid task id"
}
```

#### งานถูกปิด

Code: `400 BAD REQUEST`

Response:

```json
{
  "status": "FAIL",
  "message": "task is cancel"
}
```

#### status ไม่ถูกต้อง

Code: `400 BAD REQUEST`

Response:

```json
{
  "status": "FAIL",
  "message": "invalid status"
}
```
