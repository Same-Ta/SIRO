# PROOF 백엔드 API 완전 구현 명세서

**작성일**: 2024년 11월 14일  
**버전**: 2.0 (회고 시스템 추가)  
**대상**: 상경계열 학생 경험 관리 플랫폼

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [인증 API](#인증-api)
3. [사용자 관리 API](#사용자-관리-api)
4. [경험 활동 추천 API](#경험-활동-추천-api)
5. [경험 로그 API](#경험-로그-api)
6. [회고 시스템 API](#회고-시스템-api)
7. [프로젝트 관리 API](#프로젝트-관리-api)
8. [키워드 관리 API](#키워드-관리-api)
9. [AI 분석 API](#ai-분석-api)
10. [포트폴리오 API](#포트폴리오-api)
11. [알림 API](#알림-api)
12. [대시보드 API](#대시보드-api)
13. [검색 API](#검색-api)
14. [파일 업로드 API](#파일-업로드-api)
15. [증명 및 인증 API](#증명-및-인증-api)

---

## 🎯 시스템 개요

### 핵심 기능
1. **경험 활동 추천**: 공모전/프로젝트/동아리/인턴 추천
2. **회고 시스템**: 일간/주간/월간 회고 작성 및 AI 피드백
3. **역량 키워드 관리**: 활동 기반 역량 추출 및 레벨링
4. **포트폴리오 생성**: 자동 포트폴리오 생성

### 인증 방식
- **헤더**: `x-user-id: {UUID}`
- **토큰 없음**: JWT 대신 간단한 x-user-id 기반 인증

### Base URL
- **개발**: `http://localhost:8000/api/v1`
- **프로덕션**: `https://api.proof.app/v1`

---

## 1. 인증 API

### 1.1 회원가입
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

**구현 필수 사항:**
- bcrypt로 비밀번호 해싱
- 이메일 중복 체크
- users 테이블에 INSERT
- x-user-id로 사용할 UUID 반환

---

### 1.2 로그인
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "로그인되었습니다",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과"
  }
}
```

**구현 필수 사항:**
- 이메일 존재 여부 확인
- bcrypt로 비밀번호 검증
- users 테이블 조회

---

### 1.3 로그아웃
**POST** `/auth/logout`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

**구현 필수 사항:**
- 세션 정리 (필요 시)
- 로그 기록

---

## 2. 사용자 관리 API

### 2.1 내 정보 조회
**GET** `/users/me`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과",
    "profile_image": "https://...",
    "bio": "열정적인 경영학도",
    "created_at": "2024-01-01T00:00:00Z",
    "stats": {
      "total_logs": 45,
      "total_projects": 8,
      "total_keywords": 12,
      "active_reflections": 3
    }
  }
}
```

**구현 필수 사항:**
- x-user-id로 users 테이블 조회
- 통계 정보 집계 (JOIN 또는 서브쿼리)

---

### 2.2 프로필 수정
**PATCH** `/users/me`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "name": "홍길동",
  "university": "서울대학교",
  "major": "경영학과",
  "bio": "열정적인 경영학도"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "프로필이 수정되었습니다",
  "data": {
    "user_id": "uuid",
    "name": "홍길동",
    "university": "서울대학교",
    "major": "경영학과",
    "bio": "열정적인 경영학도"
  }
}
```

**구현 필수 사항:**
- x-user-id로 사용자 확인
- users 테이블 UPDATE
- updated_at 자동 업데이트

---

### 2.3 프로필 이미지 업로드
**POST** `/users/me/profile-image`

**Headers:**
```
x-user-id: {UUID}
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: File (최대 5MB, JPG/PNG)

**Response (200):**
```json
{
  "success": true,
  "message": "프로필 이미지가 업로드되었습니다",
  "data": {
    "profile_image": "https://supabase.co/storage/profile-images/{user_id}/avatar.jpg"
  }
}
```

**구현 필수 사항:**
- 파일 크기 검증 (최대 5MB)
- 파일 형식 검증 (JPG, PNG, WebP)
- Supabase Storage 업로드
- users 테이블의 profile_image 컬럼 UPDATE

---

## 3. 경험 활동 추천 API

### 3.1 추천 활동 목록 조회
**GET** `/recommendations/activities`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `type`: `contest`, `project`, `club`, `internship`, `all` (default: all)
- `category`: `marketing`, `strategy`, `finance`, `hr`, `all` (default: all)
- `level`: `beginner`, `intermediate`, `advanced`, `all` (default: all)
- `limit`: 20 (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "activity_1",
        "type": "contest",
        "category": "marketing",
        "title": "2024 롯데 마케팅 공모전",
        "organization": "롯데그룹",
        "description": "혁신적인 마케팅 전략을 제안하는 공모전",
        "level": "intermediate",
        "deadline": "2024-12-31",
        "prize": "대상 500만원",
        "tags": ["마케팅", "전략기획", "브랜딩"],
        "url": "https://...",
        "match_score": 0.85,
        "match_reasons": [
          "귀하의 '마케팅' 키워드와 일치합니다",
          "경영학과 학생에게 적합합니다"
        ],
        "image_url": "https://...",
        "is_bookmarked": false
      }
    ],
    "total": 45,
    "personalized": true
  }
}
```

**구현 필수 사항:**
- 사용자의 키워드, 전공 기반 추천 알고리즘
- recommendations 또는 activities 테이블 조회
- match_score 계산 로직
- 마감일 임박순/추천순 정렬

---

### 3.2 활동 상세 조회
**GET** `/recommendations/activities/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "activity_1",
    "type": "contest",
    "title": "2024 롯데 마케팅 공모전",
    "organization": "롯데그룹",
    "description": "상세 설명...",
    "requirements": [
      "대학생 또는 대학원생",
      "3-5인 팀 구성"
    ],
    "timeline": [
      { "date": "2024-11-01", "event": "접수 시작" },
      { "date": "2024-12-31", "event": "접수 마감" },
      { "date": "2025-01-15", "event": "결과 발표" }
    ],
    "prizes": [
      { "rank": "대상", "prize": "500만원", "count": 1 },
      { "rank": "우수상", "prize": "200만원", "count": 2 }
    ],
    "tags": ["마케팅", "전략기획"],
    "related_keywords": ["마케팅전략", "소비자분석", "브랜딩"],
    "similar_activities": [
      { "id": "activity_2", "title": "현대카드 마케팅 공모전" }
    ]
  }
}
```

**구현 필수 사항:**
- activities 테이블 조회
- 연관 활동 추천 (유사도 기반)

---

### 3.3 활동 북마크
**POST** `/recommendations/activities/:id/bookmark`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "북마크에 추가되었습니다",
  "data": {
    "is_bookmarked": true
  }
}
```

**구현 필수 사항:**
- bookmarks 테이블 INSERT
- UNIQUE 제약으로 중복 방지

---

### 3.4 북마크 삭제
**DELETE** `/recommendations/activities/:id/bookmark`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "북마크가 제거되었습니다"
}
```

**구현 필수 사항:**
- bookmarks 테이블 DELETE

---

### 3.5 북마크 목록 조회
**GET** `/recommendations/bookmarks`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookmarks": [
      {
        "activity_id": "activity_1",
        "title": "2024 롯데 마케팅 공모전",
        "type": "contest",
        "deadline": "2024-12-31",
        "bookmarked_at": "2024-11-14T10:00:00Z"
      }
    ]
  }
}
```

**구현 필수 사항:**
- bookmarks 테이블과 activities 테이블 JOIN 조회

---

## 4. 경험 로그 API

### 4.1 로그 목록 조회
**GET** `/logs`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `status`: `active`, `completed`, `all` (default: all)
- `project_id`: UUID (optional)
- `sort`: `recent`, `date`, `title` (default: recent)
- `limit`: 20 (default: 20)
- `page`: 1 (default: 1)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "project": "서버랩 D-1",
      "project_id": "project_uuid",
      "projectBadgeColor": "#25A778",
      "title": "디프만 15기 디자이너 작곡",
      "date": "2024 상반기",
      "dateBadgeColor": "#DDF3EB",
      "period": "서류 준비",
      "keywords": [
        { "text": "협업", "color": "blue" },
        { "text": "리더십", "color": "purple" },
        { "text": "React", "color": "yellow" }
      ],
      "has_reflection": true,
      "reflection_count": 5,
      "created_at": "2024-03-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**구현 필수 사항:**
- logs 테이블 조회 (user_id 필터링)
- projects 테이블 JOIN (프로젝트 이름)
- log_keywords 테이블 JOIN (키워드 목록)
- 키워드 색상 할당 (index % 3)
- 페이지네이션 구현

---

### 4.2 로그 상세 조회
**GET** `/logs/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "log_123",
    "project_id": "project_uuid",
    "project_name": "서버랩 D-1",
    "title": "디프만 15기 디자이너 작곡",
    "content": "오늘 학회 회의에서...",
    "reflection": "AI가 생성한 회고",
    "date": "2024-03-15",
    "period": "서류 준비",
    "tags": ["힘듦", "전략기획"],
    "keywords": [
      { "id": "keyword_1", "text": "협업", "color": "blue", "confidence": 0.92 }
    ],
    "reflections": [
      {
        "id": "reflection_1",
        "cycle": "daily",
        "content": "오늘의 회고...",
        "ai_feedback": "AI 피드백...",
        "created_at": "2024-03-15T18:00:00Z"
      }
    ],
    "created_at": "2024-03-15T10:00:00Z",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

**구현 필수 사항:**
- logs 테이블 조회
- projects, log_keywords, keywords 테이블 JOIN
- reflections 테이블 조회 (해당 로그의 회고 목록)

---

### 4.3 로그 생성
**POST** `/logs`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "date": "2024-03-15",
  "project_id": "project_uuid",
  "title": "디프만 15기 디자이너 작곡",
  "content": "오늘 학회 회의에서 데이터 분석안 다 갈아엎음...",
  "period": "서류 준비",
  "tags": ["힘듦", "전략기획"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "로그가 생성되었습니다",
  "data": {
    "id": "log_123",
    "project_id": "project_uuid",
    "title": "디프만 15기 디자이너 작곡",
    "content": "오늘 학회 회의에서...",
    "date": "2024-03-15",
    "period": "서류 준비",
    "tags": ["힘듦", "전략기획"],
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

**구현 필수 사항:**
- logs 테이블 INSERT
- user_id는 x-user-id 헤더에서 가져오기
- project_id 존재 여부 확인
- period는 3가지 값만 허용 (서류 준비, 서류 합격, 면접 합격)

---

### 4.4 로그 수정
**PATCH** `/logs/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "period": "서류 합격",
  "tags": ["새태그"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "로그가 수정되었습니다",
  "data": {
    "id": "log_123",
    "title": "수정된 제목",
    "content": "수정된 내용",
    "period": "서류 합격",
    "updated_at": "2024-03-16T11:00:00Z"
  }
}
```

**구현 필수 사항:**
- logs 테이블 UPDATE
- user_id 일치 여부 확인 (권한 체크)
- updated_at 트리거로 자동 업데이트

---

### 4.5 로그 삭제
**DELETE** `/logs/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "로그가 삭제되었습니다"
}
```

**구현 필수 사항:**
- logs 테이블 DELETE
- user_id 일치 여부 확인
- CASCADE로 연관 데이터(log_keywords, reflections) 자동 삭제

---

## 5. 회고 시스템 API

### 5.1 회고 설정 생성
**POST** `/reflections/settings`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "log_id": "log_uuid",
  "cycle": "daily",
  "enabled": true,
  "reminder_time": "18:00",
  "questions": [
    "오늘 무엇을 했나요?",
    "어떤 어려움이 있었나요?",
    "내일 무엇을 할 건가요?"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "회고 설정이 저장되었습니다",
  "data": {
    "id": "setting_uuid",
    "log_id": "log_uuid",
    "cycle": "daily",
    "enabled": true,
    "reminder_time": "18:00",
    "next_reminder_at": "2024-03-16T18:00:00Z"
  }
}
```

**구현 필수 사항:**
- reflection_settings 테이블 INSERT
- cycle: daily, weekly, biweekly, monthly
- next_reminder_at 계산 (현재 시각 + 주기)

---

### 5.2 회고 작성
**POST** `/reflections`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "log_id": "log_uuid",
  "cycle": "daily",
  "content": "오늘은 데이터 분석을 완료했다. 생각보다 시간이 오래 걸렸지만 결과가 만족스럽다.",
  "answers": [
    {
      "question": "오늘 무엇을 했나요?",
      "answer": "데이터 분석 완료"
    },
    {
      "question": "어떤 어려움이 있었나요?",
      "answer": "데이터 정제가 어려웠음"
    }
  ],
  "mood": "good",
  "progress_score": 7
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "회고가 저장되었습니다",
  "data": {
    "id": "reflection_uuid",
    "log_id": "log_uuid",
    "cycle": "daily",
    "content": "오늘은 데이터 분석을...",
    "mood": "good",
    "progress_score": 7,
    "ai_feedback": "훌륭한 진행 상황입니다. 데이터 정제는 시간이 걸리지만 중요한 과정입니다...",
    "ai_suggestions": [
      "다음 단계로 시각화 작업을 진행해보세요",
      "팀원들과 분석 결과를 공유하면 좋을 것 같습니다"
    ],
    "created_at": "2024-03-15T18:30:00Z"
  }
}
```

**구현 필수 사항:**
- reflections 테이블 INSERT
- AI API 호출하여 피드백 생성 (OpenAI GPT-4)
- reflection_settings의 next_reminder_at 업데이트

---

### 5.3 회고 목록 조회
**GET** `/reflections`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `log_id`: UUID (optional)
- `cycle`: daily, weekly, biweekly, monthly (optional)
- `start_date`: YYYY-MM-DD (optional)
- `end_date`: YYYY-MM-DD (optional)
- `limit`: 20 (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reflection_uuid",
      "log_id": "log_uuid",
      "log_title": "디프만 15기",
      "cycle": "daily",
      "content": "오늘은...",
      "mood": "good",
      "progress_score": 7,
      "ai_feedback": "AI 피드백...",
      "created_at": "2024-03-15T18:30:00Z"
    }
  ]
}
```

**구현 필수 사항:**
- reflections 테이블 조회
- logs 테이블 JOIN (로그 제목)
- 날짜 범위 필터링

---

### 5.4 회고 상세 조회
**GET** `/reflections/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "reflection_uuid",
    "log_id": "log_uuid",
    "log_title": "디프만 15기",
    "cycle": "daily",
    "content": "오늘은 데이터 분석을...",
    "answers": [
      {
        "question": "오늘 무엇을 했나요?",
        "answer": "데이터 분석 완료"
      }
    ],
    "mood": "good",
    "progress_score": 7,
    "ai_feedback": "훌륭한 진행 상황입니다...",
    "ai_suggestions": [
      "다음 단계로 시각화 작업을 진행해보세요"
    ],
    "extracted_keywords": ["데이터분석", "시각화", "팀워크"],
    "created_at": "2024-03-15T18:30:00Z"
  }
}
```

**구현 필수 사항:**
- reflections 테이블 조회
- logs 테이블 JOIN

---

### 5.5 회고 수정
**PATCH** `/reflections/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "content": "수정된 회고 내용",
  "mood": "great",
  "progress_score": 8
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "회고가 수정되었습니다",
  "data": {
    "id": "reflection_uuid",
    "content": "수정된 회고 내용",
    "mood": "great",
    "progress_score": 8,
    "updated_at": "2024-03-16T10:00:00Z"
  }
}
```

**구현 필수 사항:**
- reflections 테이블 UPDATE
- user_id 일치 여부 확인

---

### 5.6 회고 삭제
**DELETE** `/reflections/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "회고가 삭제되었습니다"
}
```

**구현 필수 사항:**
- reflections 테이블 DELETE
- user_id 일치 여부 확인

---

### 5.7 회고 통계 조회
**GET** `/reflections/stats`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `period`: week, month, year (default: month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_reflections": 45,
    "by_cycle": {
      "daily": 30,
      "weekly": 10,
      "monthly": 5
    },
    "by_mood": {
      "great": 10,
      "good": 20,
      "normal": 10,
      "bad": 3,
      "terrible": 2
    },
    "avg_progress_score": 7.2,
    "streak_days": 15,
    "most_active_day": "Monday",
    "completion_rate": 0.85
  }
}
```

**구현 필수 사항:**
- reflections 테이블 집계
- GROUP BY cycle, mood
- AVG(progress_score) 계산
- 연속 작성일 계산

---

## 6. 프로젝트 관리 API

### 6.1 프로젝트 목록 조회
**GET** `/projects`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `status`: active, completed, archived (optional)
- `type`: contest, club, internship, project (optional)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_uuid",
      "name": "서버랩 D-1",
      "description": "서버 개발 프로젝트",
      "type": "project",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "tags": ["개발", "서버"],
      "thumbnail_url": "https://...",
      "team_size": 5,
      "stats": {
        "total_logs": 15,
        "total_reflections": 30,
        "total_keywords": 8
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**구현 필수 사항:**
- projects 테이블 조회
- logs 테이블 집계 (COUNT)

---

### 6.2 프로젝트 간단 목록 (드롭다운용)
**GET** `/projects/simple-list`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "project_1", "name": "서버랩 D-1" },
    { "id": "project_2", "name": "2차 면접 D-2" },
    { "id": "project_3", "name": "1차 면접 D-9" }
  ]
}
```

**구현 필수 사항:**
- projects 테이블 조회 (id, name만)
- status = 'active' 필터링

---

### 6.3 프로젝트 생성 (새 경험 시작)
**POST** `/projects`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "name": "2024 롯데 마케팅 공모전",
  "description": "공모전 참가",
  "type": "contest",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "team_size": 4,
  "my_role": "팀장",
  "tags": ["마케팅", "전략"],
  "reflection_settings": {
    "cycle": "weekly",
    "enabled": true,
    "reminder_time": "18:00",
    "questions": [
      "이번 주에 무엇을 했나요?",
      "어떤 어려움이 있었나요?",
      "다음 주 목표는 무엇인가요?"
    ]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "프로젝트가 생성되었습니다",
  "data": {
    "id": "project_uuid",
    "name": "2024 롯데 마케팅 공모전",
    "type": "contest",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "reflection_settings": {
      "id": "setting_uuid",
      "cycle": "weekly",
      "next_reminder_at": "2024-01-07T18:00:00Z"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**구현 필수 사항:**
- projects 테이블 INSERT
- reflection_settings 테이블 INSERT (회고 설정)
- team_members 테이블 INSERT (사용자를 팀장으로 추가)

---

### 6.4 프로젝트 수정
**PATCH** `/projects/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "name": "수정된 프로젝트명",
  "description": "수정된 설명",
  "status": "completed",
  "end_date": "2024-04-30"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "프로젝트가 수정되었습니다",
  "data": {
    "id": "project_uuid",
    "name": "수정된 프로젝트명",
    "status": "completed",
    "updated_at": "2024-04-30T10:00:00Z"
  }
}
```

**구현 필수 사항:**
- projects 테이블 UPDATE
- user_id 일치 여부 확인

---

### 6.5 프로젝트 삭제
**DELETE** `/projects/:id`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "프로젝트가 삭제되었습니다"
}
```

**구현 필수 사항:**
- projects 테이블 DELETE
- CASCADE로 연관 데이터(logs, reflections) 처리

---

## 7. 키워드 관리 API

### 7.1 키워드 마스터 목록
**GET** `/keywords`

**Query Parameters:**
- `category`: 전략기획, 마케팅, 개발, 협업역량 (optional)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "keyword_uuid",
      "name": "기획력",
      "category": "전략기획",
      "description": "문제를 정의하고 해결 방안을 제시하는 능력",
      "related_keywords": ["문제정의", "솔루션기획"]
    }
  ]
}
```

**구현 필수 사항:**
- keywords 테이블 조회
- 카테고리 필터링

---

### 7.2 내 키워드 목록 (역량 보드)
**GET** `/users/me/keywords`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "keyword_id": "keyword_uuid",
      "name": "기획력",
      "category": "전략기획",
      "level": 2,
      "related_logs_count": 12,
      "related_projects_count": 4,
      "last_used_at": "2024-03-15",
      "evidence_count": 1,
      "endorsement_count": 2
    }
  ]
}
```

**구현 필수 사항:**
- user_keywords 테이블 조회
- keywords 테이블 JOIN
- log_keywords 테이블 집계 (COUNT)
- evidence, peer_endorsements 테이블 집계

---

## 8. AI 분석 API

### 8.1 키워드 추출
**POST** `/ai/extract-keywords`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "content": "오늘 학회 회의에서 데이터 분석안을 발표했다. 팀원들과 협력하여 React로 프론트엔드를 구현했다."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "keywords": [
      { "text": "데이터분석", "color": "blue", "confidence": 0.92 },
      { "text": "팀워크", "color": "purple", "confidence": 0.89 },
      { "text": "React", "color": "yellow", "confidence": 0.95 },
      { "text": "프론트엔드", "color": "blue", "confidence": 0.87 }
    ],
    "suggestedTags": [
      { "text": "협업", "bgColor": "#DDF3EB", "textColor": "#186D50" },
      { "text": "개발", "bgColor": "#DDF3EB", "textColor": "#186D50" }
    ]
  }
}
```

**구현 필수 사항:**
- OpenAI GPT-4 API 호출
- 키워드 추출 프롬프트 설계
- 색상 자동 할당 (index % 3)

---

### 8.2 회고 피드백 생성
**POST** `/ai/generate-feedback`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "reflection_content": "오늘은 데이터 분석을 완료했다. 생각보다 시간이 오래 걸렸지만 결과가 만족스럽다.",
  "progress_score": 7,
  "mood": "good",
  "previous_reflections": [
    "지난주에는 데이터 수집을 했다.",
    "이번주 초에 데이터 정제를 시작했다."
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "feedback": "훌륭한 진행 상황입니다. 데이터 분석 완료는 프로젝트의 중요한 이정표입니다...",
    "suggestions": [
      "다음 단계로 시각화 작업을 진행해보세요",
      "팀원들과 분석 결과를 공유하면 좋을 것 같습니다"
    ],
    "improvement_areas": [
      "시간 관리: 다음에는 분석 단계를 세분화하여 시간 예측을 개선해보세요"
    ],
    "strengths": [
      "꼼꼼한 데이터 분석",
      "결과에 대한 만족도 높음"
    ]
  }
}
```

**구현 필수 사항:**
- OpenAI GPT-4 API 호출
- 이전 회고 컨텍스트 포함
- 구조화된 피드백 생성 프롬프트

---

## 9. 포트폴리오 API

### 9.1 포트폴리오 생성
**POST** `/portfolios`

**Headers:**
```
x-user-id: {UUID}
```

**Request Body:**
```json
{
  "title": "경영전략 직무 포트폴리오",
  "target_job": "경영전략",
  "project_ids": ["project_1", "project_2"],
  "template": "professional",
  "settings": {
    "include_photo": true,
    "include_reflections": true,
    "include_keywords": true
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "포트폴리오 생성이 시작되었습니다",
  "data": {
    "portfolio_id": "portfolio_uuid",
    "status": "generating",
    "estimated_time": 30
  }
}
```

**구현 필수 사항:**
- portfolios 테이블 INSERT
- 비동기 작업 큐에 추가
- PDF 생성 작업 시작

---

### 9.2 포트폴리오 상태 확인
**GET** `/portfolios/:id/status`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "portfolio_id": "portfolio_uuid",
    "status": "completed",
    "progress": 100,
    "pdf_url": "https://supabase.co/storage/portfolios/...",
    "web_url": "https://proof.app/portfolio/uuid",
    "generated_at": "2024-03-15T10:05:00Z"
  }
}
```

**구현 필수 사항:**
- portfolios 테이블 조회
- status: generating, completed, failed

---

### 9.3 포트폴리오 목록
**GET** `/portfolios`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "portfolio_uuid",
      "title": "경영전략 직무 포트폴리오",
      "target_job": "경영전략",
      "pdf_url": "https://...",
      "created_at": "2024-03-15T10:00:00Z"
    }
  ]
}
```

**구현 필수 사항:**
- portfolios 테이블 조회

---

## 10. 알림 API

### 10.1 알림 목록
**GET** `/notifications`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `unread_only`: true/false (default: false)
- `limit`: 20 (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_uuid",
      "type": "reflection_reminder",
      "title": "회고 작성 시간입니다",
      "content": "'서버랩 D-1' 프로젝트의 주간 회고를 작성해주세요",
      "link": "/reflections/new?log_id=log_uuid",
      "read_at": null,
      "created_at": "2024-03-15T18:00:00Z"
    }
  ],
  "unread_count": 3
}
```

**구현 필수 사항:**
- notifications 테이블 조회
- read_at IS NULL 필터링

---

### 10.2 알림 읽음 처리
**PATCH** `/notifications/:id/read`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "message": "알림을 읽음 처리했습니다"
}
```

**구현 필수 사항:**
- notifications 테이블 UPDATE
- read_at = NOW()

---

### 10.3 읽지 않은 알림 개수
**GET** `/notifications/unread-count`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

**구현 필수 사항:**
- notifications 테이블 COUNT
- read_at IS NULL

---

## 11. 대시보드 API

### 11.1 대시보드 통계
**GET** `/dashboard/stats`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_logs": 45,
    "total_projects": 8,
    "total_keywords": 12,
    "total_reflections": 120,
    "active_projects": 3,
    "reflection_streak": 15,
    "this_week": {
      "logs": 5,
      "reflections": 7
    },
    "this_month": {
      "logs": 20,
      "reflections": 30
    }
  }
}
```

**구현 필수 사항:**
- 여러 테이블 집계
- 날짜 범위 필터링

---

### 11.2 최근 활동
**GET** `/dashboard/recent-activity`

**Headers:**
```
x-user-id: {UUID}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "reflection",
      "title": "주간 회고 작성",
      "project_name": "서버랩 D-1",
      "created_at": "2024-03-15T18:00:00Z"
    },
    {
      "type": "log",
      "title": "새 로그 생성",
      "project_name": "롯데 공모전",
      "created_at": "2024-03-15T10:00:00Z"
    }
  ]
}
```

**구현 필수 사항:**
- logs, reflections 테이블 UNION
- 최근 순 정렬

---

## 12. 검색 API

### 12.1 통합 검색
**GET** `/search`

**Headers:**
```
x-user-id: {UUID}
```

**Query Parameters:**
- `q`: 검색어 (required)
- `type`: logs, projects, keywords, all (default: all)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_uuid",
        "title": "디프만 15기",
        "snippet": "...데이터 분석을 완료..."
      }
    ],
    "projects": [
      {
        "id": "project_uuid",
        "name": "서버랩 D-1"
      }
    ],
    "keywords": [
      {
        "id": "keyword_uuid",
        "name": "데이터분석"
      }
    ]
  }
}
```

**구현 필수 사항:**
- ILIKE 또는 pg_trgm 사용
- 여러 테이블 검색

---

## 13. 파일 업로드 API

### 13.1 파일 업로드
**POST** `/upload`

**Headers:**
```
x-user-id: {UUID}
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File
- `type`: profile, evidence, document

**Response (200):**
```json
{
  "success": true,
  "data": {
    "file_url": "https://supabase.co/storage/...",
    "file_name": "document.pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf"
  }
}
```

**구현 필수 사항:**
- Supabase Storage 업로드
- 파일 크기/형식 검증
- 파일 경로: {type}/{user_id}/{filename}

---

## 14. 증명 및 인증 API

### 14.1 증명서 업로드
**POST** `/verifications/evidence`

**Headers:**
```
x-user-id: {UUID}
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: PDF/JPG/PNG
- `project_id`: UUID
- `type`: certificate, award, internship

**Response (201):**
```json
{
  "success": true,
  "data": {
    "evidence_id": "evidence_uuid",
    "file_url": "https://...",
    "ocr_text": "수상증명서\n홍길동\n최우수상",
    "ocr_confidence": 0.95,
    "verified_keywords": ["기획력", "리더십"]
  }
}
```

**구현 필수 사항:**
- evidence 테이블 INSERT
- OCR 처리 (Google Vision API)
- 키워드 자동 추출 및 레벨 업그레이드

---

## 📊 데이터베이스 추가 테이블

### reflection_settings (회고 설정)
```sql
CREATE TABLE reflection_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cycle VARCHAR(20) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  reminder_time TIME,
  questions JSONB,
  next_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- cycle: daily, weekly, biweekly, monthly
```

### reflections (회고 데이터)
```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cycle VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  answers JSONB,
  mood VARCHAR(20),
  progress_score INTEGER,
  ai_feedback TEXT,
  ai_suggestions JSONB,
  extracted_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- mood: great, good, normal, bad, terrible
-- progress_score: 1-10
```

### activities (추천 활동)
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  organization VARCHAR(200),
  description TEXT,
  level VARCHAR(50),
  deadline DATE,
  prize VARCHAR(200),
  tags TEXT[],
  url TEXT,
  image_url TEXT,
  requirements JSONB,
  timeline JSONB,
  prizes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### bookmarks (북마크)
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);
```

### team_members (팀원)
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100),
  role VARCHAR(100),
  email VARCHAR(255),
  is_leader BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔔 백그라운드 작업

### 1. 회고 알림 발송
```python
# 크론 작업 (매 시간 실행)
# reflection_settings에서 next_reminder_at이 현재 시각을 지난 설정 조회
# notifications 테이블에 INSERT
# next_reminder_at 업데이트 (다음 주기로)
```

### 2. 포트폴리오 PDF 생성
```python
# 큐 워커 (Celery, RQ 등)
# portfolios 테이블에서 status='generating' 조회
# PDF 생성 (HTML → PDF 변환)
# Supabase Storage 업로드
# status='completed', pdf_url 업데이트
```

### 3. AI 분석 배치
```python
# 크론 작업 (매일 자정)
# 오늘 작성된 reflections 조회
# AI로 추가 인사이트 생성
# reflections 테이블 업데이트
```

---

## ✅ 구현 우선순위

### Phase 1 (MVP - 2주)
1. ✅ 인증 API (회원가입, 로그인)
2. ✅ 프로젝트 생성 (새 경험 시작)
3. ✅ 로그 CRUD
4. ✅ 회고 작성 및 AI 피드백
5. ✅ 대시보드 통계

### Phase 2 (1개월)
6. ✅ 경험 활동 추천
7. ✅ 키워드 추출 및 관리
8. ✅ 회고 통계 및 분석
9. ✅ 알림 시스템
10. ✅ 검색 기능

### Phase 3 (2개월)
11. ⏳ 포트폴리오 생성
12. ⏳ 증명서 OCR
13. ⏳ 팀원 관리
14. ⏳ 동료 인증

---

## 🔐 보안 체크리스트

- ✅ x-user-id 헤더 검증 (모든 보호된 엔드포인트)
- ✅ 비밀번호 bcrypt 해싱
- ✅ SQL Injection 방지 (Parameterized Query)
- ✅ XSS 방지 (입력값 이스케이프)
- ✅ CORS 설정 (프론트엔드 도메인만 허용)
- ✅ Rate Limiting (분당 60회)
- ✅ 파일 업로드 검증 (크기, 형식)
- ✅ 권한 체크 (user_id 일치 여부)

---

## 📝 환경 변수

```env
# 데이터베이스
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# 서버
PORT=8000
CORS_ORIGINS=http://localhost:3000

# OCR
GOOGLE_VISION_API_KEY=...

# 백그라운드 작업
REDIS_URL=redis://localhost:6379
```

---

**최종 업데이트**: 2024년 11월 14일  
**총 엔드포인트 수**: 50+  
**작성자**: PROOF 팀
