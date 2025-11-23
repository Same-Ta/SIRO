# 백엔드 API 엔드포인트 구현 요청

## 🚨 긴급 이슈
프론트엔드에서 404 에러 발생 중입니다. 아래 API 엔드포인트가 구현되어 있는지 확인 부탁드립니다.

## 📌 필요한 API 엔드포인트

### 1. 활동 목록 조회 API
**우선순위: 높음**

다음 중 하나의 엔드포인트가 필요합니다:
- `GET /api/activities`
- 또는 `GET /api/recommendations/activities`

#### 요청 파라미터 (Query String):
```
limit: number (기본값: 20, 현재 프론트에서 60 요청)
sort: string (match_score | recommended | deadline | popular)
category: string (all | contest | hackathon | external_activity | project | club | internship | volunteer)
field: string (all | 마케팅 | 전략기획 | 데이터분석 | 개발 | 디자인 | 영업 | 인사 | 재무)
```

#### 요청 헤더:
```
Authorization: Bearer {accessToken}  (로그인한 경우)
또는
x-user-id: {userId}  (비로그인 상태)
```

#### 응답 형식:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "string",
        "title": "string",
        "organization": "string",
        "category": "contest | hackathon | external_activity | project | club | internship | volunteer",
        "target_jobs": ["마케팅", "전략기획", ...],
        "tags": ["string", ...],
        "description": "string",
        "benefits": ["string", ...],
        "eligibility": "string",
        "start_date": "YYYY-MM-DD" (optional),
        "end_date": "YYYY-MM-DD" (optional),
        "application_deadline": "YYYY-MM-DD" (optional),
        "url": "string" (optional),
        "image_url": "string" (optional),
        "location": "string" (optional),
        "contact_info": "string" (optional),
        "prize_money": "string" (optional),
        "view_count": number,
        "bookmark_count": number,
        "is_bookmarked": boolean,
        "match_score": number (0-100, sort=match_score일 때 필수),
        "match_reasons": ["string", ...] (매칭 이유 설명),
        "created_at": "ISO 8601 datetime",
        "updated_at": "ISO 8601 datetime"
      }
    ],
    "total": number,
    "page": number,
    "page_size": number
  }
}
```

### 2. 북마크 토글 API
**우선순위: 중간**

#### 북마크 추가
```
POST /api/activities/{activityId}/bookmark
```

#### 북마크 제거
```
DELETE /api/activities/{activityId}/bookmark
```

#### 요청 헤더:
```
Authorization: Bearer {accessToken}
또는
x-user-id: {userId}
Content-Type: application/json
```

#### 응답 형식:
```json
{
  "success": true,
  "message": "북마크가 추가/제거되었습니다"
}
```

## 🔍 확인 필요 사항

1. **현재 구현된 엔드포인트 경로 확인**
   - `/api/activities` 경로가 구현되어 있나요?
   - `/api/recommendations/activities` 경로가 구현되어 있나요?
   - 다른 경로를 사용 중이라면 알려주세요

2. **CORS 설정 확인**
   - `http://localhost:3000` (프론트엔드)에서의 요청을 허용하는지 확인 필요

3. **데이터베이스 연결 확인**
   - Supabase에 60개의 활동 데이터가 정상적으로 저장되어 있나요?
   - `activities` 테이블 구조가 위 응답 형식과 일치하나요?

4. **인증 방식 확인**
   - Bearer token 인증이 구현되어 있나요?
   - `x-user-id` 헤더 방식도 지원하나요?

## 🧪 테스트 방법

백엔드 서버 실행 후 다음 명령어로 테스트 가능:

```bash
# 활동 목록 조회 테스트
curl http://localhost:8000/api/activities?limit=60&sort=match_score&category=all&field=all

# 또는
curl http://localhost:8000/api/recommendations/activities?limit=60&sort=match_score&category=all&field=all
```

## 📝 참고사항

- 프론트엔드는 먼저 `/api/activities`를 호출하고, 404가 나면 `/api/recommendations/activities`를 시도합니다
- 두 경로 모두 404가 나면 사용자에게 에러 메시지가 표시됩니다
- `match_score` 정렬은 사용자 프로필 기반 매칭 점수로 정렬해야 합니다
- 비로그인 사용자도 활동 목록을 볼 수 있어야 하지만, `is_bookmarked`는 false로 고정됩니다

## 💡 추가 디버깅 팁

백엔드 개발자에게 다음 정보도 요청하세요:

1. **현재 구현된 API 엔드포인트 목록** (Swagger/OpenAPI 문서가 있다면 URL)
2. **백엔드 서버 로그** (404 에러 발생 시점의 로그)
3. **사용 중인 라우터 경로 설정** (FastAPI의 router 설정)
