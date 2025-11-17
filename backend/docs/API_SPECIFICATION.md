# ProoF 프론트엔드 → 백엔드 API 명세서

**작성일**: 2025년 11월 14일  
**목적**: 프론트엔드가 백엔드에 요청하는 API 엔드포인트 및 데이터 형식 정의

---

## 📌 기본 정보

### Base URL
```
http://localhost:8000
```

### 인증 방식
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

### 공통 응답 형식
```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string
  } | null
}
```

---

## 🔐 1. 인증 (Authentication)

### 1.1 회원가입
**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과",
  "studentId": "2021-12345",        // 선택
  "targetJob": "마케팅"              // 선택
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동",
    "accessToken": "jwt-token-string",
    "refreshToken": "refresh-token-string"
  }
}
```

**프론트엔드 저장**:
- `localStorage.setItem('access_token', accessToken)`
- `localStorage.setItem('refresh_token', refreshToken)`
- `localStorage.setItem('x-user-id', userId)`

---

### 1.2 로그인
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동",
    "accessToken": "jwt-token-string",
    "refreshToken": "refresh-token-string"
  }
}
```

---

### 1.3 로그아웃
**Endpoint**: `POST /auth/logout`

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": null
}
```

---

### 1.4 토큰 갱신
**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token-string"
  }
}
```

---

## 👤 2. 사용자 (User)

### 2.1 내 정보 조회
**Endpoint**: `GET /user/me`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과",
    "profileImage": "https://...",
    "stats": {
      "totalActivities": 12,
      "totalLogs": 45,
      "streak": 7
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2.2 프로필 수정
**Endpoint**: `PUT /user/me`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Request Body**:
```json
{
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과",
  "profileImage": "base64-string-or-url"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과",
    "profileImage": "https://..."
  }
}
```

---

## 🎯 3. 추천 활동 (Recommendations)

### 3.1 추천 활동 목록 조회
**Endpoint**: `GET /recommendations`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Query Parameters**:
```
?page=1
&limit=20
&category=contest|club|project|internship
&field=기획/전략|마케팅|재무/회계|인사/HR|운영/SCM|영업|데이터분석|경영/사업
&sortBy=recommended|deadline|recent
&search=검색어
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-string",
        "title": "2024 마케팅 공모전",
        "category": "contest",
        "field": "마케팅",
        "organization": "주최기관명",
        "description": "공모전 설명...",
        "deadline": "2024-12-31T23:59:59Z",
        "url": "https://...",
        "tags": ["마케팅", "브랜딩", "SNS"],
        "benefits": ["상금 500만원", "인턴 기회"],
        "isRecommended": true,
        "matchScore": 95,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 3.2 추천 활동 상세 조회
**Endpoint**: `GET /recommendations/{activityId}`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "2024 마케팅 공모전",
    "category": "contest",
    "field": "마케팅",
    "organization": "주최기관명",
    "description": "공모전 상세 설명...",
    "deadline": "2024-12-31T23:59:59Z",
    "url": "https://...",
    "tags": ["마케팅", "브랜딩", "SNS"],
    "benefits": ["상금 500만원", "인턴 기회"],
    "requirements": "지원 자격...",
    "schedule": "진행 일정...",
    "contact": "문의처...",
    "isRecommended": true,
    "matchScore": 95,
    "relatedActivities": ["uuid-1", "uuid-2"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 📝 4. 활동 로그 (Logs)

### 4.1 로그 목록 조회
**Endpoint**: `GET /logs`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Query Parameters**:
```
?page=1
&limit=20
&activityId=uuid-string
&startDate=2024-01-01
&endDate=2024-12-31
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid-string",
        "activityId": "uuid-string",
        "content": "오늘 한 일...",
        "reflections": "배운 점...",
        "tags": ["기획", "데이터분석"],
        "date": "2024-11-14",
        "createdAt": "2024-11-14T10:00:00Z",
        "updatedAt": "2024-11-14T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 4.2 로그 상세 조회
**Endpoint**: `GET /logs/{logId}`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "activityId": "uuid-string",
    "content": "오늘 한 일...",
    "reflections": "배운 점...",
    "tags": ["기획", "데이터분석"],
    "date": "2024-11-14",
    "createdAt": "2024-11-14T10:00:00Z",
    "updatedAt": "2024-11-14T10:00:00Z"
  }
}
```

---

### 4.3 로그 생성
**Endpoint**: `POST /logs`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "activityId": "uuid-string",
  "content": "오늘 마케팅 공모전 기획서를 작성했습니다...",
  "reflections": "타겟 고객 분석이 중요하다는 것을 배웠습니다...",
  "tags": ["기획", "마케팅"],
  "date": "2024-11-14"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "activityId": "uuid-string",
    "content": "오늘 마케팅 공모전 기획서를 작성했습니다...",
    "reflections": "타겟 고객 분석이 중요하다는 것을 배웠습니다...",
    "tags": ["기획", "마케팅"],
    "date": "2024-11-14",
    "createdAt": "2024-11-14T10:00:00Z",
    "updatedAt": "2024-11-14T10:00:00Z"
  }
}
```

---

### 4.4 로그 수정
**Endpoint**: `PUT /logs/{logId}`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
Content-Type: application/json
```

**Request Body** (수정할 필드만 전송):
```json
{
  "content": "수정된 내용...",
  "reflections": "수정된 배운 점...",
  "tags": ["기획", "전략"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "activityId": "uuid-string",
    "content": "수정된 내용...",
    "reflections": "수정된 배운 점...",
    "tags": ["기획", "전략"],
    "date": "2024-11-14",
    "createdAt": "2024-11-14T10:00:00Z",
    "updatedAt": "2024-11-14T15:30:00Z"
  }
}
```

---

### 4.5 로그 삭제
**Endpoint**: `DELETE /logs/{logId}`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": null
}
```

---

## 🏃 5. 활동 관리 (Activities)

### 5.1 내 활동 목록 조회
**Endpoint**: `GET /activities`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Query Parameters**:
```
?page=1
&limit=20
&status=planned|ongoing|completed
&category=contest|club|project|internship
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-string",
        "recommendationId": "uuid-string",
        "title": "2024 마케팅 공모전",
        "category": "contest",
        "field": "마케팅",
        "status": "ongoing",
        "startDate": "2024-11-01",
        "endDate": "2024-12-31",
        "progress": 65,
        "totalLogs": 8,
        "createdAt": "2024-11-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

---

### 5.2 활동 등록 (추천 활동 → 내 활동)
**Endpoint**: `POST /activities`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "recommendationId": "uuid-string",
  "title": "2024 마케팅 공모전",
  "category": "contest",
  "field": "마케팅",
  "startDate": "2024-11-01",
  "endDate": "2024-12-31",
  "goal": "우수상 수상"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "recommendationId": "uuid-string",
    "title": "2024 마케팅 공모전",
    "category": "contest",
    "field": "마케팅",
    "status": "planned",
    "startDate": "2024-11-01",
    "endDate": "2024-12-31",
    "goal": "우수상 수상",
    "progress": 0,
    "createdAt": "2024-11-01T00:00:00Z"
  }
}
```

---

### 5.3 활동 상태 변경
**Endpoint**: `PATCH /activities/{activityId}/status`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "ongoing" | "completed" | "cancelled"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "completed",
    "updatedAt": "2024-12-31T23:59:59Z"
  }
}
```

---

## 📊 6. 통계 (Statistics)

### 6.1 내 통계 조회
**Endpoint**: `GET /stats`

**Headers**:
```http
Authorization: Bearer {access_token}
x-user-id: {userId}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalActivities": 12,
    "ongoingActivities": 3,
    "completedActivities": 9,
    "totalLogs": 45,
    "currentStreak": 7,
    "longestStreak": 14,
    "categoryCounts": {
      "contest": 5,
      "club": 3,
      "project": 2,
      "internship": 2
    },
    "fieldCounts": {
      "마케팅": 8,
      "기획/전략": 4
    },
    "monthlyActivity": [
      { "month": "2024-11", "logs": 12 },
      { "month": "2024-10", "logs": 15 }
    ]
  }
}
```

---

## ⚠️ 에러 코드

### HTTP Status Codes
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 중복 (이메일 등)
- `500 Internal Server Error`: 서버 오류

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

### 주요 에러 코드
- `EMAIL_ALREADY_EXISTS`: 이미 존재하는 이메일
- `INVALID_CREDENTIALS`: 잘못된 인증 정보
- `TOKEN_EXPIRED`: 토큰 만료
- `INVALID_TOKEN`: 유효하지 않은 토큰
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ACTIVITY_NOT_FOUND`: 활동을 찾을 수 없음
- `LOG_NOT_FOUND`: 로그를 찾을 수 없음
- `UNAUTHORIZED_ACCESS`: 권한 없는 접근

---

## 🔄 프론트엔드 → 백엔드 매핑

### 카테고리 (Activity Category)
| 프론트엔드 | 백엔드 |
|-----------|--------|
| contest | contest |
| club | club |
| project | project |
| internship | internship |

### 분야 (Field)
| 프론트엔드 | 백엔드 |
|-----------|--------|
| 기획/전략 | 기획/전략 |
| 마케팅 | 마케팅 |
| 재무/회계 | 재무/회계 |
| 인사/HR | 인사/HR |
| 운영/SCM | 운영/SCM |
| 영업 | 영업 |
| 데이터분석 | 데이터분석 |
| 경영/사업 | 경영/사업 |

### 정렬 옵션 (Sort By)
| 프론트엔드 | 백엔드 |
|-----------|--------|
| recommended | recommended |
| deadline | deadline |
| recent | recent |

---

## 📝 참고사항

1. **타임존**: 모든 날짜/시간은 UTC 기준 ISO 8601 형식
2. **페이지네이션**: 기본 page=1, limit=20
3. **인증**: JWT Bearer 토큰 + x-user-id 헤더 병행
4. **CORS**: `withCredentials: true` 설정 필요
5. **Timeout**: 30초

---

**문의**: 추가 엔드포인트나 수정사항은 프론트엔드 개발자에게 연락주세요.
