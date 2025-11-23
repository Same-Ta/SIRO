# 프론트엔드 활동 데이터 연동 가이드

## 📋 개요

백엔드 데이터베이스에 저장된 대외활동 정보를 프론트엔드에서 사용하는 방법을 안내합니다.

**현재 상태:**
- ✅ 백엔드 서버: `http://localhost:8000` 실행 중
- ✅ 데이터베이스: 60개 활동 데이터 저장 완료
- ✅ API 엔드포인트: `/api/activities` 사용 가능

---

## 🚀 빠른 시작

### 1. 기본 활동 목록 조회

```typescript
const fetchActivities = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/activities?limit=20', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log(data.data.activities); // 활동 목록
    
    return data.data.activities;
  } catch (error) {
    console.error('활동 조회 실패:', error);
  }
};
```

### 2. 브라우저 콘솔에서 즉시 테스트

```javascript
// 개발자 도구 콘솔에서 실행
fetch('http://localhost:8000/api/activities?limit=5')
  .then(res => res.json())
  .then(data => console.log(data.data.activities));
```

---

## 📡 API 엔드포인트

### 1. 활동 목록 조회

**URL:** `GET /api/activities`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `category` | string | ❌ | 활동 카테고리 필터 | `contest`, `internship`, `external_activity`, `project`, `club`, `volunteer` |
| `field` | string | ❌ | 관심 직무 필터 | `마케팅`, `개발`, `디자인`, `데이터분석` |
| `search` | string | ❌ | 키워드 검색 | `AI`, `공모전`, `마케팅` |
| `limit` | number | ❌ | 결과 개수 (기본값: 20) | `10`, `20`, `50` |
| `sort` | string | ❌ | 정렬 기준 | `recommended` (기본값), `deadline`, `popular`, `match_score` |

**Headers:**

```typescript
{
  'Content-Type': 'application/json',
  'x-user-id': 'user-id-here',  // 선택적 (사용자 인증)
  // 또는
  'Authorization': 'Bearer your-token-here'  // 선택적
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "activities": [
      {
        "activity": {
          "id": "uuid",
          "title": "2024 마케팅 공모전",
          "organization": "한국마케팅협회",
          "category": "contest",
          "target_jobs": ["마케팅", "전략기획"],
          "tags": ["브랜딩", "SNS마케팅", "캠페인"],
          "description": "SNS를 활용한 창의적인 마케팅 캠페인을 기획하고 실행하는 공모전입니다.",
          "benefits": ["상금 500만원", "수료증 발급", "인턴 기회"],
          "eligibility": "전국 대학생",
          "start_date": "2024-10-01",
          "end_date": "2024-12-31",
          "application_deadline": "2024-12-15T23:59:59Z",
          "url": "https://example.com/contest",
          "image_url": "https://example.com/images/contest.jpg",
          "location": "온라인",
          "contact_info": "marketing@example.com",
          "view_count": 1250,
          "bookmark_count": 89,
          "is_bookmarked": false,
          "created_at": "2024-10-01T00:00:00Z",
          "updated_at": "2024-10-01T00:00:00Z"
        },
        "match_score": 0.92,
        "match_reasons": [
          "전공 일치",
          "관심사 부합",
          "경험 수준 적합"
        ]
      }
    ],
    "total_count": 60,
    "page": 1,
    "limit": 20
  }
}
```

### 2. 북마크 추가

**URL:** `POST /api/activities/{activity_id}/bookmark`

**Headers:**

```typescript
{
  'Content-Type': 'application/json',
  'x-user-id': 'user-id-here'  // 필수
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "activity_id": "uuid",
    "is_bookmarked": true,
    "bookmark_count": 90
  },
  "message": "북마크에 추가되었습니다"
}
```

### 3. 북마크 제거

**URL:** `DELETE /api/activities/{activity_id}/bookmark`

**Headers:**

```typescript
{
  'Content-Type': 'application/json',
  'x-user-id': 'user-id-here'  // 필수
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "activity_id": "uuid",
    "is_bookmarked": false,
    "bookmark_count": 88
  },
  "message": "북마크에서 제거되었습니다"
}
```

---

## 💻 사용 예시

### 1. 카테고리별 필터링

```typescript
// 공모전만 조회
const fetchContests = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?category=contest&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};

// 인턴십만 조회
const fetchInternships = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?category=internship&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};
```

### 2. 직무별 필터링

```typescript
// 마케팅 관련 활동만
const fetchMarketingActivities = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?field=마케팅&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};

// 개발 관련 활동만
const fetchDevelopmentActivities = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?field=개발&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};
```

### 3. 검색 기능

```typescript
const searchActivities = async (keyword: string) => {
  const response = await fetch(
    `http://localhost:8000/api/activities?search=${encodeURIComponent(keyword)}&limit=20`,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};

// 사용 예시
searchActivities('AI');  // AI 관련 활동 검색
searchActivities('공모전');  // 공모전 검색
```

### 4. 정렬 기준 변경

```typescript
// 마감일 임박 순
const fetchByDeadline = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?sort=deadline&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};

// 인기순
const fetchPopular = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?sort=popular&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};

// 추천순 (매칭 점수 기반)
const fetchRecommended = async () => {
  const response = await fetch(
    'http://localhost:8000/api/activities?sort=recommended&limit=20',
    {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};
```

### 5. 여러 조건 조합

```typescript
const fetchFilteredActivities = async () => {
  const params = new URLSearchParams({
    category: 'contest',      // 공모전만
    field: '마케팅',           // 마케팅 직무
    search: 'AI',             // AI 키워드
    limit: '10',              // 10개만
    sort: 'deadline'          // 마감일 순
  });
  
  const response = await fetch(
    `http://localhost:8000/api/activities?${params}`,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return data.data.activities;
};
```

---

## 🎨 React 컴포넌트 예시

### 1. 기본 활동 목록 컴포넌트

```typescript
import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  title: string;
  organization: string;
  category: string;
  target_jobs: string[];
  tags: string[];
  description: string;
  benefits: string[];
  eligibility: string;
  application_deadline: string;
  url: string;
  image_url?: string;
  bookmark_count: number;
  view_count: number;
  is_bookmarked: boolean;
}

interface ActivityItem {
  activity: Activity;
  match_score: number;
  match_reasons: string[];
}

export default function ActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchActivities();
  }, []);
  
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/activities?limit=20', {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('활동 조회 실패');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities);
      } else {
        throw new Error('응답 형식 오류');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      console.error('활동 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }
  
  if (error) {
    return <div className="error">오류: {error}</div>;
  }
  
  return (
    <div className="activity-list">
      <h1>추천 활동</h1>
      
      <div className="activity-grid">
        {activities.map((item) => (
          <div key={item.activity.id} className="activity-card">
            <h3>{item.activity.title}</h3>
            <p className="organization">{item.activity.organization}</p>
            
            {/* 매칭 점수 */}
            <div className="match-score">
              매칭도: {Math.round(item.match_score * 100)}%
            </div>
            
            {/* 추천 이유 */}
            <div className="match-reasons">
              {item.match_reasons.map((reason, idx) => (
                <span key={idx} className="badge">{reason}</span>
              ))}
            </div>
            
            {/* 직무 태그 */}
            <div className="target-jobs">
              {item.activity.target_jobs.map((job) => (
                <span key={job} className="job-tag">{job}</span>
              ))}
            </div>
            
            {/* 키워드 태그 */}
            <div className="tags">
              {item.activity.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
            
            {/* 설명 */}
            <p className="description">{item.activity.description}</p>
            
            {/* 혜택 */}
            {item.activity.benefits && item.activity.benefits.length > 0 && (
              <div className="benefits">
                <strong>혜택:</strong>
                <ul>
                  {item.activity.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 마감일 */}
            <p className="deadline">
              마감: {new Date(item.activity.application_deadline).toLocaleDateString('ko-KR')}
            </p>
            
            {/* 통계 */}
            <div className="stats">
              <span>❤️ {item.activity.bookmark_count}</span>
              <span>👁️ {item.activity.view_count}</span>
            </div>
            
            {/* 링크 */}
            <a 
              href={item.activity.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="detail-link"
            >
              자세히 보기 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. 필터링 기능이 있는 컴포넌트

```typescript
import { useState, useEffect } from 'react';

export default function FilteredActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [field, setField] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');
  
  useEffect(() => {
    fetchActivities();
  }, [category, field, searchQuery, sortBy]);
  
  const fetchActivities = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (field) params.append('field', field);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '20');
      params.append('sort', sortBy);
      
      const response = await fetch(
        `http://localhost:8000/api/activities?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (error) {
      console.error('활동 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivities();
  };
  
  return (
    <div className="filtered-activity-list">
      <h1>활동 찾기</h1>
      
      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="활동 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>
      
      {/* 필터 */}
      <div className="filters">
        <div className="filter-group">
          <label>카테고리:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            <option value="contest">공모전</option>
            <option value="internship">인턴십</option>
            <option value="external_activity">대외활동</option>
            <option value="project">프로젝트</option>
            <option value="club">동아리</option>
            <option value="volunteer">봉사</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>직무:</label>
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">전체</option>
            <option value="마케팅">마케팅</option>
            <option value="개발">개발</option>
            <option value="디자인">디자인</option>
            <option value="데이터분석">데이터분석</option>
            <option value="전략기획">전략기획</option>
            <option value="영업">영업</option>
            <option value="인사">인사</option>
            <option value="재무">재무</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>정렬:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recommended">추천순</option>
            <option value="deadline">마감일순</option>
            <option value="popular">인기순</option>
            <option value="match_score">매칭도순</option>
          </select>
        </div>
      </div>
      
      {/* 결과 */}
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="results">
          <p>{activities.length}개의 활동을 찾았습니다</p>
          
          <div className="activity-grid">
            {activities.map((item) => (
              <ActivityCard key={item.activity.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. 북마크 기능 컴포넌트

```typescript
import { useState } from 'react';

interface BookmarkButtonProps {
  activityId: string;
  initialBookmarked: boolean;
  initialCount: number;
  userId: string;
}

export function BookmarkButton({
  activityId,
  initialBookmarked,
  initialCount,
  userId
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  
  const toggleBookmark = async () => {
    setLoading(true);
    
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(
        `http://localhost:8000/api/activities/${activityId}/bookmark`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setIsBookmarked(data.data.is_bookmarked);
        setBookmarkCount(data.data.bookmark_count);
      }
    } catch (error) {
      console.error('북마크 실패:', error);
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
    >
      {loading ? (
        '...'
      ) : (
        <>
          {isBookmarked ? '❤️' : '🤍'} {bookmarkCount}
        </>
      )}
    </button>
  );
}
```

### 4. 사용자 맞춤 추천 컴포넌트

```typescript
import { useState, useEffect } from 'react';

interface PersonalizedActivitiesProps {
  userId: string;
  targetJob?: string;  // 직무 시뮬레이션 결과
}

export default function PersonalizedActivities({
  userId,
  targetJob
}: PersonalizedActivitiesProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPersonalizedActivities();
  }, [userId, targetJob]);
  
  const fetchPersonalizedActivities = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        limit: '10',
        sort: 'match_score'
      });
      
      if (targetJob) {
        params.append('field', targetJob);
      }
      
      const response = await fetch(
        `http://localhost:8000/api/activities?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (error) {
      console.error('추천 활동 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>맞춤 추천 활동을 불러오는 중...</div>;
  }
  
  return (
    <div className="personalized-activities">
      <h2>
        {targetJob ? `${targetJob} 직무를 위한 추천 활동` : '당신을 위한 추천 활동'}
      </h2>
      
      <div className="activity-grid">
        {activities.map((item) => (
          <div key={item.activity.id} className="activity-card recommended">
            {/* 높은 매칭도 표시 */}
            {item.match_score >= 0.7 && (
              <span className="high-match-badge">
                🎯 {Math.round(item.match_score * 100)}% 매칭
              </span>
            )}
            
            <h3>{item.activity.title}</h3>
            <p>{item.activity.organization}</p>
            
            {/* 추천 이유 강조 */}
            <div className="match-reasons highlighted">
              {item.match_reasons.map((reason, idx) => (
                <span key={idx} className="reason">{reason}</span>
              ))}
            </div>
            
            <div className="tags">
              {item.activity.tags.slice(0, 3).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            
            <a href={item.activity.url} target="_blank" rel="noopener noreferrer">
              자세히 보기
            </a>
            
            <BookmarkButton
              activityId={item.activity.id}
              initialBookmarked={item.activity.is_bookmarked}
              initialCount={item.activity.bookmark_count}
              userId={userId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 TypeScript 타입 정의

```typescript
// types/activity.ts

export type ActivityCategory = 
  | 'contest' 
  | 'internship' 
  | 'external_activity' 
  | 'project' 
  | 'club' 
  | 'volunteer';

export interface Activity {
  id: string;
  title: string;
  organization: string;
  category: ActivityCategory;
  target_jobs: string[];
  tags: string[];
  description: string;
  benefits: string[];
  eligibility: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  url: string;
  image_url?: string;
  location?: string;
  contact_info?: string;
  view_count: number;
  bookmark_count: number;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  activity: Activity;
  match_score: number;
  match_reasons: string[];
}

export interface ActivityListResponse {
  success: boolean;
  data: {
    activities: ActivityItem[];
    total_count: number;
    page: number;
    limit: number;
  };
}

export interface BookmarkResponse {
  success: boolean;
  data: {
    activity_id: string;
    is_bookmarked: boolean;
    bookmark_count: number;
  };
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

---

## 🛠️ 유틸리티 함수

### API 클라이언트

```typescript
// utils/activityApi.ts

const BASE_URL = 'http://localhost:8000/api';

export class ActivityAPI {
  private baseUrl: string;
  private userId?: string;
  
  constructor(userId?: string) {
    this.baseUrl = BASE_URL;
    this.userId = userId;
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    
    return headers;
  }
  
  async getActivities(params?: {
    category?: string;
    field?: string;
    search?: string;
    limit?: number;
    sort?: string;
  }): Promise<ActivityListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.field) queryParams.append('field', params.field);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const response = await fetch(
      `${this.baseUrl}/activities?${queryParams}`,
      {
        headers: this.getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async addBookmark(activityId: string): Promise<BookmarkResponse> {
    if (!this.userId) {
      throw new Error('로그인이 필요합니다');
    }
    
    const response = await fetch(
      `${this.baseUrl}/activities/${activityId}/bookmark`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async removeBookmark(activityId: string): Promise<BookmarkResponse> {
    if (!this.userId) {
      throw new Error('로그인이 필요합니다');
    }
    
    const response = await fetch(
      `${this.baseUrl}/activities/${activityId}/bookmark`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async toggleBookmark(activityId: string, isBookmarked: boolean): Promise<BookmarkResponse> {
    return isBookmarked 
      ? this.removeBookmark(activityId)
      : this.addBookmark(activityId);
  }
}

// 사용 예시
const api = new ActivityAPI('user-123');

// 활동 조회
const activities = await api.getActivities({
  category: 'contest',
  limit: 20,
  sort: 'deadline'
});

// 북마크 추가
await api.addBookmark('activity-uuid');
```

### React Custom Hook

```typescript
// hooks/useActivities.ts

import { useState, useEffect } from 'react';
import { ActivityAPI } from '@/utils/activityApi';

export function useActivities(
  userId?: string,
  filters?: {
    category?: string;
    field?: string;
    search?: string;
    sort?: string;
  }
) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchActivities();
  }, [userId, filters?.category, filters?.field, filters?.search, filters?.sort]);
  
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const api = new ActivityAPI(userId);
      const response = await api.getActivities({
        ...filters,
        limit: 20,
      });
      
      setActivities(response.data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };
  
  const refetch = () => {
    fetchActivities();
  };
  
  return {
    activities,
    loading,
    error,
    refetch,
  };
}

// 사용 예시
function MyComponent() {
  const { activities, loading, error, refetch } = useActivities('user-123', {
    category: 'contest',
    sort: 'deadline'
  });
  
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  
  return (
    <div>
      {activities.map(item => (
        <ActivityCard key={item.activity.id} item={item} />
      ))}
      <button onClick={refetch}>새로고침</button>
    </div>
  );
}
```

---

## 🎨 스타일링 예시 (CSS)

```css
/* styles/activities.css */

.activity-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.activity-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.organization {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.match-score {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.match-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  background: #f0f4ff;
  color: #4c6ef5;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.target-jobs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.job-tag {
  background: #e7f5ff;
  color: #1971c2;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  color: #868e96;
  font-size: 0.85rem;
}

.description {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.benefits {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.benefits ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.benefits li {
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 0.25rem;
}

.deadline {
  color: #e03131;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #868e96;
  font-size: 0.9rem;
}

.detail-link {
  display: inline-block;
  background: #228be6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}

.detail-link:hover {
  background: #1971c2;
}

/* 필터 스타일 */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* 검색 바 */
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-form input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
}

.search-form button {
  padding: 0.75rem 1.5rem;
  background: #228be6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

/* 북마크 버튼 */
.bookmark-button {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-button.bookmarked {
  background: #ffe3e3;
  border-color: #ff6b6b;
  color: #c92a2a;
}

.bookmark-button:hover {
  background: #f8f9fa;
}

.bookmark-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 로딩 및 에러 */
.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #868e96;
}

.error {
  color: #e03131;
}
```

---

## 🔒 인증 처리

### 로컬스토리지 사용

```typescript
// utils/auth.ts

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function setUserId(userId: string): void {
  localStorage.setItem('userId', userId);
}

export function clearUserId(): void {
  localStorage.removeItem('userId');
}

// 사용 예시
import { getUserId } from '@/utils/auth';

const userId = getUserId();
if (userId) {
  const api = new ActivityAPI(userId);
  // ...
}
```

### JWT 토큰 사용

```typescript
// utils/auth.ts

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

// API 호출
const token = getAccessToken();
const response = await fetch('http://localhost:8000/api/activities', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
});
```

---

## 🧪 테스트 코드

### Jest + React Testing Library

```typescript
// __tests__/ActivityList.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import ActivityList from '@/components/ActivityList';

// Mock fetch
global.fetch = jest.fn();

describe('ActivityList', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });
  
  it('활동 목록을 렌더링한다', async () => {
    const mockData = {
      success: true,
      data: {
        activities: [
          {
            activity: {
              id: '1',
              title: '테스트 공모전',
              organization: '테스트 기관',
              category: 'contest',
              target_jobs: ['마케팅'],
              tags: ['테스트'],
              description: '설명',
              benefits: ['상금'],
              eligibility: '대학생',
              application_deadline: '2025-12-31',
              url: 'https://example.com',
              bookmark_count: 10,
              view_count: 100,
              is_bookmarked: false,
            },
            match_score: 0.9,
            match_reasons: ['전공 일치'],
          },
        ],
        total_count: 1,
        page: 1,
        limit: 20,
      },
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });
    
    render(<ActivityList />);
    
    await waitFor(() => {
      expect(screen.getByText('테스트 공모전')).toBeInTheDocument();
    });
  });
  
  it('로딩 상태를 표시한다', () => {
    render(<ActivityList />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });
});
```

---

## 📱 모바일 대응

### 반응형 CSS

```css
/* 모바일 */
@media (max-width: 768px) {
  .activity-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form button {
    width: 100%;
  }
}
```

---

## 🚨 에러 처리

```typescript
// utils/errorHandler.ts

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    
    throw new APIError(
      data.error?.message || '서버 오류가 발생했습니다',
      response.status,
      data.error?.code
    );
  }
  
  return response.json();
}

// 사용 예시
try {
  const response = await fetch('http://localhost:8000/api/activities');
  const data = await handleAPIResponse(response);
  // ...
} catch (error) {
  if (error instanceof APIError) {
    if (error.statusCode === 404) {
      console.error('활동을 찾을 수 없습니다');
    } else if (error.statusCode === 401) {
      console.error('로그인이 필요합니다');
    }
  }
}
```

---

## 📚 참고 자료

- **백엔드 API 요구사항**: `BACKEND_ACTIVITY_API_REQUIREMENTS.md`
- **API 변경사항**: `ACTIVITY_API_CHANGES.md`
- **크롤러 가이드**: `ACTIVITY_RECOMMENDATION_GUIDE.md`
- **Swagger UI**: http://localhost:8000/api/docs

---

## 💡 팁과 Best Practices

1. **환경 변수 사용**
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   ```

2. **재사용 가능한 컴포넌트**
   - ActivityCard, FilterBar, SearchBar 등을 분리

3. **상태 관리**
   - 큰 프로젝트는 Redux, Zustand, Recoil 사용 권장

4. **캐싱**
   - React Query나 SWR로 데이터 캐싱

5. **디바운싱**
   - 검색 입력에 디바운스 적용
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce(searchActivities, 300),
     []
   );
   ```

6. **무한 스크롤**
   - 페이지네이션 대신 무한 스크롤 구현 가능

7. **Optimistic UI**
   - 북마크 토글 시 즉시 UI 업데이트

---

**문의사항이나 추가 기능이 필요하면 언제든 말씀해주세요!** 🚀
