# ProoF 직무 선택 & 스펙체크 시스템 - 백엔드 프롬프트 명세 (v2.4)

## 📋 문서 개요
- **작성일**: 2025-11-18
- **버전**: 2.4 (일반 설문/스펙체크 API 구현 및 데이터 연동 완료)
- **목적**: 상경계열 학생 대상 대분류 직무 추천 + 세부 직무 분석 시스템의 백엔드 API 명세
- **핵심 구조**:
  - **직무 선택**: 대분류 8개 직무 추천 및 저장 (마케팅, 인사, 브랜드, 전략, 재무, 영업, 데이터, 운영)
  - **스펙체크**: 선택한 대분류의 세부 직무 분석 (예: 마케팅 → 그로스/디지털/브랜드/콘텐츠/CRM/퍼포먼스)
- **구현 상태**:
  - 프론트엔드: ✅ 대분류/세부 직무 분리 + 실 서비스 연동
  - 백엔드: ✅ `/api/v1/survey/*` 엔드포인트 구현 및 데이터 로더 완성
- **관련 파일**:
  - `backend/app/routes/survey.py` (설문/스펙체크 API 구현체)
  - `public/data/survey-general.json` (대분류 직무 설문 - 8개 직무)
  - `public/data/spec-check-*.json` (세부 직무 스펙체크 - 각 대분류당 4-6개 세부 직무)

---

## 1. 시스템 아키텍처

### 1.1 전체 플로우 (수정 완료)
```
[직무 선택 방법 1: 학과 선택]
1. [프론트] 학과/관심 분야 선택
   ↓
2. [백엔드] POST /api/v1/career/save-major
   → 학과 기반 대분류 직무 자동 매칭 (8개 중 1개)
   → 사용자 대분류 직무로 저장
   ↓
3. [프론트] 스펙체크로 이동 → 세부 직무 분석

[직무 선택 방법 2: 설문] ⭐ 핵심 수정
1. [프론트] 대분류 직무 설문(25~30문) 제출
   → 목적: 마케팅, 인사, 브랜드, 전략, 재무, 영업, 데이터, 운영 중 적합한 직무 찾기
   ↓
2. [백엔드] POST /api/v1/survey/submit
   → 8개 대분류 직무별 점수 계산
   → preference_top3: 선호도 기반 순위 (설문 응답 분석)
   → fit_top3: 역량 기반 순위 (능력 적합도 분석)
   → recommended_job: 종합 1순위 직무 (대분류)
   ↓
3. [프론트] 대분류 직무 결과 화면 표시
   → 사용자가 8개 직무 중 1개 선택
   ↓
4. [백엔드] POST /api/v1/career/save-job
   → 선택한 대분류 직무를 사용자 직무로 저장
   ↓
5. [프론트] 스펙체크로 이동 → 세부 직무 분석

[스펙체크 - 세부 직무 분석] ⭐ 핵심 수정
6. [백엔드] GET /api/v1/survey/spec-check/{job_category}
   → 대분류 직무의 스펙체크 설문 반환 (20문)
   → 예: marketing → 그로스/디지털/브랜드/콘텐츠/CRM/퍼포먼스 관련 질문
   ↓
7. [프론트] 스펙체크 설문 제출 (경험 기반 질문 20개)
   ↓
8. [백엔드] POST /api/v1/survey/spec-check/submit
   → 세부 직무별 능력치 계산 (대분류 안의 세부 분야만)
   → all_specializations: 모든 세부 직무 점수 (바 차트용)
   → preference_top3: 선호 기반 세부 직무 Top 3
   → fit_top3: 역량 기반 세부 직무 Top 3
   → recommended_specialization: 최종 추천 세부 직무 1개
   ↓
9. [프론트] 세부 직무 결과 표시 및 활동 추천

**핵심 차이:**
- 직무 선택 설문 → 대분류 8개 (마케팅, 인사, 브랜드, 전략, 재무, 영업, 데이터, 운영)
- 스펙체크 설문 → 세부 직무 (예: 마케팅 선택 시 → 그로스/디지털/브랜드/콘텐츠/CRM/퍼포먼스)
```

---

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

**응답** (모든 세부 직무 점수 + 설문/역량 기반 Top3 분리):
```json
{
  "job_category": "marketing",
  "submitted_at": "2025-11-18T12:05:00",
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
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 84.0},
    {"subtype_id": "digital", "name": "디지털 마케터", "score": 80.5},
    {"subtype_id": "brand", "name": "브랜드 마케터", "score": 72.3},
    {"subtype_id": "content", "name": "콘텐츠 마케터", "score": 69.1},
    {"subtype_id": "crm", "name": "CRM/리텐션 마케터", "score": 65.4}
  ],
  "preference_top3": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 92.4},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 84.0},
    {"subtype_id": "digital", "name": "디지털 마케터", "score": 80.5}
  ],
  "fit_top3": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 92.4},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 84.0},
    {"subtype_id": "digital", "name": "디지털 마케터", "score": 80.5}
  ],
  "recommended_specialization": {
    "subtype_id": "growth",
    "name": "그로스 마케터",
    "score": 92.4,
    "description": "데이터 기반 실험과 성장 지표 최적화에 집중",
    "reason": "'데이터 분석', 'A/B 테스트' 관련 문항 점수가 특히 높았습니다."
  },
  "insights": [
    "그로스 마케터가 세부 직무 중 가장 높은 점수를 기록했습니다.",
    "'데이터 분석 툴 사용'과 'A/B 테스트 설계' 문항에서 특히 높은 응답을 보여주셨어요."
  ]
```

> `survey_id`는 실제 JSON 파일 슬러그(`survey-general`)와 일치해야 하며, API는 `public/data` 디렉터리에서 해당 파일을 로드한다.

**응답**:
```json
{
  "survey_id": "survey-general",
  "submitted_at": "2025-11-18T12:00:00",
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
    "score": 89.2,
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

### 2.3 POST `/api/v1/career/save-job` (신규)
**설명**: 설문 결과에서 선택한 직무를 사용자 직무로 저장

**요청 바디**:
```json
{
  "user_id": "user123",
  "job_id": "marketing",
  "source": "survey"
}
```

**응답**:
```json
{
  "success": true,
  "saved_job": "marketing",
  "job_name": "마케팅",
  "message": "직무가 저장되었습니다. 스펙체크를 진행해보세요!"
}
```

---

### 2.2 GET `/api/v1/survey/spec-check/{job_category}`
**설명**: 특정 직무의 스펙체크 설문 데이터 반환

**예시**: `GET /api/v1/survey/spec-check/marketing`

**응답**: `spec-check-marketing.json` 내용 전체 반환

---

### 2.5 POST `/api/v1/survey/spec-check/submit`
**설명**: 스펙체크 설문 제출 및 세부 직무 유형 판별 (모든 세부 직무 점수 + 설문/역량 기반 Top3 분리)

**요청 바디**:
```json
{
  "survey_id": "marketing_spec_v1",
  "answers": {
    "m1": 5,
    "m2": 4,
    "m3": 5,
    ...
  }
}
```

**응답** (모든 세부 직무 점수 + 설문/역량 기반 Top3 분리):
```json
{
  "job_category": "marketing",
  "job_name": "마케팅",
  "all_specializations": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 85.0},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 80.0},
    {"subtype_id": "content", "name": "콘텐츠 마케터", "score": 76.0},
    {"subtype_id": "digital", "name": "디지털 마케터", "score": 75.0},
    {"subtype_id": "brand", "name": "브랜드 마케터", "score": 70.0},
    {"subtype_id": "crm", "name": "CRM/리텐션 마케터", "score": 68.0}
  ],
  "preference_top3": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 85.0},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 82.0},
    {"subtype_id": "content", "name": "콘텐츠 마케터", "score": 78.0}
  ],
  "fit_top3": [
    {"subtype_id": "growth", "name": "그로스 마케터", "score": 88.0},
    {"subtype_id": "digital", "name": "디지털 마케터", "score": 81.0},
    {"subtype_id": "performance", "name": "퍼포먼스 마케터", "score": 77.0}
  ],
  "recommended_specialization": {
    "subtype_id": "growth",
    "name": "그로스 마케터",
    "combined_score": 86.5,
    "reason": "데이터 분석과 실험 경험이 뛰어납니다"
  }
}
```

---

## 3. 점수 계산 규칙

### 3.1 일반 설문 (survey-general.json)

#### Likert 응답 (1-5)
```python
# 각 문항의 weights에 응답값(1-5)을 곱함
for question in questions:
    answer = answers[question['id']]  # 1~5
    for job_id, weight in question['weights'].items():
        scores[job_id] += answer * weight
```

**예시**:
- Q1 응답: 4, weights: `{"marketing": 2, "brand": 2, "strategy": 1}`
- 계산: marketing += 4*2=8, brand += 4*2=8, strategy += 4*1=4

#### 선택형 응답 (단일/다중)
```python
# 선택 시 고정 보너스(5점)를 가중치와 곱함
for option in selected_options:
    for job_id, weight in option['weights'].items():
        scores[job_id] += 5 * weight
```

#### 정규화
```python
max_score = max(scores.values())
normalized = {job_id: (score / max_score) * 100 for job_id, score in scores.items()}
```

---

### 3.2 선호도 vs 적합도 분리
- **선호도(Preference)**: 주관식("관심 분야"), 선택형("원하는 스타일") 가중
- **적합도(Fit)**: 객관식(능력/경험 기반) Likert 가중
- **Combined Score**: `preference * 0.4 + fit * 0.6`

현재 구현에서는 간단히 동일 점수 사용, 향후 개선 시 질문 카테고리별 분리 필요.

---

### 3.3 스펙체크 점수 계산
```python
# 세부 직무 유형별 점수
for question in spec_questions:
    answer = answers[question['id']]  # 1~5
    for subtype_id, weight in question['weights'].items():
        subtype_scores[subtype_id] += answer * weight

# 정규화 후 Top 3 추출
```

---

## 4. 데이터 구조

### 4.1 설문 JSON 스키마
```json
{
  "survey_id": "string",
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "string",
      "type": "likert | text | single_choice | multiple_choice",
      "text": "string",
      "weights": {"job_id": weight},
      "options": [...]
    }
  ],
  "job_categories": [
    {"id": "string", "name": "string", "icon": "emoji"}
  ]
}
```

### 4.2 데이터베이스 스키마 (권장)
```sql
-- 설문 응답 저장
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    survey_id VARCHAR(50),
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- 설문 결과 저장
CREATE TABLE survey_results (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    survey_response_id UUID REFERENCES survey_responses(id),
    survey_scores JSONB,
    preference_top3 JSONB,
    fit_top3 JSONB,
    recommended_job VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 스펙체크 결과
CREATE TABLE spec_check_results (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_category VARCHAR(50),
    subtype_scores JSONB,
    top_subtypes JSONB,
    selected_subtype VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. 변경 사항 (v1 → v2)

### 추가된 기능
1. **직무 선택 설문** (일반 설문 25~30문)
2. **스펙체크 시스템** (8개 직무별 세부 직무 판별)
3. **선호도/적합도 분리** (Preference vs Fit)
4. **점수 정규화** (0-100 범위)
5. **Top 3 직무 추천**

### 기존 시스템과의 차이
- **기존(v1)**: AI 챗봇 기반 대화형 진로 추천 (3~5문항)
- **신규(v2)**: 설문 기반 정량적 직무 매칭 (25~50문항)
- **통합 방안**: v1(챗봇)을 최종 활동 추천 단계에서 활용, v2(설문)는 사전 직무 필터링

---

## 6. 구현 우선순위

### Phase 1 (MVP)
- [x] 설문 JSON 생성
- [x] 점수 계산 엔드포인트
- [ ] DB 저장 로직
- [ ] 프론트엔드 통합

### Phase 2
- [ ] 선호도/적합도 가중치 정밀 조정
- [ ] 사용자 히스토리 조회 API
- [ ] 결과 공유 기능

### Phase 3
- [ ] AI 기반 설문 추천 (adaptive survey)
- [ ] 활동 추천 연동 (v1 챗봇과 연계)

---

## 7. 참고 문서
- `backend/docs/prompt.md` (기존 진로봇 시스템)
- `docs/logic.md` (프론트엔드 로직)
- `docs/logic2.md` (신규 설문 시스템 프론트 로직)

---

## 8. 헬스체크 API 추가 (2024 업데이트)

### 개요
일별 사용자 건강 상태(기분/팀 상태) 추적 기능이 추가되었습니다.

### 엔드포인트

#### POST `/api/v1/health-check`
사용자의 일별 헬스체크를 저장합니다 (upsert 방식).

**요청 예시:**
```json
{
  "user_id": "user123",
  "health_score": 8,
  "date": "2024-01-15"
}
```

**응답 예시:**
```json
{
  "id": "uuid",
  "user_id": "user123",
  "health_score": 8,
  "date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### GET `/api/v1/health-check/latest?user_id={user_id}`
가장 최근 헬스체크를 조회합니다.

#### GET `/api/v1/health-check/history?user_id={user_id}&limit=30`
헬스체크 히스토리를 조회합니다.

### 에러 메시지

**422 Validation Error:**
```json
{
  "detail": "health_score must be between 1 and 10"
}
```

**404 Not Found:**
```json
{
  "detail": "No health check found for this user"
}
```

### Supabase 테이블 스키마
```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  health_score INTEGER NOT NULL CHECK (health_score >= 1 AND health_score <= 10),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```
