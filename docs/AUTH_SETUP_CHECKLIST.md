# 🚨 백엔드 연동 체크리스트

## ✅ 완료된 작업

### 1. API Base URL 수정
- ❌ 이전: `process.env.NEXT_PUBLIC_API_BASE_URL || '/api'`
- ✅ 현재: `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'`

### 2. 환경 변수 설정
`.env.local` 파일이 올바르게 설정됨:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBmag2xIc9sLH-IWHrzY67uD6B3hqYwl0w
```

### 3. 인증 API 엔드포인트
- ✅ 회원가입: `POST /auth/register`
- ✅ 로그인: `POST /auth/login`
- ✅ 로그아웃: `POST /auth/logout`
- ✅ 토큰 갱신: `POST /auth/refresh`

### 4. 응답 구조 처리
백엔드 API 명세서에 따른 공통 응답 형식:
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

### 5. 에러 처리 개선
- ✅ `EMAIL_ALREADY_EXISTS` - "이미 사용 중인 이메일입니다"
- ✅ `INVALID_CREDENTIALS` - "이메일 또는 비밀번호가 잘못되었습니다"
- ✅ `USER_NOT_FOUND` - "등록되지 않은 사용자입니다"
- ✅ Network Error - "서버에 연결할 수 없습니다"

### 6. CORS 설정
- ✅ `withCredentials: false` (백엔드 CORS 정책에 맞춤)

---

## 🔧 백엔드 서버 실행 방법

### 1. 백엔드 서버 시작
```powershell
cd c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\back
.\venv\Scripts\Activate.ps1
python run.py
```

**실행 확인:**
- 콘솔에 `INFO: Application startup complete.` 출력
- http://localhost:8000 접속 가능
- http://localhost:8000/api/docs 에서 Swagger UI 확인

### 2. 백엔드 환경 변수 확인
`back/.env` 파일 필수 항목:
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

## 🧪 테스트 방법

### 1. 백엔드 API 직접 테스트 (Swagger UI)
1. 브라우저에서 http://localhost:8000/api/docs 접속
2. "POST /auth/register" 클릭
3. "Try it out" 클릭
4. Request body 입력:
```json
{
  "email": "test@example.com",
  "password": "test1234",
  "name": "테스트유저",
  "university": "서울대학교",
  "major": "컴퓨터공학과"
}
```
5. "Execute" 클릭
6. 응답 확인 (200 OK)

### 2. 프론트엔드에서 회원가입 테스트
1. 프론트엔드 서버 실행:
```powershell
cd c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\front
npm run dev
```

2. 브라우저에서 http://localhost:3000/auth/register 접속
3. 회원가입 폼 작성:
   - 이름: 홍길동
   - 이메일: test@example.com
   - 비밀번호: test1234
   - 비밀번호 확인: test1234
   - 대학교: 서울대학교
   - 전공: 컴퓨터공학과
4. "회원가입" 버튼 클릭
5. 성공 시: "회원가입이 완료되었습니다!" 토스트 → 대시보드로 이동

### 3. 로그인 테스트
1. http://localhost:3000/auth/login 접속
2. 로그인 폼 작성:
   - 이메일: test@example.com
   - 비밀번호: test1234
3. "로그인" 버튼 클릭
4. 성공 시: "환영합니다, 홍길동님!" 토스트 → 대시보드로 이동

### 4. 브라우저 개발자 도구에서 확인
1. F12 키를 눌러 개발자 도구 열기
2. Console 탭에서 다음 확인:
   - "회원가입 응답:" 또는 "로그인 응답:" 로그
   - `success: true` 확인
   - `data` 객체에 `userId`, `accessToken`, `refreshToken` 포함 확인
3. Application 탭 → Local Storage에서 확인:
   - `access_token`: eyJ...
   - `refresh_token`: eyJ...
   - `x-user-id`: uuid

---

## 🐛 문제 해결

### 문제 1: "서버에 연결할 수 없습니다" 에러
**원인**: 백엔드 서버가 실행되지 않음

**해결책**:
```powershell
cd c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\back
.\venv\Scripts\Activate.ps1
python run.py
```

### 문제 2: CORS 에러
**원인**: 백엔드 CORS 설정에 프론트엔드 URL이 없음

**해결책**: `back/.env` 파일 수정
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 문제 3: "이미 사용 중인 이메일입니다" 에러
**원인**: 해당 이메일로 이미 회원가입됨

**해결책**: 다른 이메일 사용 또는 Supabase에서 해당 사용자 삭제

### 문제 4: 401 Unauthorized 에러
**원인**: 토큰이 만료되었거나 유효하지 않음

**해결책**:
1. localStorage 초기화:
```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('x-user-id')
```
2. 다시 로그인

### 문제 5: 프론트엔드 개발 서버 재시작 필요
**원인**: `.env.local` 파일 변경

**해결책**:
```powershell
# Ctrl+C로 서버 중지
npm run dev  # 서버 재시작
```

---

## 📝 API 호출 흐름

### 회원가입 플로우
```
1. 사용자가 폼 작성 → Submit
2. authApi.register() 호출
3. axios → POST http://localhost:8000/auth/register
4. 백엔드 응답:
   {
     "success": true,
     "data": {
       "userId": "uuid",
       "email": "test@example.com",
       "name": "홍길동",
       "accessToken": "eyJ...",
       "refreshToken": "eyJ..."
     }
   }
5. localStorage에 토큰 저장
6. router.push('/dashboard')
```

### 로그인 플로우
```
1. 사용자가 이메일/비밀번호 입력 → Submit
2. authApi.login() 호출
3. axios → POST http://localhost:8000/auth/login
4. 백엔드 응답:
   {
     "success": true,
     "data": {
       "userId": "uuid",
       "email": "test@example.com",
       "name": "홍길동",
       "accessToken": "eyJ...",
       "refreshToken": "eyJ..."
     }
   }
5. localStorage에 토큰 저장
6. router.push('/dashboard')
```

### 인증이 필요한 API 호출
```
1. useQuery 또는 useMutation 실행
2. api 인스턴스의 request interceptor 실행
3. localStorage에서 access_token 가져오기
4. Authorization: Bearer {token} 헤더 추가
5. 백엔드로 요청 전송
6. 200 OK → 정상 처리
7. 401 Unauthorized → refresh token으로 갱신 시도
   - 성공: 새 access_token 저장 후 재요청
   - 실패: /auth/login으로 리다이렉트
```

---

## ✅ 최종 체크리스트

프론트엔드와 백엔드가 제대로 연동되었는지 확인:

- [ ] 백엔드 서버 실행 중 (`python run.py`)
- [ ] http://localhost:8000/api/docs 접속 가능
- [ ] `.env.local` 파일에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` 설정
- [ ] 프론트엔드 서버 실행 중 (`npm run dev`)
- [ ] http://localhost:3000 접속 가능
- [ ] 회원가입 성공 (새 이메일로 테스트)
- [ ] localStorage에 토큰 저장됨
- [ ] 로그인 성공
- [ ] 대시보드로 리다이렉트됨
- [ ] 브라우저 Console에 에러 없음
- [ ] Network 탭에서 API 호출 200 OK 확인

---

## 🎯 다음 단계

인증이 성공적으로 작동하면:

1. **회고 v3 API 연동**
   - `/api/reflections/micro` - 초라이트 기록 작성
   - `/api/reflections/stats` - 통계 조회
   - `/api/reflections/story` - 스토리 뷰 조회

2. **사용자 정보 API 연동**
   - `GET /users/me` - 내 정보 조회
   - `PUT /users/me` - 내 정보 수정
   - `POST /users/baseline-mood` - 베이스라인 설정

3. **AI 기능 연동**
   - `POST /api/ai/suggest-tags` - AI 태그 제안

---

## 📚 참고 문서

- `docs/FRONTEND_API_GUIDE.md` - 백엔드 API 완벽 가이드
- `docs/API_SPECIFICATION.md` - API 상세 명세
- `docs/BACKEND_REQUIREMENTS.md` - 백엔드 구현 요구사항

---

**문제가 계속 발생하면 백엔드 콘솔 로그와 프론트엔드 브라우저 Console 로그를 함께 확인해주세요!** 🔍
