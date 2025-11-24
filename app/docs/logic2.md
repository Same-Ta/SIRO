# CIRO 프론트엔드 시스템 로직 문서 (v2.0)

## 📋 문서 정보
- **작성일**: 2025-11-23
- **버전**: 2.0 (최신 통합 버전)
- **목적**: CIRO 프론트엔드의 주요 로직 및 컴포넌트 구조 문서화
- **기술 스택**: Next.js 14, React, TypeScript, TanStack Query, Tailwind CSS

---

## 1. 프로젝트 구조

```
app/
├── dashboard/              # 메인 대시보드
│   ├── page.tsx           # 대시보드 홈
│   ├── layout.tsx         # 대시보드 레이아웃
│   ├── career/            # 진로 탐색
│   │   └── page.tsx       # 직무 설문 페이지
│   ├── reflection-home/   # 회고 홈
│   │   └── page.tsx       # 회고 대시보드
│   ├── reflections/       # 회고 관리
│   │   ├── page.tsx       # 회고 목록
│   │   └── survey/        # 회고 설문
│   ├── recommendations/   # 활동 추천
│   │   └── page.tsx       # 추천 활동 목록
│   └── spaces/            # 스페이스 관리
│       ├── page.tsx       # 스페이스 목록
│       └── new/           # 새 스페이스 생성
├── api/                   # API 라우트
│   └── gemini/           # Gemini AI 통합
│       └── career-analyze/
└── layout.tsx            # 루트 레이아웃

components/
├── CareerResult.tsx      # 직무 설문 결과
├── CareerSurvey.tsx      # 직무 설문 UI
├── CareerBot.tsx         # AI 진로봇
├── JobResult.tsx         # 직무 결과 표시
├── JobSimulation.tsx     # 직무 시뮬레이션
└── TeamInviteModal.tsx   # 팀 초대 모달

lib/
├── api/                  # API 클라이언트
│   └── reflections.ts    # 회고 API
└── api.ts               # Axios 인스턴스
```

---

## 2. 대시보드 (Dashboard)

### 2.1 대시보드 홈 (`app/dashboard/page.tsx`)

**목적**: 사용자의 공고 및 활동 현황 표시

**주요 기능**:
- 현재 진행중인 공고 카드 그리드
- 모든 공고 리스트 뷰
- 새 스페이스 생성 버튼

**데이터 구조**:
```typescript
interface LogData {
  id: number;
  project: string;
  title: string;
  date: string;
  period: string;
  keywords: string[];
}
```

**UI 컴포넌트**:
- **공고 카드**: 프로젝트 배지, 날짜, 제목, 기간, 키워드 태그
- **키워드 색상**: 3가지 색상 테마 순환 (파란색/보라색/노란색)

---

### 2.2 레이아웃 (`app/dashboard/layout.tsx`)

**목적**: 대시보드 공통 레이아웃 및 사이드바 네비게이션

**네비게이션 메뉴**:
```typescript
const menuItems = [
  { href: '/dashboard', label: '홈', icon: '🏠' },
  { href: '/dashboard/career', label: '진로 탐색', icon: '🎯' },
  { href: '/dashboard/reflection-home', label: '회고 홈', icon: '📝' },
  { href: '/dashboard/reflections', label: '회고 관리', icon: '📊' },
  { href: '/dashboard/recommendations', label: '활동 추천', icon: '✨' },
  { href: '/dashboard/spaces', label: '스페이스', icon: '🚀' }
];
```

**반응형 디자인**:
- 데스크탑: 사이드바 고정
- 모바일: 햄버거 메뉴 토글

---

## 3. 진로 탐색 (Career)

### 3.1 직무 설문 (`app/dashboard/career/page.tsx`)

**목적**: 8개 대분류 직무 적합도 분석 설문

**상태 관리**:
```typescript
const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
const [currentStep, setCurrentStep] = useState(0);
const [answers, setAnswers] = useState<Record<string, any>>({});
const [showResults, setShowResults] = useState(false);
const [result, setResult] = useState<SurveyResult | null>(null);
```

**플로우**:
1. **설문 데이터 로드**: `/data/survey-general.json` 또는 API
2. **질문 단계별 진행**: Likert/선택형 질문 응답
3. **설문 제출**: `POST /api/v1/survey/submit`
4. **결과 표시**: `<CareerResult>` 컴포넌트

**질문 타입 처리**:
```typescript
// Likert 응답 (1-5)
if (question.type === 'likert') {
  return <LikertScale value={answer} onChange={handleAnswer} />;
}

// 단일 선택
if (question.type === 'single_choice') {
  return <RadioGroup options={question.options} onChange={handleAnswer} />;
}

// 다중 선택
if (question.type === 'multiple_choice') {
  return <CheckboxGroup options={question.options} onChange={handleAnswer} />;
}
```

**로컬스토리지 저장**:
```typescript
// 추천 직무를 스펙체크에서 사용하기 위해 저장
useEffect(() => {
  if (result?.recommended_job?.job_id) {
    localStorage.setItem('recommended_job', result.recommended_job.job_id);
  }
}, [result]);
```

---

### 3.2 직무 결과 (`components/CareerResult.tsx`)

**Props**:
```typescript
interface CareerResultProps {
  result: SurveyResult;
  onSelectJob: (jobId: string) => void;
  onBack?: () => void;
}
```

**UI 구성**:
1. **추천 직무 카드**: 1순위 직무 강조 표시
2. **선호도 Top 3**: 사용자가 관심있는 직무
3. **적합도 Top 3**: 역량 기반 추천 직무
4. **직무별 색상 테마**: 직무마다 고유한 그라데이션

**애니메이션**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: rank * 0.1 }}
>
  {/* 점수 바 애니메이션 */}
  <motion.div
    className="h-full bg-gradient-to-r"
    initial={{ width: 0 }}
    animate={{ width: `${score}%` }}
    transition={{ duration: 0.8 }}
  />
</motion.div>
```

---

### 3.3 스펙체크 (`components/CareerSurvey.tsx`)

**목적**: 선택한 대분류 직무의 세부 직무 유형 판별

**플로우**:
1. **직무 선택 후 진입**: `localStorage`에서 선택한 직무 확인
2. **스펙체크 설문 로드**: `GET /api/v1/survey/spec-check/{job_category}`
3. **20문항 응답**: 경험 기반 질문
4. **결과 제출**: `POST /api/v1/survey/spec-check/submit`
5. **세부 직무 결과**: 그로스/디지털/브랜드 등 세부 유형 표시

**예시 (마케팅 스펙체크)**:
```typescript
// 세부 직무 유형
const subtypes = {
  growth: '그로스 마케터',
  performance: '퍼포먼스 마케터',
  digital: '디지털 마케터',
  brand: '브랜드 마케터',
  content: '콘텐츠 마케터',
  crm: 'CRM/리텐션 마케터'
};
```

---

### 3.4 직무 시뮬레이션 (`components/JobSimulation.tsx`)

**목적**: AI 기반 직무 체험 챗봇

**상태 관리**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isTyping, setIsTyping] = useState(false);
const [currentQuestion, setCurrentQuestion] = useState(0);
```

**AI 대화 플로우**:
1. 사용자가 관심 직무 선택
2. AI가 실무 상황 질문 제시
3. 사용자 답변 수집 (5-10문항)
4. 최종 직무 적합도 분석

**API 호출**:
```typescript
// 시뮬레이션 시작
await fetch('/api/v1/job-simulation/start', {
  method: 'POST',
  body: JSON.stringify({ job_id: selectedJob })
});

// 답변 제출
await fetch('/api/v1/job-simulation/submit', {
  method: 'POST',
  body: JSON.stringify({ answers })
});
```

---

## 4. 회고 시스템 (Reflections)

### 4.1 회고 홈 (`app/dashboard/reflection-home/page.tsx`)

**목적**: 회고 대시보드 - 최근 회고 및 진행중인 스페이스 표시

**데이터 조회**:
```typescript
// 최근 회고 목록
const { data: recentReflections } = useQuery({
  queryKey: ['recent-reflections'],
  queryFn: async () => {
    const response = await fetch('/api/reflections?limit=3', {
      headers: { 'x-user-id': localStorage.getItem('x-user-id') || '' }
    });
    return response.json();
  }
});

// 활성 스페이스
const { data: activeSpaces } = useQuery({
  queryKey: ['active-spaces'],
  queryFn: async () => {
    const response = await fetch('/api/projects?status=active&limit=4', {
      headers: { 'x-user-id': localStorage.getItem('x-user-id') || '' }
    });
    return response.json();
  }
});

// 성장 통계
const { data: growthStats } = useQuery({
  queryKey: ['growth-stats'],
  queryFn: async () => {
    const response = await fetch('/api/dashboard/stats', {
      headers: { 'x-user-id': localStorage.getItem('x-user-id') || '' }
    });
    return response.json();
  }
});
```

**UI 컴포넌트**:
- **통계 카드**: 총 회고 수, 연속 작성일, 완료된 활동
- **최근 회고 카드**: 기분 이모지, 스페이스명, 작성일
- **진행중인 스페이스**: 다음 회고 날짜, 진행률 바

---

### 4.2 회고 목록 (`app/dashboard/reflections/page.tsx`)

**목적**: 전체 회고 목록 및 필터링

**필터 옵션**:
```typescript
const [filters, setFilters] = useState({
  log_id: '',
  cycle: 'all',
  start_date: '',
  end_date: '',
  mood: 'all'
});
```

**회고 카드 UI**:
```typescript
interface ReflectionCard {
  id: string;
  space_name: string;
  activity_type: 'contest' | 'project' | 'study' | 'etc';
  mood: 'happy' | 'neutral' | 'sad';
  progress_score: number;
  reflection_date: string;
  keywords: string[];
}
```

**활동 유형 아이콘 매핑**:
```typescript
const activityTypeMap = {
  contest: { icon: '🏆', label: '공모전' },
  club: { icon: '👥', label: '동아리' },
  project: { icon: '💻', label: '프로젝트' },
  internship: { icon: '💼', label: '인턴' },
  study: { icon: '📚', label: '학습' },
  etc: { icon: '✨', label: '활동' }
};
```

---

### 4.3 회고 설문 (`app/dashboard/reflections/survey/page.tsx`)

**목적**: 회고 작성 전 설문을 통한 템플릿 추천

**설문 질문 예시**:
```typescript
const surveyQuestions = [
  {
    id: 'reflection_depth',
    question: '이번 회고에서 어떤 것을 중점적으로 돌아보고 싶나요?',
    options: [
      { value: 'achievement', label: '성과와 달성한 것' },
      { value: 'learning', label: '배운 점과 성장' },
      { value: 'challenge', label: '어려움과 극복 과정' },
      { value: 'collaboration', label: '팀워크와 협업' }
    ]
  },
  {
    id: 'reflection_time',
    question: '회고 작성에 얼마나 시간을 투자하고 싶나요?',
    options: [
      { value: 'quick', label: '빠르게 (5분 이내)' },
      { value: 'moderate', label: '적당하게 (10-15분)' },
      { value: 'deep', label: '깊이있게 (20분 이상)' }
    ]
  }
];
```

**템플릿 추천 로직**:
```typescript
function recommendTemplate(answers: Record<string, string>) {
  if (answers.reflection_depth === 'achievement' && answers.reflection_time === 'quick') {
    return 'daily-log';
  }
  if (answers.reflection_depth === 'learning') {
    return 'growth-focused';
  }
  if (answers.reflection_depth === 'challenge') {
    return 'problem-solving';
  }
  return 'comprehensive';
}
```

---

## 5. 활동 추천 (Recommendations)

### 5.1 추천 활동 페이지 (`app/dashboard/recommendations/page.tsx`)

**목적**: 맞춤 활동 추천 및 관리

**상태 관리**:
```typescript
const [selectedCategory, setSelectedCategory] = useState('all');
const [selectedField, setSelectedField] = useState('all');
const [sortBy, setSortBy] = useState('match_score');
const [searchQuery, setSearchQuery] = useState('');
```

**활동 조회 (TanStack Query)**:
```typescript
const { data: activitiesData, isLoading, error } = useQuery({
  queryKey: ['recommendations', selectedCategory, selectedField, sortBy, searchQuery],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedField !== 'all') params.append('field', selectedField);
    params.append('sort', sortBy);
    if (searchQuery) params.append('search', searchQuery);
    
    const response = await fetch(`/api/v1/recommendations/activities?${params}`);
    return response.json();
  }
});
```

**필터 UI**:
```typescript
const categories = [
  { value: 'all', label: '전체' },
  { value: 'contest', label: '공모전' },
  { value: 'internship', label: '인턴십' },
  { value: 'project', label: '프로젝트' },
  { value: 'study', label: '학습' }
];

const sortOptions = [
  { value: 'match_score', label: '매칭도 순' },
  { value: 'deadline', label: '마감일 순' },
  { value: 'recent', label: '최신 순' }
];
```

**활동 카드 UI**:
```typescript
interface ActivityCard {
  id: string;
  title: string;
  category: string;
  field: string;
  match_score: number;
  deadline: string;
  days_left: number;
  tags: string[];
  bookmarked: boolean;
}
```

**북마크 기능**:
```typescript
const bookmarkMutation = useMutation({
  mutationFn: async (activityId: string) => {
    const response = await fetch(`/api/v1/recommendations/activities/${activityId}/bookmark`, {
      method: 'POST',
      headers: { 'x-user-id': localStorage.getItem('x-user-id') || '' }
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['recommendations']);
  }
});
```

---

### 5.2 진로봇 통합

**목적**: 추천 페이지 내 AI 진로 상담 모달

**모달 트리거**:
```typescript
const [showSimulation, setShowSimulation] = useState(false);

<button onClick={() => setShowSimulation(true)}>
  🤖 AI 진로봇과 상담하기
</button>

{showSimulation && (
  <JobSimulation
    onClose={() => setShowSimulation(false)}
    onComplete={(result) => {
      setSimulationResult(result);
      setShowResult(true);
    }}
  />
)}
```

---

## 6. 스페이스 관리 (Spaces)

### 6.1 스페이스 목록 (`app/dashboard/spaces/page.tsx`)

**목적**: 사용자의 회고 스페이스 관리

**스페이스 카드 정보**:
```typescript
interface SpaceCard {
  id: string;
  name: string;
  type: 'contest' | 'project' | 'study';
  reflection_cycle: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  next_reflection_date: string;
  total_reflections: number;
  expected_reflections: number;
  progress: number; // total / expected * 100
  status: 'active' | 'completed' | 'archived';
}
```

**진행률 바**:
```typescript
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-green-500 h-2 rounded-full transition-all"
    style={{ width: `${(space.total_reflections / space.expected_reflections) * 100}%` }}
  />
</div>
```

---

### 6.2 새 스페이스 생성 (`app/dashboard/spaces/new/page.tsx`)

**폼 필드**:
```typescript
interface SpaceForm {
  name: string;
  type: 'contest' | 'project' | 'internship' | 'study' | 'etc';
  description: string;
  start_date: string;
  end_date: string;
  reflection_cycle: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  reminder_enabled: boolean;
}
```

**제출 로직**:
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const response = await fetch('/api/v1/spaces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('x-user-id') || ''
    },
    body: JSON.stringify(formData)
  });
  
  if (response.ok) {
    router.push('/dashboard/spaces');
  }
};
```

**주기 추천 버튼**:
```typescript
<button onClick={async () => {
  const response = await fetch('/api/v1/spaces/recommend-cycle', {
    method: 'POST',
    body: JSON.stringify({
      type: formData.type,
      duration_days: calculateDays(formData.start_date, formData.end_date),
      activity_intensity: 'medium'
    })
  });
  const { recommended_cycle } = await response.json();
  setFormData({ ...formData, reflection_cycle: recommended_cycle });
}}>
  🤖 AI 추천 받기
</button>
```

---

## 7. API 통합 (lib/api/)

### 7.1 Axios 인스턴스 (`lib/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터: 인증 토큰 자동 추가
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('x-user-id');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 7.2 회고 API (`lib/api/reflections.ts`)

```typescript
import api from '../api';

export const recommendationsApi = {
  // 추천 활동 목록
  getActivities: async (params?: {
    type?: string;
    category?: string;
    level?: string;
    limit?: number;
  }) => {
    const response = await api.get('/recommendations/activities', { params });
    return response.data;
  },

  // 활동 북마크
  bookmarkActivity: async (id: string) => {
    const response = await api.post(`/recommendations/activities/${id}/bookmark`);
    return response.data;
  },

  // 북마크 삭제
  unbookmarkActivity: async (id: string) => {
    const response = await api.delete(`/recommendations/activities/${id}/bookmark`);
    return response.data;
  },

  // 북마크 목록
  getBookmarks: async () => {
    const response = await api.get('/recommendations/bookmarks');
    return response.data;
  }
};

export const reflectionsApi = {
  // 회고 목록
  getAll: async (params?: {
    log_id?: string;
    cycle?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    const response = await api.get('/reflections', { params });
    return response.data;
  },

  // 회고 작성
  create: async (data: {
    log_id?: string;
    project_id?: string;
    cycle: string;
    content: string;
    answers?: { question: string; answer: string }[];
    mood: string;
    progress_score?: number;
  }) => {
    const response = await api.post('/reflections', data);
    return response.data;
  },

  // 회고 삭제
  delete: async (id: string) => {
    const response = await api.delete(`/reflections/${id}`);
    return response.data;
  }
};
```

---

## 8. 상태 관리

### 8.1 TanStack Query 설정

**Provider 설정** (`app/providers.tsx`):
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        cacheTime: 5 * 60 * 1000, // 5분
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

### 8.2 로컬스토리지 사용

**사용자 ID 저장**:
```typescript
// 로그인 시
localStorage.setItem('x-user-id', userId);

// API 요청 시
const userId = localStorage.getItem('x-user-id');
```

**설문 결과 캐싱**:
```typescript
// 직무 설문 결과 저장
localStorage.setItem('recommended_job', jobId);

// 스펙체크에서 불러오기
const recommendedJob = localStorage.getItem('recommended_job');
```

---

## 9. 스타일링 및 UI

### 9.1 Tailwind CSS 클래스 시스템

**색상 팔레트**:
```typescript
const colors = {
  primary: '#25A778',      // 메인 그린
  primaryDark: '#186D50',  // 다크 그린
  primaryLight: '#2DC98E', // 라이트 그린
  secondary: '#DDF3EB',    // 라이트 그린 배경
  text: '#1B1C1E',         // 다크 텍스트
  textLight: '#6B6D70',    // 라이트 텍스트
  border: '#EAEBEC',       // 보더 색상
  background: '#F1F2F3'    // 배경 색상
};
```

**자주 사용하는 컴포넌트 클래스**:
```css
/* 카드 */
.card {
  @apply bg-white rounded-[16px] p-5 border border-[#EAEBEC] 
         hover:border-[#25A778] transition-all cursor-pointer;
}

/* 버튼 - Primary */
.btn-primary {
  @apply px-4 py-2 bg-[#25A778] text-white rounded-[12px] 
         text-sm font-bold hover:bg-[#2DC98E] transition-all;
}

/* 버튼 - Secondary */
.btn-secondary {
  @apply px-4 py-2 bg-white border border-[#EAEBEC] rounded-[12px] 
         text-sm font-medium text-[#1B1C1E] hover:border-[#25A778] transition-all;
}

/* 배지 */
.badge {
  @apply inline-block px-2.5 py-1 bg-[#DDF3EB] text-[#186D50] 
         rounded-[6px] text-xs font-bold;
}
```

---

### 9.2 애니메이션 (Framer Motion)

**페이드인 애니메이션**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* 콘텐츠 */}
</motion.div>
```

**스태거 애니메이션**:
```typescript
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="visible"
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

---

## 10. 에러 처리 및 로딩 상태

### 10.1 로딩 스피너

```typescript
{isLoading && (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25A778]" />
  </div>
)}
```

---

### 10.2 에러 메시지

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <p className="text-red-800 font-medium">오류가 발생했습니다</p>
    <p className="text-red-600 text-sm mt-1">{error.message}</p>
  </div>
)}
```

---

### 10.3 빈 상태 (Empty State)

```typescript
{data?.length === 0 && (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📭</div>
    <p className="text-lg font-medium text-[#1B1C1E] mb-2">
      아직 회고가 없습니다
    </p>
    <p className="text-sm text-[#6B6D70] mb-6">
      첫 회고를 작성해보세요!
    </p>
    <button className="btn-primary">
      회고 작성하기
    </button>
  </div>
)}
```

---

## 11. 성능 최적화

### 11.1 이미지 최적화

```typescript
import Image from 'next/image';

<Image
  src="/images/icon.png"
  alt="아이콘"
  width={24}
  height={24}
  priority // 중요 이미지
/>
```

---

### 11.2 코드 스플리팅

```typescript
import dynamic from 'next/dynamic';

// 모달은 필요할 때만 로드
const TeamInviteModal = dynamic(() => import('@/components/TeamInviteModal'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

---

### 11.3 메모이제이션

```typescript
import { useMemo, useCallback } from 'react';

// 비용이 큰 계산 메모이제이션
const filteredActivities = useMemo(() => {
  return activities.filter(activity => 
    activity.category === selectedCategory
  );
}, [activities, selectedCategory]);

// 콜백 메모이제이션
const handleBookmark = useCallback((id: string) => {
  bookmarkMutation.mutate(id);
}, [bookmarkMutation]);
```

---

## 12. 배포 및 환경 설정

### 12.1 환경 변수 (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
```

---

### 12.2 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
```

**포트 변경** (`package.json`):
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

---

## 13. 참고 문서
- `backend/docs/logic2.md`: 백엔드 API 로직
- `backend/docs/prompt2.md`: AI 프롬프트 명세
- Next.js 14 공식 문서: https://nextjs.org/docs
