# CIRO 백엔드 시스템 로직 문서 (v2.0)

## 📋 문서 정보
- **작성일**: 2025-11-23
- **버전**: 2.0 (최신 통합 버전)
- **목적**: CIRO 백엔드의 주요 API 로직 및 시스템 아키텍처 문서화
- **관련 파일**: `backend/app/routes/`, `backend/docs/prompt2.md`

---

## 1. 시스템 개요

### 1.1 핵심 기능
CIRO는 경험 회고 및 역량 추적 시스템으로 다음 기능을 제공합니다:

1. **회고 시스템** (Reflections)
   - Micro Log (초라이트 기록)
   - 회고 작성 및 관리
   - 스토리 뷰 생성
   - 통계 및 인사이트

2. **스페이스 관리** (Spaces)
   - 회고 스페이스 생성/관리
   - 회고 주기 설정 (일간/주간/격주/월간)
   - 다음 회고 날짜 자동 계산

3. **헬스체크** (Health Check)
   - 일별 컨디션 기록 (0-100)
   - 히스토리 조회
   - 트렌드 분석

4. **진로/직무 시스템** (Career/Survey)
   - 일반 직무 설문 (8개 대분류)
   - 스펙체크 (세부 직무 분석)
   - 직무 시뮬레이션

5. **활동 추천** (Recommendations)
   - 맞춤 활동 추천
   - 북마크 관리
   - 지원 현황 추적

6. **대시보드** (Dashboard)
   - 통합 통계
   - 최근 활동
   - 회고 개요

---

## 2. 회고 시스템 (Reflections)

### 2.1 Micro Log (초라이트 기록)

#### 엔드포인트: POST `/api/v1/reflections/micro`

**목적**: 간단한 일일 활동 기록 및 기분 추적

**요청 바디**:
```json
{
  "activity_type": "contest",
  "memo": "해커톤 준비 시작",
  "mood_compare": "better",
  "reason": "positive_001",
  "tags": ["해커톤", "AI", "팀워크"],
  "date": "2025-11-23"
}
```

**유효성 검증**:
- `activity_type`: contest | club | project | internship | study | etc
- `mood_compare`: worse | same | better
- `reason`: mood_compare가 'same'이 아닐 때 필수
- `memo`: 최대 500자

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "user123",
    "activity_type": "contest",
    "memo": "해커톤 준비 시작",
    "mood_compare": "better",
    "reason": "positive_001",
    "tags": ["해커톤", "AI", "팀워크"],
    "date": "2025-11-23",
    "created_at": "2025-11-23T10:30:00Z"
  },
  "error": null
}
```

#### 엔드포인트: GET `/api/v1/reflections/micro`

**목적**: 마이크로 로그 목록 조회

**쿼리 파라미터**:
- `limit`: 조회 개수 (기본 20, 최대 100)
- `offset`: 페이지네이션 오프셋
- `date_from`: 시작 날짜
- `date_to`: 종료 날짜
- `activity_type`: 활동 유형 필터

---

### 2.2 회고 통계

#### 엔드포인트: GET `/api/v1/reflections/stats`

**목적**: 회고 통계 및 활동 분포 조회

**쿼리 파라미터**:
- `period`: week | month (기본 week)

**응답**:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "total_logs": 15,
    "positive_logs": 10,
    "neutral_logs": 3,
    "negative_logs": 2,
    "activity_distribution": {
      "contest": 5,
      "project": 7,
      "study": 3
    },
    "most_active_type": "project",
    "top_tags": [
      {"tag": "AI", "count": 8},
      {"tag": "팀워크", "count": 5}
    ]
  }
}
```

**로직**:
1. 사용자의 지정 기간 내 마이크로 로그 조회
2. mood_compare 기준으로 긍정/중립/부정 분류
3. activity_type 분포 계산
4. 가장 많이 사용된 태그 Top 5 추출

---

### 2.3 스토리 뷰

#### 엔드포인트: GET `/api/v1/reflections/story`

**목적**: 사용자의 활동을 스토리 형식으로 생성

**쿼리 파라미터**:
- `period`: week | month | quarter

**응답**:
```json
{
  "success": true,
  "data": {
    "period_label": "지난 주",
    "total_days": 7,
    "activity_summary": [
      {
        "type": "contest",
        "count": 5,
        "icon": "🏆",
        "label": "공모전/대외활동"
      }
    ],
    "positive_patterns": [
      "팀 협업을 통한 성장이 두드러졌어요",
      "AI 관련 프로젝트에서 긍정적인 피드백이 많았어요"
    ],
    "negative_patterns": [
      "시간 관리에 어려움을 느꼈던 순간이 있었어요"
    ],
    "strength_analysis": {
      "top_strength": "팀워크 및 협업 능력",
      "evidence": ["해커톤에서 팀 리더 역할", "프로젝트 협업 성공"]
    },
    "suggested_tracks": ["기획", "PM", "데이터 분석"],
    "next_suggestion": {
      "title": "다음 단계 추천",
      "action": "추천 활동 보러가기",
      "recommended_activities": []
    }
  }
}
```

**로직**:
1. 기간 내 모든 마이크로 로그 조회
2. 활동 유형별 분포 분석
3. 긍정/부정 패턴 추출 (reason 코드 기반)
4. 태그 빈도 분석으로 강점 도출
5. 추천 진로 트랙 생성

---

## 3. 스페이스 관리 (Spaces)

### 3.1 스페이스 생성

#### 엔드포인트: POST `/api/v1/spaces`

**목적**: 새로운 회고 스페이스 생성

**요청 바디**:
```json
{
  "name": "AI 해커톤 준비",
  "type": "contest",
  "description": "2025 AI 해커톤 준비 회고",
  "start_date": "2025-11-01",
  "end_date": "2025-12-31",
  "reflection_cycle": "weekly",
  "reminder_enabled": true
}
```

**유효성 검증**:
- `end_date` >= `start_date`
- `reflection_cycle`: daily | weekly | biweekly | monthly

**로직**:
1. 다음 회고 날짜 자동 계산 (`calculate_next_reflection_date`)
   - daily: 다음 날
   - weekly: 다음 주 같은 요일
   - biweekly: 2주 후
   - monthly: 다음 달 같은 날
2. 예상 회고 횟수 계산 (`calculate_expected_reflections`)
   - 시작일~종료일 사이 주기별 회고 가능 횟수

**응답**:
```json
{
  "id": "uuid",
  "user_id": "user123",
  "name": "AI 해커톤 준비",
  "type": "contest",
  "reflection_cycle": "weekly",
  "next_reflection_date": "2025-11-30T00:00:00Z",
  "expected_reflections": 8,
  "total_reflections": 0,
  "status": "active"
}
```

---

### 3.2 스페이스 목록 조회

#### 엔드포인트: GET `/api/v1/spaces`

**쿼리 파라미터**:
- `status`: active | completed | archived
- `type`: contest | project | study | etc

---

### 3.3 주기 추천 API

#### 엔드포인트: POST `/api/v1/spaces/recommend-cycle`

**목적**: 활동 특성에 맞는 회고 주기 추천

**요청 바디**:
```json
{
  "type": "contest",
  "duration_days": 90,
  "activity_intensity": "high"
}
```

**응답**:
```json
{
  "recommended_cycle": "weekly",
  "reason": "공모전은 주간 단위로 진행 상황을 점검하는 것이 효과적입니다",
  "alternatives": ["biweekly", "daily"]
}
```

---

## 4. 헬스체크 (Health Check)

### 4.1 헬스체크 기록

#### 엔드포인트: POST `/api/v1/health-check`

**목적**: 일별 컨디션 기록 (기분/팀 상태)

**요청 바디**:
```json
{
  "health_score": 75,
  "date": "2025-11-23",
  "notes": "오늘 프로젝트 진행이 잘 됐음"
}
```

**유효성 검증**:
- `health_score`: 0-100 사이 정수
- `date`: ISO 8601 날짜 형식 (기본값: 오늘)

**Upsert 로직**:
```python
# Supabase upsert: user_id + date 조합으로 unique
result = supabase.table("health_checks").upsert({
    "user_id": user_id,
    "health_score": data.health_score,
    "date": check_date,
    "notes": data.notes,
    "updated_at": datetime.now().isoformat()
}, on_conflict="user_id,date").execute()
```

→ 동일 날짜에 여러 번 기록 시 자동 업데이트

---

### 4.2 최신 헬스체크 조회

#### 엔드포인트: GET `/api/v1/health-check/latest`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "user123",
    "health_score": 75,
    "date": "2025-11-23",
    "notes": "오늘 프로젝트 진행이 잘 됐음",
    "created_at": "2025-11-23T10:00:00Z"
  }
}
```

---

### 4.3 헬스체크 히스토리

#### 엔드포인트: GET `/api/v1/health-check/history`

**쿼리 파라미터**:
- `limit`: 조회 개수 (기본 30)

**용도**: 컨디션 트렌드 시각화 (차트/그래프)

---

## 5. 진로/직무 시스템 (Career & Survey)

### 5.1 일반 직무 설문

#### 엔드포인트: POST `/api/v1/survey/submit`

**목적**: 8개 대분류 직무 적합도 분석

**대분류 직무**:
- marketing (마케팅)
- hr (인사)
- brand (브랜드/상품 기획)
- strategy (전략기획)
- finance (재무)
- sales (영업)
- data (데이터 분석)
- operations (운영)

**요청 바디**:
```json
{
  "survey_id": "survey-general",
  "answers": {
    "q1": 5,
    "q2": 4,
    "q3": 3
  },
  "user_id": "user123"
}
```

**점수 계산 로직**:
```python
def calculate_general_scores(answers, survey_data):
    scores = {job['id']: 0.0 for job in survey_data['job_categories']}
    trait_contributions = defaultdict(dict)
    
    for question in survey_data['questions']:
        q_id = question['id']
        q_type = question.get('type', 'likert')
        
        if q_type == 'likert':
            # Likert 응답 (1-5)
            answer = answers.get(q_id, 0)
            for job_id, weight in question['weights'].items():
                scores[job_id] += answer * weight
                
        elif q_type in ['single_choice', 'multiple_choice']:
            # 선택형 응답
            selected = answers.get(q_id, [])
            for option in question['options']:
                if option['value'] in selected:
                    for job_id, weight in option['weights'].items():
                        scores[job_id] += 5 * weight  # 고정 보너스
    
    # 정규화 (0-100)
    max_score = max(scores.values()) or 1
    normalized = {k: (v / max_score) * 100 for k, v in scores.items()}
    
    return normalized, trait_contributions
```

**응답**:
```json
{
  "survey_id": "survey-general",
  "submitted_at": "2025-11-23T10:00:00Z",
  "total_questions": 30,
  "job_scores": {
    "marketing": 88.5,
    "data": 80.2,
    "brand": 73.1,
    "strategy": 69.4,
    "finance": 51.0,
    "sales": 48.3,
    "hr": 44.2,
    "operations": 42.7
  },
  "preference_top3": [
    {"job_id": "marketing", "name": "마케팅", "score": 88.5, "rank": 1},
    {"job_id": "data", "name": "데이터 분석", "score": 80.2, "rank": 2},
    {"job_id": "brand", "name": "브랜드/상품 기획", "score": 73.1, "rank": 3}
  ],
  "fit_top3": [
    {"job_id": "marketing", "name": "마케팅", "score": 88.5, "rank": 1},
    {"job_id": "data", "name": "데이터 분석", "score": 80.2, "rank": 2},
    {"job_id": "brand", "name": "브랜드/상품 기획", "score": 73.1, "rank": 3}
  ],
  "recommended_job": {
    "job_id": "marketing",
    "name": "마케팅",
    "score": 88.5,
    "rank": 1,
    "reason": "마케팅 직무에 필요한 창의적 기획 · 데이터 기반 의사결정 역량 점수가 높았습니다."
  },
  "insights": [
    "마케팅 직무가 선호와 역량 모두에서 가장 높은 점수를 기록했어요.",
    "상위 직무를 스펙체크에 저장하면 세부 직무 역량까지 분석할 수 있어요."
  ]
}
```

---

### 5.2 스펙체크 (세부 직무 분석)

#### 엔드포인트: GET `/api/v1/survey/spec-check/{job_category}`

**목적**: 대분류 직무의 스펙체크 설문 데이터 반환

**예시**: `GET /api/v1/survey/spec-check/marketing`

**응답**: `spec-check-marketing.json` 전체 내용

---

#### 엔드포인트: POST `/api/v1/survey/spec-check/submit`

**목적**: 세부 직무 유형 판별 (예: 마케팅 → 그로스/디지털/브랜드 등)

**요청 바디**:
```json
{
  "job_category": "marketing",
  "answers": {
    "m1": 5,
    "m2": 4,
    "m3": 5
  }
}
```

**점수 계산**:
```python
def calculate_spec_check_scores(answers, spec_data):
    subtype_scores = defaultdict(float)
    
    for question in spec_data['questions']:
        answer = answers.get(question['id'], 0)
        for subtype_id, weight in question['weights'].items():
            subtype_scores[subtype_id] += answer * weight
    
    # 정규화
    max_score = max(subtype_scores.values()) or 1
    normalized = {k: (v / max_score) * 100 for k, v in subtype_scores.items()}
    
    return normalized
```

**응답**:
```json
{
  "job_category": "marketing",
  "submitted_at": "2025-11-23T10:05:00Z",
  "total_questions": 20,
  "score_map": {
    "growth": 92.4,
    "performance": 84.0,
    "digital": 80.5,
    "brand": 72.3,
    "content": 69.1,
    "crm": 65.4
  },
  "top_specializations": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 92.4},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 84.0}
  ],
  "preference_top3": [...],
  "fit_top3": [...],
  "recommended_specialization": {
    "subtype_id": "growth",
    "name": "그로스 마케터",
    "score": 92.4,
    "description": "데이터 기반 실험과 성장 지표 최적화에 집중",
    "reason": "'데이터 분석', 'A/B 테스트' 관련 문항 점수가 특히 높았습니다."
  },
  "insights": [
    "그로스 마케터가 세부 직무 중 가장 높은 점수를 기록했습니다."
  ]
}
```

---

### 5.3 직무 시뮬레이션

#### 엔드포인트: POST `/api/v1/job-simulation/start`

**목적**: AI 기반 직무 체험 시뮬레이션 시작

#### 엔드포인트: POST `/api/v1/job-simulation/submit`

**목적**: 시뮬레이션 답변 제출 및 결과 분석

---

## 6. 활동 추천 (Recommendations)

### 6.1 맞춤 활동 추천

#### 엔드포인트: GET `/api/v1/recommendations/activities`

**쿼리 파라미터**:
- `category`: contest | project | internship | study
- `fields`: 관심 분야 (IT, 경영, 디자인 등)
- `level`: beginner | intermediate | advanced
- `sort`: match_score | deadline | recent

**매칭 점수 계산**:
```python
def calculate_match_score(user_data, activity):
    score = 0
    
    # 관심 분야 매칭
    if activity['field'] in user_data['interests']:
        score += 30
    
    # 레벨 적합도
    if activity['level'] == user_data['level']:
        score += 25
    
    # 키워드 매칭
    user_keywords = set(user_data.get('keywords', []))
    activity_keywords = set(activity.get('tags', []))
    overlap = len(user_keywords & activity_keywords)
    score += min(overlap * 5, 30)
    
    # 마감일 임박도
    days_left = calculate_days_left(activity['end_date'])
    if days_left <= 7:
        score += 15
    elif days_left <= 30:
        score += 10
    
    return score
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2025 AI 해커톤",
      "category": "contest",
      "field": "IT",
      "level": "intermediate",
      "match_score": 85,
      "deadline": "2025-12-31",
      "days_left": 38,
      "tags": ["AI", "개발", "팀프로젝트"],
      "bookmarked": false
    }
  ]
}
```

---

### 6.2 북마크 관리

#### 엔드포인트: POST `/api/v1/recommendations/activities/{id}/bookmark`

**목적**: 활동 북마크 추가

#### 엔드포인트: DELETE `/api/v1/recommendations/activities/{id}/bookmark`

**목적**: 북마크 삭제

---

## 7. 대시보드 (Dashboard)

### 7.1 대시보드 통계

#### 엔드포인트: GET `/api/dashboard/stats`

**헤더**: `x-user-id: {UUID}`

**응답**:
```json
{
  "success": true,
  "data": {
    "total_reflections": 45,
    "current_streak": 7,
    "active_spaces": 3,
    "completed_activities": 12
  }
}
```

**로직**:
1. 전체 회고 개수 조회
2. 연속 작성일 계산 (`calculate_streak`)
   - 최근 날짜부터 역순으로 회고 날짜 체크
   - 하루 간격이 벌어지면 중단
3. 활성 스페이스 개수
4. 완료된 활동 개수

---

### 7.2 최근 활동

#### 엔드포인트: GET `/api/dashboard/recent-activity`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "type": "reflection",
      "title": "AI 해커톤 준비 회고",
      "project_name": "서버랩 D-1",
      "snippet": "오늘 팀원들과 아이디어 회의를 진행했다...",
      "mood": "😊",
      "created_at": "2025-11-23T10:00:00Z"
    },
    {
      "type": "log",
      "title": "새 로그 생성",
      "project_name": "롯데 공모전",
      "created_at": "2025-11-22T15:30:00Z"
    }
  ]
}
```

**로직**:
1. 최근 로그 5개 조회
2. 최근 회고 5개 조회
3. 두 목록 병합 후 시간순 정렬
4. 최대 10개 반환

---

### 7.3 회고 개요

#### 엔드포인트: GET `/api/dashboard/reflection-overview`

**응답**:
```json
{
  "success": true,
  "data": {
    "active_spaces": [
      {
        "id": "uuid",
        "name": "AI 해커톤 준비",
        "type": "contest",
        "total_reflections": 8,
        "expected_reflections": 12,
        "next_reflection_date": "2025-11-30"
      }
    ],
    "recent_reflections": [...],
    "due_today_count": 2,
    "due_today": [...]
  }
}
```

---

## 8. 인증 및 보안

### 8.1 인증 미들웨어

```python
from app.utils.auth import get_current_user

@router.post("/spaces")
async def create_space(
    data: SpaceCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    # ... 로직
```

### 8.2 인증 방식
1. **JWT 토큰**: Authorization 헤더 또는 쿠키
2. **x-user-id 헤더**: 개발/테스트 환경 (임시)
3. **Supabase Auth**: 프로덕션 환경 권장

---

## 9. 에러 처리

### 9.1 표준 에러 응답

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "health_score must be between 0 and 100"
  }
}
```

### 9.2 주요 에러 코드
- `VALIDATION_ERROR`: 입력값 유효성 검사 실패
- `NOT_FOUND`: 리소스 없음
- `UNAUTHORIZED`: 인증 실패
- `INTERNAL_ERROR`: 서버 내부 오류

---

## 10. 데이터베이스 스키마

### 10.1 주요 테이블

**micro_logs**:
```sql
CREATE TABLE micro_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(50),
  memo TEXT,
  mood_compare VARCHAR(20),
  reason VARCHAR(50),
  tags TEXT[],
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**health_checks**:
```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**reflection_spaces**:
```sql
CREATE TABLE reflection_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  type VARCHAR(50),
  description TEXT,
  start_date DATE,
  end_date DATE,
  reflection_cycle VARCHAR(20),
  next_reflection_date TIMESTAMPTZ,
  expected_reflections INTEGER,
  total_reflections INTEGER DEFAULT 0,
  reminder_enabled BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. 성능 최적화

### 11.1 인덱싱
```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_micro_logs_user_date ON micro_logs(user_id, date DESC);
CREATE INDEX idx_health_checks_user_date ON health_checks(user_id, date DESC);
CREATE INDEX idx_spaces_user_status ON reflection_spaces(user_id, status);
```

### 11.2 캐싱 전략
- **Redis 캐시**: 대시보드 통계 (5분 TTL)
- **쿼리 최적화**: JOIN 최소화, SELECT 필드 제한

---

## 12. 배포 및 환경 설정

### 12.1 환경 변수
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
```

### 12.2 서버 실행
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

---

## 13. 참고 문서
- `backend/docs/prompt2.md`: 프롬프트 및 AI 로직
- `backend/docs/API_SPECIFICATION.md`: 전체 API 명세
- `app/docs/logic2.md`: 프론트엔드 로직
