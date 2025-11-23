# 🚀 백엔드 API 완벽 가이드 (프론트엔드용)

**작성일**: 2025년 11월 22일  
**백엔드 서버**: FastAPI + Supabase  
**Base URL**: `http://localhost:8000`

---

## 📋 목차

1. [서버 실행 방법](#서버-실행-방법)
2. [인증 시스템](#인증-시스템)
3. [API 엔드포인트 전체 목록](#api-엔드포인트-전체-목록)
4. [에러 핸들링](#에러-핸들링)
5. [데이터 타입 정의](#데이터-타입-정의)
6. [실제 사용 예제](#실제-사용-예제)
7. [자주 발생하는 404 에러 해결](#자주-발생하는-404-에러-해결)

---

## 서버 실행 방법

### 1. 백엔드 서버 시작

```bash
cd back
.\venv\Scripts\Activate.ps1  # Windows
python run.py
```

서버 실행 확인:
- 콘솔에 `INFO: Application startup complete.` 출력
- http://localhost:8000 접속 가능
- http://localhost:8000/api/docs 에서 Swagger UI 확인 가능

### 2. 환경 변수 설정

`.env` 파일 필수 항목:
```env
# Supabase
SUPABASE_URL=https://xyrbiuogwtmcjwqkojrb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET_KEY=your-secret-key-change-this-in-production-min-32-characters
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Server
PORT=8000
HOST=0.0.0.0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 인증 시스템

### 인증 방식 (2가지 모두 지원)

#### 방법 1: JWT Bearer Token (권장)
```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

#### 방법 2: x-user-id 헤더 (하위 호환용)
```typescript
const headers = {
  'x-user-id': userId,
  'Content-Type': 'application/json'
}
```

### 로그인 플로우

```typescript
// 1. 로그인
const loginResponse = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { success, data } = await loginResponse.json();
// data: { userId, email, name, accessToken, refreshToken }

// 2. localStorage에 저장
localStorage.setItem('access_token', data.accessToken);
localStorage.setItem('refresh_token', data.refreshToken);
localStorage.setItem('x-user-id', data.userId);

// 3. 이후 모든 API 요청에 포함
const protectedResponse = await fetch('http://localhost:8000/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }
});
```

---

## API 엔드포인트 전체 목록

### ✅ 구현 완료된 엔드포인트

#### 1. 인증 (Authentication)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/auth/register` | 회원가입 | ❌ |
| POST | `/auth/login` | 로그인 | ❌ |
| POST | `/auth/logout` | 로그아웃 | ✅ |
| POST | `/auth/refresh` | 토큰 갱신 | ❌ |

#### 2. 사용자 (Users)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/users/me` | 내 정보 조회 | ✅ |
| PUT | `/users/me` | 내 정보 수정 | ✅ |
| POST | `/users/baseline-mood` | 베이스라인 무드 설정 | ✅ |

#### 3. 회고 v3 시스템 (Reflections)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/api/reflections/micro` | 초라이트 기록 작성 | ✅ |
| GET | `/api/reflections/micro` | 초라이트 기록 목록 | ✅ |
| GET | `/api/reflections/stats` | 회고 통계 | ✅ |
| GET | `/api/reflections/story` | 스토리 뷰 | ✅ |
| GET | `/api/reflections` | 회고 목록 (하위호환) | ✅ |
| GET | `/api/reflections/growth-stats` | 성장 통계 (하위호환) | ✅ |

#### 4. AI (Artificial Intelligence)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/api/ai/suggest-tags` | AI 태그 제안 | ✅ |

### ❌ 아직 구현되지 않은 엔드포인트 (404 에러 발생)

| Method | Endpoint | 상태 | 대체 방법 |
|--------|----------|------|-----------|
| GET | `/api/projects` | ❌ 미구현 | 임시로 빈 배열 반환 필요 |
| GET | `/api/recommendations/activities` | ❌ 미구현 | 임시 데이터 필요 |
| GET | `/api/templates/kpt` | ❌ 미구현 | 프론트에서 하드코딩 |
| POST | `/api/logs` | ❌ 미구현 | reflections/micro 사용 |

---

## 에러 핸들링

### 공통 응답 형식

```typescript
// 성공
{
  "success": true,
  "data": { ... },
  "error": null
}

// 실패
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 에러 코드 목록

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `EMAIL_ALREADY_EXISTS` | 이메일 중복 | 200 (응답 내 error) |
| `INVALID_CREDENTIALS` | 로그인 실패 | 200 (응답 내 error) |
| `TOKEN_EXPIRED` | 토큰 만료 | 200 (응답 내 error) |
| `INVALID_TOKEN` | 유효하지 않은 토큰 | 200 (응답 내 error) |
| `USER_NOT_FOUND` | 사용자 없음 | 200 (응답 내 error) |
| `UNAUTHORIZED` | 인증 필요 | 401 |
| `INTERNAL_ERROR` | 서버 에러 | 200 (응답 내 error) |

### 프론트엔드 에러 처리 예제

```typescript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const result = await response.json();

if (!result.success) {
  // 에러 처리
  switch (result.error.code) {
    case 'INVALID_CREDENTIALS':
      alert('이메일 또는 비밀번호가 잘못되었습니다.');
      break;
    case 'USER_NOT_FOUND':
      alert('등록되지 않은 사용자입니다.');
      break;
    default:
      alert(result.error.message);
  }
  return;
}

// 성공 처리
const { userId, accessToken, refreshToken } = result.data;
localStorage.setItem('access_token', accessToken);
```

---

## 데이터 타입 정의

### 1. 회원가입 (POST /auth/register)

**Request:**
```typescript
interface RegisterRequest {
  email: string;           // 이메일 (필수)
  password: string;        // 비밀번호 (필수)
  name: string;            // 이름 (필수)
  university?: string;     // 학교 (선택)
  major?: string;          // 전공 (선택)
  studentId?: string;      // 학번 (선택)
  targetJob?: string;      // 희망 직무 (선택)
}
```

**Response:**
```typescript
interface RegisterResponse {
  success: true;
  data: {
    userId: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
  };
  error: null;
}
```

### 2. 로그인 (POST /auth/login)

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  success: true;
  data: {
    userId: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
  };
  error: null;
}
```

### 3. 내 정보 조회 (GET /users/me)

**Response:**
```typescript
interface UserMeResponse {
  success: true;
  data: {
    id: string;
    email: string;
    name: string;
    university: string | null;
    major: string | null;
    profileImage: string | null;
    baselineMood: 'tired' | 'neutral' | 'positive' | null;
    stats: {
      totalActivities: number;
      totalLogs: number;
      streak: number;
    };
    createdAt: string;  // ISO 8601
  };
  error: null;
}
```

### 4. 초라이트 기록 작성 (POST /api/reflections/micro)

**Request:**
```typescript
interface MicroLogRequest {
  activity_type: 'contest' | 'club' | 'project' | 'internship' | 'study' | 'etc';
  memo?: string;                    // 최대 500자
  mood_compare: 'worse' | 'same' | 'better';
  reason?: string;                  // mood_compare가 'same'이 아니면 필수
  tags?: string[];                  // AI 제안 또는 사용자 선택
  date: string;                     // YYYY-MM-DD
}

// reason 코드
type PositiveReason = 
  | 'positive_001'  // 사람들과 의견 주고받는 게 재밌었다
  | 'positive_002'  // 새로운 걸 배우는 게 신났다
  | 'positive_003'  // 내가 잘하는 걸 발휘할 수 있었다
  | 'positive_004'  // 누군가에게 도움이 되는 게 뿌듯했다
  | 'positive_005'  // 일이 술술 풀렸다
  | 'positive_006'; // 성과를 인정받았다

type NegativeReason =
  | 'negative_001'  // 생각보다 잘 안 풀렸다
  | 'negative_002'  // 사람들이랑 의견이 안 맞았다
  | 'negative_003'  // 시간이 오래 걸렸다
  | 'negative_004'  // 내가 못하는 부분이 드러났다
  | 'negative_005'  // 하기 싫은데 억지로 했다
  | 'negative_006'; // 결과가 기대에 못 미쳤다
```

**Response:**
```typescript
interface MicroLogResponse {
  success: true;
  data: {
    id: string;
    user_id: string;
    activity_type: string;
    memo: string | null;
    mood_compare: string;
    reason: string | null;
    tags: string[];
    date: string;
    created_at: string;
  };
  error: null;
}
```

### 5. 회고 통계 (GET /api/reflections/stats?period=week)

**Query Parameters:**
- `period`: `week` | `month` (기본값: week)

**Response:**
```typescript
interface StatsResponse {
  success: true;
  data: {
    period: 'week' | 'month';
    total_logs: number;
    positive_logs: number;
    neutral_logs: number;
    negative_logs: number;
    growth_trend: number;           // -100 ~ 100 (%)
    most_active_type: string | null;
    activity_distribution: {
      [key: string]: number;        // 예: { "club": 5, "project": 3 }
    };
    top_tags: Array<{
      tag: string;
      count: number;
    }>;
  };
  error: null;
}
```

### 6. 스토리 뷰 (GET /api/reflections/story?period=week)

**Query Parameters:**
- `period`: `week` | `month` | `quarter` (기본값: week)

**Response:**
```typescript
interface StoryResponse {
  success: true;
  data: {
    period_label: string;           // "이번 주"
    total_days: number;
    activity_summary: Array<{
      type: string;
      count: number;
      icon: string;                 // 이모지
      label: string;
    }>;
    positive_patterns: string[];    // 긍정 패턴 문장들
    negative_patterns: string[];    // 부정 패턴 문장들
    strength_analysis: string;      // 강점 분석 문장
    suggested_tracks: Array<{
      track: string;
      score: number;                // 0-100
      reason: string;
    }>;
    next_suggestion: {
      title: string;
      description: string;
      action: string;
      recommended_activities: any[];
    };
  };
  error: null;
}
```

### 7. AI 태그 제안 (POST /api/ai/suggest-tags)

**Request:**
```typescript
interface TagSuggestionRequest {
  activity_type: string;
  memo: string;
}
```

**Response:**
```typescript
interface TagSuggestionResponse {
  success: true;
  data: {
    tags: string[];                 // 최대 5개
  };
  error: null;
}
```

---

## 실제 사용 예제

### 예제 1: 회원가입 → 로그인 → 정보 조회

```typescript
// 1. 회원가입
async function register() {
  const response = await fetch('http://localhost:8000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'test1234',
      name: '홍길동',
      university: '서울대학교',
      major: '경영학과'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('access_token', result.data.accessToken);
    localStorage.setItem('refresh_token', result.data.refreshToken);
    localStorage.setItem('x-user-id', result.data.userId);
    console.log('회원가입 성공:', result.data);
  } else {
    console.error('회원가입 실패:', result.error);
  }
}

// 2. 로그인
async function login() {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'test1234'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('access_token', result.data.accessToken);
    localStorage.setItem('refresh_token', result.data.refreshToken);
    localStorage.setItem('x-user-id', result.data.userId);
    console.log('로그인 성공:', result.data);
  }
}

// 3. 내 정보 조회
async function getMyInfo() {
  const response = await fetch('http://localhost:8000/users/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('내 정보:', result.data);
    return result.data;
  }
}
```

### 예제 2: 회고 작성 플로우

```typescript
// 1. 베이스라인 무드 설정 (최초 1회)
async function setBaselineMood() {
  const response = await fetch('http://localhost:8000/users/baseline-mood', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      baseline_mood: 'neutral'  // 'tired' | 'neutral' | 'positive'
    })
  });
  
  const result = await response.json();
  console.log('베이스라인 무드 설정:', result);
}

// 2. AI 태그 제안 받기
async function getSuggestedTags(activityType: string, memo: string) {
  const response = await fetch('http://localhost:8000/api/ai/suggest-tags', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      activity_type: activityType,
      memo: memo
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('제안된 태그:', result.data.tags);
    return result.data.tags;
  }
}

// 3. 초라이트 기록 작성
async function createMicroLog() {
  const response = await fetch('http://localhost:8000/api/reflections/micro', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      activity_type: 'club',
      memo: '오늘 동아리 회의에서 새 프로젝트 기획안을 발표했다',
      mood_compare: 'better',
      reason: 'positive_001',
      tags: ['기획', '발표', '협업'],
      date: '2025-11-22'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('기록 작성 성공:', result.data);
  }
}

// 4. 회고 통계 조회
async function getStats() {
  const response = await fetch('http://localhost:8000/api/reflections/stats?period=week', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('주간 통계:', result.data);
    return result.data;
  }
}

// 5. 스토리 뷰 조회
async function getStory() {
  const response = await fetch('http://localhost:8000/api/reflections/story?period=week', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('주간 스토리:', result.data);
    return result.data;
  }
}
```

### 예제 3: React Hook 예제

```typescript
// useAuth.ts
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.data);
      } else {
        // 토큰 만료 또는 유효하지 않음
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('x-user-id');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);
      localStorage.setItem('x-user-id', result.data.userId);
      setUser(result.data);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('x-user-id');
    setUser(null);
  }

  return { user, loading, login, logout, checkAuth };
}
```

---

## 자주 발생하는 404 에러 해결

### 1. `/api/projects` - 404 에러

**원인**: 아직 구현되지 않음

**임시 해결책** (프론트엔드):
```typescript
async function getProjects() {
  try {
    const response = await fetch('http://localhost:8000/api/projects?status=active&limit=4', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    });
    
    if (response.status === 404) {
      // 임시 데이터 반환
      return {
        success: true,
        data: {
          projects: []
        }
      };
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: true,
      data: { projects: [] }
    };
  }
}
```

### 2. `/api/recommendations/activities` - 404 에러

**원인**: 아직 구현되지 않음

**임시 해결책**:
```typescript
async function getRecommendations() {
  try {
    const response = await fetch('http://localhost:8000/api/recommendations/activities?sort=recommended&limit=20', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    });
    
    if (response.status === 404) {
      return {
        success: true,
        data: {
          activities: []
        }
      };
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: true,
      data: { activities: [] }
    };
  }
}
```

### 3. `/api/templates/kpt` - 404 에러

**원인**: 아직 구현되지 않음

**임시 해결책** (프론트엔드에서 하드코딩):
```typescript
const KPT_TEMPLATE = {
  id: 'kpt',
  name: 'KPT 회고',
  questions: [
    {
      id: 1,
      text: 'Keep: 계속할 것',
      placeholder: '잘했던 점, 유지하고 싶은 것을 작성하세요'
    },
    {
      id: 2,
      text: 'Problem: 문제점',
      placeholder: '어려웠던 점, 개선이 필요한 것을 작성하세요'
    },
    {
      id: 3,
      text: 'Try: 시도할 것',
      placeholder: '다음에 시도해볼 것을 작성하세요'
    }
  ]
};
```

### 4. 경로 수정 가이드

기존 프론트엔드 코드에서 경로 수정이 필요한 경우:

```typescript
// ❌ 잘못된 경로 (404 발생)
'/api/v1/auth/login'
'/api/v1/users/me'
'/api/v1/reflections/micro'

// ✅ 올바른 경로
'/auth/login'
'/users/me'
'/api/reflections/micro'
```

**규칙**:
- 인증 관련: `/auth/*` (v1 제거)
- 사용자 관련: `/users/*` (v1 제거)
- 나머지: `/api/*` (v1 제거)

---

## 디버깅 팁

### 1. API 호출 디버깅

```typescript
async function debugFetch(url: string, options: RequestInit = {}) {
  console.log('🚀 API 요청:', url);
  console.log('📤 요청 옵션:', options);
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  console.log('📥 응답 상태:', response.status);
  console.log('📥 응답 데이터:', result);
  
  return result;
}

// 사용
const result = await debugFetch('http://localhost:8000/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. 네트워크 에러 vs 404 에러 구분

```typescript
async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 404) {
      console.warn('⚠️ 404: 엔드포인트가 존재하지 않습니다:', url);
      return { success: false, error: { code: 'NOT_FOUND', message: '404 Not Found' } };
    }
    
    return await response.json();
  } catch (error) {
    console.error('🔥 네트워크 에러:', error);
    return { success: false, error: { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다' } };
  }
}
```

### 3. Swagger UI로 테스트

백엔드 서버가 실행 중일 때:
1. 브라우저에서 http://localhost:8000/api/docs 접속
2. 각 엔드포인트 클릭
3. "Try it out" 클릭
4. 파라미터 입력 후 "Execute" 클릭
5. 응답 확인

---

## CORS 이슈 해결

프론트엔드 포트가 3000이 아닌 경우 백엔드 `.env` 파일 수정:

```env
# 프론트엔드 포트 추가
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

서버 재시작 필요.

---

## 요약

### ✅ 사용 가능한 주요 API

1. **인증**: `/auth/register`, `/auth/login`, `/auth/logout`
2. **사용자**: `/users/me`, `/users/baseline-mood`
3. **회고**: `/api/reflections/micro`, `/api/reflections/stats`, `/api/reflections/story`
4. **AI**: `/api/ai/suggest-tags`

### ❌ 미구현 API (404 발생)

- `/api/projects/*`
- `/api/recommendations/activities`
- `/api/templates/*`
- `/api/logs/*` (대신 `/api/reflections/micro` 사용)

### 📝 체크리스트

- [ ] 백엔드 서버 실행 (`python run.py`)
- [ ] `.env` 파일 설정 확인
- [ ] CORS 설정 확인 (프론트엔드 포트 포함)
- [ ] API 경로에 `/api/v1` 제거
- [ ] Authorization 헤더 또는 x-user-id 헤더 포함
- [ ] 404 에러 발생 시 임시 데이터 처리

---

**문의사항이나 추가 구현이 필요한 API가 있다면 백엔드 팀에 요청해주세요!** 🚀
