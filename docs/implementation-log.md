# ProoF 백엔드 구현 로그

## 구현 일자
2025년 11월 13일

## 구현 완료 항목

### 1. 프로젝트 초기 설정
- ✅ Node.js + TypeScript + Express 프로젝트 스캐폴딩
- ✅ package.json 생성 (의존성 및 스크립트 설정)
- ✅ tsconfig.json 설정
- ✅ .env 환경 변수 파일 생성
- ✅ README.md 작성

### 2. 데이터베이스 설정
- ✅ Prisma ORM 설정
- ✅ SQLite 데이터베이스 (개발용)
- ✅ 스키마 정의 (User, Log, Project, Keyword, Evidence, PeerEndorsement, Portfolio)
- ✅ 초기 마이그레이션 실행 완료

### 3. 인증 시스템 구현
#### 구현된 API 엔드포인트:
- ✅ `POST /api/v1/auth/register` - 회원가입
- ✅ `POST /api/v1/auth/login` - 로그인
- ✅ `POST /api/v1/auth/refresh` - 토큰 갱신
- ✅ `POST /api/v1/auth/logout` - 로그아웃

#### 인증 기능:
- ✅ JWT 기반 인증 (Access Token + Refresh Token)
- ✅ bcryptjs를 이용한 비밀번호 해싱
- ✅ Bearer Token 인증 미들웨어
- ✅ HTTP-only 쿠키 지원
- ✅ 메모리 기반 Refresh Token 저장소 (데모용)

### 4. 사용자 관리
- ✅ `GET /api/v1/users/me` - 인증된 사용자 프로필 조회

### 5. 기본 인프라
- ✅ CORS 설정 (프론트엔드 연동 준비)
- ✅ 에러 핸들링 미들웨어
- ✅ 헬스체크 엔드포인트 (`GET /api/v1/health`)
- ✅ 환경 변수 관리

## 기술 스택

### 백엔드
- **런타임**: Node.js v22.19.0
- **프레임워크**: Express.js 4.21.2
- **언어**: TypeScript 5.9.3
- **ORM**: Prisma 5.22.0
- **데이터베이스**: SQLite (개발), PostgreSQL (프로덕션 권장)
- **인증**: JWT (jsonwebtoken 9.0.2)
- **암호화**: bcryptjs 2.4.3

### 개발 도구
- ts-node-dev (핫 리로드)
- cookie-parser (쿠키 파싱)
- dotenv (환경 변수)
- cors (CORS 설정)

## 프로젝트 구조

```
back/
├── docs/
│   ├── backend-requirements.md    # API 요구사항 명세
│   └── implementation-log.md      # 이 파일
├── prisma/
│   ├── schema.prisma              # Prisma 스키마
│   └── migrations/                # 마이그레이션 파일들
├── src/
│   ├── lib/
│   │   ├── jwt.ts                 # JWT 유틸리티
│   │   └── prisma.ts              # Prisma 클라이언트
│   ├── middleware/
│   │   └── auth.ts                # 인증 미들웨어
│   ├── routes/
│   │   ├── auth.ts                # 인증 라우트
│   │   └── users.ts               # 사용자 라우트
│   ├── app.ts                     # Express 앱 설정
│   ├── env.ts                     # 환경 변수 로더
│   └── index.ts                   # 서버 진입점
├── .env                           # 환경 변수 (gitignore)
├── .env.example                   # 환경 변수 예시
├── package.json
├── tsconfig.json
└── README.md
```

## 해결한 주요 문제

### 1. SQLite 호환성 문제
**문제**: Prisma 스키마의 PostgreSQL 전용 타입들이 SQLite에서 지원되지 않음
- `@db.Text` 타입
- `String[]` (배열)
- `Json` 타입

**해결**: 
- `@db.Text` → 일반 `String`으로 변경
- `String[]` → `String` (콤마 구분 문자열로 저장, 애플리케이션 레벨에서 파싱)
- `Json` → `String` (JSON.stringify/parse로 처리)

### 2. TypeScript 타입 오류
**문제**: jsonwebtoken의 expiresIn 옵션 타입 불일치

**해결**: `as any` 타입 캐스팅 추가
```typescript
jwt.sign(payload, secret, { expiresIn: "15m" } as any)
```

### 3. Express Request 타입 확장
**문제**: `req.cookies` 타입이 기본 Request에 없음

**해결**: `(req as any).cookies`로 타입 캐스팅

### 4. 패키지 타입 선언 누락
**문제**: @types/bcryptjs, @types/cors 누락

**해결**: devDependencies에 타입 선언 패키지 추가

## 테스트 결과

### API 테스트 (2025-11-13 23:56 KST)
모든 테스트 통과 ✅

1. **헬스체크**
   - `GET /api/v1/health` → 200 OK

2. **회원가입**
   - `POST /api/v1/auth/register`
   - 테스트 계정: test@example.com
   - 결과: 사용자 생성 성공, 토큰 발급

3. **로그인**
   - `POST /api/v1/auth/login`
   - 결과: Access Token 및 Refresh Token 발급

4. **인증된 프로필 조회**
   - `GET /api/v1/users/me` (Bearer Token)
   - 결과: 사용자 정보 반환

5. **토큰 갱신**
   - `POST /api/v1/auth/refresh`
   - 결과: 새로운 토큰 발급

6. **로그아웃**
   - `POST /api/v1/auth/logout`
   - 결과: 성공

## 환경 변수

### 필수 환경 변수
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-min-32-chars-dev-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. Prisma 설정
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 3. 개발 서버 실행
```bash
npm run dev
```

서버가 http://localhost:5000 에서 실행됩니다.

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 다음 구현 예정 항목

### 우선순위 1 (핵심 기능)
- [ ] 경험 로그 (Log) CRUD API
  - POST /api/v1/logs (AI 회고 생성)
  - GET /api/v1/logs (목록 조회, 페이지네이션)
  - GET /api/v1/logs/:id (상세 조회)
  - PATCH /api/v1/logs/:id (수정)
  - DELETE /api/v1/logs/:id (삭제)

- [ ] 프로젝트 (Project) CRUD API
  - POST /api/v1/projects
  - GET /api/v1/projects
  - GET /api/v1/projects/:id
  - PATCH /api/v1/projects/:id
  - DELETE /api/v1/projects/:id

### 우선순위 2 (AI 기능)
- [ ] OpenAI GPT-4 통합
- [ ] AI 회고 생성 (스트리밍 SSE)
- [ ] 키워드 자동 추천
- [ ] 프로젝트 자동 매칭

### 우선순위 3 (역량 검증)
- [ ] 키워드 관리 API
- [ ] 동료 인증 (Peer Endorsement) API
- [ ] 증명서 업로드 및 OCR

### 우선순위 4 (고도화)
- [ ] 포트폴리오 생성 API
- [ ] 파일 업로드 (Supabase/S3)
- [ ] 알림 시스템 (FCM)
- [ ] Rate Limiting (Redis 기반)
- [ ] Refresh Token을 Redis/DB로 이전

## 보안 고려사항

### 현재 상태
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ JWT 토큰 기반 인증
- ✅ CORS 설정
- ⚠️ Refresh Token 메모리 저장 (데모용)

### 프로덕션 전 필수 개선
- [ ] Refresh Token을 Redis에 저장
- [ ] HTTPS 적용
- [ ] Rate Limiting 구현
- [ ] Input Validation (Zod)
- [ ] SQL Injection 방어 (Prisma가 기본 제공)
- [ ] XSS 방어
- [ ] CSRF 토큰
- [ ] 환경 변수 암호화
- [ ] 로깅 및 모니터링

## PostgreSQL 전환 가이드

현재는 SQLite를 사용 중이지만, 프로덕션에서는 PostgreSQL 권장:

### 1. DATABASE_URL 변경
```env
DATABASE_URL="postgresql://user:password@localhost:5432/proof"
```

### 2. Prisma 스키마 datasource 변경
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. 배열 및 JSON 타입 복원
PostgreSQL에서는 다음과 같이 변경 가능:
- `tags String` → `tags String[]`
- `settings String` → `settings Json`

### 4. 마이그레이션 재실행
```bash
npx prisma migrate dev --name switch_to_postgres
```

## 참고 문서
- [backend-requirements.md](./backend-requirements.md) - 전체 API 명세
- [Prisma 공식 문서](https://www.prisma.io/docs/)
- [Express.js 공식 문서](https://expressjs.com/)

## 버전 정보
- 프로젝트 버전: 0.1.0
- 구현 단계: Phase 1 (인증 시스템)
- 마지막 업데이트: 2025-11-13
