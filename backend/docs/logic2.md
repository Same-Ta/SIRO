# CIRO 백엔드 시스템 로직 (2024 업데이트)

## 1. 헬스체크 API

### 개요
사용자의 일별 건강 상태(기분/팀 상태)를 저장하고 조회하는 REST API입니다.

### 엔드포인트

#### POST `/api/v1/health-check`
사용자의 오늘 날짜 헬스체크를 저장합니다. 동일한 user_id와 날짜가 있으면 업데이트(upsert)합니다.

**Request Body:**
```json
{
  "user_id": "string",
  "health_score": 7,
  "date": "2024-01-15"
}
```

**Validation:**
- `health_score`: 1~10 사이의 정수
- `date`: ISO 8601 날짜 형식 (YYYY-MM-DD)
- `user_id`: 필수 문자열

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "user123",
  "health_score": 7,
  "date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Response (422):**
```json
{
  "detail": "health_score must be between 1 and 10"
}
```

---

#### GET `/api/v1/health-check/latest`
특정 사용자의 가장 최근 헬스체크를 조회합니다.

**Query Parameters:**
- `user_id` (required): 사용자 ID

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "user123",
  "health_score": 8,
  "date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response (404):**
```json
{
  "detail": "No health check found for this user"
}
```

---

#### GET `/api/v1/health-check/history`
특정 사용자의 헬스체크 히스토리를 조회합니다.

**Query Parameters:**
- `user_id` (required): 사용자 ID
- `limit` (optional, default=30): 최대 조회 개수
- `start_date` (optional): 시작 날짜 (YYYY-MM-DD)
- `end_date` (optional): 종료 날짜 (YYYY-MM-DD)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "user123",
    "health_score": 8,
    "date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid",
    "user_id": "user123",
    "health_score": 6,
    "date": "2024-01-14",
    "created_at": "2024-01-14T09:20:00Z"
  }
]
```

---

### 구현 상세 (`backend/app/routes/health.py`)

```python
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date as Date
from ..database import get_supabase_client

router = APIRouter(prefix="/health-check", tags=["health"])

class HealthCheckCreate(BaseModel):
    user_id: str
    health_score: int = Field(..., ge=1, le=10)
    date: str  # ISO 8601 format (YYYY-MM-DD)
    
    @validator('health_score')
    def validate_score(cls, v):
        if not 1 <= v <= 10:
            raise ValueError('health_score must be between 1 and 10')
        return v

@router.post("")
async def create_health_check(data: HealthCheckCreate):
    supabase = get_supabase_client()
    
    # Upsert: user_id + date 조합으로 unique constraint
    result = supabase.table("health_checks").upsert({
        "user_id": data.user_id,
        "health_score": data.health_score,
        "date": data.date
    }, on_conflict="user_id,date").execute()
    
    return result.data[0]

@router.get("/latest")
async def get_latest_health_check(user_id: str = Query(...)):
    supabase = get_supabase_client()
    
    result = supabase.table("health_checks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("date", desc=True)\
        .limit(1)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No health check found")
    
    return result.data[0]

@router.get("/history")
async def get_health_check_history(
    user_id: str = Query(...),
    limit: int = Query(30, ge=1, le=365),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    supabase = get_supabase_client()
    
    query = supabase.table("health_checks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("date", desc=True)\
        .limit(limit)
    
    if start_date:
        query = query.gte("date", start_date)
    if end_date:
        query = query.lte("date", end_date)
    
    result = query.execute()
    return result.data
```

---

### 데이터베이스 스키마 (Supabase)

```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  health_score INTEGER NOT NULL CHECK (health_score >= 1 AND health_score <= 10),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)  -- 하루에 하나의 헬스체크만 허용
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX idx_health_checks_user_date ON health_checks(user_id, date DESC);
```

---

### Upsert 로직 설명
1. 클라이언트가 동일한 날짜에 여러 번 헬스체크를 저장하려고 할 때
2. `UNIQUE(user_id, date)` 제약 조건으로 중복 방지
3. `upsert()` 메서드가 자동으로 기존 레코드를 업데이트
4. `updated_at` 타임스탬프는 자동으로 갱신

---

### 인증 통합 (TODO)
현재는 `user_id`를 클라이언트에서 직접 전송하지만, 프로덕션에서는 다음과 같이 변경:

```python
from ..auth import get_current_user

@router.post("")
async def create_health_check(
    data: HealthCheckCreate,
    current_user = Depends(get_current_user)
):
    # user_id를 토큰에서 추출
    data.user_id = current_user.id
    # ... 나머지 로직
```

---

## 2. 팀 초대 API (예정)

### POST `/api/v1/invites`
팀원을 이메일로 초대합니다.

**Request Body:**
```json
{
  "project_id": "uuid",
  "emails": ["user1@example.com", "user2@example.com"],
  "role": "member"  // "admin" | "member" | "viewer"
}
```

**Response (200):**
```json
{
  "success": true,
  "invited_count": 2,
  "failed_emails": []
}
```

**구현 계획:**
1. 이메일 유효성 검사
2. 이미 팀에 있는 사용자 필터링
3. 초대 링크 생성 (JWT 토큰 기반)
4. 이메일 전송 (SendGrid/AWS SES)
5. `invitations` 테이블에 기록

---

## 3. FastAPI 앱 구조

### 라우터 등록 (`backend/app/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health

app = FastAPI(title="CIRO API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# 라우터 등록
app.include_router(health.router, prefix="/api/v1")

@app.get("/health")
async def root_health_check():
    return {
        "success": True,
        "data": {
            "status": "ok",
            "environment": "development"
        }
    }
```

---

## 4. 환경 변수 및 Supabase 연결

### 환경 변수 (`backend/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # 관리자 작업용
```

### Supabase 클라이언트 (`backend/app/database.py`)
```python
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials not found in environment")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)
```

---

## 5. 에러 핸들링

### 공통 에러 응답 구조
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 커스텀 예외 핸들러
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from datetime import datetime

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": str(exc),
            "error_code": "VALIDATION_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## 6. 데이터 유효성 검사

### Pydantic 모델 검증
```python
from pydantic import BaseModel, validator, Field
from datetime import date

class HealthCheckCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=255)
    health_score: int = Field(..., ge=1, le=10, description="Health score from 1 to 10")
    date: str = Field(..., regex=r'^\d{4}-\d{2}-\d{2}$')
    
    @validator('date')
    def validate_date_format(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "health_score": 7,
                "date": "2024-01-15"
            }
        }
```

---

## 7. 로깅 및 모니터링

### 구조화된 로깅
```python
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

@router.post("")
async def create_health_check(data: HealthCheckCreate):
    logger.info(
        "Health check created",
        extra={
            "user_id": data.user_id,
            "health_score": data.health_score,
            "date": data.date,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    # ... 로직
```

---

## 8. 테스트 엔드포인트

### 헬스체크 테스트
```bash
# 헬스체크 생성
curl -X POST http://localhost:5000/api/v1/health-check \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "health_score": 8,
    "date": "2024-01-15"
  }'

# 최신 헬스체크 조회
curl "http://localhost:5000/api/v1/health-check/latest?user_id=test_user"

# 히스토리 조회
curl "http://localhost:5000/api/v1/health-check/history?user_id=test_user&limit=7"
```

---

## 9. 성능 최적화

### 데이터베이스 인덱싱
```sql
-- 복합 인덱스로 user_id + date 쿼리 최적화
CREATE INDEX idx_health_checks_user_date ON health_checks(user_id, date DESC);

-- user_id만 검색하는 경우를 위한 단일 인덱스
CREATE INDEX idx_health_checks_user ON health_checks(user_id);
```

### 캐싱 전략 (Redis, TODO)
```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@router.get("/latest")
@cache(expire=300)  # 5분 캐싱
async def get_latest_health_check(user_id: str):
    # ... 로직
```

---

## 10. API 문서화

FastAPI는 자동으로 Swagger UI를 제공합니다:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### 커스텀 문서 설정
```python
app = FastAPI(
    title="CIRO API",
    description="경험 회고 및 역량 추적 시스템",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
```
