# ProoF 백엔드 API 요구사항

## 개요
ProoF 서비스의 백엔드 API 명세서입니다. Next.js 14 프론트엔드와 Node.js + Express 백엔드를 위한 RESTful API 설계이며, JWT 기반 인증을 사용합니다.

---

## 기술 스택

### 백엔드
- **런타임**: Node.js 20 LTS
- **프레임워크**: Express.js 4.18+
- **언어**: TypeScript 5.3+
- **ORM**: Prisma 5.8+
- **데이터베이스**: PostgreSQL 16
- **캐시**: Redis 7
- **AI**: OpenAI GPT-4 Turbo API

### 프론트엔드 연동
- **프레임워크**: Next.js 14 (App Router)
- **HTTP 클라이언트**: Axios 1.6+
- **상태 관리**: TanStack Query (React Query) 5.17+
- **폼 관리**: React Hook Form + Zod

---

## 기본 정보

### Base URL
```
로컬 개발: http://localhost:5000/api/v1
프로덕션: https://api.proof.app/v1
```

### Next.js API Routes (선택적)
```
/api/auth/*         - 인증 관련 (Next.js API Routes)
/api/webhooks/*     - 웹훅 처리 (Next.js API Routes)
```

### 인증
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer {access_token}`
- **Token 유효기간**: 
  - Access Token: 15분 (보안 강화)
  - Refresh Token: 7일
- **저장 위치**: 
  - Access Token: HTTP-only 쿠키 또는 메모리
  - Refresh Token: HTTP-only 쿠키 (XSS 방어)

### 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2025-11-13T10:00:00Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2025-11-13T10:00:00Z"
}
```

### CORS 설정
```javascript
// Express CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL, // http://localhost:3000
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

## 1. 인증 (Authentication)

### 1.1 회원가입
```http
POST /auth/register
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과",
  "studentId": "2021123456",
  "targetJob": "전략기획"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 1.2 로그인
```http
POST /auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 1.3 토큰 갱신
```http
POST /auth/refresh
```

**Request Body**
```json
{
  "refreshToken": "refresh_token"
}
```

### 1.4 로그아웃
```http
POST /auth/logout
```

---

## 2. 사용자 (User)

### 2.1 프로필 조회
```http
GET /users/me
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과",
    "studentId": "2021123456",
    "targetJob": "전략기획",
    "profileImage": "https://...",
    "createdAt": "2025-01-01T00:00:00Z",
    "stats": {
      "totalLogs": 45,
      "totalProjects": 8,
      "totalKeywords": 12
    }
  }
}
```

### 2.2 프로필 수정
```http
PATCH /users/me
```

**Request Body**
```json
{
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과",
  "targetJob": "마케팅"
}
```

### 2.3 프로필 이미지 업로드
```http
POST /users/me/profile-image
Content-Type: multipart/form-data
```

**Form Data**
- `image`: File (최대 5MB, JPG/PNG)

---

## 3. 경험 로그 (Log)

### 3.1 로그 생성 (AI Ghostwriter)
```http
POST /logs
```

**Request Body**
```json
{
  "text": "오늘 학회 회의에서 데이터 분석안 다 갈아엎음... #힘듦 #전략기획",
  "tags": ["힘듦", "전략기획", "분석"],
  "projectId": "uuid or null",
  "date": "2025-11-13"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "logId": "uuid",
    "originalText": "오늘 학회 회의에서...",
    "aiGeneratedReflection": "초기 데이터 분석 결과 X 가설이 틀렸음을 발견하고...",
    "suggestedKeywords": [
      {
        "keyword": "기획력",
        "confidence": 0.92,
        "category": "전략기획"
      },
      {
        "keyword": "문제정의",
        "confidence": 0.88,
        "category": "전략기획"
      },
      {
        "keyword": "데이터분석",
        "confidence": 0.85,
        "category": "분석"
      }
    ],
    "suggestedProjects": [
      {
        "projectId": "uuid",
        "projectName": "2025 마케팅 공모전",
        "matchScore": 0.78
      }
    ],
    "tags": ["힘듦", "전략기획", "분석"],
    "date": "2025-11-13",
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

### 3.2 로그 목록 조회
```http
GET /logs?page=1&limit=20&projectId=uuid&startDate=2025-01-01&endDate=2025-12-31
```

**Query Parameters**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20, 최대: 100)
- `projectId`: 프로젝트 필터 (선택)
- `startDate`: 시작 날짜 (선택)
- `endDate`: 종료 날짜 (선택)
- `tags`: 태그 필터 (선택, 쉼표 구분)

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "uuid",
        "text": "...",
        "reflection": "...",
        "tags": [],
        "keywords": [],
        "date": "2025-11-13",
        "projectId": "uuid",
        "projectName": "프로젝트명",
        "createdAt": "2025-11-13T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20
    }
  }
}
```

### 3.3 로그 상세 조회
```http
GET /logs/:logId
```

### 3.4 로그 수정
```http
PATCH /logs/:logId
```

**Request Body**
```json
{
  "text": "수정된 내용",
  "reflection": "수정된 회고",
  "tags": ["새태그"],
  "projectId": "uuid"
}
```

### 3.5 로그 삭제
```http
DELETE /logs/:logId
```

### 3.6 로그에 키워드 추가 (Lv.1)
```http
POST /logs/:logId/keywords
```

**Request Body**
```json
{
  "keywordIds": ["uuid1", "uuid2"]
}
```

---

## 4. 프로젝트 (Project)

### 4.1 프로젝트 생성
```http
POST /projects
```

**Request Body**
```json
{
  "title": "2025 마케팅 전략 공모전",
  "description": "공모전 설명",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  "type": "contest",
  "tags": ["마케팅", "전략"]
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "title": "2025 마케팅 전략 공모전",
    "description": "공모전 설명",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "type": "contest",
    "tags": ["마케팅", "전략"],
    "status": "active",
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

### 4.2 프로젝트 목록 조회
```http
GET /projects?page=1&limit=20&status=active
```

**Query Parameters**
- `status`: active, completed, archived
- `type`: contest, club, internship, project

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "projectId": "uuid",
        "title": "프로젝트명",
        "description": "설명",
        "startDate": "2025-01-01",
        "endDate": "2025-03-31",
        "status": "active",
        "type": "contest",
        "tags": [],
        "stats": {
          "totalLogs": 15,
          "totalKeywords": 8,
          "teamMembers": 3
        },
        "thumbnail": "https://...",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 8
    }
  }
}
```

### 4.3 프로젝트 상세 조회
```http
GET /projects/:projectId
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "title": "프로젝트명",
    "description": "설명",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "status": "completed",
    "type": "contest",
    "tags": ["마케팅", "전략"],
    "aiSummary": "AI가 생성한 프로젝트 요약",
    "timeline": [
      {
        "logId": "uuid",
        "date": "2025-01-15",
        "title": "킥오프 미팅",
        "summary": "...",
        "isKeyEvent": true
      }
    ],
    "keywords": [
      {
        "keywordId": "uuid",
        "name": "기획력",
        "level": 2,
        "relatedLogsCount": 5
      }
    ],
    "teamMembers": [
      {
        "userId": "uuid",
        "name": "홍길동",
        "role": "기획 리드",
        "profileImage": "https://..."
      }
    ],
    "evidence": [
      {
        "evidenceId": "uuid",
        "type": "certificate",
        "fileName": "수상증명서.pdf",
        "fileUrl": "https://...",
        "uploadedAt": "2025-04-01T00:00:00Z"
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### 4.4 프로젝트 타임라인 조회
```http
GET /projects/:projectId/timeline
```

### 4.5 프로젝트 요약 생성 (AI)
```http
POST /projects/:projectId/generate-summary
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "summary": "AI가 생성한 프로젝트 전체 요약",
    "keyInsights": [
      "핵심 인사이트 1",
      "핵심 인사이트 2"
    ],
    "challengesAndSolutions": [
      {
        "challenge": "문제 상황",
        "solution": "해결 방법"
      }
    ]
  }
}
```

### 4.6 프로젝트 수정
```http
PATCH /projects/:projectId
```

### 4.7 프로젝트 삭제
```http
DELETE /projects/:projectId
```

### 4.8 팀원 초대
```http
POST /projects/:projectId/invite
```

**Request Body**
```json
{
  "email": "teammate@example.com",
  "role": "팀원"
}
```

---

## 5. 역량 키워드 (Keyword)

### 5.1 키워드 마스터 목록
```http
GET /keywords?category=전략기획
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keywordId": "uuid",
        "name": "기획력",
        "category": "전략기획",
        "description": "문제를 정의하고 해결 방안을 제시하는 능력",
        "relatedKeywords": ["문제정의", "솔루션기획"]
      }
    ]
  }
}
```

### 5.2 내 키워드 목록 (역량 보드)
```http
GET /users/me/keywords
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keywordId": "uuid",
        "name": "기획력",
        "category": "전략기획",
        "level": 3,
        "relatedLogsCount": 12,
        "relatedProjectsCount": 4,
        "lastUsedAt": "2025-11-13",
        "evidence": [
          {
            "type": "peer_endorsement",
            "count": 2
          },
          {
            "type": "certificate",
            "count": 1
          }
        ],
        "growthData": [
          {
            "date": "2025-01",
            "count": 2
          },
          {
            "date": "2025-02",
            "count": 5
          }
        ]
      }
    ]
  }
}
```

### 5.3 키워드 상세 (관련 로그/프로젝트)
```http
GET /keywords/:keywordId/details
```

---

## 6. 역량 검증 (Verification)

### 6.1 동료 인증 요청 (Lv.2)
```http
POST /verifications/peer-endorsement
```

**Request Body**
```json
{
  "projectId": "uuid",
  "recipientEmail": "peer@example.com",
  "keywordIds": ["uuid1", "uuid2"],
  "message": "함께 프로젝트 진행했던 부분 확인 부탁드립니다."
}
```

### 6.2 동료 인증 승인/거부
```http
PATCH /verifications/peer-endorsement/:endorsementId
```

**Request Body**
```json
{
  "action": "approve",
  "confirmedKeywords": ["uuid1", "uuid2"],
  "role": "기획 리드",
  "comment": "함께 기획 작업 진행했습니다."
}
```

### 6.3 증명서 업로드 (Lv.3)
```http
POST /verifications/evidence
Content-Type: multipart/form-data
```

**Form Data**
- `file`: PDF/JPG/PNG (최대 10MB)
- `projectId`: uuid
- `keywordIds`: ["uuid1", "uuid2"]
- `type`: certificate, internship, award

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "evidenceId": "uuid",
    "fileName": "수상증명서.pdf",
    "fileUrl": "https://...",
    "ocrResult": {
      "extractedText": "최우수상\n홍길동\n2025 마케팅 전략 공모전",
      "detectedInfo": {
        "awardName": "최우수상",
        "recipientName": "홍길동",
        "contestName": "2025 마케팅 전략 공모전",
        "date": "2025-04-01"
      },
      "confidence": 0.95
    },
    "verifiedKeywords": [
      {
        "keywordId": "uuid",
        "name": "기획력",
        "upgradedToLevel": 3
      }
    ],
    "uploadedAt": "2025-11-13T10:00:00Z"
  }
}
```

### 6.4 증명서 OCR 재처리
```http
POST /verifications/evidence/:evidenceId/reprocess
```

---

## 7. 포트폴리오 (Portfolio)

### 7.1 포트폴리오 생성
```http
POST /portfolios
```

**Request Body**
```json
{
  "title": "전략기획 직무 포트폴리오",
  "targetJob": "전략기획",
  "projectIds": ["uuid1", "uuid2", "uuid3"],
  "includedKeywords": ["uuid1", "uuid2"],
  "template": "professional",
  "settings": {
    "includePhoto": true,
    "includeContactInfo": true,
    "includePeerEndorsements": true,
    "includeEvidence": true
  }
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "portfolioId": "uuid",
    "title": "전략기획 직무 포트폴리오",
    "status": "generating",
    "estimatedTime": 30,
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

### 7.2 포트폴리오 생성 상태 확인
```http
GET /portfolios/:portfolioId/status
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "portfolioId": "uuid",
    "status": "completed",
    "progress": 100,
    "pdfUrl": "https://...",
    "webUrl": "https://proof.app/portfolio/uuid",
    "generatedAt": "2025-11-13T10:05:00Z"
  }
}
```

### 7.3 포트폴리오 목록 조회
```http
GET /portfolios
```

### 7.4 포트폴리오 다운로드
```http
GET /portfolios/:portfolioId/download
```

### 7.5 포트폴리오 공유 링크 생성
```http
POST /portfolios/:portfolioId/share
```

**Request Body**
```json
{
  "expiresIn": 30,
  "password": "optional_password",
  "allowDownload": true
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "shareUrl": "https://proof.app/share/abcdef123456",
    "expiresAt": "2025-12-13T10:00:00Z",
    "isPasswordProtected": false
  }
}
```

---

## 8. AI 서비스

### 8.1 AI 회고 생성 (스트리밍)
```http
POST /ai/generate-reflection/stream
Content-Type: application/json
```

**Request Body**
```json
{
  "text": "오늘 한 일",
  "context": {
    "previousLogs": ["이전 로그 텍스트"],
    "projectContext": "프로젝트 정보"
  }
}
```

**Response (Server-Sent Events)**
```
data: {"type": "start", "message": "회고 생성 시작"}

data: {"type": "chunk", "content": "초기 데이터 분석 결과"}

data: {"type": "chunk", "content": " X 가설이 틀렸음을 발견하고"}

data: {"type": "keywords", "keywords": ["기획력", "문제정의"]}

data: {"type": "complete", "fullText": "..."}
```

### 8.2 키워드 추천
```http
POST /ai/suggest-keywords
```

**Request Body**
```json
{
  "text": "회고 내용",
  "existingKeywords": ["기획력"]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "suggestedKeywords": [
      {
        "keywordId": "uuid",
        "name": "문제해결",
        "confidence": 0.89,
        "reason": "문제 상황 인식과 해결 과정이 드러남"
      }
    ]
  }
}
```

### 8.3 프로젝트 자동 매칭
```http
POST /ai/match-project
```

---

## 9. 알림 (Notification)

### 9.1 알림 목록
```http
GET /notifications?page=1&limit=20&unreadOnly=true
```

### 9.2 알림 읽음 처리
```http
PATCH /notifications/:notificationId/read
```

### 9.3 FCM 토큰 등록
```http
POST /notifications/fcm-token
```

**Request Body**
```json
{
  "token": "fcm_device_token",
  "platform": "android"
}
```

---

## 10. HR 기능 (Phase 2-3)

### 10.1 인재 검색
```http
GET /hr/candidates?keywords=기획력,데이터분석&minLevel=2
```

### 10.2 후보자 상세
```http
GET /hr/candidates/:userId
```

### 10.3 채용 공고 등록
```http
POST /hr/job-postings
```

---

## 11. 관리자 (Admin)

### 11.1 사용자 통계
```http
GET /admin/stats/users
```

### 11.2 키워드 관리
```http
POST /admin/keywords
PATCH /admin/keywords/:keywordId
DELETE /admin/keywords/:keywordId
```

---

## 에러 코드

### 인증 관련
- `AUTH001`: 유효하지 않은 토큰
- `AUTH002`: 토큰 만료
- `AUTH003`: 권한 없음
- `AUTH004`: 이메일 중복
- `AUTH005`: 잘못된 비밀번호

### 리소스 관련
- `RES001`: 리소스를 찾을 수 없음
- `RES002`: 중복된 리소스
- `RES003`: 리소스 접근 권한 없음

### 입력 검증
- `VAL001`: 필수 필드 누락
- `VAL002`: 잘못된 형식
- `VAL003`: 값 범위 초과

### 파일 업로드
- `FILE001`: 파일 크기 초과
- `FILE002`: 지원하지 않는 파일 형식
- `FILE003`: 파일 업로드 실패

### AI 서비스
- `AI001`: AI 서비스 오류
- `AI002`: AI 응답 시간 초과
- `AI003`: 할당량 초과

### 일반
- `SYS001`: 서버 내부 오류
- `SYS002`: 데이터베이스 오류
- `SYS003`: 외부 서비스 오류

---

## Rate Limiting

### 기본 제한
- **인증되지 않은 요청**: 분당 10회
- **인증된 요청**: 분당 60회
- **파일 업로드**: 시간당 20회
- **AI 요청**: 일당 100회

### 응답 헤더
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1699876543
```

---

## Webhook (Phase 2)

### AI 회고 생성 완료
```json
{
  "event": "reflection.generated",
  "logId": "uuid",
  "userId": "uuid",
  "timestamp": "2025-11-13T10:00:00Z"
}
```

### 동료 인증 요청
```json
{
  "event": "endorsement.requested",
  "endorsementId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "projectId": "uuid",
  "timestamp": "2025-11-13T10:00:00Z"
}
```

---

## 데이터베이스 스키마 (Prisma)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  university    String?
  major         String?
  studentId     String?
  targetJob     String?
  profileImage  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  logs          Log[]
  projects      Project[]
  userKeywords  UserKeyword[]
  endorsementsGiven    PeerEndorsement[] @relation("Endorser")
  endorsementsReceived PeerEndorsement[] @relation("Endorsed")
  portfolios    Portfolio[]
}

model Log {
  id              String   @id @default(uuid())
  userId          String
  text            String   @db.Text
  reflection      String?  @db.Text
  tags            String[]
  date            DateTime
  projectId       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  project         Project? @relation(fields: [projectId], references: [id])
  keywords        LogKeyword[]
}

model Project {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?  @db.Text
  startDate   DateTime
  endDate     DateTime?
  type        String
  status      String   @default("active")
  tags        String[]
  aiSummary   String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  logs        Log[]
  evidence    Evidence[]
  endorsements PeerEndorsement[]
}

model Keyword {
  id          String   @id @default(uuid())
  name        String   @unique
  category    String
  description String?  @db.Text
  
  userKeywords UserKeyword[]
  logKeywords  LogKeyword[]
}

model UserKeyword {
  id          String   @id @default(uuid())
  userId      String
  keywordId   String
  level       Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  keyword     Keyword  @relation(fields: [keywordId], references: [id])
  
  @@unique([userId, keywordId])
}

model LogKeyword {
  id        String @id @default(uuid())
  logId     String
  keywordId String
  
  log       Log     @relation(fields: [logId], references: [id])
  keyword   Keyword @relation(fields: [keywordId], references: [id])
  
  @@unique([logId, keywordId])
}

model Evidence {
  id          String   @id @default(uuid())
  userId      String
  projectId   String
  type        String
  fileName    String
  fileUrl     String
  ocrText     String?  @db.Text
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  
  project     Project  @relation(fields: [projectId], references: [id])
}

model PeerEndorsement {
  id          String   @id @default(uuid())
  fromUserId  String
  toUserId    String
  projectId   String
  role        String
  comment     String?  @db.Text
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  
  from        User     @relation("Endorser", fields: [fromUserId], references: [id])
  to          User     @relation("Endorsed", fields: [toUserId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
}

model Portfolio {
  id          String   @id @default(uuid())
  userId      String
  title       String
  targetJob   String
  pdfUrl      String?
  webUrl      String?
  status      String   @default("draft")
  settings    Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 환경 변수

### 백엔드 (.env)
```env
# App
NODE_ENV="development"
PORT="5000"
FRONTEND_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/proof"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# AI Services
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# Storage (Supabase 또는 AWS S3)
STORAGE_PROVIDER="supabase"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="..."
SUPABASE_BUCKET="proof-files"

# 또는 AWS S3
AWS_S3_BUCKET="proof-storage"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-northeast-2"

# FCM (Push Notifications)
FCM_SERVER_KEY="..."

# OCR
GOOGLE_VISION_API_KEY="..."

# Email (선택)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."

# Rate Limiting
RATE_LIMIT_WINDOW="15"  # 분
RATE_LIMIT_MAX_REQUESTS="100"
```

### 프론트엔드 (.env.local)
```env
# API 엔드포인트
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"

# Supabase (선택 - 직접 스토리지 접근 시)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Google Analytics (선택)
NEXT_PUBLIC_GA_ID="G-..."

# 환경
NEXT_PUBLIC_ENV="development"
```

---

## 업데이트 날짜
2025년 11월 13일
