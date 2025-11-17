# 활동 추천 시스템 백엔드 요구사항

## 📋 개요

학생의 학과, 관심사, 역량 키워드를 기반으로 실제 공모전/프로젝트/동아리 활동을 추천하는 시스템입니다.
크롤링된 실시간 데이터를 Supabase에 저장하고, AI 기반 매칭 알고리즘으로 개인화된 추천을 제공합니다.

---

## 🗄️ 데이터베이스 스키마

### 1. activities (활동 정보)

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 기본 정보
  title VARCHAR(500) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'contest', 'project', 'club', 'study', 'internship'
  type VARCHAR(50), -- '공모전', '해커톤', '프로젝트', '동아리', '인턴십' 등
  
  -- 상세 정보
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  target_audience TEXT[], -- ['대학생', '전공무관', '팀 참여'] 등
  
  -- 일정 정보
  start_date DATE,
  end_date DATE,
  application_start_date DATE,
  application_end_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'upcoming'
  
  -- 분야 및 태그
  fields VARCHAR(100)[], -- ['IT', '기획', '디자인', '마케팅'] 등
  tags VARCHAR(50)[], -- ['개발', 'AI', '빅데이터', 'UX/UI'] 등
  keywords VARCHAR(100)[], -- 키워드 기반 매칭용
  
  -- 학과 적합도 (선택적)
  recommended_majors VARCHAR(100)[], -- ['컴퓨터공학', '경영학', '디자인학'] 등
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  
  -- 외부 링크
  url TEXT,
  image_url TEXT,
  apply_url TEXT,
  
  -- 메타 정보
  source VARCHAR(100), -- 'linkareer', 'wevity', 'thinkpool' 등
  crawled_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  
  -- 상금/혜택
  prize_money BIGINT, -- 상금 (원)
  prize_details JSONB, -- {1st: 1000000, 2nd: 500000, ...}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_end_date ON activities(application_end_date);
CREATE INDEX idx_activities_fields ON activities USING GIN(fields);
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX idx_activities_majors ON activities USING GIN(recommended_majors);
CREATE INDEX idx_activities_keywords ON activities USING GIN(keywords);
```

### 2. user_bookmarks (사용자 북마크)

```sql
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, activity_id)
);

CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX idx_bookmarks_activity ON user_bookmarks(activity_id);
```

### 3. user_activity_applications (지원 내역)

```sql
CREATE TABLE user_activity_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'accepted', 'rejected', 'completed'
  applied_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applications_user ON user_activity_applications(user_id);
CREATE INDEX idx_applications_activity ON user_activity_applications(activity_id);
```

### 4. user_preferences (사용자 추천 설정)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- 관심 분야
  interested_fields VARCHAR(100)[],
  interested_categories VARCHAR(50)[],
  
  -- 역량 키워드 (자동 수집)
  skill_keywords VARCHAR(100)[],
  
  -- 추천 필터
  exclude_categories VARCHAR(50)[],
  min_prize_money BIGINT,
  preferred_difficulty VARCHAR(20),
  
  -- 알림 설정
  notification_enabled BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. activity_recommendations (추천 로그)

```sql
CREATE TABLE activity_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  
  -- 추천 점수
  match_score FLOAT NOT NULL, -- 0.0 ~ 1.0
  reasons JSONB, -- {major_match: 0.3, keyword_match: 0.5, ...}
  
  -- 사용자 반응
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP,
  bookmarked BOOLEAN DEFAULT false,
  applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON activity_recommendations(user_id);
CREATE INDEX idx_recommendations_score ON activity_recommendations(match_score DESC);
```

---

## 🔄 크롤링 시스템

### 크롤링 대상 사이트

1. **링커리어** (https://linkareer.com)
   - 공모전, 대외활동, 인턴십
   - 주요 필드: 제목, 기관, 분야, 일정, 대상, 혜택

2. **위비티** (https://www.wevity.com)
   - 공모전 전문
   - 주요 필드: 제목, 주최, 분야, 상금, 마감일

3. **씽굿** (https://www.thinkpool.com)
   - 대학생 활동 종합
   - 주요 필드: 제목, 유형, 대상, 일정

4. **온오프믹스** (https://onoffmix.com)
   - IT 해커톤, 세미나
   - 주요 필드: 제목, 주최, 일정, 참가비

### 크롤링 스크립트 (Python + Selenium)

```python
# scripts/crawlers/activity_crawler.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import requests
from datetime import datetime
from supabase import create_client, Client
import os

class ActivityCrawler:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
    def crawl_linkareer(self):
        """링커리어 크롤링"""
        driver = webdriver.Chrome()
        activities = []
        
        try:
            driver.get("https://linkareer.com/activity")
            # 크롤링 로직
            items = driver.find_elements(By.CLASS_NAME, "activity-item")
            
            for item in items:
                activity = {
                    "title": item.find_element(By.CLASS_NAME, "title").text,
                    "organization": item.find_element(By.CLASS_NAME, "company").text,
                    "category": self._categorize(item.text),
                    "fields": self._extract_fields(item.text),
                    "url": item.find_element(By.TAG_NAME, "a").get_attribute("href"),
                    "source": "linkareer",
                    "crawled_at": datetime.now().isoformat()
                }
                activities.append(activity)
                
        finally:
            driver.quit()
            
        return activities
    
    def crawl_wevity(self):
        """위비티 크롤링"""
        url = "https://www.wevity.com/?c=find&s=1&gub=1"
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        activities = []
        items = soup.select(".list-row")
        
        for item in items:
            activity = {
                "title": item.select_one(".tit").text.strip(),
                "organization": item.select_one(".organizer").text.strip(),
                "category": "contest",
                "fields": self._extract_fields_from_text(item.text),
                "url": "https://www.wevity.com" + item.select_one("a")["href"],
                "source": "wevity",
                "crawled_at": datetime.now().isoformat()
            }
            activities.append(activity)
            
        return activities
    
    def save_to_supabase(self, activities):
        """Supabase에 저장"""
        for activity in activities:
            # 중복 체크 (URL 기준)
            existing = self.supabase.table("activities")\
                .select("id")\
                .eq("url", activity["url"])\
                .execute()
            
            if not existing.data:
                # 새 활동 추가
                self.supabase.table("activities").insert(activity).execute()
            else:
                # 기존 활동 업데이트
                self.supabase.table("activities")\
                    .update(activity)\
                    .eq("id", existing.data[0]["id"])\
                    .execute()
    
    def _categorize(self, text):
        """텍스트 기반 카테고리 분류"""
        if "공모전" in text or "contest" in text.lower():
            return "contest"
        elif "해커톤" in text:
            return "hackathon"
        elif "인턴" in text:
            return "internship"
        elif "동아리" in text:
            return "club"
        else:
            return "project"
    
    def _extract_fields(self, text):
        """분야 추출"""
        field_keywords = {
            "IT": ["개발", "프로그래밍", "코딩", "소프트웨어"],
            "기획": ["기획", "전략", "마케팅"],
            "디자인": ["디자인", "UX", "UI", "그래픽"],
            "경영": ["경영", "비즈니스", "사업"],
        }
        
        detected_fields = []
        for field, keywords in field_keywords.items():
            if any(keyword in text for keyword in keywords):
                detected_fields.append(field)
        
        return detected_fields or ["기타"]

# 실행
if __name__ == "__main__":
    crawler = ActivityCrawler()
    
    # 크롤링 실행
    linkareer_activities = crawler.crawl_linkareer()
    wevity_activities = crawler.crawl_wevity()
    
    # Supabase 저장
    crawler.save_to_supabase(linkareer_activities + wevity_activities)
    
    print(f"Total {len(linkareer_activities + wevity_activities)} activities crawled")
```

### 크롤링 스케줄러 (Cron Job)

```bash
# crontab -e

# 매일 오전 2시에 크롤링 실행
0 2 * * * cd /path/to/project && python scripts/crawlers/activity_crawler.py

# 매주 월요일 오전 1시에 마감된 활동 정리
0 1 * * 1 cd /path/to/project && python scripts/cleanup_expired_activities.py
```

---

## 🤖 AI 추천 알고리즘

### API 엔드포인트

#### 1. GET /api/recommendations/activities

**개인화 추천 활동 조회**

**Request Query Parameters:**
```typescript
{
  category?: string        // 'contest' | 'project' | 'club' | 'internship'
  fields?: string[]       // ['IT', '기획', '디자인']
  limit?: number          // default: 20
  page?: number          // default: 1
  status?: string        // 'active' | 'upcoming'
  sort?: string          // 'recommended' | 'deadline' | 'popular'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "title": "2024 AI 해커톤",
        "organization": "네이버",
        "category": "contest",
        "type": "해커톤",
        "description": "AI 기술을 활용한 혁신적인 아이디어 공모전",
        "fields": ["IT", "AI"],
        "tags": ["인공지능", "머신러닝", "딥러닝"],
        "application_end_date": "2024-12-31",
        "prize_money": 10000000,
        "url": "https://...",
        "image_url": "https://...",
        "match_score": 0.87,
        "match_reasons": {
          "major_match": 0.3,
          "keyword_match": 0.4,
          "interest_match": 0.17
        },
        "is_bookmarked": false,
        "has_applied": false,
        "days_left": 15
      }
    ],
    "total": 156,
    "page": 1,
    "per_page": 20
  }
}
```

**추천 알고리즘 로직:**

```typescript
// 추천 점수 계산
function calculateMatchScore(user, activity) {
  let score = 0.0;
  const reasons = {};
  
  // 1. 학과 매칭 (30%)
  if (activity.recommended_majors.includes(user.major)) {
    const majorScore = 0.3;
    score += majorScore;
    reasons.major_match = majorScore;
  }
  
  // 2. 키워드 매칭 (40%)
  const userKeywords = user.skill_keywords || [];
  const activityKeywords = activity.keywords || [];
  const keywordIntersection = userKeywords.filter(k => 
    activityKeywords.includes(k)
  );
  if (keywordIntersection.length > 0) {
    const keywordScore = Math.min(
      0.4, 
      (keywordIntersection.length / Math.max(userKeywords.length, 1)) * 0.4
    );
    score += keywordScore;
    reasons.keyword_match = keywordScore;
  }
  
  // 3. 관심 분야 매칭 (20%)
  const userFields = user.interested_fields || [];
  const activityFields = activity.fields || [];
  const fieldIntersection = userFields.filter(f => 
    activityFields.includes(f)
  );
  if (fieldIntersection.length > 0) {
    const fieldScore = Math.min(
      0.2,
      (fieldIntersection.length / Math.max(userFields.length, 1)) * 0.2
    );
    score += fieldScore;
    reasons.interest_match = fieldScore;
  }
  
  // 4. 난이도 매칭 (10%)
  if (user.preferred_difficulty === activity.difficulty_level) {
    score += 0.1;
    reasons.difficulty_match = 0.1;
  }
  
  return { score, reasons };
}
```

#### 2. POST /api/recommendations/activities/:id/bookmark

**활동 북마크 추가**

**Response:**
```json
{
  "success": true,
  "data": {
    "bookmark_id": "uuid",
    "activity_id": "uuid",
    "bookmarked_at": "2024-11-14T10:00:00Z"
  }
}
```

#### 3. DELETE /api/recommendations/activities/:id/bookmark

**활동 북마크 제거**

#### 4. GET /api/recommendations/bookmarks

**북마크한 활동 목록 조회**

#### 5. POST /api/recommendations/activities/:id/apply

**활동 지원 기록**

**Request Body:**
```json
{
  "notes": "지원 동기 및 메모"
}
```

#### 6. GET /api/recommendations/my-applications

**내 지원 내역 조회**

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "activity": {
          "id": "uuid",
          "title": "2024 AI 해커톤",
          "organization": "네이버"
        },
        "status": "applied",
        "applied_at": "2024-11-01T10:00:00Z",
        "notes": "AI 관련 프로젝트 경험 있음"
      }
    ],
    "total": 12
  }
}
```

#### 7. POST /api/recommendations/preferences

**추천 설정 저장**

**Request Body:**
```json
{
  "interested_fields": ["IT", "기획"],
  "interested_categories": ["contest", "hackathon"],
  "exclude_categories": ["study"],
  "min_prize_money": 1000000,
  "preferred_difficulty": "intermediate",
  "notification_enabled": true,
  "notification_frequency": "weekly"
}
```

#### 8. GET /api/recommendations/trending

**인기 활동 조회**

마감 임박 & 조회수/북마크 많은 활동

#### 9. GET /api/recommendations/deadline-soon

**마감 임박 활동 조회**

7일 이내 마감 활동

---

## 🔧 백엔드 구현 예시

### Express.js 라우터

```typescript
// routes/recommendations.ts

import express from 'express';
import { supabase } from '../lib/supabase';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// 추천 활동 조회
router.get('/activities', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, fields, limit = 20, page = 1, sort = 'recommended' } = req.query;
    
    // 사용자 프로필 조회
    const { data: user } = await supabase
      .from('users')
      .select('major, interested_fields, skill_keywords')
      .eq('id', userId)
      .single();
    
    // 활동 조회
    let query = supabase
      .from('activities')
      .select('*')
      .eq('status', 'active')
      .gte('application_end_date', new Date().toISOString())
      .order('application_end_date', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (fields && Array.isArray(fields)) {
      query = query.overlaps('fields', fields);
    }
    
    const { data: activities, error } = await query;
    
    if (error) throw error;
    
    // 추천 점수 계산
    const scoredActivities = activities.map(activity => {
      const { score, reasons } = calculateMatchScore(user, activity);
      return {
        ...activity,
        match_score: score,
        match_reasons: reasons
      };
    });
    
    // 정렬
    if (sort === 'recommended') {
      scoredActivities.sort((a, b) => b.match_score - a.match_score);
    }
    
    // 북마크 정보 추가
    const activityIds = scoredActivities.map(a => a.id);
    const { data: bookmarks } = await supabase
      .from('user_bookmarks')
      .select('activity_id')
      .eq('user_id', userId)
      .in('activity_id', activityIds);
    
    const bookmarkedIds = new Set(bookmarks?.map(b => b.activity_id) || []);
    
    const result = scoredActivities.map(activity => ({
      ...activity,
      is_bookmarked: bookmarkedIds.has(activity.id),
      days_left: calculateDaysLeft(activity.application_end_date)
    }));
    
    res.json({
      success: true,
      data: {
        activities: result,
        total: result.length,
        page: parseInt(page),
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 북마크 추가
router.post('/activities/:id/bookmark', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        activity_id: id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 북마크 카운트 증가
    await supabase.rpc('increment_bookmark_count', { activity_id: id });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 북마크 제거
router.delete('/activities/:id/bookmark', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('activity_id', id);
    
    if (error) throw error;
    
    // 북마크 카운트 감소
    await supabase.rpc('decrement_bookmark_count', { activity_id: id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## 📊 배치 작업

### 1. 만료된 활동 정리

```python
# scripts/cleanup_expired_activities.py

from supabase import create_client
from datetime import datetime

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 마감된 활동 status 변경
supabase.table("activities")\
    .update({"status": "closed"})\
    .lt("application_end_date", datetime.now().isoformat())\
    .eq("status", "active")\
    .execute()
```

### 2. 사용자 키워드 자동 업데이트

```typescript
// 사용자가 회고를 작성할 때마다 키워드 업데이트
async function updateUserKeywords(userId: string) {
  // 최근 회고에서 키워드 추출
  const { data: reflections } = await supabase
    .from('reflections')
    .select('ai_keywords')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  const allKeywords = reflections
    .flatMap(r => r.ai_keywords || [])
    .reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});
  
  // 상위 20개 키워드 저장
  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword]) => keyword);
  
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      skill_keywords: topKeywords
    });
}
```

---

## 🔔 알림 시스템

### 추천 활동 이메일 발송

```typescript
// services/notification.service.ts

async function sendWeeklyRecommendations() {
  // 알림 설정한 사용자 조회
  const { data: users } = await supabase
    .from('user_preferences')
    .select('user_id, notification_frequency')
    .eq('notification_enabled', true)
    .eq('notification_frequency', 'weekly');
  
  for (const user of users) {
    // 개인화 추천 활동 조회
    const recommendations = await getTopRecommendations(user.user_id, 5);
    
    // 이메일 발송
    await sendEmail(user.email, {
      subject: '이번 주 추천 활동',
      template: 'weekly-recommendations',
      data: { recommendations }
    });
  }
}
```

---

## 🚀 배포 및 운영

### 환경 변수

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# 크롤링 스케줄
CRAWLER_SCHEDULE=0 2 * * *

# 알림
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-email-key
```

### 성능 최적화

1. **캐싱**: Redis로 추천 결과 1시간 캐싱
2. **인덱싱**: GIN 인덱스로 배열 검색 최적화
3. **배치 처리**: 추천 점수 사전 계산 (매일 새벽)

---

## 📈 모니터링

### 주요 지표

- 크롤링 성공률
- 추천 클릭률 (CTR)
- 북마크 전환율
- 지원 전환율
- API 응답 시간

