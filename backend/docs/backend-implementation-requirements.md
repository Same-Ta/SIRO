# 백엔드 구현 필수 요구사항

## 📋 문서 개요
이 문서는 회고 시스템(Reflection System) 프론트엔드 구현에 필요한 백엔드 API의 상세 요구사항을 정리한 문서입니다.

**작성일**: 2025년 11월 14일  
**프론트엔드 버전**: Next.js 14.0.4 (App Router)  
**백엔드 요구사항**: Node.js + Express + PostgreSQL + Redis  

---

## 🎯 핵심 기능 요약

### 1. 회고 홈 대시보드
- **페이지**: `/dashboard/reflection-home/page.tsx`
- **목적**: 회고 시스템의 메인 허브 역할

### 2. 맞춤 회고 템플릿
- **페이지**: `/dashboard/reflections/templates/page.tsx`
- **목적**: 6개 회고 템플릿 제공 및 AI 추천

### 3. 2단계 스페이스 생성
- **페이지**: `/dashboard/spaces/new/page.tsx`
- **목적**: 간소화된 회고 공간 생성 플로우

### 4. 회고 작성 (드롭다운 UI)
- **페이지**: `/dashboard/reflections/write/page.tsx`
- **목적**: 템플릿 기반 회고 작성 및 진행률 추적

### 5. AI 성장 분석
- **페이지**: `/dashboard/reflections/analysis/page.tsx`
- **목적**: AI 기반 성장 분석 및 방향성 제시

---

## 🔐 인증 & 보안

### 인증 헤더
모든 API 요청에 다음 헤더 포함:
```
Authorization: Bearer {access_token}
x-user-id: {user_id}  // 임시 사용자 식별 (localStorage)
```

### 보안 요구사항
- CORS 설정: `http://localhost:3000` 허용
- Rate Limiting: 사용자당 분당 60회 요청 제한
- Input Validation: Zod 스키마 기반 검증
- SQL Injection 방지: Prisma ORM 사용

---

## 📊 데이터베이스 스키마 요구사항

### 1. `reflection_templates` 테이블
회고 템플릿 저장

```sql
CREATE TABLE reflection_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL, -- '기본', '심화', '감정', '분석', '정기'
    questions JSONB NOT NULL, -- 질문 배열 ["질문1", "질문2", ...]
    usage_count INTEGER DEFAULT 0,
    is_ai_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 기본 템플릿 6개 데이터
INSERT INTO reflection_templates (id, name, description, category, questions) VALUES
('kpt', 'KPT 회고', '잘한 점, 문제점, 시도할 점을 정리하는 가장 기본적인 회고 템플릿', '기본', 
 '["Keep: 계속 유지할 점은 무엇인가요?", "Problem: 어떤 문제가 있었나요?", "Try: 다음에 시도할 점은 무엇인가요?"]'),
('4f', '4F 회고', '사실-감정-발견-미래 단계로 깊이 있게 성찰하는 템플릿', '심화', 
 '["Fact: 어떤 일이 있었나요?", "Feeling: 어떤 감정을 느꼈나요?", "Finding: 무엇을 배웠나요?", "Future: 앞으로 어떻게 할까요?"]'),
('start-stop-continue', 'Start-Stop-Continue', '시작할 것, 멈출 것, 계속할 것을 구분하는 행동 중심 템플릿', '기본', 
 '["Start: 새로 시작할 행동은?", "Stop: 그만둘 행동은?", "Continue: 계속할 행동은?"]'),
('mad-sad-glad', 'Mad-Sad-Glad', '감정 상태를 중심으로 회고하는 감성 기반 템플릿', '감정', 
 '["Mad: 화났던 순간은?", "Sad: 슬펐던 순간은?", "Glad: 기뻤던 순간은?"]'),
('5why', '5 Why 분석', '문제의 근본 원인을 찾는 깊이 있는 분석 템플릿', '분석', 
 '["1차: 무슨 문제가 발생했나요?", "2차: 왜 그런 일이 발생했나요?", "3차: 그 원인은 무엇인가요?", "4차: 근본 원인은 무엇인가요?", "5차: 해결 방안은 무엇인가요?"]'),
('weekly-review', '주간 리뷰', '일주일을 돌아보는 정기적인 성장 점검 템플릿', '정기', 
 '["이번 주 목표 달성도는?", "가장 의미있었던 활동은?", "개선이 필요한 부분은?", "다음 주 목표는?"]');
```

### 2. `reflection_spaces` 테이블
회고 공간 (프로젝트/활동 단위)

```sql
CREATE TABLE reflection_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- '공모전', '프로젝트', '동아리', '스터디'
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reflection_cycle VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly'
    reminder_enabled BOOLEAN DEFAULT TRUE,
    next_reflection_date TIMESTAMP,
    total_reflections INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_spaces_user ON reflection_spaces(user_id);
CREATE INDEX idx_spaces_status ON reflection_spaces(status);
```

### 3. `reflections` 테이블
실제 회고 기록

```sql
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES reflection_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    template_id VARCHAR(50) REFERENCES reflection_templates(id),
    
    -- 회고 내용
    answers JSONB NOT NULL, -- [{"question": "...", "answer": "..."}]
    mood VARCHAR(20) NOT NULL, -- 'great', 'good', 'normal', 'bad', 'terrible'
    progress_score INTEGER CHECK (progress_score >= 1 AND progress_score <= 10),
    
    -- AI 분석
    ai_feedback TEXT,
    ai_keywords JSONB, -- ["키워드1", "키워드2", ...]
    ai_sentiment_score DECIMAL(3,2), -- 0.00 ~ 1.00
    
    -- 메타데이터
    reflection_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reflections_space ON reflections(space_id);
CREATE INDEX idx_reflections_user ON reflections(user_id);
CREATE INDEX idx_reflections_date ON reflections(reflection_date DESC);
```

### 4. `reflection_ai_analysis` 테이블
AI 성장 분석 결과 캐싱

```sql
CREATE TABLE reflection_ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- AI 분석 결과
    summary TEXT NOT NULL,
    strengths JSONB NOT NULL, -- [{"title": "...", "description": "..."}]
    improvements JSONB NOT NULL,
    next_steps JSONB NOT NULL,
    
    -- 차트 데이터
    monthly_progress JSONB NOT NULL, -- [{"month": "1월", "score": 7.5}]
    skill_distribution JSONB NOT NULL, -- [{"skill": "...", "level": 85}]
    mood_distribution JSONB NOT NULL, -- [{"mood": "great", "count": 12}]
    keyword_levels JSONB NOT NULL, -- [{"keyword": "...", "level": 75}]
    
    -- 메타데이터
    analysis_period VARCHAR(50), -- 'last_30_days', 'last_3_months'
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- 캐시 만료 시간
    
    UNIQUE(user_id, analysis_period)
);

CREATE INDEX idx_analysis_user ON reflection_ai_analysis(user_id);
CREATE INDEX idx_analysis_expires ON reflection_ai_analysis(expires_at);
```

### 5. `growth_metrics` 테이블
성장 지표 추적

```sql
CREATE TABLE growth_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    avg_progress DECIMAL(3,1), -- 평균 진척도
    completion_rate INTEGER, -- 회고 완료율
    keyword_count INTEGER, -- 추출된 키워드 수
    project_completion INTEGER, -- 완료 프로젝트 수
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, DATE(calculated_at))
);
```

---

## 🚀 API 엔드포인트 상세 명세

### 1. 회고 홈 대시보드 APIs

#### 1.1 성장 지표 조회
**사용 위치**: `reflection-home/page.tsx:26`

```typescript
GET /api/v1/reflections/growth-stats

Headers:
  Authorization: Bearer {token}
  x-user-id: {user_id}

Response 200:
{
  "success": true,
  "data": {
    "avg_progress": 7.5,        // 평균 진척도
    "completion_rate": 85,       // 회고 완료율 (%)
    "keyword_count": 42,         // 추출된 키워드 수
    "project_completion": 8      // 완료 프로젝트 수
  }
}
```

**구현 로직**:
```typescript
// 평균 진척도: 최근 30일 회고의 progress_score 평균
const avgProgress = await prisma.reflections.aggregate({
  where: {
    user_id: userId,
    created_at: { gte: thirtyDaysAgo }
  },
  _avg: { progress_score: true }
});

// 완료율: (실제 작성 회고 / 예상 회고 수) * 100
const expectedReflections = calculateExpectedReflections(spaces, 30);
const actualReflections = await prisma.reflections.count({
  where: { user_id: userId, created_at: { gte: thirtyDaysAgo } }
});
const completionRate = Math.round((actualReflections / expectedReflections) * 100);

// 키워드 수: ai_keywords 배열 합계
const keywords = await prisma.reflections.findMany({
  where: { user_id: userId },
  select: { ai_keywords: true }
});
const keywordCount = [...new Set(keywords.flatMap(k => k.ai_keywords))].length;

// 완료 프로젝트 수
const projectCompletion = await prisma.reflection_spaces.count({
  where: { user_id: userId, status: 'completed' }
});
```

#### 1.2 최근 회고 목록 조회
**사용 위치**: `reflection-home/page.tsx:35`

```typescript
GET /api/v1/reflections/recent?limit=3

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "space": {
        "id": "uuid",
        "name": "AI 해커톤 준비",
        "type": "공모전"
      },
      "template_name": "KPT 회고",
      "mood": "good",
      "progress_score": 8,
      "ai_feedback": "이번 회고에서 팀워크가 눈에 띄게 향상되었습니다...",
      "reflection_date": "2025-11-13",
      "created_at": "2025-11-13T15:30:00Z"
    }
  ]
}
```

#### 1.3 활성 스페이스 조회
**사용 위치**: `reflection-home/page.tsx:44`

```typescript
GET /api/v1/spaces/active?limit=5

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AI 해커톤 준비",
      "type": "공모전",
      "reflection_cycle": "weekly",
      "next_reflection_date": "2025-11-20T09:00:00Z",
      "total_reflections": 8,
      "start_date": "2025-10-01",
      "end_date": "2025-12-31"
    }
  ]
}
```

---

### 2. 템플릿 관련 APIs

#### 2.1 템플릿 목록 조회
**사용 위치**: `reflections/templates/page.tsx` (현재 하드코딩)

```typescript
GET /api/v1/templates?category={category}

Query Parameters:
  category (optional): '기본' | '심화' | '감정' | '분석' | '정기' | 'all'

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "kpt",
      "name": "KPT 회고",
      "description": "잘한 점, 문제점, 시도할 점을 정리하는 가장 기본적인 회고 템플릿",
      "category": "기본",
      "questions": [
        "Keep: 계속 유지할 점은 무엇인가요?",
        "Problem: 어떤 문제가 있었나요?",
        "Try: 다음에 시도할 점은 무엇인가요?"
      ],
      "usage_count": 1523,
      "is_ai_recommended": true
    }
  ]
}
```

#### 2.2 템플릿 상세 조회
**사용 위치**: `reflections/write/page.tsx:36`, `reflections/new/page.tsx:36`

```typescript
GET /api/v1/templates/{template_id}

Response 200:
{
  "success": true,
  "data": {
    "id": "kpt",
    "name": "KPT 회고",
    "description": "잘한 점, 문제점, 시도할 점을 정리하는 가장 기본적인 회고 템플릿",
    "category": "기본",
    "questions": [
      "Keep: 계속 유지할 점은 무엇인가요?",
      "Problem: 어떤 문제가 있었나요?",
      "Try: 다음에 시도할 점은 무엇인가요?"
    ],
    "usage_count": 1523,
    "is_ai_recommended": true
  }
}
```

#### 2.3 AI 템플릿 추천
**사용 위치**: `reflections/templates/page.tsx:189` (AI 추천 배너)

```typescript
POST /api/v1/templates/recommend

Request Body:
{
  "user_id": "uuid",
  "recent_moods": ["good", "great", "normal"], // 최근 3개 회고 mood
  "space_type": "공모전" // 현재 스페이스 타입
}

Response 200:
{
  "success": true,
  "data": {
    "recommended_templates": [
      {
        "template_id": "4f",
        "reason": "최근 긍정적인 회고가 많아 더 깊이 있는 성찰을 추천합니다"
      },
      {
        "template_id": "weekly-review",
        "reason": "정기적인 점검으로 목표 달성률을 높일 수 있습니다"
      }
    ]
  }
}
```

**AI 추천 로직**:
```typescript
// GPT-4 Turbo 프롬프트
const prompt = `
사용자의 최근 회고 데이터를 기반으로 적합한 회고 템플릿을 추천해주세요.

사용자 정보:
- 최근 감정 상태: ${recentMoods.join(', ')}
- 활동 타입: ${spaceType}

사용 가능한 템플릿:
1. KPT 회고 (기본)
2. 4F 회고 (심화)
3. Start-Stop-Continue (행동 중심)
4. Mad-Sad-Glad (감정 중심)
5. 5 Why 분석 (문제 해결)
6. 주간 리뷰 (정기)

2개의 템플릿을 추천하고, 각각의 추천 이유를 50자 이내로 설명해주세요.
`;
```

---

### 3. 스페이스 관련 APIs

#### 3.1 스페이스 생성
**사용 위치**: `spaces/new/page.tsx:27`

```typescript
POST /api/v1/spaces

Request Body:
{
  "name": "AI 해커톤 준비",
  "type": "공모전",
  "description": "AIFFEL AI 해커톤 참가를 위한 팀 프로젝트",
  "start_date": "2025-10-01",
  "end_date": "2025-12-31",
  "reflection_cycle": "weekly",
  "reminder_enabled": true
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "AI 해커톤 준비",
    "type": "공모전",
    "description": "AIFFEL AI 해커톤 참가를 위한 팀 프로젝트",
    "start_date": "2025-10-01",
    "end_date": "2025-12-31",
    "reflection_cycle": "weekly",
    "reminder_enabled": true,
    "next_reflection_date": "2025-10-08T09:00:00Z", // start_date + 1 cycle
    "expected_reflections": 13, // 계산된 예상 회고 수
    "created_at": "2025-11-14T10:00:00Z"
  }
}
```

**구현 로직**:
```typescript
// 예상 회고 수 계산
function calculateExpectedReflections(startDate, endDate, cycle) {
  const totalDays = differenceInDays(endDate, startDate);
  
  const cycleMap = {
    'daily': 1,
    'weekly': 7,
    'biweekly': 14,
    'monthly': 30
  };
  
  return Math.floor(totalDays / cycleMap[cycle]);
}

// 다음 회고 날짜 계산
function calculateNextReflectionDate(startDate, cycle) {
  const cycleMap = {
    'daily': { days: 1 },
    'weekly': { weeks: 1 },
    'biweekly': { weeks: 2 },
    'monthly': { months: 1 }
  };
  
  return add(startDate, cycleMap[cycle]);
}
```

#### 3.2 스페이스 목록 조회
**사용 위치**: Navigation, Space Selector

```typescript
GET /api/v1/spaces?status=active&limit=10

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AI 해커톤 준비",
      "type": "공모전",
      "reflection_cycle": "weekly",
      "total_reflections": 8,
      "next_reflection_date": "2025-11-20T09:00:00Z",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

#### 3.3 AI 회고 주기 추천
**사용 위치**: `spaces/new/page.tsx` Step 2 (AI 추천 배너)

```typescript
POST /api/v1/spaces/recommend-cycle

Request Body:
{
  "type": "공모전",
  "start_date": "2025-10-01",
  "end_date": "2025-12-31"
}

Response 200:
{
  "success": true,
  "data": {
    "recommended_cycle": "weekly",
    "reason": "공모전은 빠른 피드백이 중요합니다. 주간 회고로 진행 상황을 점검하세요.",
    "expected_reflections": 13
  }
}
```

**AI 추천 로직**:
```typescript
// GPT-4 기반 추천
const prompt = `
활동 타입: ${type}
기간: ${differenceInDays(endDate, startDate)}일

다음 중 가장 적합한 회고 주기를 추천하고 이유를 설명해주세요:
- daily (매일): 단기 집중 활동, 빠른 학습 필요
- weekly (주간): 일반적인 프로젝트, 정기적인 점검
- biweekly (격주): 장기 프로젝트, 여유있는 성찰
- monthly (월간): 매우 장기적인 활동, 큰 그림 파악

JSON 형식으로 응답:
{
  "cycle": "weekly",
  "reason": "..."
}
`;
```

---

### 4. 회고 작성 APIs

#### 4.1 회고 저장
**사용 위치**: `reflections/write/page.tsx:50`, `reflections/new/page.tsx:50`

```typescript
POST /api/v1/reflections

Request Body:
{
  "space_id": "uuid",
  "template_id": "kpt",
  "answers": [
    {
      "question": "Keep: 계속 유지할 점은 무엇인가요?",
      "answer": "팀원들과의 소통이 원활했습니다. 매일 스탠드업 미팅을 통해..."
    },
    {
      "question": "Problem: 어떤 문제가 있었나요?",
      "answer": "시간 관리가 어려웠습니다. 예상보다 구현에 시간이..."
    },
    {
      "question": "Try: 다음에 시도할 점은 무엇인가요?",
      "answer": "태스크를 더 작은 단위로 쪼개서 진행하겠습니다."
    }
  ],
  "mood": "good",
  "progress_score": 7,
  "reflection_date": "2025-11-14"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "space_id": "uuid",
    "template_id": "kpt",
    "answers": [...],
    "mood": "good",
    "progress_score": 7,
    "ai_feedback": "이번 회고에서 팀워크 향상이 돋보입니다. 시간 관리 개선을 위해...",
    "ai_keywords": ["팀워크", "시간관리", "태스크분할"],
    "ai_sentiment_score": 0.72,
    "reflection_date": "2025-11-14",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

**구현 로직 - AI 피드백 생성**:
```typescript
async function generateAiFeedback(answers, mood, progressScore) {
  const prompt = `
다음 회고 내용을 분석하여 피드백을 제공해주세요:

회고 내용:
${answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

현재 기분: ${mood}
진척도: ${progressScore}/10

다음 형식으로 응답해주세요:
1. ai_feedback: 200자 이내의 격려와 구체적인 조언
2. ai_keywords: 핵심 키워드 3-5개 추출 (배열)
3. ai_sentiment_score: 감정 점수 0.0-1.0 (긍정도)
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

#### 4.2 회고 수정
**사용 위치**: Edit 기능

```typescript
PATCH /api/v1/reflections/{reflection_id}

Request Body:
{
  "answers": [...], // 수정된 답변
  "mood": "great",
  "progress_score": 9
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2025-11-14T11:00:00Z",
    // ... 전체 데이터
  }
}
```

#### 4.3 회고 삭제
```typescript
DELETE /api/v1/reflections/{reflection_id}

Response 204: No Content
```

---

### 5. AI 성장 분석 APIs

#### 5.1 AI 성장 분석 조회
**사용 위치**: `reflections/analysis/page.tsx:26`

```typescript
GET /api/v1/reflections/ai-analysis?period=last_30_days

Query Parameters:
  period: 'last_30_days' | 'last_3_months' | 'last_6_months'

Response 200:
{
  "success": true,
  "data": {
    "summary": "지난 30일간 총 12개의 회고를 작성하셨습니다. 전반적으로 긍정적인 성장 패턴을 보이고 있으며...",
    
    "metrics": {
      "avg_progress": 7.5,
      "completion_rate": 85,
      "keyword_count": 42,
      "project_completion": 8
    },
    
    "strengths": [
      {
        "title": "꾸준한 회고 습관",
        "description": "85%의 높은 회고 완료율을 보이고 있습니다. 정기적인 성찰이 습관화되었어요."
      },
      {
        "title": "팀워크 역량 강화",
        "description": "'협업', '소통' 키워드가 최근 3주간 50% 증가했습니다."
      },
      {
        "title": "긍정적 마인드",
        "description": "최근 mood 분석 결과 70%가 'good' 이상입니다."
      }
    ],
    
    "improvements": [
      {
        "title": "시간 관리 개선 필요",
        "description": "'시간관리' 키워드가 반복 출현하고 있습니다. 구체적인 시간 계획 수립을 추천합니다."
      },
      {
        "title": "목표 설정 구체화",
        "description": "추상적인 목표가 많습니다. SMART 원칙을 활용해보세요."
      },
      {
        "title": "회고 깊이 향상",
        "description": "답변 길이가 평균 50자 미만입니다. 더 깊이 있는 성찰을 시도해보세요."
      }
    ],
    
    "next_steps": [
      {
        "title": "고급 템플릿 시도",
        "action": "4F 회고나 5 Why 분석 템플릿을 사용해보세요",
        "expected_result": "더 깊이 있는 인사이트 발견"
      },
      {
        "title": "주간 목표 설정",
        "action": "매주 월요일 구체적인 목표 3가지 설정",
        "expected_result": "진척도 20% 향상 예상"
      }
    ],
    
    "charts": {
      "monthly_progress": [
        { "month": "9월", "score": 6.8 },
        { "month": "10월", "score": 7.2 },
        { "month": "11월", "score": 7.5 }
      ],
      
      "skill_distribution": [
        { "skill": "팀워크", "level": 85 },
        { "skill": "기술력", "level": 78 },
        { "skill": "문제해결", "level": 72 },
        { "skill": "시간관리", "level": 65 },
        { "skill": "커뮤니케이션", "level": 80 }
      ],
      
      "mood_distribution": [
        { "mood": "great", "count": 3 },
        { "mood": "good", "count": 6 },
        { "mood": "normal", "count": 2 },
        { "mood": "bad", "count": 1 },
        { "mood": "terrible", "count": 0 }
      ],
      
      "keyword_levels": [
        { "keyword": "팀워크", "level": 85 },
        { "keyword": "문제해결", "level": 78 },
        { "keyword": "시간관리", "level": 65 },
        { "keyword": "학습", "level": 72 }
      ]
    },
    
    "generated_at": "2025-11-14T10:00:00Z",
    "expires_at": "2025-11-14T22:00:00Z" // 12시간 캐시
  }
}
```

**구현 로직 - AI 분석 생성**:
```typescript
async function generateGrowthAnalysis(userId, period) {
  // 1. 캐시 확인
  const cached = await prisma.reflection_ai_analysis.findUnique({
    where: { 
      user_id: userId,
      analysis_period: period,
      expires_at: { gte: new Date() }
    }
  });
  
  if (cached) return cached;
  
  // 2. 회고 데이터 수집
  const reflections = await fetchReflections(userId, period);
  const spaces = await fetchSpaces(userId);
  
  // 3. GPT-4 분석 요청
  const prompt = `
사용자의 회고 데이터를 분석하여 성장 인사이트를 제공해주세요.

데이터:
- 총 회고 수: ${reflections.length}
- 평균 진척도: ${calculateAvgProgress(reflections)}
- 주요 키워드: ${extractTopKeywords(reflections)}
- 감정 분포: ${calculateMoodDistribution(reflections)}
- 활동 타입: ${spaces.map(s => s.type).join(', ')}

다음 형식으로 JSON 응답:
{
  "summary": "전체 요약 (200자)",
  "strengths": [{"title": "...", "description": "..."}],
  "improvements": [{"title": "...", "description": "..."}],
  "next_steps": [{"title": "...", "action": "...", "expected_result": "..."}],
  "charts": {
    "monthly_progress": [...],
    "skill_distribution": [...],
    "mood_distribution": [...],
    "keyword_levels": [...]
  }
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  
  const analysis = JSON.parse(response.choices[0].message.content);
  
  // 4. 캐시 저장 (12시간)
  await prisma.reflection_ai_analysis.create({
    data: {
      user_id: userId,
      analysis_period: period,
      ...analysis,
      expires_at: add(new Date(), { hours: 12 })
    }
  });
  
  return analysis;
}
```

#### 5.2 AI 분석 캐시 무효화
**사용 위치**: 새 회고 작성 시 자동 호출

```typescript
DELETE /api/v1/reflections/ai-analysis/cache

Response 204: No Content

// 새 회고 저장 시 자동 호출
await invalidateAnalysisCache(userId);
```

---

## 📈 추가 필수 APIs

### 6. 알림 & 리마인더

#### 6.1 다음 회고 알림 조회
```typescript
GET /api/v1/reflections/upcoming

Response 200:
{
  "success": true,
  "data": [
    {
      "space_id": "uuid",
      "space_name": "AI 해커톤 준비",
      "due_date": "2025-11-20T09:00:00Z",
      "is_overdue": false,
      "days_until": 6
    }
  ]
}
```

#### 6.2 리마인더 설정 변경
```typescript
PATCH /api/v1/spaces/{space_id}/reminder

Request Body:
{
  "reminder_enabled": true,
  "reminder_time": "09:00" // HH:mm 형식
}

Response 200:
{
  "success": true,
  "data": {
    "space_id": "uuid",
    "reminder_enabled": true,
    "reminder_time": "09:00"
  }
}
```

---

### 7. 검색 & 필터링

#### 7.1 회고 검색
```typescript
GET /api/v1/reflections/search?q={keyword}&space_id={uuid}&mood={mood}

Query Parameters:
  q: 검색 키워드 (answers 내용 검색)
  space_id: 스페이스 필터
  mood: 감정 필터
  date_from: 시작 날짜
  date_to: 종료 날짜

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "space_name": "AI 해커톤 준비",
      "template_name": "KPT 회고",
      "mood": "good",
      "reflection_date": "2025-11-10",
      "preview": "팀원들과의 소통이 원활했습니다..." // 첫 100자
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20
  }
}
```

---

### 8. 통계 & 인사이트

#### 8.1 키워드 트렌드 분석
```typescript
GET /api/v1/reflections/keyword-trends?period=last_3_months

Response 200:
{
  "success": true,
  "data": {
    "trending_keywords": [
      {
        "keyword": "팀워크",
        "count": 15,
        "trend": "up", // 'up', 'down', 'stable'
        "change_percentage": 50 // 이전 기간 대비
      }
    ],
    "declining_keywords": [
      {
        "keyword": "시간관리",
        "count": 8,
        "trend": "down",
        "change_percentage": -20
      }
    ]
  }
}
```

#### 8.2 스페이스별 통계
```typescript
GET /api/v1/spaces/{space_id}/stats

Response 200:
{
  "success": true,
  "data": {
    "space_id": "uuid",
    "total_reflections": 12,
    "completion_rate": 92, // %
    "avg_progress_score": 7.8,
    "most_used_template": "KPT 회고",
    "mood_trend": "improving", // 'improving', 'declining', 'stable'
    "top_keywords": ["팀워크", "문제해결", "학습"]
  }
}
```

---

## 🔄 배치 작업 요구사항

### 1. 회고 리마인더 발송
**실행 주기**: 매일 오전 9시

```typescript
// Cron Job: 0 9 * * *
async function sendReflectionReminders() {
  const today = new Date();
  
  // 오늘 회고 예정인 스페이스 조회
  const dueSpaces = await prisma.reflection_spaces.findMany({
    where: {
      reminder_enabled: true,
      next_reflection_date: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      }
    },
    include: { user: true }
  });
  
  // 알림 발송
  for (const space of dueSpaces) {
    await sendNotification(space.user_id, {
      title: `${space.name} 회고 작성 시간입니다`,
      body: '오늘의 경험을 기록하고 성장하세요!',
      action_url: `/dashboard/reflections/write?space_id=${space.id}`
    });
  }
}
```

### 2. 다음 회고 날짜 자동 갱신
**실행 주기**: 회고 작성 직후

```typescript
async function updateNextReflectionDate(spaceId) {
  const space = await prisma.reflection_spaces.findUnique({
    where: { id: spaceId }
  });
  
  const nextDate = add(space.next_reflection_date, {
    days: space.reflection_cycle === 'daily' ? 1 : 0,
    weeks: space.reflection_cycle === 'weekly' ? 1 : 
           space.reflection_cycle === 'biweekly' ? 2 : 0,
    months: space.reflection_cycle === 'monthly' ? 1 : 0
  });
  
  await prisma.reflection_spaces.update({
    where: { id: spaceId },
    data: { 
      next_reflection_date: nextDate,
      total_reflections: { increment: 1 }
    }
  });
}
```

### 3. AI 분석 캐시 만료 처리
**실행 주기**: 매시간

```typescript
// Cron Job: 0 * * * *
async function cleanExpiredAnalysisCache() {
  await prisma.reflection_ai_analysis.deleteMany({
    where: {
      expires_at: { lte: new Date() }
    }
  });
}
```

### 4. 성장 지표 계산
**실행 주기**: 매일 자정

```typescript
// Cron Job: 0 0 * * *
async function calculateDailyGrowthMetrics() {
  const users = await prisma.users.findMany();
  
  for (const user of users) {
    const metrics = await calculateUserMetrics(user.id);
    
    await prisma.growth_metrics.upsert({
      where: {
        user_id_date: {
          user_id: user.id,
          date: new Date()
        }
      },
      create: {
        user_id: user.id,
        ...metrics
      },
      update: metrics
    });
  }
}
```

---

## 🚨 에러 처리 & 검증

### 에러 응답 형식
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다",
    "details": [
      {
        "field": "progress_score",
        "message": "1-10 사이의 숫자여야 합니다"
      }
    ]
  }
}
```

### 에러 코드 목록
```typescript
enum ErrorCode {
  // 인증 & 권한
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 유효성 검증
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // 리소스
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // 비즈니스 로직
  REFLECTION_ALREADY_SUBMITTED = 'REFLECTION_ALREADY_SUBMITTED',
  SPACE_NOT_ACTIVE = 'SPACE_NOT_ACTIVE',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  
  // 외부 서비스
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 입력 검증 스키마 (Zod)

```typescript
// 스페이스 생성
const CreateSpaceSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(['공모전', '프로젝트', '동아리', '스터디']),
  description: z.string().max(1000).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reflection_cycle: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  reminder_enabled: z.boolean().default(true)
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: '종료일은 시작일보다 이후여야 합니다'
});

// 회고 작성
const CreateReflectionSchema = z.object({
  space_id: z.string().uuid(),
  template_id: z.string(),
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string().min(10).max(2000)
  })).min(1),
  mood: z.enum(['great', 'good', 'normal', 'bad', 'terrible']),
  progress_score: z.number().int().min(1).max(10),
  reflection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
```

---

## 🔒 보안 요구사항

### 1. Rate Limiting
```typescript
// IP 기반
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // IP당 100 요청
});

// 사용자 기반
const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60, // 사용자당 60 요청
  keyGenerator: (req) => req.headers['x-user-id']
});

// AI 요청 제한
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 50, // 사용자당 50 AI 요청
  keyGenerator: (req) => req.headers['x-user-id']
});
```

### 2. 입력 검증 & Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  // HTML 태그 제거
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // SQL Injection 방지 (Prisma ORM 사용 시 자동)
  // XSS 방지
  return cleaned.trim();
}
```

### 3. CORS 설정
```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://proof.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
};
```

---

## 📊 성능 최적화 요구사항

### 1. 캐싱 전략

#### Redis 캐싱
```typescript
// 템플릿 목록 (1시간 캐시)
const cacheKey = 'templates:all';
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const templates = await prisma.reflection_templates.findMany();
await redis.setex(cacheKey, 3600, JSON.stringify(templates));

// AI 분석 결과 (12시간 캐시)
const analysisCacheKey = `analysis:${userId}:${period}`;
await redis.setex(analysisCacheKey, 43200, JSON.stringify(analysis));
```

#### 데이터베이스 인덱스
```sql
-- 자주 조회되는 컬럼 인덱스
CREATE INDEX idx_reflections_user_date ON reflections(user_id, reflection_date DESC);
CREATE INDEX idx_spaces_user_status ON reflection_spaces(user_id, status);
CREATE INDEX idx_reflections_space_created ON reflections(space_id, created_at DESC);

-- AI 키워드 검색용 GIN 인덱스
CREATE INDEX idx_reflections_keywords_gin ON reflections USING GIN (ai_keywords);
CREATE INDEX idx_reflections_answers_gin ON reflections USING GIN (answers);
```

### 2. 쿼리 최적화

```typescript
// N+1 문제 방지 - Eager Loading
const reflections = await prisma.reflections.findMany({
  where: { user_id: userId },
  include: {
    space: {
      select: { id: true, name: true, type: true }
    },
    template: {
      select: { id: true, name: true }
    }
  },
  orderBy: { created_at: 'desc' },
  take: 10
});

// Pagination
const [reflections, total] = await Promise.all([
  prisma.reflections.findMany({
    skip: (page - 1) * limit,
    take: limit
  }),
  prisma.reflections.count()
]);
```

### 3. AI 요청 최적화

```typescript
// 배치 처리
async function batchGenerateAiFeedback(reflections) {
  const prompts = reflections.map(r => buildPrompt(r));
  
  // 10개씩 병렬 처리
  const chunks = chunk(prompts, 10);
  const results = [];
  
  for (const chunk of chunks) {
    const batchResults = await Promise.all(
      chunk.map(prompt => openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }]
      }))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// 스트리밍 응답 (긴 AI 분석용)
async function streamAiAnalysis(userId, period) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [...],
    stream: true
  });
  
  return stream;
}
```

---

## 🧪 테스트 요구사항

### 1. 단위 테스트 (Jest)
```typescript
describe('Reflection Creation', () => {
  it('should create reflection with AI feedback', async () => {
    const reflection = await createReflection({
      space_id: testSpaceId,
      template_id: 'kpt',
      answers: [/* ... */],
      mood: 'good',
      progress_score: 7
    });
    
    expect(reflection.ai_feedback).toBeDefined();
    expect(reflection.ai_keywords.length).toBeGreaterThan(0);
  });
  
  it('should validate progress_score range', async () => {
    await expect(createReflection({
      progress_score: 11
    })).rejects.toThrow('1-10 사이의 숫자여야 합니다');
  });
});
```

### 2. 통합 테스트
```typescript
describe('Space Creation Flow', () => {
  it('should create space and schedule first reflection', async () => {
    const space = await request(app)
      .post('/api/v1/spaces')
      .send({
        name: 'Test Project',
        type: '프로젝트',
        start_date: '2025-11-01',
        end_date: '2025-12-31',
        reflection_cycle: 'weekly'
      })
      .expect(201);
    
    expect(space.body.data.next_reflection_date).toBeDefined();
    expect(space.body.data.expected_reflections).toBe(8);
  });
});
```

---

## 📝 로깅 요구사항

### 로그 포맷
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 로그 항목
logger.info('Reflection created', {
  user_id: userId,
  space_id: spaceId,
  template_id: templateId,
  ai_processing_time: 1.5 // seconds
});

logger.error('AI service error', {
  user_id: userId,
  error: error.message,
  stack: error.stack
});
```

### 모니터링 지표
- API 응답 시간 (p50, p95, p99)
- AI 요청 성공률
- 회고 생성 성공률
- 캐시 히트율
- 데이터베이스 쿼리 시간

---

## 🚀 배포 & 인프라 요구사항

### 환경 변수
```bash
# .env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/proof
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/proof
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: proof
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## ✅ 체크리스트

### Phase 1: 기본 CRUD (1주차)
- [ ] 데이터베이스 스키마 생성
- [ ] Prisma ORM 설정
- [ ] 템플릿 CRUD API
- [ ] 스페이스 CRUD API
- [ ] 회고 CRUD API (AI 없이)

### Phase 2: AI 통합 (2주차)
- [ ] OpenAI API 연동
- [ ] AI 피드백 생성 로직
- [ ] AI 키워드 추출
- [ ] AI 감정 분석
- [ ] AI 템플릿 추천

### Phase 3: 성장 분석 (3주차)
- [ ] 성장 지표 계산 로직
- [ ] AI 종합 분석 생성
- [ ] 차트 데이터 API
- [ ] 키워드 트렌드 분석
- [ ] 스페이스별 통계

### Phase 4: 최적화 & 배치 (4주차)
- [ ] Redis 캐싱 적용
- [ ] 데이터베이스 인덱스 최적화
- [ ] 회고 리마인더 배치 작업
- [ ] AI 분석 캐시 관리
- [ ] Rate Limiting 적용

### Phase 5: 테스트 & 배포 (5주차)
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] API 문서 자동화 (Swagger)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 구축

---

## 📞 문의 & 지원

**프론트엔드 개발자**: 회고 시스템 UI/UX 구현 완료  
**백엔드 개발자**: 이 문서를 기반으로 API 구현 필요  

**우선순위 API**:
1. 🔴 HIGH: 템플릿 API, 스페이스 생성, 회고 저장
2. 🟡 MEDIUM: AI 피드백, 성장 분석
3. 🟢 LOW: 통계, 검색, 배치 작업

**예상 개발 기간**: 4-5주  
**필수 기술 스택**: Node.js, Express, Prisma, PostgreSQL, Redis, OpenAI API  

---

*이 문서는 프론트엔드 구현을 기반으로 작성되었으며, 백엔드 구현 시 실제 요구사항에 맞게 조정 가능합니다.*
