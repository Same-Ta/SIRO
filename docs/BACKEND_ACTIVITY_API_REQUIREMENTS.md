# 활동 추천 API 백엔드 구현 요구사항

## 📋 개요

프론트엔드에서 활동 추천 기능을 위해 필요한 백엔드 API 엔드포인트 및 데이터 구조 명세서입니다.

**베이스 URL**: `http://localhost:8000`

---

## 🎯 1. 활동 추천 목록 조회 API

### Endpoint
```
GET /api/activities
또는
GET /api/recommendations/activities
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `category` | string | ❌ | 활동 카테고리 필터 | `contest`, `hackathon`, `project`, `club`, `internship`, `volunteer` |
| `field` | string | ❌ | 관심 분야 필터 | `marketing`, `strategy`, `data`, `development`, `design` |
| `sort` | string | ❌ | 정렬 기준 | `recommended` (기본값), `match_score`, `deadline`, `popular` |
| `limit` | number | ❌ | 결과 개수 제한 | `20` (기본값) |
| `search` | string | ❌ | 검색 키워드 | 활동명, 기관명, 태그 검색 |

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

또는

```http
Content-Type: application/json
x-user-id: {user_id}
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "activity": {
          "id": "uuid-string",
          "title": "2024 대학생 마케팅 공모전",
          "organization": "한국마케팅협회",
          "category": "contest",
          "target_jobs": ["마케팅", "전략기획"],
          "tags": ["브랜딩", "SNS마케팅", "캠페인"],
          "description": "SNS를 활용한 창의적인 마케팅 캠페인을 기획하고 실행하는 공모전입니다.",
          "benefits": ["상금 500만원", "수료증 발급", "인턴 기회"],
          "eligibility": "전국 대학생",
          "start_date": "2024-10-01T00:00:00Z",
          "end_date": "2024-12-31T23:59:59Z",
          "application_deadline": "2024-12-15T23:59:59Z",
          "url": "https://example.com/contest",
          "image_url": "https://example.com/images/contest.jpg",
          "location": "온라인",
          "contact_info": "marketing@example.com",
          "prize_money": "5,000,000원",
          "view_count": 1250,
          "bookmark_count": 89,
          "is_bookmarked": false,
          "created_at": "2024-10-01T00:00:00Z",
          "updated_at": "2024-10-01T00:00:00Z"
        },
        "match_score": 0.92,
        "match_reasons": [
          "전공 일치",
          "관심사 부합",
          "경험 수준 적합"
        ]
      }
    ],
    "total_count": 25,
    "page": 1,
    "limit": 20
  }
}
```

### Response Fields 설명

#### Activity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | 활동 고유 ID (UUID) |
| `title` | string | ✅ | 활동 제목 |
| `organization` | string | ✅ | 주최 기관명 |
| `category` | string | ✅ | 활동 카테고리 (`contest`, `hackathon`, `project`, `club`, `volunteer`, `internship`) |
| `target_jobs` | string[] | ✅ | 추천 직무 목록 |
| `tags` | string[] | ✅ | 활동 태그 (키워드) |
| `description` | string | ✅ | 활동 상세 설명 |
| `benefits` | string[] | ❌ | 혜택 목록 (상금, 수료증 등) |
| `eligibility` | string | ❌ | 지원 자격 |
| `start_date` | string (ISO 8601) | ❌ | 활동 시작일 |
| `end_date` | string (ISO 8601) | ❌ | 활동 종료일 |
| `application_deadline` | string (ISO 8601) | ❌ | 지원 마감일 |
| `url` | string | ❌ | 활동 상세 페이지 URL |
| `image_url` | string | ❌ | 대표 이미지 URL |
| `location` | string | ❌ | 활동 장소 |
| `contact_info` | string | ❌ | 연락처 (이메일, 전화번호) |
| `prize_money` | string | ❌ | 상금 (공모전/대회의 경우) |
| `view_count` | number | ✅ | 조회수 |
| `bookmark_count` | number | ✅ | 북마크 수 |
| `is_bookmarked` | boolean | ✅ | 현재 사용자의 북마크 여부 |
| `created_at` | string (ISO 8601) | ✅ | 생성 일시 |
| `updated_at` | string (ISO 8601) | ✅ | 수정 일시 |

#### RecommendedActivity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activity` | Activity | ✅ | 활동 정보 객체 |
| `match_score` | number (0.0-1.0) | ✅ | 매칭도 점수 |
| `match_reasons` | string[] | ✅ | 추천 이유 목록 (최대 3개) |

### 매칭 알고리즘 (권장)

```
match_score = (job_match * 0.5) + (tag_match * 0.3) + (deadline_urgency * 0.1) + (popularity * 0.1)
```

- **job_match** (50%): 사용자의 직무와 target_jobs 일치도
- **tag_match** (30%): 사용자의 관심사/태그와 활동 태그 일치도
- **deadline_urgency** (10%): 마감일 임박도 (7일 이내 높은 점수)
- **popularity** (10%): 조회수, 북마크 수 기반 인기도

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "서버 오류가 발생했습니다"
  }
}
```

---

## 🔖 2. 북마크 토글 API

### Endpoint
```
POST /api/activities/{activity_id}/bookmark
DELETE /api/activities/{activity_id}/bookmark
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activity_id` | string | ✅ | 활동 ID (UUID) |

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

또는

```http
Content-Type: application/json
x-user-id: {user_id}
```

### Request Body

**POST** (북마크 추가):
```json
{}
```

**DELETE** (북마크 제거):
```json
{}
```

### Response (200 OK)

**POST** 성공:
```json
{
  "success": true,
  "data": {
    "activity_id": "uuid-string",
    "is_bookmarked": true,
    "bookmark_count": 90
  },
  "message": "북마크에 추가되었습니다"
}
```

**DELETE** 성공:
```json
{
  "success": true,
  "data": {
    "activity_id": "uuid-string",
    "is_bookmarked": false,
    "bookmark_count": 88
  },
  "message": "북마크에서 제거되었습니다"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "ACTIVITY_NOT_FOUND",
    "message": "활동을 찾을 수 없습니다"
  }
}
```

---

## 📊 3. 데이터베이스 스키마 (권장)

### activities 테이블

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_jobs TEXT[] NOT NULL,
    tags TEXT[] NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT[],
    eligibility TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    application_deadline TIMESTAMP,
    url TEXT,
    image_url TEXT,
    location VARCHAR(255),
    contact_info VARCHAR(255),
    prize_money VARCHAR(100),
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_end_date ON activities(end_date);
CREATE INDEX idx_activities_target_jobs ON activities USING GIN(target_jobs);
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);
```

### user_activity_bookmarks 테이블

```sql
CREATE TABLE user_activity_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, activity_id)
);

-- 인덱스
CREATE INDEX idx_bookmarks_user_id ON user_activity_bookmarks(user_id);
CREATE INDEX idx_bookmarks_activity_id ON user_activity_bookmarks(activity_id);
```

---

## 🧪 4. 테스트용 샘플 데이터

### SQL Insert 예시

```sql
INSERT INTO activities (
    title, organization, category, target_jobs, tags, description, 
    benefits, eligibility, start_date, end_date, url, location, 
    contact_info, prize_money, view_count, bookmark_count
) VALUES 
(
    '2024 대학생 마케팅 공모전',
    '한국마케팅협회',
    'contest',
    ARRAY['마케팅', '전략기획'],
    ARRAY['브랜딩', 'SNS마케팅', '캠페인'],
    'SNS를 활용한 창의적인 마케팅 캠페인을 기획하고 실행하는 공모전입니다.',
    ARRAY['상금 500만원', '수료증 발급', '인턴 기회'],
    '전국 대학생',
    '2024-10-01',
    '2024-12-31',
    'https://example.com/contest',
    '온라인',
    'marketing@example.com',
    '5,000,000원',
    1250,
    89
),
(
    'AI 해커톤 2024',
    '테크 스타트업 연합',
    'hackathon',
    ARRAY['개발', '데이터분석'],
    ARRAY['AI', '머신러닝', '팀프로젝트'],
    '48시간 동안 AI 기술을 활용한 서비스를 개발하는 해커톤입니다.',
    ARRAY['상금 1000만원', '네트워킹', '취업 연계'],
    '개발자, 기획자, 디자이너',
    '2024-11-15',
    '2024-11-30',
    'https://example.com/hackathon',
    '서울 강남구',
    'hackathon@example.com',
    '10,000,000원',
    2340,
    156
),
(
    '데이터 분석 스터디',
    '대학생 연합 동아리',
    'club',
    ARRAY['데이터분석', '전략기획'],
    ARRAY['Python', '데이터시각화', '통계'],
    '매주 데이터 분석 프로젝트를 진행하며 실무 역량을 키우는 스터디입니다.',
    ARRAY['프로젝트 경험', '포트폴리오 구축', '네트워킹'],
    '데이터 분석에 관심있는 대학생',
    '2024-11-01',
    '2025-02-28',
    'https://example.com/study',
    '온라인',
    'study@example.com',
    NULL,
    890,
    67
),
(
    'UX/UI 디자인 챌린지',
    '디자인 협회',
    'contest',
    ARRAY['디자인', '전략기획'],
    ARRAY['UX', 'UI', '프로토타입'],
    '사용자 중심의 혁신적인 서비스 디자인을 제안하는 공모전입니다.',
    ARRAY['상금 300만원', '포트폴리오 리뷰', '멘토링'],
    '디자인 전공 대학생',
    '2024-11-01',
    '2024-12-15',
    'https://example.com/design',
    '온라인',
    'design@example.com',
    '3,000,000원',
    1560,
    112
),
(
    '소셜벤처 창업 경진대회',
    '사회혁신재단',
    'project',
    ARRAY['전략기획', '영업'],
    ARRAY['창업', '소셜임팩트', '비즈니스모델'],
    '사회 문제를 해결하는 비즈니스 아이디어를 발굴하고 실행하는 프로그램입니다.',
    ARRAY['시드머니 지원', '멘토링', '사무공간 제공'],
    '예비 창업자',
    '2024-11-10',
    '2025-01-31',
    'https://example.com/venture',
    '서울 마포구',
    'venture@example.com',
    '20,000,000원',
    1890,
    134
),
(
    '글로벌 인턴십 프로그램',
    '글로벌 기업 연합',
    'internship',
    ARRAY['마케팅', '영업', '인사'],
    ARRAY['해외인턴', '글로벌', '실무경험'],
    '글로벌 기업에서 3개월간 실무 경험을 쌓는 인턴십 프로그램입니다.',
    ARRAY['급여 지원', '숙소 제공', '정규직 전환 기회'],
    '영어 가능한 대학생 및 졸업생',
    '2024-12-01',
    '2025-03-31',
    'https://example.com/internship',
    '해외',
    'intern@example.com',
    NULL,
    3450,
    278
);
```

---

## 🔗 5. 직무 시뮬레이션 결과 페이지 연동

### JobResult 컴포넌트에서 호출

```typescript
// 직무 시뮬레이션 완료 후 해당 직무에 맞는 활동 추천
const fetchRecommendedActivities = async () => {
  const targetJob = jobToTargetJob[topJob] || '전략기획';
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch(
    `http://localhost:8000/api/activities?limit=3&sort=match_score`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  setRecommendedActivities(data.data.activities);
};
```

### 직무 코드 매핑

```typescript
const jobToTargetJob = {
  MKT: '마케팅',
  PM: '전략기획',
  DATA: '데이터분석',
  DEV: '개발',
  TECH: '개발',
  DESIGN: '디자인',
  PEOPLE: '인사',
  HR: '인사',
  FIN: '재무'
};
```

---

## 📝 6. 구현 체크리스트

### 필수 구현 사항

- [ ] `GET /api/activities` 엔드포인트 구현
- [ ] Query parameter 필터링 (category, field, sort, limit, search)
- [ ] 사용자 인증 처리 (Bearer token 또는 x-user-id)
- [ ] 매칭 점수 계산 로직 구현
- [ ] 추천 이유 생성 로직
- [ ] `POST /api/activities/{id}/bookmark` 구현
- [ ] `DELETE /api/activities/{id}/bookmark` 구현
- [ ] 북마크 수 업데이트 로직
- [ ] 조회수 증가 로직
- [ ] CORS 설정 (프론트엔드 localhost:3000 허용)

### 선택 구현 사항

- [ ] 페이지네이션 (offset/cursor 기반)
- [ ] 검색 기능 (제목, 기관명, 태그)
- [ ] 마감임박 활동 우선순위
- [ ] 사용자 관심사 기반 개인화 추천
- [ ] 활동 조회수 추적
- [ ] 캐싱 (Redis 등)
- [ ] Rate limiting

---

## 🚀 7. 테스트 방법

### cURL 예시

```bash
# 1. 활동 목록 조회
curl -X GET "http://localhost:8000/api/activities?limit=20&sort=match_score" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 2. 카테고리 필터링
curl -X GET "http://localhost:8000/api/activities?category=contest&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 북마크 추가
curl -X POST "http://localhost:8000/api/activities/ACTIVITY_ID/bookmark" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 4. 북마크 제거
curl -X DELETE "http://localhost:8000/api/activities/ACTIVITY_ID/bookmark" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection

```json
{
  "info": {
    "name": "Activity Recommendations API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Activities",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:8000/api/activities?limit=20&sort=match_score",
          "host": ["http://localhost:8000"],
          "path": ["api", "activities"],
          "query": [
            {"key": "limit", "value": "20"},
            {"key": "sort", "value": "match_score"}
          ]
        }
      }
    },
    {
      "name": "Add Bookmark",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": "http://localhost:8000/api/activities/{{activity_id}}/bookmark"
      }
    }
  ]
}
```

---

## 🔧 8. 환경 변수

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_secret_key_here
CORS_ORIGINS=http://localhost:3000
```

---

## 📞 9. 문의사항

프론트엔드 구현 완료 상태:
- ✅ `/dashboard/recommendations` 페이지 구현 완료
- ✅ 활동 카드 UI 완성
- ✅ 북마크 토글 기능 구현
- ✅ 필터링 UI 구현
- ✅ 직무 시뮬레이션 결과 페이지 연동
- ✅ Mock 데이터 fallback 구현

백엔드 구현 후 Mock 데이터는 자동으로 실제 데이터로 대체됩니다.

---

**작성일**: 2024-11-22  
**버전**: 1.0  
**담당자**: Frontend Team
