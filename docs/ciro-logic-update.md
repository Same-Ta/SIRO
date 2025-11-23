# CIRO 시스템 로직 - 헬스체크 & 팀 협업 (2024)

## 1. 헬스체크 시스템

### 개요
사용자가 매일 자신의 기분 또는 팀 건강 상태를 1~10 점수로 체크할 수 있는 기능입니다.

### 데이터 흐름
1. 사용자가 슬라이더를 조작하여 1~10 점수 선택
2. 변경 즉시 localStorage에 저장 (키: `healthCheck`)
3. 동시에 백엔드 API로 POST 요청 전송
4. 백엔드는 해당 사용자의 오늘 날짜 기준으로 upsert (있으면 업데이트, 없으면 삽입)

### 프론트엔드 구현 (`app/dashboard/reflections/page.tsx`)
```typescript
const [healthScore, setHealthScore] = useState<number>(5);

useEffect(() => {
  // localStorage에서 초기값 불러오기
  const saved = localStorage.getItem('healthCheck');
  if (saved) {
    setHealthScore(parseInt(saved));
  }
}, []);

const handleHealthChange = async (value: number) => {
  setHealthScore(value);
  localStorage.setItem('healthCheck', value.toString());
  
  try {
    const response = await fetch('http://localhost:5000/api/v1/health-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user123', // 실제로는 인증된 사용자 ID
        health_score: value,
        date: new Date().toISOString().split('T')[0]
      })
    });
  } catch (error) {
    console.error('Failed to save health check:', error);
  }
};
```

### UI 구성
- Slider 컴포넌트 (1~10 범위)
- 현재 선택된 점수 표시
- 실시간 저장 피드백 (에러 발생 시 콘솔 로그)

### 저장 전략
- **LocalStorage**: 오프라인 백업 및 빠른 UI 반영
- **Backend API**: 영구 저장 및 히스토리 추적

---

## 2. 팀 초대 모달 시스템

### 개요
프로젝트/팀에 멤버를 초대할 수 있는 모달 UI입니다. 이메일 입력 또는 초대 링크 복사 기능을 제공합니다.

### 데이터 흐름
1. 사용자가 "팀원 초대하기" 버튼 클릭
2. 모달 오픈 → 초대 링크 자동 생성 (현재: 임시 URL)
3. 이메일 입력 시 동적으로 입력 필드 추가 가능
4. "초대 보내기" 버튼 클릭 시 POST `/api/invites` (TODO: 이메일 서비스 연동)
5. "링크 복사" 버튼으로 Clipboard API를 통해 초대 링크 복사

### 프론트엔드 구현 (`components/TeamInviteModal.tsx`)
```typescript
const [emails, setEmails] = useState<string[]>(['']);
const [inviteLink] = useState('https://example.com/invite/project123');

const handleAddEmail = () => {
  setEmails([...emails, '']);
};

const handleCopyLink = async () => {
  await navigator.clipboard.writeText(inviteLink);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

const handleSendInvites = async () => {
  const validEmails = emails.filter(email => email.trim() !== '');
  // TODO: POST to /api/invites with email list
};
```

### UI 구성
- 모달 배경 (framer-motion 애니메이션)
- 초대 링크 표시 및 복사 버튼
- 동적 이메일 입력 필드 (+ 버튼으로 추가)
- 이메일 입력 유효성 검사 (비어있지 않은 이메일만 전송)

### 통합 위치
- `app/dashboard/reflections/page.tsx`의 Quick Actions 영역
- "팀원 초대하기" 버튼 클릭 시 모달 열림

---

## 3. 챗봇 초기화 가드 (중복 질문 방지)

### 문제 상황
React StrictMode에서 useEffect가 두 번 실행되어 첫 질문이 두 번 표시되는 버그 발생.

### 해결 방법
```typescript
const [initialized, setInitialized] = useState(false);

useEffect(() => {
  if (!initialized && selectedTemplate && messages.length === 0) {
    setInitialized(true);
    askNextQuestion();
  }
}, [initialized, selectedTemplate, messages.length]);
```

### 로직 설명
1. `initialized` 상태로 useEffect 실행 여부 추적
2. 이미 초기화된 경우 (`initialized === true`) 건너뜀
3. 템플릿 선택되고 메시지가 비어있을 때만 첫 질문 시작
4. 개발 모드 StrictMode에서도 단 한 번만 실행됨

---

## 4. UI 통합 (경험정리 카테고리)

### 변경 내용
**기존**: "나의 회고", "템플릿" 두 개의 별도 메뉴 항목

**변경 후**: "경험정리" 단일 카테고리로 통합

### 구현 (`app/dashboard/layout.tsx`)
```typescript
{
  name: "경험정리",
  icon: FileText,
  href: "/dashboard/reflections",
  active: pathname.startsWith('/dashboard/reflections')
}
```

### 하위 경로
- `/dashboard/reflections`: 메인 허브 (헬스체크 + 빠른 액션)
- `/dashboard/reflections/survey`: 설문 시작
- `/dashboard/reflections/template-recommendation`: 템플릿 추천 결과
- `/dashboard/reflections/chatbot`: 챗봇형 회고 진행
- `/dashboard/reflections/result`: 역량 분석 결과

### 활성 상태 표시
`pathname.startsWith('/dashboard/reflections')`로 모든 하위 경로에서 사이드바 메뉴 활성화

---

## 5. "초라이트 기록" 제거 및 레이아웃 조정

### 변경 내용
- 기존 3개 카드 (나의 회고, 템플릿, 초라이트 기록) → 2개 카드로 축소
- "초라이트 기록" 카드 완전 제거
- 그리드 레이아웃 `grid-cols-3` → `grid-cols-2`

### Quick Actions 영역 최종 구성
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 경험 기록 시작하기 */}
  <Link href="/dashboard/reflections/survey">
    <div className="card hover:shadow-lg transition-all">
      시작하기 버튼
    </div>
  </Link>

  {/* 팀원 초대하기 */}
  <div onClick={() => setShowInviteModal(true)} className="card hover:shadow-lg transition-all cursor-pointer">
    초대 버튼
  </div>
</div>
```

### UI 개선 효과
- 더 넓은 카드 크기로 가독성 향상
- 팀 협업 기능 강조 (헬스체크 + 팀 초대)
- 단순화된 인터페이스로 사용자 선택 집중도 향상

---

## 6. 설문 → 템플릿 추천 → 챗봇 → 결과 플로우

### 전체 플로우
1. **설문 단계** (`/survey`)
   - 4개 질문 (목적, 규모, 시간, 선호도)
   - 진행률 표시바 (1/4, 2/4, 3/4, 4/4)
   - URL 쿼리로 답변 전달

2. **템플릿 추천** (`/template-recommendation`)
   - 설문 답변 기반 규칙 엔진
   - 2~3개 템플릿 추천 (STAR, 5F, KPT, 4L, PMI)
   - 각 템플릿 추천 이유 표시

3. **챗봇 회고** (`/chatbot`)
   - 선택한 템플릿의 질문 순차 제시
   - 실시간 타이핑 애니메이션
   - 답변 저장 → 다음 질문
   - 역량 키워드 자동 추출 (25개 카테고리)

4. **결과 분석** (`/result`)
   - Top 5 역량 표시 (점수 순)
   - 각 역량별 매칭 키워드 표시
   - 전체 회고 내용 요약

### 데이터 저장 방식
- Survey → URL 쿼리 파라미터
- Chatbot 답변 → sessionStorage (`reflectionData`)
- 결과 페이지 → sessionStorage 읽기

### 역량 추출 알고리즘
```typescript
const extractCompetencies = (answers: string[]) => {
  const competencyScores: Record<string, { score: number; keywords: string[] }> = {};
  
  answers.forEach(answer => {
    const lowerAnswer = answer.toLowerCase();
    
    Object.entries(competencyKeywords).forEach(([competency, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerAnswer.includes(keyword.toLowerCase())) {
          if (!competencyScores[competency]) {
            competencyScores[competency] = { score: 0, keywords: [] };
          }
          competencyScores[competency].score += 1;
          if (!competencyScores[competency].keywords.includes(keyword)) {
            competencyScores[competency].keywords.push(keyword);
          }
        }
      });
    });
  });
  
  return Object.entries(competencyScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 5);
};
```

---

## 7. VS Code 개발 자동화

### F5 디버깅 설정 (`.vscode/launch.json`)
```json
{
  "name": "Python: FastAPI Backend",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--reload", "--port", "5000"],
  "cwd": "${workspaceFolder}/backend",
  "envFile": "${workspaceFolder}/backend/.env"
}
```

### 멀티 서버 실행 (`.vscode/tasks.json`)
```json
{
  "label": "Run Frontend and Backend",
  "dependsOn": ["Run Frontend", "Run Backend"],
  "problemMatcher": []
}
```

### 사용 방법
- **F5**: 백엔드 디버깅 모드로 시작
- **터미널 → Run Task → Run Frontend and Backend**: 양쪽 서버 동시 실행

---

## 8. 환경 변수 구성

### Frontend (`.env.local`)
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 주의사항
- Pydantic ValidationError 방지를 위해 `launch.json`에 `envFile` 경로 명시
- `.env` 파일은 `.gitignore`에 포함 (보안)
