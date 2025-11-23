# CIRO 시스템 로직 문서 (2024 업데이트)

> **참고**: 기존 ProoF 직무 선택 시스템 문서는 별도 파일로 분리되었습니다.

---

# ProoF 직무 선택 & 스펙체크 시스템 - 프론트엔드 로직 명세 (v2.4)

## 📋 문서 개요
- **작성일**: 2025-11-18
- **버전**: 2.4 (일반 설문/스펙체크 백엔드 연동 및 UI 고도화)
- **목적**: 상경계열 학생 대상 직무 적합도 검사 UI/UX 플로우 및 구현 가이드
- **핵심 구조**:
  - **직무 선택**: 대분류 8개 직무 추천 (마케팅, 인사, 브랜드, 전략, 재무, 영업, 데이터, 운영)
  - **스펙체크**: 선택한 대분류의 세부 직무 분석 (예: 마케팅 → 그로스/디지털/브랜드/콘텐츠/CRM/퍼포먼스)
- **관련 컴포넌트**:
  - `app/dashboard/career/page.tsx` (직무 선택 메인 - 대분류 직무 추천 및 선택)
  - `app/dashboard/spec-check/page.tsx` (스펙체크 메인)
  - `app/dashboard/spec-check/[jobId]/page.tsx` (스펙체크 설문 및 세부 직무 결과)
  - `components/CareerSurvey.tsx` (대분류 설문 공용 컴포넌트 - Career 페이지에서 동적 로드)
  - `components/CareerResult.tsx` (개별 결과 카드 컴포넌트 / 필요 시 재사용)

---

## 1. 사용자 플로우

### 1.1 전체 단계 (수정 완료 버전)
```
[방법 1: 학과 선택] ✅ 구현 완료
Step 1. 직무 선택 인트로 (/dashboard/career)
  → "학과로 직무 찾기" 카드 클릭
  
Step 2. 학과 드롭다운 선택
  → 상경계열 학과 선택 (6개 카테고리, 22개 학과)
  → 매칭 직무 미리보기 표시 (예: 경영학과 → 마케팅)
  → "저장하고 스펙체크 진행하기" 버튼 클릭
  
Step 3. 대분류 직무 자동 저장
  → 백엔드: POST /api/v1/career/save-major (현재 Mock)
  → 저장 완료 화면 표시 (✅ 애니메이션)
  → 2초 후 자동 리다이렉트: /dashboard/spec-check/[jobId]
  → 세부 직무 분석(스펙체크)으로 이동

[방법 2: 설문으로 추천] ✅ UI 구현 완료
Step 1. 직무 선택 인트로 (/dashboard/career)
  → "설문으로 추천받기" 카드 클릭

Step 2. 대분류 직무 설문 진행 (25~30문)
  → 목적: 마케팅, 인사, 브랜드, 전략기획, 재무, 영업, 데이터, 운영 중 적합한 직무 찾기
  → `components/CareerSurvey.tsx`를 동적 로드하여 `/public/data/survey-general.json` 기반 UI 제공
  → 응답은 `POST http://localhost:5000/api/v1/survey/submit`으로 전송 (survey_id: `survey-general`)
  → 백엔드가 선호/역량 Top3 + 추천 직무/인사이트를 계산하여 반환

Step 3. 대분류 직무 결과 화면 ✅ 수정 완료
  → 🥇 1순위 추천 직무 (보라색 대형 카드)
  → 🥈🥉 2-3순위 직무 (중형 카드)
  → 나머지 직무 목록 (접기/펼치기)
  → 각 직무별 "선택하고 스펙체크 하기" 버튼
  
Step 4. 대분류 직무 선택 및 저장 ✅ 구현 완료
  → 버튼 클릭 시: POST /api/v1/career/save-job (Mock)
  → 자동 리다이렉트: /dashboard/spec-check/[jobId]
  → 세부 직무 분석(스펙체크)으로 이동

[공통: 스펙체크 - 세부 직무 분석] ✅ 수정 완료
Step 5. 스펙체크 설문 (20문) (/dashboard/spec-check/[jobId])
  → URL 파라미터로 대분류 직무 자동 로드
  → 예: marketing → 그로스마케터, 디지털마케터, 브랜드마케터, 콘텐츠마케터, CRM마케터, 퍼포먼스마케터
  → 경험 기반 질문 20개 (마케팅 JSON 완료, 나머지 7개 대기)
  → Likert 5점 척도 (😐🙂😊😄🤩)
  
Step 6. 스펙체크 결과 - 세부 직무만 표시 ✅ 수정 완료
  → 제목: "세부 직무 역량 분석 완료!"
  → 상단: 전체 세부 직무 능력치 바 차트 (순위별 🥇🥈🥉)
    * 예: 그로스마케터 85.0, 디지털마케터 78.5, 브랜드마케터 72.3...
  → 좌측: 선호 기반 Top 3 (파란색 박스) - "하고 싶어하는 세부 직무"
  → 우측: 역량 기반 Top 3 (초록색 박스) - "잘할 수 있는 세부 직무"
  → 하단: 최종 추천 세부 직무 (보라색 강조)

Step 7. 활동 추천
  → "이 직무로 활동 추천받기 →" 버튼
  → 리다이렉트: /dashboard/recommendations (추후 연결)
```

**핵심 차이점:**
- **직무 선택 (설문)**: 대분류 8개 직무 중 선택 (마케팅, 인사, 브랜드, 전략, 재무, 영업, 데이터, 운영)
- **스펙체크**: 선택한 대분류의 세부 직무 분석 (예: 마케팅 → 그로스/디지털/브랜드/콘텐츠/CRM/퍼포먼스)

---

## 2. 화면별 상세 명세

### 2.1 직무 선택 인트로 화면
**파일**: `pages/dashboard/career.tsx` (인트로 섹션)

**구성 요소**:
- 제목: "나에게 맞는 직무를 찾아보세요"
- 설명: "상경계열 학생을 위한 직무 적합도 검사 (약 5-7분)"
- 옵션 1: "학과/관심 분야 입력" → 텍스트 입력 → 자동 점수 부여
- 옵션 2: "설문으로 추천받기" → Step 2로 이동

**UX 팁**:
- 옵션 1 선택 시: 입력한 키워드와 관련 직무에 보너스 점수(+20) 부여
- 옵션 2 권장 (정확도 높음)

---

### 2.2 일반 설문 화면 (`CareerSurvey.tsx`)

#### 디자인 요소
- **프로그레스 바**: 상단 고정, 퍼센트 표시
- **질문 카드**: 애니메이션(슬라이드), 그림자, 둥근 모서리(border-radius: 24px)
- **응답 버튼**:
  - Likert: 이모티콘(😐🙂😊😄🤩) + 숫자(1-5)
  - 선택형: 전체 너비 버튼, 선택 시 보라색 테두리
- **네비게이션**: 이전/다음 버튼 (하단 고정)

#### 상태 관리
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [answers, setAnswers] = useState<Record<string, any>>({});

// 진행 가능 여부 체크
const canProceed = () => {
  const answer = answers[currentQuestion.id];
  if (currentQuestion.optional) return true;
  return answer !== undefined && answer !== null;
};
```

> Career 메인 페이지에서는 Next.js `dynamic(() => import('@/components/CareerSurvey'), { ssr: false })`로 설문 컴포넌트를 불러오고, `onComplete`에서 백엔드 응답을 받아 viewMode를 `result`로 전환한다.

#### 제출 로직
```typescript
const surveySlug = 'survey-general';

const handleSubmit = async () => {
  const response = await fetch('http://localhost:5000/api/v1/survey/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      survey_id: surveySlug,
      answers,
    }),
  });

  if (!response.ok) throw new Error('설문 제출 실패');
  const result = await response.json();
  onComplete(result); // Career 페이지 viewMode=result
};
```

---

### 2.3 결과 화면 (`CareerResult.tsx`)

#### 레이아웃
```
┌────────────────────────────────────────┐
│   🎉 당신의 진로 분석 결과            │
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │  🎯 추천 직무: 마케팅          │ (중앙 강조)
│  │  종합 점수 80.6점              │
│  │  [스펙체크 시작하기 →]         │
│  └────────────────────────────────┘    │
├─────────────────┬──────────────────────┤
│  💝 선호도 Top3 │  🎯 역량 적합도 Top3 │
│  ┌─────────┐    │   ┌─────────┐        │
│  │ 1. 마케팅│    │   │ 1. 마케팅│        │
│  │   78.5%  │    │   │   82.0%  │        │
│  └─────────┘    │   └─────────┘        │
│  ... (2, 3)     │   ... (2, 3)         │
└─────────────────┴──────────────────────┘
```

#### 직무 카드 컴포넌트
```typescript
const renderJobCard = (job: JobScore, rank: number, type: 'preference' | 'fit') => (
  <motion.div
    className="bg-white rounded-3xl shadow-lg p-6 cursor-pointer hover:shadow-xl"
    onClick={() => onSelectJob(job.job_id)}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
        {rank}
      </div>
      <div className="text-4xl">{JOB_ICONS[job.job_id]}</div>
    </div>
    <h3 className="text-xl font-bold">{job.name}</h3>
    <div className="h-3 bg-gray-200 rounded-full">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ width: 0 }}
        animate={{ width: `${job.score}%` }}
      />
    </div>
  </motion.div>
);
```

#### 인터랙션
- **클릭**: 직무 카드 클릭 → 해당 직무 선택 → 스펙체크 설문으로 이동
- **호버**: 그림자 확대 (hover:shadow-xl)
- **애니메이션**: 카드별 순차 등장 (delay: rank * 0.1s)

---

### 2.4 스펙체크 설문 화면
**파일**: `app/dashboard/spec-check/[jobId]/page.tsx`

- 페이지 진입 시 `/public/data/spec-check-${jobId}.json`을 직접 fetch (직무별 20문항)
- 제출: `POST http://localhost:5000/api/v1/survey/spec-check/submit` (payload: `{ job_category, answers }`)
- 응답: `top_specializations`(전체 순위), `preference_top3`, `fit_top3`, `recommended_specialization`, `insights`
- 결과 화면에서는 세부 직무 바 차트 + Top3 카드 + 분석 인사이트 + 활동 추천 버튼을 렌더링

---

### 2.5 스펙체크 결과 화면
**구성**:
- 세부 직무 유형 3개 (바 차트)
- 각 유형별 설명 (툴팁 또는 아코디언)
- 최종 선택 버튼

**예시**:
```
┌────────────────────────────────────────┐
│  마케팅 직군 세부 직무 분석 결과      │
├────────────────────────────────────────┤
│  1️⃣ 그로스 마케터       85.0%  ████████│
│     → 데이터 기반 실험과 성장 최적화   │
│  2️⃣ 퍼포먼스 마케터     80.0%  ███████ │
│     → 광고 운영과 ROI 최적화           │
│  3️⃣ 콘텐츠 마케터       76.0%  ██████  │
│     → 콘텐츠 제작과 스토리텔링         │
├────────────────────────────────────────┤
│  [그로스 마케터 선택하고 활동 추천받기]│
└────────────────────────────────────────┘
```

---

## 3. 데이터 흐름

### 3.1 상태 관리 (Zustand 권장)
```typescript
// stores/careerStore.ts
import create from 'zustand';

interface CareerState {
  generalSurveyResult: SurveyResult | null;
  selectedJob: string | null;
  specCheckResult: SpecCheckResult | null;
  setGeneralSurveyResult: (result: SurveyResult) => void;
  setSelectedJob: (jobId: string) => void;
  setSpecCheckResult: (result: SpecCheckResult) => void;
}

export const useCareerStore = create<CareerState>((set) => ({
  generalSurveyResult: null,
  selectedJob: null,
  specCheckResult: null,
  setGeneralSurveyResult: (result) => set({ generalSurveyResult: result }),
  setSelectedJob: (jobId) => set({ selectedJob: jobId }),
  setSpecCheckResult: (result) => set({ specCheckResult: result }),
}));
```

### 3.2 페이지 라우팅
```
/dashboard/career              → 인트로
/dashboard/career/survey       → 일반 설문
/dashboard/career/result       → 결과 화면
/dashboard/career/spec-check   → 스펙체크 설문
/dashboard/career/spec-result  → 스펙체크 결과
/dashboard/career/activities   → 활동 추천
```

---

## 4. 디자인 시스템

### 4.1 컬러 팔레트
```css
/* 직무별 그라데이션 */
--marketing: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
--hr: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
--brand: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
--strategy: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
--finance: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
--sales: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
--data: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
--operations: linear-gradient(135deg, #6b7280 0%, #475569 100%);
```

### 4.2 타이포그래피
- **제목 (H1)**: 3xl (30px), font-bold
- **소제목 (H2)**: 2xl (24px), font-bold
- **카드 제목 (H3)**: xl (20px), font-semibold
- **본문**: base (16px), font-normal
- **캡션**: sm (14px), font-medium

### 4.3 간격 및 레이아웃
- **카드 간격**: space-y-4 (16px)
- **섹션 간격**: mb-8 (32px), mb-12 (48px)
- **여백**: px-4 (모바일), px-8 (데스크톱)
- **최대 너비**: max-w-3xl (설문), max-w-6xl (결과)

---

## 5. 반응형 디자인

### 5.1 브레이크포인트
```css
/* Tailwind 기준 */
sm: 640px   /* 모바일 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 화면 */
```

### 5.2 모바일 최적화
- **설문 카드**: 전체 너비, 세로 스크롤
- **결과 화면**: 선호도/적합도 카드를 세로 배치 (`grid-cols-1 md:grid-cols-2`)
- **버튼**: 터치 영역 최소 44x44px
- **텍스트**: 최소 14px (가독성)

---

## 6. 접근성 (A11y)

### 6.1 키보드 네비게이션
- **Tab**: 다음 버튼/응답 옵션 이동
- **Enter/Space**: 선택
- **Shift+Tab**: 이전 요소

### 6.2 스크린 리더
```tsx
<button
  aria-label={`${job.name} 직무 선택하기`}
  aria-pressed={selectedJob === job.job_id}
>
  {job.name}
</button>
```

### 6.3 색상 대비
- 텍스트 대비: 최소 4.5:1 (WCAG AA)
- 버튼: 포커스 링(focus:ring-2)

---

## 7. 성능 최적화

### 7.1 이미지 최적화
- 아이콘: 이모지 사용 (경량)
- 배경: CSS 그라데이션 (이미지 대신)

### 7.2 코드 스플리팅
```typescript
// pages/dashboard/career/index.tsx
import dynamic from 'next/dynamic';

const CareerSurvey = dynamic(() => import('@/components/CareerSurvey'), {
  loading: () => <LoadingSpinner />,
});
```

### 7.3 애니메이션
- `framer-motion` 사용
- `prefers-reduced-motion` 존중
```tsx
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## 8. 변경 사항 (v1 → v2)

### 추가된 화면
- 직무 선택 인트로
- 일반 설문 (25~30문)
- 결과 화면 (선호도/적합도 분리)
- 스펙체크 설문 (직무별 20문)
- 스펙체크 결과

### 기존 시스템과의 통합
- **v1 (진로봇)**: 활동 추천 단계에서 활용
- **v2 (설문)**: 직무 필터링 사전 단계

---

## 9. 테스트 시나리오

### 9.1 기능 테스트
- [ ] 설문 진행 (1번 → 30번)
- [ ] 중간 이탈 후 재진입 (답변 보존)
- [ ] 결과 화면 렌더링 (Top 3)
- [ ] 직무 선택 → 스펙체크 이동
- [ ] 스펙체크 완료 → 최종 결과

### 9.2 UX 테스트
- [ ] 모바일에서 터치 응답
- [ ] 프로그레스 바 정확도
- [ ] 애니메이션 부드러움
- [ ] 로딩 상태 표시

### 9.3 엣지 케이스
- [ ] 모든 질문 "보통"으로 응답 시
- [ ] 텍스트 입력 미작성 시 (optional)
- [ ] API 오류 시 에러 핸들링

---

## 10. 다음 단계

### Phase 1 (MVP)
- [x] CareerSurvey 컴포넌트
- [x] CareerResult 컴포넌트
- [ ] 페이지 통합 및 라우팅
- [ ] API 연동

### Phase 2
- [ ] 결과 저장 (localStorage/DB)
- [ ] 결과 공유 기능 (URL, 이미지)
- [ ] 재설문 기능 (히스토리 보관)

### Phase 3
- [ ] AI 기반 추가 질문 (adaptive)
- [ ] 활동 추천 연동 (v1 챗봇)
- [ ] 분석 대시보드 (통계)

---

## 11. 참고 문서
- `docs/logic.md` (기존 진로봇 로직)
- `backend/docs/prompt2.md` (백엔드 API 명세)
- `docs/prd.md` (전체 서비스 기획서)
