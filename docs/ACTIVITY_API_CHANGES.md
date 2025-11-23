# 활동 추천 API 변경사항

## 📅 변경 일자
2025-11-22

## 🎯 변경 목적
프론트엔드 요구사항(`BACKEND_ACTIVITY_API_REQUIREMENTS.md`)에 맞춰 API 엔드포인트 및 응답 형식 수정

---

## ✅ 주요 변경사항

### 1. 엔드포인트 경로 변경

**변경 전:**
```
/api/v1/recommendations/activities
```

**변경 후:**
```
/api/activities (주 엔드포인트)
/api/recommendations/activities (별칭, 기존 호환성 유지)
```

### 2. 인증 방식 개선

**기존:**
- `get_current_user` Dependency 필수 (인증 필수)

**변경:**
- `x-user-id` 헤더 또는 `Authorization: Bearer {token}` 헤더 선택적 지원
- 미인증 사용자도 활동 목록 조회 가능 (단, 북마크 정보 없음)

```python
# 헤더 예시
x-user-id: test-user-123
# 또는
Authorization: Bearer your-access-token
```

### 3. 응답 형식 변경

**변경 전:**
```json
{
  "data": {
    "activities": [
      {
        "id": "...",
        "title": "...",
        "match_score": 0.85,
        ...
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20
  },
  "timestamp": "..."
}
```

**변경 후:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "activity": {
          "id": "...",
          "title": "...",
          "url": "...",
          "application_deadline": "...",
          "is_bookmarked": false,
          ...
        },
        "match_score": 0.92,
        "match_reasons": [
          "전공 일치",
          "관심사 부합"
        ]
      }
    ],
    "total_count": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 4. 필드명 변경

| 기존 필드 | 새 필드 | 설명 |
|----------|---------|------|
| `activity_url` | `url` | 활동 상세 페이지 URL |
| `application_end` | `application_deadline` | 지원 마감일 |
| - | `match_reasons` | 추천 이유 배열 추가 |

### 5. 매칭 알고리즘 변경

**기존 알고리즘:**
- 학과 매칭 (30%)
- 키워드 매칭 (40%)
- 관심 분야 매칭 (20%)
- 난이도 매칭 (10%)

**새 알고리즘 (프론트엔드 요구사항):**
- 직무 매칭 (50%) - `target_jobs` 배열 기반
- 태그 매칭 (30%) - `tags` 배열 기반
- 마감일 임박도 (10%) - 7일 이내 높은 점수
- 인기도 (10%) - `bookmark_count`, `view_count` 기반

```python
match_score = (job_match * 0.5) + (tag_match * 0.3) + (deadline_urgency * 0.1) + (popularity * 0.1)
```

### 6. Query Parameter 변경

**변경:**
- `fields` → `field` (단수형, 직무명)
- `search` 추가 (제목, 기관명 검색)
- `page` 제거 (단순화)

**새 파라미터:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | ❌ | 활동 카테고리 (`contest`, `internship`, 등) |
| `field` | string | ❌ | 관심 직무 (`마케팅`, `개발`, 등) |
| `search` | string | ❌ | 검색 키워드 |
| `limit` | number | ❌ | 결과 개수 (기본값: 20) |
| `sort` | string | ❌ | 정렬 (`recommended`, `deadline`, `popular`) |

### 7. 북마크 API 응답 변경

**POST `/api/activities/{activity_id}/bookmark` 응답:**

```json
{
  "success": true,
  "data": {
    "activity_id": "uuid",
    "is_bookmarked": true,
    "bookmark_count": 90
  },
  "message": "북마크에 추가되었습니다"
}
```

**DELETE `/api/activities/{activity_id}/bookmark` 응답:**

```json
{
  "success": true,
  "data": {
    "activity_id": "uuid",
    "is_bookmarked": false,
    "bookmark_count": 88
  },
  "message": "북마크에서 제거되었습니다"
}
```

---

## 🔧 데이터베이스 스키마 확인

### activities 테이블

필드 변경 확인:
- ✅ `activity_url` → DB 필드명
- ✅ API에서 `url`로 매핑
- ✅ `application_end` → DB 필드명
- ✅ API에서 `application_deadline`으로 매핑

---

## 🧪 테스트 방법

### 1. 활동 목록 조회 (미인증)

```bash
curl -X GET "http://localhost:8000/api/activities?limit=10&sort=match_score" \
  -H "Content-Type: application/json"
```

### 2. 활동 목록 조회 (x-user-id 헤더)

```bash
curl -X GET "http://localhost:8000/api/activities?category=contest&limit=10" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123"
```

### 3. 직무 필터링

```bash
curl -X GET "http://localhost:8000/api/activities?field=마케팅&limit=20" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123"
```

### 4. 검색

```bash
curl -X GET "http://localhost:8000/api/activities?search=공모전&limit=10" \
  -H "Content-Type: application/json"
```

### 5. 북마크 추가

```bash
curl -X POST "http://localhost:8000/api/activities/{activity_id}/bookmark" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123"
```

### 6. 북마크 제거

```bash
curl -X DELETE "http://localhost:8000/api/activities/{activity_id}/bookmark" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123"
```

---

## 📋 마이그레이션 필요 사항

### 현재 데이터베이스 상태

- ✅ `activities` 테이블: 60개 활동 데이터 존재
- ✅ `user_activity_bookmarks` 테이블: 생성 완료 (RLS 정책 포함)
- ⚠️ `users` 테이블에 `job_preference` 필드 필요 (매칭 알고리즘용)

### 추가 마이그레이션 (선택)

```sql
-- users 테이블에 job_preference 컬럼 추가 (없는 경우)
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_preference TEXT;

-- 조회수 증가 함수 (북마크 카운트는 직접 UPDATE로 변경)
-- RPC 함수 대신 직접 UPDATE 사용하므로 불필요
```

---

## ⚠️ 주의사항

1. **테이블명 차이:**
   - 기존: `user_bookmarks`
   - 새로: `user_activity_bookmarks`
   - 실제 생성된 테이블명 확인 필요

2. **RPC 함수 제거:**
   - `increment_bookmark_count` / `decrement_bookmark_count` 제거
   - 직접 UPDATE 쿼리로 변경 (더 간단하고 안정적)

3. **인증 간소화:**
   - `x-user-id` 헤더는 개발/테스트용
   - 프로덕션에서는 JWT 토큰 검증 강화 필요

4. **CORS 설정:**
   - 프론트엔드 도메인 허용 확인 (`http://localhost:3000`)

---

## 🚀 배포 체크리스트

- [x] API 엔드포인트 경로 변경
- [x] 응답 형식 프론트엔드 요구사항 반영
- [x] 매칭 알고리즘 업데이트
- [x] 북마크 API 응답 형식 변경
- [x] 미인증 사용자 지원
- [x] 별칭 엔드포인트 추가 (호환성)
- [ ] 프론트엔드 통합 테스트
- [ ] JWT 토큰 검증 강화 (프로덕션)
- [ ] API 문서 업데이트 (Swagger)

---

## 📞 문의

- 프론트엔드 연동 문제: `BACKEND_ACTIVITY_API_REQUIREMENTS.md` 참고
- 크롤러 실행: `docs/ACTIVITY_RECOMMENDATION_GUIDE.md` 참고
- API 테스트: `http://localhost:8000/api/docs` (Swagger UI)
