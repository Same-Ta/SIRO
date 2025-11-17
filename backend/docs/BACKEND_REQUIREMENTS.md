# Backend Implementation Requirements

## 목차
1. [개요](#개요)
2. [회고 v3 시스템 아키텍처](#회고-v3-시스템-아키텍처)
3. [필수 API 엔드포인트](#필수-api-엔드포인트)
4. [데이터 모델](#데이터-모델)
5. [비즈니스 로직](#비즈니스-로직)
6. [AI 통합 포인트](#ai-통합-포인트)
7. [우선순위 및 의존성](#우선순위-및-의존성)

---

## 개요

ProoF 플랫폼의 회고 v3 시스템 및 AI 경험 추천 기능을 위한 백엔드 구현 요구사항입니다.

**핵심 기능:**
- 회고 v3: "경험 → 취향 → 행동 → 스토리" 4계층 시스템
- AI 경험 추천: Gemini 기반 맞춤형 진로/활동 추천
- 통계 및 분석: 사용자 성장 패턴 분석

**기술 스택 (권장):**
- Backend: FastAPI / Flask / Django
- Database: PostgreSQL (JSON 필드 지원 필요)
- AI: Google Gemini API 통합
- Auth: JWT Bearer Token

---

## 회고 v3 시스템 아키텍처

### 4계층 구조

```
1. Micro Log (초라이트 기록)
   ↓
2. Preference Pulse (취향 탐지)
   ↓
3. Action Nudge (행동 제안)
   ↓
4. Story View (스토리 생성)
```

### 데이터 흐름

```
[사용자 입력] → [Micro Log 저장] → [무드/태그 분석] → [패턴 감지] 
→ [Action Nudge 생성] → [Story 집계] → [대시보드 표시]
```

### 페이지 구조
- `/dashboard/reflections` - 메인 대시보드 (v3)
- `/dashboard/reflections/baseline` - 베이스라인 무드 설정 (최초 1회)
- `/dashboard/reflections/micro` - 초라이트 기록 페이지
- `/dashboard/reflections/story` - 스토리 뷰 페이지

---

## 필수 API 엔드포인트

### 1. 베이스라인 무드 설정

#### POST `/api/user/baseline-mood`
사용자의 평소 기분 상태를 저장합니다 (최초 1회 필수).

**Request Body:**
```json
{
  "baseline_mood": "tired" | "neutral" | "positive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "baseline_mood": "neutral",
    "updated_at": "2025-01-15T12:34:56Z"
  },
  "error": null
}
```

**비즈니스 로직:**
- 사용자당 1개의 baseline_mood만 저장 (업데이트 가능)
- 이후 모든 무드 비교는 이 값을 기준으로 계산
- users 테이블에 `baseline_mood` 컬럼 추가 필요

---

### 2. 초라이트 기록 (Micro Log)

#### POST `/api/reflections/micro`
활동 경험을 간단하게 기록합니다.

**Request Body:**
```json
{
  "activity_type": "contest" | "club" | "project" | "internship" | "study" | "etc",
  "memo": "오늘 동아리 회의 참석, 새로운 프로젝트 기획 논의",
  "mood_compare": "worse" | "same" | "better",
  "reason": "positive_001" | "negative_001" | ...,
  "tags": ["기획", "협업", "아이디어 회의"],
  "date": "2025-01-15"
}
```

**Field 설명:**
- `activity_type`: 활동 유형 (필수)
  - `contest`: 공모전 / 대외활동
  - `club`: 학회 / 동아리
  - `project`: 팀 프로젝트
  - `internship`: 인턴 / 아르바이트
  - `study`: 자격증 / 공부
  - `etc`: 기타
- `memo`: 활동 메모 (선택, 최대 500자)
- `mood_compare`: 베이스라인 대비 기분 (필수)
- `reason`: 무드 이유 코드 (mood_compare가 'same'이 아닐 때 필수)
- `tags`: AI가 제안하거나 사용자가 선택한 태그 배열 (선택)
- `date`: 활동 날짜 (필수, YYYY-MM-DD)

**Reason Codes:**

**Positive Reasons (mood_compare = "better"):**
```
positive_001: "사람들과 의견 주고받는 게 재밌었다"
positive_002: "새로운 걸 배우는 게 신났다"
positive_003: "내가 잘하는 걸 발휘할 수 있었다"
positive_004: "누군가에게 도움이 되는 게 뿌듯했다"
positive_005: "일이 술술 풀렸다"
positive_006: "성과를 인정받았다"
```

**Negative Reasons (mood_compare = "worse"):**
```
negative_001: "생각보다 잘 안 풀렸다"
negative_002: "사람들이랑 의견이 안 맞았다"
negative_003: "시간이 오래 걸렸다"
negative_004: "내가 못하는 부분이 드러났다"
negative_005: "하기 싫은데 억지로 했다"
negative_006: "결과가 기대에 못 미쳤다"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "user_id": 123,
    "activity_type": "club",
    "memo": "오늘 동아리 회의 참석...",
    "mood_compare": "better",
    "reason": "positive_001",
    "tags": ["기획", "협업", "아이디어 회의"],
    "date": "2025-01-15",
    "created_at": "2025-01-15T12:34:56Z"
  },
  "error": null
}
```

**비즈니스 로직:**
- 같은 날짜에 여러 개의 로그 작성 가능
- tags는 JSON 배열로 저장 (PostgreSQL JSONB 추천)
- mood_compare는 user의 baseline_mood와 비교한 상대값
- 저장 시 자동으로 user_id 연결 (JWT에서 추출)

---

#### GET `/api/reflections/micro`
사용자의 초라이트 기록 목록을 조회합니다.

**Query Parameters:**
- `limit`: 조회 개수 (기본값: 20, 최대: 100)
- `offset`: 건너뛸 개수 (기본값: 0)
- `date_from`: 시작 날짜 (YYYY-MM-DD, 선택)
- `date_to`: 종료 날짜 (YYYY-MM-DD, 선택)
- `activity_type`: 활동 유형 필터 (선택)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 456,
        "activity_type": "club",
        "memo": "동아리 회의...",
        "mood_compare": "better",
        "reason": "positive_001",
        "tags": ["기획", "협업"],
        "date": "2025-01-15",
        "created_at": "2025-01-15T12:34:56Z"
      }
    ],
    "total": 15,
    "limit": 20,
    "offset": 0
  },
  "error": null
}
```

---

### 3. AI 태그 제안

#### POST `/api/ai/suggest-tags`
사용자의 활동 메모를 분석하여 관련 태그를 AI가 제안합니다.

**Request Body:**
```json
{
  "activity_type": "club",
  "memo": "오늘 동아리 회의에서 새 프로젝트 기획안을 발표했다"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": ["기획", "발표", "프로젝트 관리", "협업"]
  },
  "error": null
}
```

**구현 방법 (2가지 옵션):**

**옵션 A: 백엔드에서 Gemini API 호출 (권장)**
```python
# Python 예시
import google.generativeai as genai

def suggest_tags(activity_type: str, memo: str) -> list[str]:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    prompt = f"""
활동 유형: {activity_type}
메모: {memo}

위 활동 내용을 분석해서 관련된 태그를 3-5개 추천해주세요.
태그는 한글 단어로, 쉼표로 구분해서 작성해주세요.

예시: 기획, 협업, 데이터 분석
"""
    
    response = model.generate_content(prompt)
    tags = [tag.strip() for tag in response.text.split(',')]
    return tags[:5]  # 최대 5개
```

**옵션 B: 프론트엔드에서 직접 호출**
- 백엔드 구현 불필요
- 프론트엔드에서 Gemini API 직접 호출
- 단점: API 키 노출 위험

**태그 카테고리 (참고):**
- 기술: 기획, 개발, 디자인, 데이터 분석, 마케팅, 영업
- 역량: 협업, 리더십, 문제 해결, 의사소통, 시간 관리
- 감정: 재미, 성취감, 도전, 배움, 성장

---

### 4. 회고 통계

#### GET `/api/reflections/stats`
지정된 기간의 회고 통계를 조회합니다.

**Query Parameters:**
- `period`: `week` | `month` (기본값: week)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "total_logs": 12,
    "positive_logs": 8,
    "neutral_logs": 2,
    "negative_logs": 2,
    "growth_trend": 15.3,
    "most_active_type": "club",
    "activity_distribution": {
      "club": 5,
      "project": 4,
      "study": 3
    },
    "top_tags": [
      { "tag": "협업", "count": 7 },
      { "tag": "기획", "count": 5 },
      { "tag": "발표", "count": 4 }
    ]
  },
  "error": null
}
```

**비즈니스 로직:**
- `total_logs`: 기간 내 전체 로그 수
- `positive_logs`: mood_compare = "better" 개수
- `neutral_logs`: mood_compare = "same" 개수
- `negative_logs`: mood_compare = "worse" 개수
- `growth_trend`: (positive - negative) / total * 100 (%)
- `most_active_type`: 가장 많이 기록된 활동 유형
- `activity_distribution`: 활동 유형별 개수
- `top_tags`: 빈도 높은 태그 Top 5

**기간 계산:**
- `week`: 최근 7일
- `month`: 최근 30일

---

### 5. 스토리 뷰

#### GET `/api/reflections/story`
사용자의 경험을 분석하여 스토리 형태로 생성합니다.

**Query Parameters:**
- `period`: `week` | `month` | `quarter` (기본값: week)

**Response:**
```json
{
  "success": true,
  "data": {
    "period_label": "이번 주",
    "total_days": 7,
    "activity_summary": [
      {
        "type": "club",
        "count": 5,
        "icon": "👥",
        "label": "학회/동아리"
      },
      {
        "type": "project",
        "count": 3,
        "icon": "💼",
        "label": "프로젝트"
      }
    ],
    "positive_patterns": [
      "사람들과 의견 교환하는 활동에서 에너지를 얻어요",
      "새로운 아이디어를 내는 과정을 즐겨요",
      "팀 협업에서 강점을 발휘하고 있어요"
    ],
    "negative_patterns": [
      "혼자 진행하는 과제에서 어려움을 느껴요",
      "예상보다 시간이 오래 걸리면 스트레스를 받아요"
    ],
    "strength_analysis": "**기획/협업 역량**이 두드러지고, **커뮤니케이션**에 강점을 보이고 있어요.",
    "suggested_tracks": [
      {
        "track": "기획/전략",
        "score": 85,
        "reason": "아이디어 발산과 팀 조율에 강점"
      },
      {
        "track": "마케팅",
        "score": 72,
        "reason": "사람과의 소통을 즐기는 성향"
      }
    ],
    "next_suggestion": {
      "title": "더 큰 규모의 기획 경험 쌓기",
      "description": "지금까지 팀 단위 기획 경험이 많았다면, 이제는 더 큰 규모(예: 학회 전체 행사 기획, 연합 동아리 프로젝트)에 도전해보세요.",
      "action": "추천 활동 보러가기",
      "recommended_activities": [
        {
          "id": 101,
          "title": "2025 대학생 마케팅 공모전",
          "organizer": "한국마케팅협회",
          "category": "contest",
          "field": "마케팅",
          "deadline": "2025-02-28",
          "match_score": 88
        }
      ]
    }
  },
  "error": null
}
```

**비즈니스 로직:**

**1. Activity Summary (활동 요약)**
- 기간 내 활동 유형별 집계
- 아이콘 매핑:
  - contest: 🏆
  - club: 👥
  - project: 💼
  - internship: 💼
  - study: 📚
  - etc: ✨

**2. Positive Patterns (긍정 패턴)**
- mood_compare = "better"인 로그들의 reason, tags, memo 분석
- 공통 키워드 추출 (예: "협업", "아이디어", "사람")
- 3-5개의 문장으로 요약
- 구현 방법:
  - 옵션 A: 규칙 기반 (reason 코드별 매핑)
  - 옵션 B: AI 분석 (Gemini API 활용)

**3. Negative Patterns (부정 패턴)**
- mood_compare = "worse"인 로그들의 reason 분석
- 반복되는 어려움 추출
- 1-3개의 문장으로 요약

**4. Strength Analysis (강점 분석)**
- 빈도 높은 positive tags 기반
- 사용자의 주요 강점 영역 식별
- 예시:
  - ["기획", "협업"] → "기획/협업 역량"
  - ["발표", "의사소통"] → "커뮤니케이션"
  - ["데이터", "분석"] → "분석 역량"

**5. Suggested Tracks (추천 진로)**
- 강점 분석 + 활동 이력 기반으로 적합한 진로 트랙 제안
- 7개 트랙: 기획/전략, 마케팅, 재무/회계, HR, 운영/SCM, 영업/BD, 데이터/BA
- 점수 (0-100) + 이유 포함

**6. Next Suggestion (다음 행동 제안)**
- Action Nudge: 사용자의 다음 성장 단계 제안
- 추천 활동 3-5개 포함
- 활동은 `/api/recommendations` 엔드포인트와 동일한 구조

**AI 활용 (권장):**
```python
def generate_story(user_id: int, period: str) -> dict:
    # 1. 기간 내 로그 조회
    logs = get_user_logs(user_id, period)
    
    # 2. 통계 계산
    stats = calculate_stats(logs)
    
    # 3. Gemini API로 패턴 분석
    prompt = f"""
사용자의 최근 {period} 활동 로그:
{logs}

다음을 분석해주세요:
1. 긍정 패턴 (3-5개 문장)
2. 부정 패턴 (1-3개 문장)
3. 강점 분석 (1-2개 문장)
4. 추천 진로 트랙 (2개, 점수 + 이유)
5. 다음 행동 제안 (제목 + 설명)
"""
    
    ai_analysis = call_gemini(prompt)
    
    # 4. 추천 활동 조회 (DB)
    recommended_activities = get_matching_activities(
        user_id, 
        ai_analysis['suggested_tracks']
    )
    
    return {
        "activity_summary": stats,
        "positive_patterns": ai_analysis['positive'],
        "negative_patterns": ai_analysis['negative'],
        "strength_analysis": ai_analysis['strength'],
        "suggested_tracks": ai_analysis['tracks'],
        "next_suggestion": {
            "title": ai_analysis['next_title'],
            "description": ai_analysis['next_description'],
            "recommended_activities": recommended_activities
        }
    }
```

---

### 6. 사용자 정보 조회 (수정 필요)

#### GET `/api/user/me`
**기존 응답에 `baseline_mood` 필드 추가 필요:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "username": "홍길동",
    "baseline_mood": "neutral",  // 👈 추가
    "created_at": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

## 데이터 모델

### 1. Users 테이블 (수정)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    baseline_mood VARCHAR(20),  -- 👈 추가: 'tired' | 'neutral' | 'positive'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
```

### 2. Micro Logs 테이블 (신규)

```sql
CREATE TABLE micro_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,  -- 'contest' | 'club' | 'project' | 'internship' | 'study' | 'etc'
    memo TEXT,
    mood_compare VARCHAR(20) NOT NULL,  -- 'worse' | 'same' | 'better'
    reason VARCHAR(50),  -- 'positive_001' | 'negative_001' | ...
    tags JSONB,  -- ["기획", "협업", ...]
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_micro_logs_user_id ON micro_logs(user_id);
CREATE INDEX idx_micro_logs_date ON micro_logs(date DESC);
CREATE INDEX idx_micro_logs_user_date ON micro_logs(user_id, date DESC);
CREATE INDEX idx_micro_logs_tags ON micro_logs USING GIN(tags);  -- JSONB 검색용
```

**제약 조건:**
```sql
ALTER TABLE micro_logs 
ADD CONSTRAINT chk_activity_type 
CHECK (activity_type IN ('contest', 'club', 'project', 'internship', 'study', 'etc'));

ALTER TABLE micro_logs 
ADD CONSTRAINT chk_mood_compare 
CHECK (mood_compare IN ('worse', 'same', 'better'));

ALTER TABLE micro_logs 
ADD CONSTRAINT chk_reason_when_not_same 
CHECK (
    (mood_compare = 'same' AND reason IS NULL) OR
    (mood_compare != 'same' AND reason IS NOT NULL)
);
```

### 3. Recommendations 테이블 (기존)

**API_SPECIFICATION.md 참조**

활동 추천 시 `micro_logs`의 패턴 분석 결과와 연결:
```sql
-- 예시: 사용자의 긍정 패턴과 매칭되는 활동 조회
SELECT r.* 
FROM recommendations r
WHERE r.field IN (
    SELECT DISTINCT jsonb_array_elements_text(tags)
    FROM micro_logs
    WHERE user_id = ? 
      AND mood_compare = 'better'
      AND date >= NOW() - INTERVAL '30 days'
)
ORDER BY r.deadline ASC
LIMIT 10;
```

---

## 비즈니스 로직

### 1. 베이스라인 무드 시스템

**목적:** 사용자마다 다른 '보통' 상태를 정규화

**로직:**
```python
# 최초 설정 (한 번만)
user.baseline_mood = 'neutral'  # 사용자 선택

# 이후 모든 로그는 상대적 비교
if today_mood > baseline_mood:
    mood_compare = 'better'
elif today_mood < baseline_mood:
    mood_compare = 'worse'
else:
    mood_compare = 'same'
```

**UI 표현:**
- tired 기준: "평소보다 더 피곤했다" / "평소만큼 피곤했다" / "평소보다 덜 피곤했다"
- neutral 기준: "평소보다 안 좋았다" / "평소와 같았다" / "평소보다 좋았다"
- positive 기준: "평소보다 안 좋았다" / "평소처럼 좋았다" / "평소보다 더 좋았다"

**장점:**
- 개인별 기준 차이 해소
- 상대적 변화 추적 용이
- 패턴 분석 정확도 향상

### 2. 태그 시스템

**자동 태그 제안 (AI):**
```python
def suggest_tags(activity_type, memo):
    # Gemini API 호출
    # "기획", "협업", "발표" 같은 키워드 추출
    return tags
```

**태그 통계 활용:**
```python
def get_top_tags(user_id, period):
    # 빈도 높은 태그 추출
    # 사용자의 주요 관심사/강점 파악
    return top_tags
```

**태그 기반 추천:**
```python
def recommend_activities(user_id):
    top_tags = get_top_tags(user_id, 'month')
    # top_tags와 매칭되는 활동 조회
    return matching_activities
```

### 3. 성장 트렌드 계산

**주간 성장률:**
```python
def calculate_growth_trend(user_id):
    last_week = get_logs(user_id, days=7)
    prev_week = get_logs(user_id, days=14, offset=7)
    
    last_positive_rate = count(last_week, mood='better') / len(last_week)
    prev_positive_rate = count(prev_week, mood='better') / len(prev_week)
    
    growth = (last_positive_rate - prev_positive_rate) * 100
    return growth  # +15.3% 같은 형태
```

### 4. 패턴 감지

**긍정 패턴 추출:**
```python
def extract_positive_patterns(logs):
    positive_logs = [log for log in logs if log.mood_compare == 'better']
    
    # reason 빈도 분석
    reason_counts = Counter([log.reason for log in positive_logs])
    top_reasons = reason_counts.most_common(3)
    
    # tags 빈도 분석
    all_tags = [tag for log in positive_logs for tag in log.tags]
    tag_counts = Counter(all_tags)
    top_tags = tag_counts.most_common(5)
    
    # AI로 문장 생성
    patterns = generate_pattern_sentences(top_reasons, top_tags)
    return patterns
```

**부정 패턴 추출:**
```python
def extract_negative_patterns(logs):
    negative_logs = [log for log in logs if log.mood_compare == 'worse']
    
    # reason 빈도 분석
    reason_counts = Counter([log.reason for log in negative_logs])
    top_reasons = reason_counts.most_common(2)
    
    # 문장 생성
    patterns = [REASON_TEXT[reason] for reason, count in top_reasons]
    return patterns
```

### 5. Action Nudge 생성

**조건:**
- 최근 7일 내 로그 5개 이상
- 명확한 패턴 감지 (긍정 또는 부정)

**로직:**
```python
def generate_action_nudge(user_id):
    logs = get_recent_logs(user_id, days=7)
    
    if len(logs) < 5:
        return None  # 데이터 부족
    
    patterns = extract_patterns(logs)
    strength = analyze_strength(patterns)
    
    # 다음 단계 제안
    if strength == '기획/협업':
        suggestion = {
            "title": "더 큰 규모의 기획 경험 쌓기",
            "description": "팀 단위 → 조직 단위로 확장",
            "activities": recommend_activities(user_id, field='기획')
        }
    
    return suggestion
```

### 6. 스토리 생성 주기

**권장 주기:**
- **Week**: 매주 월요일 자동 생성 (최근 7일 분석)
- **Month**: 매월 1일 자동 생성 (최근 30일 분석)
- **Quarter**: 분기별 1일 자동 생성 (최근 90일 분석)

**구현 방법:**
```python
# Cron Job 또는 Celery Task
@scheduler.task('cron', day_of_week='mon', hour=0)
def generate_weekly_stories():
    users = get_active_users()
    for user in users:
        story = generate_story(user.id, 'week')
        cache_story(user.id, story)  # 캐싱으로 성능 최적화
```

---

## AI 통합 포인트

### 1. Gemini API 설정

**필수 환경 변수:**
```bash
GEMINI_API_KEY=AIzaSyBmag2xIc9sLH-IWHrzY67uD6B3hqYwl0w
```

**모델:**
- `gemini-2.0-flash` (권장) - 빠르고 안정적
- ~~`gemini-1.5-pro`~~ (사용 불가 - 404 에러)

**Configuration:**
```python
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)
```

### 2. AI 활용 시나리오

#### A. 태그 자동 제안
```python
def suggest_tags(activity_type, memo):
    prompt = f"""
활동 유형: {activity_type}
메모: {memo}

위 활동 내용을 분석해서 관련 태그 3-5개를 추천해주세요.
태그는 짧은 한글 단어로, 쉼표로 구분해주세요.

카테고리:
- 기술: 기획, 개발, 디자인, 데이터 분석, 마케팅, 영업
- 역량: 협업, 리더십, 문제 해결, 의사소통, 시간 관리
- 감정: 재미, 성취감, 도전, 배움, 성장

예시: 기획, 협업, 아이디어 회의
"""
    
    response = model.generate_content(prompt)
    tags = [tag.strip() for tag in response.text.split(',')]
    return tags[:5]
```

#### B. 패턴 분석
```python
def analyze_patterns(logs):
    # 로그 요약
    log_summary = "\n".join([
        f"- {log.date}: {log.activity_type}, {log.mood_compare}, {log.reason}"
        for log in logs
    ])
    
    prompt = f"""
사용자의 최근 활동 로그:
{log_summary}

다음을 분석해주세요:
1. 긍정 패턴 (어떤 활동에서 에너지를 얻나요? 3-5문장)
2. 부정 패턴 (어떤 활동에서 어려움을 느끼나요? 1-3문장)
3. 강점 분석 (어떤 역량이 두드러지나요? 1-2문장)

답변 형식:
긍정:
- ...
- ...

부정:
- ...

강점:
- ...
"""
    
    response = model.generate_content(prompt)
    return parse_ai_response(response.text)
```

#### C. 진로 트랙 추천
```python
def recommend_career_tracks(patterns, tags):
    prompt = f"""
사용자 분석 결과:
긍정 패턴: {patterns['positive']}
강점: {patterns['strength']}
주요 태그: {tags}

다음 7개 진로 트랙 중 가장 적합한 2개를 추천하고, 각각 점수(0-100)와 이유를 제시해주세요:

1. 기획/전략 - 전략 수립, 사업 기획, 프로젝트 관리
2. 마케팅 - 브랜드 기획, 콘텐츠 제작, 고객 분석
3. 재무/회계 - 예산 관리, 회계 처리, 투자 분석
4. HR - 채용, 교육, 조직문화
5. 운영/SCM - 프로세스 최적화, 재고 관리, 품질 관리
6. 영업/BD - 고객 관계, 제안 영업, 파트너십 구축
7. 데이터/BA - 데이터 분석, 리포팅, 인사이트 도출

답변 형식 (JSON):
[
  {
    "track": "기획/전략",
    "score": 85,
    "reason": "아이디어 발산과 팀 조율에 강점"
  },
  {
    "track": "마케팅",
    "score": 72,
    "reason": "사람과의 소통을 즐기는 성향"
  }
]
"""
    
    response = model.generate_content(prompt)
    return json.loads(response.text)
```

#### D. 다음 행동 제안
```python
def suggest_next_action(tracks, current_activities):
    prompt = f"""
사용자의 추천 진로: {tracks}
최근 활동: {current_activities}

사용자의 다음 성장 단계를 제안해주세요.

답변 형식:
제목: (한 문장)
설명: (2-3문장, 구체적인 행동 방향)

예시:
제목: 더 큰 규모의 기획 경험 쌓기
설명: 지금까지 팀 단위 기획 경험이 많았다면, 이제는 더 큰 규모(예: 학회 전체 행사 기획)에 도전해보세요.
"""
    
    response = model.generate_content(prompt)
    return parse_action_suggestion(response.text)
```

### 3. AI 응답 캐싱

**성능 최적화를 위한 캐싱 전략:**

```python
import redis
import hashlib

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cached_ai_call(prompt, cache_key_prefix, ttl=3600):
    # 캐시 키 생성
    cache_key = f"{cache_key_prefix}:{hashlib.md5(prompt.encode()).hexdigest()}"
    
    # 캐시 조회
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # AI 호출
    response = model.generate_content(prompt)
    result = response.text
    
    # 캐시 저장
    redis_client.setex(cache_key, ttl, json.dumps(result))
    
    return result

# 사용 예시
tags = cached_ai_call(
    prompt=tag_prompt, 
    cache_key_prefix="tags",
    ttl=86400  # 24시간
)

story = cached_ai_call(
    prompt=story_prompt,
    cache_key_prefix=f"story:{user_id}:{period}",
    ttl=3600  # 1시간
)
```

**캐싱 적용 대상:**
- ✅ 태그 제안: 동일한 memo + activity_type 조합
- ✅ 스토리 생성: 같은 period + 같은 로그 데이터
- ❌ 실시간 추천: 최신 데이터 필요
- ❌ 패턴 분석: 로그 변경 시 재계산 필요

---

## 우선순위 및 의존성

### Phase 1: 기본 회고 시스템 (필수) - 2-3주

**목표:** 사용자가 Micro Log를 작성하고 조회할 수 있는 최소 기능

**구현 항목:**
1. ✅ **Users 테이블 `baseline_mood` 필드 추가**
   - Migration: ALTER TABLE users ADD COLUMN baseline_mood VARCHAR(20);
   - 기본값: NULL (설정 안 한 사용자)

2. ✅ **POST `/api/user/baseline-mood`**
   - 베이스라인 무드 설정 엔드포인트
   - 최초 1회 필수 설정

3. ✅ **GET `/api/user/me` 수정**
   - 응답에 `baseline_mood` 필드 추가

4. ✅ **Micro Logs 테이블 생성**
   - 스키마: 위의 "데이터 모델" 섹션 참조
   - 인덱스: user_id, date, tags (GIN)

5. ✅ **POST `/api/reflections/micro`**
   - 로그 작성 엔드포인트
   - 유효성 검증: mood_compare != 'same' 일 때 reason 필수

6. ✅ **GET `/api/reflections/micro`**
   - 로그 목록 조회
   - 페이지네이션 지원
   - 날짜/활동 유형 필터링

**테스트 시나리오:**
```bash
# 1. 베이스라인 설정
POST /api/user/baseline-mood
{ "baseline_mood": "neutral" }

# 2. 로그 작성
POST /api/reflections/micro
{
  "activity_type": "club",
  "memo": "동아리 회의 참석",
  "mood_compare": "better",
  "reason": "positive_001",
  "tags": ["협업", "기획"],
  "date": "2025-01-15"
}

# 3. 로그 조회
GET /api/reflections/micro?limit=10

# 4. 사용자 정보 확인
GET /api/user/me
# 응답에 baseline_mood 포함되어야 함
```

**의존성:**
- ❌ 없음 (독립적으로 구현 가능)

---

### Phase 2: AI 통합 (중요) - 1-2주

**목표:** AI 기반 태그 제안 및 패턴 분석

**구현 항목:**
1. ✅ **POST `/api/ai/suggest-tags`**
   - Gemini API 통합
   - 태그 자동 제안 (3-5개)
   - 캐싱 적용 (동일한 입력 재사용)

2. ✅ **GET `/api/reflections/stats`**
   - 통계 계산 로직
   - 긍정/부정/중립 로그 집계
   - 성장 트렌드 계산
   - 활동 분포 및 Top Tags

**테스트 시나리오:**
```bash
# 1. 태그 제안
POST /api/ai/suggest-tags
{
  "activity_type": "club",
  "memo": "오늘 동아리 회의에서 프로젝트 기획안을 발표했다"
}
# 예상 응답: ["기획", "발표", "프로젝트 관리", "협업"]

# 2. 통계 조회
GET /api/reflections/stats?period=week
# 응답: total_logs, positive_logs, growth_trend, top_tags 등
```

**의존성:**
- ✅ Phase 1 완료 필요 (Micro Logs 데이터 필요)
- ✅ Gemini API 키 설정

---

### Phase 3: 스토리 뷰 (고급) - 2-3주

**목표:** 기간별 성장 스토리 자동 생성

**구현 항목:**
1. ✅ **GET `/api/reflections/story`**
   - 패턴 분석 로직 (긍정/부정)
   - 강점 분석
   - 진로 트랙 추천
   - 다음 행동 제안
   - 추천 활동 연결

2. ✅ **AI 프롬프트 최적화**
   - 패턴 분석 프롬프트
   - 진로 추천 프롬프트
   - 행동 제안 프롬프트

3. ✅ **캐싱 시스템**
   - Redis 통합
   - 스토리 결과 캐싱 (1시간)
   - AI 응답 캐싱 (24시간)

**테스트 시나리오:**
```bash
# 1. 주간 스토리
GET /api/reflections/story?period=week

# 2. 월간 스토리
GET /api/reflections/story?period=month

# 예상 응답:
# - activity_summary: 활동 유형별 집계
# - positive_patterns: ["사람들과 의견 교환...", "새로운 아이디어..."]
# - negative_patterns: ["혼자 진행하는 과제..."]
# - strength_analysis: "기획/협업 역량이 두드러지고..."
# - suggested_tracks: [{"track": "기획/전략", "score": 85, ...}]
# - next_suggestion: {"title": "...", "recommended_activities": [...]}
```

**의존성:**
- ✅ Phase 1 완료 (Micro Logs 데이터)
- ✅ Phase 2 완료 (AI 통합, 통계 계산)
- ✅ 활동 추천 API (recommendations 테이블)

---

### Phase 4: 자동화 및 최적화 (선택) - 1주

**목표:** 성능 개선 및 주기적 업데이트

**구현 항목:**
1. ✅ **주간 스토리 자동 생성**
   - Cron Job: 매주 월요일 0시
   - 활성 사용자 대상 (최근 7일 내 로그 1개 이상)

2. ✅ **Action Nudge 생성**
   - 조건: 최근 7일 내 로그 5개 이상
   - 명확한 패턴 감지 시 생성

3. ✅ **인덱스 최적화**
   - 느린 쿼리 분석 (EXPLAIN)
   - 복합 인덱스 추가

4. ✅ **API 응답 시간 최적화**
   - 캐싱 확대 적용
   - 데이터베이스 쿼리 최적화
   - 페이지네이션 기본값 조정

**모니터링:**
```python
# 성능 메트릭
- API 응답 시간: < 500ms (목표)
- AI 호출 응답 시간: < 2s (목표)
- 캐시 히트율: > 70% (목표)
- DB 쿼리 시간: < 100ms (목표)
```

**의존성:**
- ✅ Phase 1-3 완료
- ✅ Redis 설치
- ✅ 모니터링 도구 (New Relic, Sentry 등)

---

## 우선순위 요약

| Phase | 기능 | 중요도 | 예상 기간 | 의존성 |
|-------|------|--------|----------|--------|
| 1 | 기본 회고 시스템 | 🔴 필수 | 2-3주 | 없음 |
| 2 | AI 통합 | 🟠 중요 | 1-2주 | Phase 1 |
| 3 | 스토리 뷰 | 🟡 고급 | 2-3주 | Phase 1, 2 |
| 4 | 자동화 및 최적화 | 🟢 선택 | 1주 | Phase 1-3 |

**권장 개발 순서:**
1. Phase 1 완료 → 프론트엔드 연동 테스트
2. Phase 2 완료 → AI 기능 테스트
3. Phase 3 완료 → 전체 플로우 테스트
4. Phase 4 (선택) → 성능 개선

---

## 참고 문서

- **API_SPECIFICATION.md**: 기존 API 명세 (Auth, User, Recommendations 등)
- **lib/gemini.ts**: Gemini AI 설정 및 시스템 프롬프트
- **components/CareerBot.tsx**: AI 경험 추천 구현 참고

---

## 문의 및 지원

**프론트엔드 구현 상태:**
- ✅ 베이스라인 설정 페이지: `/dashboard/reflections/baseline`
- ✅ Micro Log 작성 페이지: `/dashboard/reflections/micro`
- ✅ 스토리 뷰 페이지: `/dashboard/reflections/story`
- ✅ 메인 대시보드: `/dashboard/reflections`
- ✅ AI 경험 추천: `<CareerBot />` 컴포넌트

**백엔드 구현 시 확인 사항:**
1. API 응답 형식이 프론트엔드 인터페이스와 일치하는지
2. 에러 처리가 `API_SPECIFICATION.md`의 에러 코드 규칙을 따르는지
3. JWT 토큰 검증이 올바르게 작동하는지
4. CORS 설정이 프론트엔드 URL을 허용하는지

**테스트 환경:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Gemini API Key: AIzaSyBmag2xIc9sLH-IWHrzY67uD6B3hqYwl0w

---

**문서 버전:** 1.0  
**최종 수정일:** 2025-01-15  
**작성자:** GitHub Copilot (Claude Sonnet 4.5)
