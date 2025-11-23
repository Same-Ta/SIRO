# CIRO 백엔드 API 응답 메시지 (2024)

## 1. 헬스체크 API 응답

### 성공 응답 (POST /health-check)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "health_score": 8,
  "date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### 에러 응답 (422 Validation Error)
```json
{
  "detail": [
    {
      "loc": ["body", "health_score"],
      "msg": "ensure this value is greater than or equal to 1",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

커스텀 에러 메시지:
```json
{
  "detail": "health_score must be between 1 and 10",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 에러 응답 (404 Not Found)
```json
{
  "detail": "No health check found for this user"
}
```

---

## 2. 루트 헬스체크 API 응답

### GET /health
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development"
  }
}
```

프로덕션 환경:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "production",
    "version": "1.0.0",
    "uptime": "7d 3h 24m"
  }
}
```

---

## 3. 로그 메시지

### 헬스체크 생성 로그
```
INFO: Health check created - user_id=user123, health_score=8, date=2024-01-15
```

### 데이터베이스 연결 에러
```
ERROR: Failed to connect to Supabase - SUPABASE_URL or SUPABASE_KEY not configured
```

### Upsert 실행 로그
```
INFO: Health check upserted - user_id=user123, date=2024-01-15, operation=update
```

---

## 4. Supabase 쿼리 에러 메시지

### Unique Constraint 위반
```json
{
  "code": "23505",
  "details": "Key (user_id, date)=(user123, 2024-01-15) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint \"health_checks_user_id_date_key\""
}
```

처리 후 사용자 응답:
```json
{
  "detail": "Health check for today already exists. It has been updated.",
  "operation": "updated"
}
```

### Check Constraint 위반 (health_score 범위)
```json
{
  "code": "23514",
  "message": "new row for relation \"health_checks\" violates check constraint \"health_checks_health_score_check\""
}
```

사용자 응답:
```json
{
  "detail": "Health score must be between 1 and 10",
  "provided_value": 15
}
```

---

## 5. 환경 변수 검증 메시지

### 누락된 환경 변수
```
ValueError: Supabase credentials not found in environment. 
Please set SUPABASE_URL and SUPABASE_KEY in backend/.env file.
```

### 잘못된 URL 형식
```
ValueError: Invalid SUPABASE_URL format. Expected: https://[project-id].supabase.co
```

---

## 6. API 문서화 텍스트 (Swagger UI)

### 헬스체크 엔드포인트 설명

**POST /api/v1/health-check**
```
Summary: Create or update daily health check
Description: Saves the user's daily health status (mood/team health) on a scale of 1-10. 
             If a health check already exists for the user and date, it will be updated (upsert).
Tags: health
```

**GET /api/v1/health-check/latest**
```
Summary: Get latest health check
Description: Retrieves the most recent health check for a specific user.
Tags: health
Parameters:
  - user_id (query, required): User identifier
```

**GET /api/v1/health-check/history**
```
Summary: Get health check history
Description: Retrieves the health check history for a user within a specified date range.
Tags: health
Parameters:
  - user_id (query, required): User identifier
  - limit (query, optional, default=30): Maximum number of records to return
  - start_date (query, optional): Start date (YYYY-MM-DD)
  - end_date (query, optional): End date (YYYY-MM-DD)
```

---

## 7. Pydantic 모델 예제

### HealthCheckCreate 스키마 예제
```json
{
  "user_id": "user123",
  "health_score": 7,
  "date": "2024-01-15"
}
```

### 잘못된 요청 예제
```json
{
  "user_id": "",
  "health_score": 15,
  "date": "01/15/2024"
}
```

검증 에러:
```json
{
  "detail": [
    {
      "loc": ["body", "user_id"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    },
    {
      "loc": ["body", "health_score"],
      "msg": "health_score must be between 1 and 10",
      "type": "value_error"
    },
    {
      "loc": ["body", "date"],
      "msg": "Invalid date format. Use YYYY-MM-DD",
      "type": "value_error"
    }
  ]
}
```

---

## 8. CORS 에러 메시지

### CORS 허용되지 않은 오리진
```
Access to fetch at 'http://localhost:5000/api/v1/health-check' from origin 'http://localhost:3001' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

해결 후 헤더:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 9. 팀 초대 API 프롬프트 (예정)

### 초대 이메일 템플릿
**제목**: [CIRO] {sender_name}님이 {project_name} 프로젝트에 초대했습니다

**본문**:
```
안녕하세요,

{sender_name}님이 CIRO의 "{project_name}" 프로젝트에 당신을 초대했습니다.

프로젝트 역할: {role}
초대 만료일: {expiration_date}

아래 버튼을 클릭하여 초대를 수락하세요:
[초대 수락하기]

이 초대 링크는 7일 후 만료됩니다.

감사합니다,
CIRO 팀
```

### 초대 수락 성공 응답
```json
{
  "success": true,
  "message": "프로젝트 초대가 수락되었습니다",
  "project_id": "uuid",
  "role": "member"
}
```

### 초대 만료 에러
```json
{
  "detail": "이 초대 링크는 만료되었습니다. 프로젝트 관리자에게 새 초대를 요청하세요.",
  "error_code": "INVITE_EXPIRED"
}
```

---

## 10. 인증 에러 메시지

### 토큰 누락
```json
{
  "detail": "Not authenticated",
  "error_code": "AUTH_REQUIRED"
}
```

### 토큰 만료
```json
{
  "detail": "Token has expired. Please login again.",
  "error_code": "TOKEN_EXPIRED"
}
```

### 권한 부족
```json
{
  "detail": "You do not have permission to perform this action",
  "error_code": "INSUFFICIENT_PERMISSIONS",
  "required_role": "admin",
  "current_role": "member"
}
```

---

## 11. 데이터베이스 연결 상태 메시지

### 연결 성공
```
INFO: Successfully connected to Supabase - project: [project-id]
```

### 연결 실패
```
ERROR: Failed to connect to Supabase
Details: HTTPSConnectionPool(host='your-project.supabase.co', port=443): 
Max retries exceeded with url: /rest/v1/
```

### 재연결 시도
```
WARNING: Supabase connection lost. Attempting to reconnect... (attempt 1/3)
```

---

## 12. 서버 시작 메시지

### Uvicorn 시작
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

### 개발 모드 (Hot Reload)
```
INFO:     Will watch for changes in these directories: ['c:\\...\\backend']
INFO:     Uvicorn running on http://127.0.0.1:5000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
```

### 프로덕션 모드
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Application startup complete.
```

---

## 13. 디버깅 메시지

### Request 로깅
```
INFO: POST /api/v1/health-check - Request received
Body: {"user_id": "user123", "health_score": 8, "date": "2024-01-15"}
Headers: {"content-type": "application/json", "user-agent": "Mozilla/5.0..."}
```

### Response 로깅
```
INFO: POST /api/v1/health-check - Response sent
Status: 200 OK
Body: {"id": "...", "user_id": "user123", "health_score": 8}
Duration: 124ms
```

### 에러 스택 트레이스
```
ERROR: Exception in ASGI application
Traceback (most recent call last):
  File "app/routes/health.py", line 45, in create_health_check
    result = supabase.table("health_checks").upsert(...)
ValueError: health_score must be between 1 and 10

Client: 127.0.0.1:54321
Request: POST /api/v1/health-check
```

---

## 14. 성능 모니터링 메시지

### 느린 쿼리 경고
```
WARNING: Slow query detected
Endpoint: /api/v1/health-check/history
Duration: 2.3s
Query: SELECT * FROM health_checks WHERE user_id = 'user123' ORDER BY date DESC LIMIT 30
```

### 메모리 사용량 경고
```
WARNING: High memory usage detected: 85% (850MB / 1GB)
```

---

## 15. 스웨거 UI 커스텀 설명

### API 전체 설명
```markdown
# CIRO API Documentation

경험 회고 및 역량 추적 시스템(CIRO)의 백엔드 API입니다.

## 기능
- 일별 건강 상태 체크 (Health Check)
- 회고 템플릿 기반 경험 정리
- 역량 자동 추출 및 분석
- 팀 협업 및 초대 관리

## 인증
대부분의 엔드포인트는 Bearer 토큰 인증이 필요합니다.
헤더에 `Authorization: Bearer <token>`을 포함하세요.

## 에러 코드
- 400: Bad Request (잘못된 요청)
- 401: Unauthorized (인증 필요)
- 403: Forbidden (권한 부족)
- 404: Not Found (리소스 없음)
- 422: Validation Error (유효성 검사 실패)
- 500: Internal Server Error (서버 오류)
```
