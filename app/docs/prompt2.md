# CIRO 프론트엔드 프롬프트 및 AI 통합 문서 (v2.0)

## 📋 문서 정보
- **작성일**: 2025-11-23
- **버전**: 2.0 (최신 통합 버전)
- **목적**: CIRO 프론트엔드의 AI 프롬프트 및 Gemini API 통합 명세
- **AI 모델**: Google Gemini 1.5 Pro

---

## 1. AI 통합 개요

### 1.1 사용 사례
CIRO 프론트엔드는 다음 상황에서 AI를 활용합니다:

1. **진로봇 (Career Bot)**
   - 대화형 직무 상담
   - 실무 시뮬레이션
   - 맞춤형 커리어 조언

2. **직무 분석 (Career Analyze)**
   - 설문 결과 기반 직무 추천 이유 생성
   - 세부 직무 설명 생성
   - 성장 경로 제안

3. **회고 AI 피드백**
   - 회고 작성 시 AI 코멘트
   - 개선 제안
   - 패턴 분석

4. **활동 추천 강화**
   - 사용자 프로필 기반 활동 설명 커스터마이징
   - 지원 동기 작성 도우미

---

## 2. Gemini API 설정

### 2.1 API 라우트 (`app/api/gemini/career-analyze/route.ts`)

**목적**: Next.js API 라우트를 통한 Gemini AI 호출

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context } = body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ 
      success: true, 
      data: generatedText 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 2.2 프론트엔드에서 호출

```typescript
const analyzeCareer = async (surveyResult: SurveyResult) => {
  const response = await fetch('/api/gemini/career-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: buildCareerAnalysisPrompt(surveyResult),
      context: {
        user_id: localStorage.getItem('x-user-id'),
        survey_type: 'general'
      }
    })
  });

  const { data } = await response.json();
  return data;
};
```

---

## 3. 진로봇 (CareerBot) 프롬프트

### 3.1 시스템 프롬프트

```typescript
const SYSTEM_PROMPT = `
당신은 CIRO의 AI 진로 상담 전문가입니다.

**역할:**
- 대학생을 위한 친근하고 공감적인 진로 코치
- 상경계열 학생의 직무 탐색을 돕는 멘토
- 실무 중심의 구체적인 조언 제공

**대화 스타일:**
- 반말 사용 (편안하고 친근한 톤)
- 이모지 적절히 사용 (😊, 🎯, 💡 등)
- 질문은 명확하고 간결하게
- 답변은 3-5문장 이내로 간결하게

**금지 사항:**
- 너무 긴 답변 (사용자 부담)
- 일반적이고 뻔한 조언
- 전문 용어 남발
- 부정적이거나 비관적인 표현

**목표:**
사용자가 자신의 강점과 관심사를 발견하고, 구체적인 직무 경로를 그릴 수 있도록 돕는 것
`;
```

---

### 3.2 대화 시작 프롬프트

```typescript
const buildIntroPrompt = (userName?: string) => `
${SYSTEM_PROMPT}

**상황:**
${userName || '사용자'}님이 진로봇 상담을 시작했습니다.

**당신의 첫 인사:**
1. 간단한 자기소개 (AI 진로 코치)
2. 사용자가 관심있는 직무 분야 질문
3. 오늘 가장 궁금한 점이 무엇인지 질문

**예시 답변:**
안녕! 나는 CIRO 진로봇이야 😊
너의 진로 고민을 함께 풀어가는 코치라고 생각하면 돼.

오늘은 어떤 직무 분야가 궁금해?
마케팅, 기획, 데이터 분석 등 편하게 말해줘!
`;
```

---

### 3.3 직무 시뮬레이션 프롬프트

```typescript
const buildSimulationPrompt = (jobType: string, userAnswer: string, questionNumber: number) => `
${SYSTEM_PROMPT}

**상황:**
사용자가 "${jobType}" 직무 시뮬레이션을 진행 중입니다.
현재 ${questionNumber}번째 질문입니다.

**사용자의 이전 답변:**
"${userAnswer}"

**당신의 역할:**
1. 사용자의 답변에 대한 짧은 피드백 (1-2문장)
2. 실무 상황을 가정한 다음 질문 제시
3. 질문은 구체적이고 실천 가능한 내용으로

**질문 가이드:**
- ${questionNumber <= 2 ? '직무 이해도 파악 질문' : ''}
- ${questionNumber === 3 ? '실무 경험 탐색 질문' : ''}
- ${questionNumber >= 4 ? '문제 해결 능력 질문' : ''}

**예시 답변:**
좋은 접근이야! ${jobType}에서 중요한 관점이네 👍

그럼 이런 상황이라면 어떻게 할 것 같아?
[구체적인 실무 상황 시나리오 제시]
`;
```

---

### 3.4 최종 직무 분석 프롬프트

```typescript
const buildFinalAnalysisPrompt = (jobType: string, allAnswers: string[]) => `
${SYSTEM_PROMPT}

**상황:**
사용자가 "${jobType}" 직무 시뮬레이션을 완료했습니다.

**사용자의 전체 답변:**
${allAnswers.map((answer, i) => `Q${i+1}: ${answer}`).join('\n')}

**당신의 역할:**
1. 사용자의 ${jobType} 직무 적합도 분석 (0-100점)
2. 강점 3가지 간결하게 언급
3. 개선 영역 1-2가지 제안
4. 다음 액션 아이템 제안

**응답 형식 (JSON):**
{
  "score": 85,
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2"],
  "next_actions": ["액션1", "액션2"]
}

**톤:**
긍정적이고 격려하는 톤 유지, 구체적인 피드백 제공
`;
```

---

## 4. 직무 분석 프롬프트

### 4.1 직무 추천 이유 생성

```typescript
const buildJobRecommendationPrompt = (
  recommendedJob: string,
  scores: Record<string, number>,
  surveyAnswers: Record<string, any>
) => `
**목적:**
사용자에게 왜 "${recommendedJob}" 직무가 추천되었는지 설명하기

**데이터:**
- 추천 직무: ${recommendedJob}
- 점수: ${JSON.stringify(scores)}
- 주요 답변: ${JSON.stringify(surveyAnswers)}

**작성 가이드:**
1. 2-3문장으로 간결하게
2. 설문에서 드러난 사용자의 강점 언급
3. 해당 직무와의 연결고리 설명
4. 긍정적이고 확신 있는 톤

**예시:**
마케팅 직무가 가장 높은 점수를 받았어요! 
창의적인 아이디어 제시와 데이터 기반 의사결정 능력이 특히 돋보였습니다.
고객 관찰력과 트렌드 분석 능력도 마케터에게 필수적인 강점이에요 🎯
`;
```

---

### 4.2 세부 직무 설명 생성

```typescript
const buildSpecializationDescPrompt = (
  mainJob: string,
  specialization: string,
  userStrengths: string[]
) => `
**목적:**
"${mainJob}" 직무의 "${specialization}" 세부 직무를 설명하고, 
사용자의 강점과 연결하기

**사용자 강점:**
${userStrengths.join(', ')}

**작성 가이드:**
1. ${specialization}의 핵심 업무 2-3가지
2. 필요한 역량
3. 사용자의 강점이 어떻게 활용될 수 있는지
4. 커리어 성장 경로 간단히 언급

**응답 형식:**
{
  "description": "세부 직무 설명 (3-4문장)",
  "key_skills": ["스킬1", "스킬2", "스킬3"],
  "your_strengths_match": "사용자 강점과의 연결 설명 (2문장)",
  "career_path": "성장 경로 (2문장)"
}

**톤:**
전문적이면서도 이해하기 쉽게, 실무 중심으로
`;
```

---

## 5. 회고 AI 피드백 프롬프트

### 5.1 회고 작성 시 코멘트

```typescript
const buildReflectionFeedbackPrompt = (
  reflectionContent: string,
  mood: string,
  activityType: string
) => `
**상황:**
사용자가 ${activityType} 활동에 대한 회고를 작성했습니다.
기분: ${mood}

**회고 내용:**
"${reflectionContent}"

**당신의 역할:**
1. 회고 내용에 대한 공감 및 긍정적 피드백 (1-2문장)
2. 눈에 띄는 강점이나 성장 포인트 언급
3. 다음 단계 제안 또는 격려 (1문장)

**작성 가이드:**
- 따뜻하고 공감적인 톤
- 구체적인 내용 언급 (일반적인 칭찬 지양)
- 3-4문장 이내로 간결하게

**예시:**
이번 프로젝트에서 팀원들과의 소통 방식을 개선한 점이 인상적이네요 👍
특히 정기 회의를 도입한 결정이 팀워크 향상에 크게 기여했어요.
다음엔 회의록 작성까지 해보면 더욱 체계적인 협업이 가능할 것 같아요!
`;
```

---

### 5.2 패턴 분석 프롬프트

```typescript
const buildPatternAnalysisPrompt = (
  recentReflections: Array<{
    content: string;
    mood: string;
    activity_type: string;
    date: string;
  }>
) => `
**목적:**
사용자의 최근 회고 패턴을 분석하고 인사이트 제공

**최근 회고 데이터:**
${recentReflections.map((r, i) => `
${i+1}. [${r.date}] ${r.activity_type} (기분: ${r.mood})
내용: ${r.content.slice(0, 200)}...
`).join('\n')}

**분석 항목:**
1. 긍정적 패턴: 반복되는 강점이나 성공 요인
2. 도전 과제: 자주 언급되는 어려움
3. 성장 포인트: 시간에 따른 변화
4. 추천 액션: 다음 단계 제안

**응답 형식 (JSON):**
{
  "positive_patterns": ["패턴1", "패턴2"],
  "challenges": ["도전1", "도전2"],
  "growth_points": ["성장1", "성장2"],
  "recommended_actions": ["액션1", "액션2"]
}

**톤:**
데이터 기반 분석이지만 따뜻하고 격려하는 톤 유지
`;
```

---

## 6. 활동 추천 강화 프롬프트

### 6.1 활동 설명 커스터마이징

```typescript
const buildActivityDescPrompt = (
  activity: {
    title: string;
    category: string;
    field: string;
    description: string;
  },
  userProfile: {
    interests: string[];
    strengths: string[];
    career_goal: string;
  }
) => `
**목적:**
"${activity.title}" 활동이 사용자에게 왜 좋은지 설명하기

**활동 정보:**
- 카테고리: ${activity.category}
- 분야: ${activity.field}
- 기본 설명: ${activity.description}

**사용자 프로필:**
- 관심사: ${userProfile.interests.join(', ')}
- 강점: ${userProfile.strengths.join(', ')}
- 커리어 목표: ${userProfile.career_goal}

**작성 가이드:**
1. 활동이 사용자의 관심사/목표와 어떻게 연결되는지
2. 사용자의 강점을 어떻게 활용할 수 있는지
3. 이 활동을 통해 얻을 수 있는 구체적 경험
4. 2-3문장으로 간결하게

**예시:**
이 공모전은 마케팅 직무를 목표로 하는 당신에게 딱이에요!
데이터 분석 강점을 활용해 소비자 인사이트를 도출하는 경험을 쌓을 수 있어요.
실무 마케터와 협업하며 포트폴리오도 만들 수 있답니다 🎯
`;
```

---

### 6.2 지원 동기 작성 도우미

```typescript
const buildMotivationHelperPrompt = (
  activity: {
    title: string;
    organization: string;
    requirements: string[];
  },
  userExperience: {
    past_activities: string[];
    skills: string[];
    interests: string[];
  }
) => `
**목적:**
"${activity.title}" 지원 동기 초안 작성

**활동 정보:**
- 주최: ${activity.organization}
- 요구사항: ${activity.requirements.join(', ')}

**사용자 경험:**
- 과거 활동: ${userExperience.past_activities.join(', ')}
- 보유 스킬: ${userExperience.skills.join(', ')}
- 관심사: ${userExperience.interests.join(', ')}

**작성 가이드:**
1. 지원 동기 (관심을 갖게 된 이유)
2. 관련 경험 연결
3. 보유 역량 어필
4. 기대하는 배움과 기여
5. 200-250자 분량

**톤:**
진정성 있고 구체적으로, 열정적이지만 과장되지 않게

**응답 형식:**
지원 동기 초안 텍스트만 반환 (JSON 아님)
`;
```

---

## 7. AI 응답 후처리

### 7.1 응답 파싱

```typescript
const parseAIResponse = (rawResponse: string) => {
  // JSON 형식 응답 파싱 시도
  try {
    // 마크다운 코드 블록 제거
    const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleaned);
  } catch (e) {
    // 일반 텍스트 응답
    return {
      text: rawResponse.trim(),
      parsed: false
    };
  }
};
```

---

### 7.2 응답 검증

```typescript
const validateAIResponse = (response: any, expectedFields: string[]) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid AI response format');
  }

  const missingFields = expectedFields.filter(field => !(field in response));
  if (missingFields.length > 0) {
    throw new Error(`Missing fields: ${missingFields.join(', ')}`);
  }

  return true;
};
```

---

### 7.3 폴백 처리

```typescript
const handleAIError = (error: Error, fallbackMessage: string) => {
  console.error('AI Error:', error);
  
  // 사용자에게 친근한 에러 메시지
  return {
    success: false,
    message: fallbackMessage || '잠시 후 다시 시도해주세요 😅',
    error: error.message
  };
};
```

---

## 8. 프롬프트 최적화 가이드

### 8.1 효과적인 프롬프트 작성 원칙

1. **명확한 역할 정의**
   ```
   당신은 [역할]입니다.
   [구체적인 전문성]을 가지고 있습니다.
   ```

2. **구체적인 맥락 제공**
   ```
   **상황:** [현재 상황 설명]
   **사용자 정보:** [관련 데이터]
   ```

3. **명확한 출력 형식 지정**
   ```
   **응답 형식:**
   - JSON 구조
   - 문장 개수 제한
   - 톤 & 매너 가이드
   ```

4. **예시 제공**
   ```
   **좋은 예시:**
   [이상적인 응답 샘플]
   
   **나쁜 예시:**
   [피해야 할 응답 샘플]
   ```

---

### 8.2 토큰 최적화

```typescript
const optimizePrompt = (prompt: string, maxTokens: number = 2000) => {
  // 불필요한 공백 제거
  let optimized = prompt.replace(/\s+/g, ' ').trim();
  
  // 대략적인 토큰 수 계산 (1 토큰 ≈ 4 글자)
  const estimatedTokens = optimized.length / 4;
  
  if (estimatedTokens > maxTokens) {
    // 프롬프트 압축
    optimized = optimized.slice(0, maxTokens * 4);
    console.warn('Prompt truncated to fit token limit');
  }
  
  return optimized;
};
```

---

## 9. A/B 테스트 및 개선

### 9.1 프롬프트 버전 관리

```typescript
const PROMPT_VERSIONS = {
  career_analysis_v1: `[기존 프롬프트]`,
  career_analysis_v2: `[개선된 프롬프트]`,
};

const getPromptVersion = (key: string, version: 'v1' | 'v2' = 'v2') => {
  return PROMPT_VERSIONS[`${key}_${version}`];
};
```

---

### 9.2 응답 품질 평가

```typescript
interface ResponseQuality {
  relevance: number;    // 1-5
  clarity: number;      // 1-5
  usefulness: number;   // 1-5
  tone: number;         // 1-5
}

const collectFeedback = async (responseId: string, quality: ResponseQuality) => {
  await fetch('/api/ai-feedback', {
    method: 'POST',
    body: JSON.stringify({
      response_id: responseId,
      quality,
      timestamp: new Date().toISOString()
    })
  });
};
```

---

## 10. 비용 관리

### 10.1 캐싱 전략

```typescript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

const getCachedAIResponse = async (promptKey: string, context: any) => {
  const cacheKey = `ai_${promptKey}_${JSON.stringify(context)}`;
  
  // 로컬스토리지 캐시 확인
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { response, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return response;
    }
  }
  
  // 새로운 AI 호출
  const response = await callGeminiAPI(promptKey, context);
  
  // 캐시 저장
  localStorage.setItem(cacheKey, JSON.stringify({
    response,
    timestamp: Date.now()
  }));
  
  return response;
};
```

---

### 10.2 요청 제한 (Rate Limiting)

```typescript
const AI_REQUEST_LIMIT = 10; // 시간당 요청 제한
const REQUEST_WINDOW = 60 * 60 * 1000; // 1시간

const checkRateLimit = () => {
  const requests = JSON.parse(localStorage.getItem('ai_requests') || '[]');
  const now = Date.now();
  
  // 만료된 요청 제거
  const recentRequests = requests.filter((timestamp: number) => 
    now - timestamp < REQUEST_WINDOW
  );
  
  if (recentRequests.length >= AI_REQUEST_LIMIT) {
    throw new Error('AI 요청 한도 초과. 잠시 후 다시 시도해주세요.');
  }
  
  // 새 요청 기록
  recentRequests.push(now);
  localStorage.setItem('ai_requests', JSON.stringify(recentRequests));
};
```

---

## 11. 참고 문서
- Gemini API 공식 문서: https://ai.google.dev/docs
- `backend/docs/prompt2.md`: 백엔드 AI 프롬프트
- `app/docs/logic2.md`: 프론트엔드 시스템 로직
