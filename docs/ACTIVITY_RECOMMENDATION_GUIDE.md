# 대외활동 추천 시스템 API 가이드

## 📋 목차
1. [개요](#개요)
2. [시스템 구조](#시스템-구조)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [크롤링 실행](#크롤링-실행)
5. [API 엔드포인트](#api-엔드포인트)
6. [TypeScript 타입 정의](#typescript-타입-정의)
7. [React 컴포넌트 예제](#react-컴포넌트-예제)
8. [추천 알고리즘](#추천-알고리즘)
9. [구현 체크리스트](#구현-체크리스트)

---

## 개요

공모전/대외활동/프로젝트를 크롤링하여 데이터베이스에 저장하고, 사용자의 **직무/관심사 기반 맞춤 추천**을 제공하는 시스템입니다.

### 주요 기능
- ✅ **자동 크롤링**: 위비티, 링커리어, 씽굿 등 대외활동 사이트 크롤링
- ✅ **직무 자동 분류**: 제목/설명 분석하여 직무별 자동 태깅
- ✅ **맞춤 추천**: 사용자 프로필(직무, 관심사) 기반 매칭 알고리즘
- ✅ **북마크/지원 관리**: 관심 활동 저장 및 지원 현황 추적
- ✅ **필터링/검색**: 카테고리, 직무, 태그별 검색

---

## 시스템 구조

```
┌─────────────────┐
│ 크롤링 스크립트   │ (scripts/crawl_activities.py)
│  - 위비티        │
│  - 링커리어      │  
│  - 씽굿         │
└────────┬────────┘
         │ 크롤링 데이터
         ↓
┌─────────────────┐
│   Supabase DB   │
│  activities     │ (공모전/대외활동 정보)
│  user_bookmarks │ (사용자 북마크)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  FastAPI 백엔드  │
│  추천 알고리즘   │ (매칭 점수 계산)
└────────┬────────┘
         │ REST API
         ↓
┌─────────────────┐
│ Next.js 프론트   │
│  - 활동 목록     │
│  - 맞춤 추천     │
│  - 북마크 관리   │
└─────────────────┘
```

---

## 데이터베이스 스키마

### 1. `activities` 테이블

공모전/대외활동 정보를 저장하는 메인 테이블입니다.

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                    -- 활동명
    organization TEXT NOT NULL,             -- 주최 기관
    category TEXT NOT NULL,                 -- contest, external_activity, internship 등
    target_jobs TEXT[] DEFAULT '{}',        -- 관련 직무 배열 ["전략기획", "마케팅"]
    tags TEXT[] DEFAULT '{}',               -- 태그 배열 ["대학생", "무료", "온라인"]
    description TEXT,                       -- 활동 설명
    benefits TEXT,                          -- 혜택 (상금, 수료증 등)
    eligibility TEXT,                       -- 지원 자격
    start_date DATE,                        -- 활동 시작일
    end_date DATE,                          -- 활동 종료일
    application_start DATE,                 -- 접수 시작일
    application_end DATE,                   -- 접수 마감일
    url TEXT,                               -- 활동 URL (중복 체크 키)
    image_url TEXT,                         -- 포스터 이미지
    contact_info TEXT,                      -- 연락처
    location TEXT,                          -- 장소/지역
    is_active BOOLEAN DEFAULT TRUE,         -- 활성 상태
    view_count INTEGER DEFAULT 0,           -- 조회수
    bookmark_count INTEGER DEFAULT 0,       -- 북마크 수
    source_site TEXT,                       -- 크롤링 출처 (wevity, linkareer 등)
    scraped_at TIMESTAMPTZ DEFAULT NOW(),   -- 크롤링 시각
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_target_jobs ON activities USING GIN(target_jobs);
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX idx_activities_is_active ON activities(is_active);
CREATE INDEX idx_activities_application_end ON activities(application_end DESC) 
    WHERE is_active = TRUE;
```

### 2. `user_activity_bookmarks` 테이블

사용자가 북마크한 활동 정보입니다.

```sql
CREATE TABLE user_activity_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- 인덱스
CREATE INDEX idx_user_bookmarks_user_id ON user_activity_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_activity_id ON user_activity_bookmarks(activity_id);
```

### 카테고리 종류

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| `contest` | 공모전 | 마케팅 공모전, 창업 아이디어 공모전 |
| `external_activity` | 대외활동 | 마케팅 서포터즈, 체험단 |
| `project` | 프로젝트 | 연구 프로젝트, 팀 프로젝트 |
| `club` | 동아리/학회 | 학술 동아리, 창업 학회 |
| `volunteer` | 봉사활동 | 재능기부, 사회공헌 |
| `internship` | 인턴십 | 단기 인턴, 체험형 인턴 |

### 직무 종류

```typescript
type TargetJob = 
  | "전략기획"
  | "마케팅" 
  | "데이터분석"
  | "개발"
  | "디자인"
  | "영업"
  | "인사"
  | "재무"
  | "기타";
```

---

## 크롤링 실행

### 1. 크롤링 스크립트 실행

```bash
# 가상환경 활성화
cd c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\back
.\venv\Scripts\Activate.ps1

# 크롤링 실행
python scripts/crawl_activities.py
```

### 2. 크롤링 스크립트 구조

```python
# scripts/crawl_activities.py

class ActivityCrawler:
    def __init__(self):
        self.supabase = get_supabase()
        
    def crawl_wevity(self) -> List[Dict]:
        """위비티 공모전 크롤링"""
        # 실제 구현 시 BeautifulSoup 사용
        pass
    
    def crawl_linkareer(self) -> List[Dict]:
        """링커리어 대외활동 크롤링"""
        pass
    
    def categorize_by_job(self, title: str, description: str) -> List[str]:
        """제목과 설명을 분석하여 관련 직무 추출"""
        # "마케팅", "전략" 키워드 → ["마케팅", "전략기획"]
        pass
    
    def save_to_supabase(self, activities: List[Dict]):
        """크롤링 데이터를 Supabase에 저장"""
        # URL 기준 중복 체크 후 upsert
        pass
```

### 3. 정기 실행 (옵션)

Windows 작업 스케줄러 또는 GitHub Actions로 매일 자동 크롤링 가능:

```yaml
# .github/workflows/crawl.yml (예시)
name: Daily Crawl
on:
  schedule:
    - cron: '0 9 * * *'  # 매일 오전 9시 (UTC)
jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run crawler
        run: python scripts/crawl_activities.py
```

---

## API 엔드포인트

### 기본 정보

- **Base URL**: `http://localhost:8000` (개발) / `https://api.yourapp.com` (프로덕션)
- **인증**: Bearer Token (JWT) 또는 `x-user-id` 헤더
- **응답 형식**: JSON

```typescript
// 공통 응답 형식
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

---

### 1. 맞춤 추천 활동 조회

사용자의 직무/관심사 기반으로 매칭 점수가 높은 활동을 추천합니다.

```http
GET /api/recommendations/activities
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | string | ❌ | contest, external_activity 등 |
| `limit` | number | ❌ | 최대 개수 (기본: 10, 최대: 50) |
| `sort` | string | ❌ | match_score (기본), deadline, popular |

**Request Example**

```typescript
const response = await fetch('http://localhost:8000/api/recommendations/activities?limit=20&sort=match_score', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    // 또는
    'x-user-id': userId
  }
});
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "activity": {
          "id": "uuid",
          "title": "2025 대학생 마케팅 공모전",
          "organization": "○○기업",
          "category": "contest",
          "target_jobs": ["마케팅", "전략기획"],
          "tags": ["대학생", "마케팅", "공모전", "수상"],
          "description": "대학생을 대상으로 한 마케팅 전략 공모전입니다...",
          "benefits": "대상 500만원, 최우수상 300만원, 우수상 100만원",
          "eligibility": "전국 4년제 대학생 (휴학생 포함)",
          "start_date": null,
          "end_date": null,
          "application_start": "2025-01-01",
          "application_end": "2025-02-28",
          "url": "https://www.wevity.com/sample1",
          "image_url": null,
          "location": null,
          "view_count": 125,
          "bookmark_count": 34,
          "is_bookmarked": false
        },
        "match_score": 0.8,
        "match_reasons": [
          "'마케팅' 직무와 일치합니다",
          "관심사와 일치: 마케팅, 전략",
          "마감 임박 (D-15)"
        ]
      }
    ]
  }
}
```

**매칭 점수 알고리즘**

- **직무 매칭 (50%)**: 사용자 `target_job`과 활동 `target_jobs` 일치 여부
- **태그 매칭 (30%)**: 사용자 관심사(micro_logs 태그)와 활동 태그 교집합
- **마감일 임박도 (10%)**: 7일 이내 마감 시 추가 점수
- **인기도 (10%)**: 북마크 수 50개 이상 시 추가 점수

---

### 2. 활동 목록 조회 (필터링/검색)

전체 활동을 조회하거나 필터링/검색합니다.

```http
GET /api/activities
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | string | ❌ | 카테고리 필터 |
| `target_job` | string | ❌ | 직무 필터 (ex: "마케팅") |
| `search` | string | ❌ | 제목/설명/기관명 검색 |
| `is_active` | boolean | ❌ | 활성 활동만 (기본: true) |
| `page` | number | ❌ | 페이지 번호 (기본: 1) |
| `limit` | number | ❌ | 페이지당 개수 (기본: 20, 최대: 100) |

**Request Example**

```typescript
// 마케팅 직무 관련 공모전 검색
const response = await fetch(
  'http://localhost:8000/api/activities?category=contest&target_job=마케팅&page=1&limit=20',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2025 대학생 마케팅 공모전",
      "organization": "○○기업",
      "category": "contest",
      "target_jobs": ["마케팅"],
      "tags": ["마케팅", "공모전"],
      "description": "...",
      "benefits": "대상 500만원",
      "eligibility": "전국 4년제 대학생",
      "application_start": "2025-01-01",
      "application_end": "2025-02-28",
      "url": "https://...",
      "view_count": 125,
      "bookmark_count": 34,
      "is_bookmarked": false
    }
  ]
}
```

---

### 3. 활동 상세 조회

특정 활동의 상세 정보를 조회합니다. 조회 시 `view_count` 자동 증가.

```http
GET /api/activities/{activity_id}
```

**Request Example**

```typescript
const activityId = "uuid";
const response = await fetch(`http://localhost:8000/api/activities/${activityId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "2025 대학생 마케팅 공모전",
    "organization": "○○기업",
    "category": "contest",
    "target_jobs": ["마케팅", "전략기획"],
    "tags": ["마케팅", "공모전", "대학생"],
    "description": "상세 설명...",
    "benefits": "대상 500만원, 최우수상 300만원",
    "eligibility": "전국 4년제 대학생 (휴학생 포함)",
    "start_date": null,
    "end_date": null,
    "application_start": "2025-01-01",
    "application_end": "2025-02-28",
    "url": "https://www.wevity.com/sample1",
    "image_url": null,
    "contact_info": "marketing@company.com",
    "location": "온라인",
    "is_active": true,
    "view_count": 126,
    "bookmark_count": 34,
    "source_site": "wevity",
    "is_bookmarked": false,
    "created_at": "2025-11-22T10:00:00Z"
  }
}
```

---

### 4. 활동 북마크 추가

관심 있는 활동을 북마크합니다.

```http
POST /api/activities/{activity_id}/bookmark
```

**Request Example**

```typescript
const activityId = "uuid";
const response = await fetch(
  `http://localhost:8000/api/activities/${activityId}/bookmark`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "북마크가 추가되었습니다"
}
```

**Error Responses**

- **404**: 활동을 찾을 수 없음
- **409**: 이미 북마크된 활동

---

### 5. 활동 북마크 제거

북마크를 취소합니다.

```http
DELETE /api/activities/{activity_id}/bookmark
```

**Request Example**

```typescript
const activityId = "uuid";
const response = await fetch(
  `http://localhost:8000/api/activities/${activityId}/bookmark`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "북마크가 제거되었습니다"
}
```

---

### 6. 내 북마크 목록

사용자가 북마크한 활동 목록을 조회합니다.

```http
GET /api/bookmarks
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `page` | number | ❌ | 페이지 번호 (기본: 1) |
| `limit` | number | ❌ | 페이지당 개수 (기본: 20) |

**Request Example**

```typescript
const response = await fetch('http://localhost:8000/api/bookmarks?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2025 대학생 마케팅 공모전",
      "organization": "○○기업",
      "category": "contest",
      "application_end": "2025-02-28",
      "is_bookmarked": true,
      ...
    }
  ]
}
```

---

## TypeScript 타입 정의

프론트엔드에서 사용할 TypeScript 인터페이스입니다.

```typescript
// types/activity.ts

/**
 * 활동 카테고리
 */
export type ActivityCategory =
  | "contest"           // 공모전
  | "external_activity" // 대외활동
  | "project"           // 프로젝트
  | "club"              // 동아리/학회
  | "volunteer"         // 봉사활동
  | "internship";       // 인턴십

/**
 * 직무 타입
 */
export type TargetJob =
  | "전략기획"
  | "마케팅"
  | "데이터분석"
  | "개발"
  | "디자인"
  | "영업"
  | "인사"
  | "재무"
  | "기타";

/**
 * 활동 정보
 */
export interface Activity {
  id: string;
  title: string;
  organization: string;
  category: ActivityCategory;
  target_jobs: TargetJob[];
  tags: string[];
  description?: string;
  benefits?: string;
  eligibility?: string;
  start_date?: string; // ISO 8601 date
  end_date?: string;
  application_start?: string;
  application_end?: string;
  url?: string;
  image_url?: string;
  contact_info?: string;
  location?: string;
  is_active: boolean;
  view_count: number;
  bookmark_count: number;
  source_site?: string;
  is_bookmarked: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * 추천 활동 (매칭 점수 포함)
 */
export interface RecommendedActivity {
  activity: Activity;
  match_score: number;      // 0.0 ~ 1.0
  match_reasons: string[];  // ["'마케팅' 직무와 일치합니다", ...]
}

/**
 * 활동 목록 응답
 */
export interface ActivitiesResponse {
  activities: Activity[];
}

/**
 * 추천 활동 목록 응답
 */
export interface RecommendationsResponse {
  activities: RecommendedActivity[];
}

/**
 * 활동 상세 응답
 */
export interface ActivityDetailResponse {
  activity: Activity;
}

/**
 * 북마크 응답
 */
export interface BookmarkResponse {
  success: boolean;
  message: string;
}
```

---

## React 컴포넌트 예제

### 1. 추천 활동 카드 컴포넌트

```tsx
// components/RecommendedActivityCard.tsx

import { RecommendedActivity } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, ExternalLinkIcon } from 'lucide-react';

interface Props {
  recommendation: RecommendedActivity;
  onBookmark: (activityId: string) => void;
}

export function RecommendedActivityCard({ recommendation, onBookmark }: Props) {
  const { activity, match_score, match_reasons } = recommendation;
  
  // 마감일까지 남은 일수 계산
  const daysLeft = activity.application_end
    ? Math.max(
        0,
        Math.floor(
          (new Date(activity.application_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition">
      {/* 매칭 점수 배지 */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant={match_score >= 0.7 ? 'default' : 'secondary'}>
          매칭도 {Math.round(match_score * 100)}%
        </Badge>
        {daysLeft !== null && daysLeft <= 7 && (
          <Badge variant="destructive">D-{daysLeft}</Badge>
        )}
      </div>

      {/* 활동 정보 */}
      <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{activity.organization}</p>

      {/* 직무/태그 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {activity.target_jobs.map((job) => (
          <Badge key={job} variant="outline">
            {job}
          </Badge>
        ))}
      </div>

      {/* 매칭 이유 */}
      <div className="bg-blue-50 rounded p-3 mb-4">
        <p className="text-sm font-semibold mb-1">추천 이유:</p>
        <ul className="text-sm space-y-1">
          {match_reasons.map((reason, idx) => (
            <li key={idx}>• {reason}</li>
          ))}
        </ul>
      </div>

      {/* 혜택 */}
      {activity.benefits && (
        <p className="text-sm text-gray-700 mb-4">
          <strong>혜택:</strong> {activity.benefits}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={activity.is_bookmarked ? 'default' : 'outline'}
          onClick={() => onBookmark(activity.id)}
        >
          <BookmarkIcon className="w-4 h-4 mr-2" />
          {activity.is_bookmarked ? '북마크 됨' : '북마크'}
        </Button>
        <Button variant="secondary" asChild>
          <a href={activity.url} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            자세히 보기
          </a>
        </Button>
      </div>
    </div>
  );
}
```

### 2. 추천 활동 페이지

```tsx
// app/recommendations/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { RecommendedActivity } from '@/types/activity';
import { RecommendedActivityCard } from '@/components/RecommendedActivityCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'match_score' | 'deadline' | 'popular'>('match_score');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [sortBy, category]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        sort: sortBy,
        ...(category && { category })
      });

      const response = await fetch(
        `http://localhost:8000/api/recommendations/activities?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.activities);
      }
    } catch (error) {
      console.error('추천 활동 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (activityId: string) => {
    const activity = recommendations.find((r) => r.activity.id === activityId);
    if (!activity) return;

    const method = activity.activity.is_bookmarked ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/activities/${activityId}/bookmark`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.ok) {
        // 북마크 상태 토글
        setRecommendations((prev) =>
          prev.map((r) =>
            r.activity.id === activityId
              ? {
                  ...r,
                  activity: {
                    ...r.activity,
                    is_bookmarked: !r.activity.is_bookmarked,
                    bookmark_count: r.activity.bookmark_count + (method === 'POST' ? 1 : -1)
                  }
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error('북마크 처리 실패:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">맞춤 추천 활동</h1>

      {/* 필터 */}
      <div className="flex gap-4 mb-6">
        <Tabs value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? null : v)}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="contest">공모전</TabsTrigger>
            <TabsTrigger value="external_activity">대외활동</TabsTrigger>
            <TabsTrigger value="internship">인턴십</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match_score">매칭도순</SelectItem>
            <SelectItem value="deadline">마감임박순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 활동 목록 */}
      {loading ? (
        <div>로딩 중...</div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          추천 활동이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <RecommendedActivityCard
              key={rec.activity.id}
              recommendation={rec}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. 커스텀 Hook - useActivities

```typescript
// hooks/useActivities.ts

import { useState, useEffect } from 'react';
import { Activity, RecommendedActivity } from '@/types/activity';

export function useRecommendedActivities(category?: string, sortBy: string = 'match_score') {
  const [activities, setActivities] = useState<RecommendedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: '20',
          sort: sortBy,
          ...(category && { category })
        });

        const response = await fetch(
          `http://localhost:8000/api/recommendations/activities?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        if (data.success) {
          setActivities(data.data.activities);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [category, sortBy]);

  return { activities, loading, error };
}

export function useBookmark() {
  const [loading, setLoading] = useState(false);

  const toggleBookmark = async (activityId: string, isBookmarked: boolean) => {
    setLoading(true);

    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(
        `http://localhost:8000/api/activities/${activityId}/bookmark`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      return true;
    } catch (error) {
      console.error('북마크 처리 실패:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { toggleBookmark, loading };
}
```

---

## 추천 알고리즘

### 매칭 점수 계산 로직

```python
# app/routes/activities.py

def calculate_match_score(
    activity: dict,
    user_target_job: str,
    user_interests: List[str]
) -> tuple[float, List[str]]:
    """활동과 사용자 프로필 간 매칭 점수 계산"""
    score = 0.0
    reasons = []
    
    # 1. 직무 매칭 (가중치: 50%)
    if user_target_job in activity.get("target_jobs", []):
        score += 0.5
        reasons.append(f"'{user_target_job}' 직무와 일치합니다")
    
    # 2. 태그/관심사 매칭 (가중치: 30%)
    activity_tags = set(activity.get("tags", []))
    user_interests_set = set(user_interests)
    matching_tags = activity_tags & user_interests_set
    
    if matching_tags:
        tag_score = min(len(matching_tags) * 0.1, 0.3)
        score += tag_score
        reasons.append(f"관심사와 일치: {', '.join(list(matching_tags)[:3])}")
    
    # 3. 마감일 임박도 (가중치: 10%)
    if activity.get("application_end"):
        days_left = calculate_days_left(activity["application_end"])
        if 0 < days_left <= 7:
            score += 0.1
            reasons.append(f"마감 임박 (D-{days_left})")
    
    # 4. 인기도 (가중치: 10%)
    bookmark_count = activity.get("bookmark_count", 0)
    if bookmark_count > 50:
        score += 0.1
        reasons.append("인기 활동입니다")
    
    return score, reasons
```

### 알고리즘 개선 아이디어

1. **협업 필터링**: 유사한 사용자가 북마크한 활동 추천
2. **시간 가중치**: 최근 활동에 더 높은 점수 부여
3. **피드백 학습**: 사용자가 북마크/지원한 활동 패턴 학습
4. **AI 기반 분석**: GPT를 활용한 활동 설명과 사용자 경험 매칭

---

## 구현 체크리스트

### 백엔드 (완료 ✅)

- [x] `activities` 테이블 생성
- [x] `user_activity_bookmarks` 테이블 생성
- [x] 크롤링 스크립트 작성 (`scripts/crawl_activities.py`)
- [x] 추천 알고리즘 구현
- [x] GET `/api/recommendations/activities` 엔드포인트
- [x] GET `/api/activities` 엔드포인트
- [x] GET `/api/activities/{id}` 엔드포인트
- [x] POST `/api/activities/{id}/bookmark` 엔드포인트
- [x] DELETE `/api/activities/{id}/bookmark` 엔드포인트
- [x] GET `/api/bookmarks` 엔드포인트

### 프론트엔드 (구현 필요 🔲)

- [ ] TypeScript 타입 정의 (`types/activity.ts`)
- [ ] `RecommendedActivityCard` 컴포넌트
- [ ] 추천 활동 페이지 (`app/recommendations/page.tsx`)
- [ ] 활동 상세 페이지 (`app/activities/[id]/page.tsx`)
- [ ] 북마크 관리 페이지 (`app/bookmarks/page.tsx`)
- [ ] `useActivities` 커스텀 Hook
- [ ] `useBookmark` 커스텀 Hook
- [ ] 필터/정렬 UI 컴포넌트
- [ ] 검색 기능
- [ ] 무한 스크롤 또는 페이지네이션

### 데이터 준비

- [ ] 크롤링 스크립트 실행하여 초기 데이터 수집
- [ ] 직무/태그 데이터 정제
- [ ] 이미지 URL 유효성 검사
- [ ] 마감일 지난 활동 비활성화 스케줄러 설정

---

## 테스트 가이드

### 1. 크롤링 테스트

```bash
# 크롤링 실행
python scripts/crawl_activities.py

# Supabase에서 데이터 확인
# https://supabase.com/dashboard → Table Editor → activities
```

### 2. API 테스트 (Postman 또는 curl)

```bash
# 추천 활동 조회
curl -H "x-user-id: test-user-id" \
  "http://localhost:8000/api/recommendations/activities?limit=5"

# 활동 북마크
curl -X POST \
  -H "x-user-id: test-user-id" \
  "http://localhost:8000/api/activities/{activity-id}/bookmark"
```

### 3. 프론트엔드 통합 테스트

```typescript
// test/activities.test.ts

describe('Activities API', () => {
  it('should fetch recommended activities', async () => {
    const response = await fetch('/api/recommendations/activities');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.activities)).toBe(true);
  });

  it('should bookmark activity', async () => {
    const activityId = 'test-id';
    const response = await fetch(`/api/activities/${activityId}/bookmark`, {
      method: 'POST'
    });
    
    expect(response.ok).toBe(true);
  });
});
```

---

## 문제 해결 (Troubleshooting)

### 1. 추천 활동이 비어있음

**원인**: 사용자 프로필에 `target_job`이 설정되지 않았거나 활동 데이터가 없음

**해결**:
1. 사용자가 회원가입 시 직무를 선택했는지 확인
2. `activities` 테이블에 데이터가 있는지 확인
3. 활동의 `is_active`가 `true`인지 확인

### 2. 북마크가 추가되지 않음

**원인**: RLS 정책 오류 또는 인증 토큰 문제

**해결**:
1. Supabase RLS 정책 확인
2. `x-user-id` 헤더 또는 JWT 토큰이 올바른지 확인
3. 네트워크 탭에서 요청/응답 확인

### 3. 크롤링 데이터가 저장되지 않음

**원인**: Supabase 연결 오류 또는 테이블 권한 문제

**해결**:
1. `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 환경 변수 확인
2. 테이블 생성 SQL 실행 여부 확인
3. 로그에서 에러 메시지 확인

---

## 다음 단계

### Phase 2 기능 (추가 구현 가능)

1. **알림 시스템**
   - 새로운 추천 활동 푸시 알림
   - 북마크한 활동 마감 임박 알림

2. **AI 분석 강화**
   - GPT로 활동 설명과 사용자 경험 매칭
   - 추천 이유 자동 생성

3. **협업 필터링**
   - 유사한 사용자 발견
   - "이 활동을 북마크한 사용자는 이런 활동도 좋아합니다"

4. **활동 지원 관리**
   - 지원 상태 추적 (지원함, 결과 대기, 합격, 불합격)
   - 지원 히스토리 분석

5. **통계 대시보드**
   - 관리자: 인기 활동, 카테고리별 통계
   - 사용자: 내 활동 통계 (지원 수, 합격률 등)

---

## 참고 자료

- **Supabase 문서**: https://supabase.com/docs
- **FastAPI 문서**: https://fastapi.tiangolo.com
- **크롤링 가이드**: https://beautiful-soup-4.readthedocs.io
- **프로젝트 GitHub**: https://github.com/Same-Ta/SIRO

---

**작성일**: 2025-11-22  
**작성자**: GitHub Copilot  
**버전**: 1.0
