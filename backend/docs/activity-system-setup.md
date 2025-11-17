# 활동 추천 시스템 설정 가이드

## 1. 데이터베이스 설정

### Supabase SQL Editor에서 실행

`docs/migration-activity-system.sql` 파일의 전체 내용을 Supabase SQL Editor에서 실행하세요.

이 스크립트는:
- ✅ 불필요한 테이블 삭제 (reflection_settings, bookmarks, team_members)
- ✅ 활동 추천 시스템 테이블 생성 (activities, user_bookmarks, user_activity_applications, user_preferences, activity_recommendations)
- ✅ 인덱스 생성
- ✅ 트리거 및 함수 생성
- ✅ 8개 샘플 활동 데이터 삽입

### 필수 패키지 설치

```bash
pip install aiohttp beautifulsoup4
```

## 2. 크롤링 실행

### 활동 데이터 수집

```bash
python -m app.crawlers.activity_crawler
```

현재는 샘플 데이터를 사용하며, 다음 사이트에서 실제 데이터를 수집합니다:
- 링커리어 (linkareer.com)
- 위비티 (wevity.com)
- 씽굿 (thinkpool.com)
- 온오프믹스 (onoffmix.com)

### 자동 크롤링 (Cron)

매일 오전 2시에 자동으로 활동 데이터를 업데이트하려면:

```bash
# Windows 작업 스케줄러 사용
# 또는 Linux crontab:
0 2 * * * cd /path/to/project && python -m app.crawlers.activity_crawler
```

## 3. API 테스트

### 추천 활동 조회

```bash
curl "http://localhost:8000/api/v1/recommendations/activities?category=contest&limit=10" \
  -H "x-user-id: YOUR_USER_ID"
```

### 활동 상세 조회

```bash
curl "http://localhost:8000/api/v1/recommendations/activities/ACTIVITY_ID" \
  -H "x-user-id: YOUR_USER_ID"
```

### 북마크 추가

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/activities/ACTIVITY_ID/bookmark" \
  -H "x-user-id: YOUR_USER_ID"
```

### 활동 지원

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/activities/ACTIVITY_ID/apply" \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{"notes": "AI 프로젝트 경험이 있습니다"}'
```

### 추천 설정

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/preferences" \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "interested_fields": ["IT", "기획"],
    "interested_categories": ["contest", "hackathon"],
    "skill_keywords": ["Python", "AI", "머신러닝"],
    "preferred_difficulty": "intermediate",
    "notification_enabled": true
  }'
```

### 인기 활동

```bash
curl "http://localhost:8000/api/v1/recommendations/trending?limit=5" \
  -H "x-user-id: YOUR_USER_ID"
```

### 마감 임박

```bash
curl "http://localhost:8000/api/v1/recommendations/deadline-soon?days=7" \
  -H "x-user-id: YOUR_USER_ID"
```

## 4. 삭제된 테이블

프로젝트와 관련 없는 테이블이 삭제되었습니다:
- ❌ reflection_settings
- ❌ bookmarks (기존)
- ❌ team_members

## 5. 활성 테이블 (26개)

### 사용자 관련
- users
- user_keywords
- user_bookmarks (새로 생성)
- user_activity_applications (새로 생성)
- user_preferences (새로 생성)

### 활동 추천
- activities (새로 생성)
- activity_recommendations (새로 생성)

### 경험 및 회고
- logs
- projects
- reflections
- reflection_spaces
- reflection_templates
- reflection_ai_analysis
- growth_metrics

### 키워드 및 증거
- keywords
- log_keywords
- evidence
- peer_endorsements
- endorsement_keywords

### 포트폴리오
- portfolios
- portfolio_projects

### 알림
- notifications

## 6. API 엔드포인트 총계

- **총 98개 엔드포인트**
- **18개 라우터 모듈**
- **활동 추천 시스템**: 10개 엔드포인트 추가

## 7. 크롤링 확장

실제 크롤링을 구현하려면 `app/crawlers/activity_crawler.py`에서:

1. Selenium 설치
```bash
pip install selenium webdriver-manager
```

2. 각 사이트별 크롤링 함수 구현
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

driver = webdriver.Chrome(ChromeDriverManager().install())
```

## 8. 모니터링

### 활동 통계

```sql
-- 카테고리별 활동 수
SELECT category, COUNT(*) as count
FROM activities
WHERE status = 'active'
GROUP BY category;

-- 분야별 활동 수
SELECT unnest(fields) as field, COUNT(*) as count
FROM activities
WHERE status = 'active'
GROUP BY field
ORDER BY count DESC;

-- 마감 임박 활동 (7일 이내)
SELECT title, organization, application_end_date,
       (application_end_date - CURRENT_DATE) as days_left
FROM activities
WHERE status = 'active'
  AND application_end_date >= CURRENT_DATE
  AND application_end_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY application_end_date;
```

## 9. 문제 해결

### 크롤링 오류

```python
# 타임아웃 증가
async with session.get(url, timeout=30) as response:
    ...

# 재시도 로직
for i in range(3):
    try:
        result = await crawl_site()
        break
    except Exception as e:
        if i == 2:
            raise
        await asyncio.sleep(5)
```

### 중복 데이터 방지

URL을 UNIQUE 제약조건으로 설정했으므로 자동으로 중복이 방지됩니다.

```sql
-- 중복 URL 확인
SELECT url, COUNT(*) as count
FROM activities
GROUP BY url
HAVING COUNT(*) > 1;
```

## 10. 다음 단계

- ✅ 데이터베이스 테이블 생성
- ✅ API 엔드포인트 구현
- ✅ 추천 알고리즘 구현
- ✅ 크롤러 기본 구조
- ⏳ 실제 크롤링 구현 (Selenium)
- ⏳ 이메일 알림 시스템
- ⏳ 이미지 크롤링 및 저장
- ⏳ 캐싱 (Redis)
