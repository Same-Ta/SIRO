# MCP Supabase 백엔드 구현 가이드

> Supabase MCP를 사용하여 스페이스 생성 및 회고 저장 API를 구현하는 가이드입니다.

## 목차
1. [MCP 설정](#1-mcp-설정)
2. [필요한 API 엔드포인트](#2-필요한-api-엔드포인트)
3. [구현 예시](#3-구현-예시)
4. [테이블 생성](#4-테이블-생성)

---

## 1. MCP 설정

### 1.1 Supabase 프로젝트 생성

Claude Desktop에서 MCP를 사용하려면:

```json
// Claude Desktop 설정 (~/Library/Application Support/Claude/claude_desktop_config.json)
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-project-url.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### 1.2 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

---

## 2. 필요한 API 엔드포인트

프론트엔드가 호출하는 API:

### 2.1 스페이스 생성
- **Endpoint**: `POST /api/spaces`
- **Headers**: `x-user-id: string`
- **Body**:
```json
{
  "name": "2024 마케팅 공모전",
  "description": "전국 대학생 마케팅 공모전",
  "type": "공모전",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "reflection_settings": {
    "cycle": "weekly",
    "enabled": true
  }
}
```

### 2.2 회고 저장
- **Endpoint**: `POST /api/v1/reflections`
- **Headers**: `x-user-id: string`
- **Body**:
```json
{
  "space_id": "uuid",
  "template_id": "uuid",
  "type": "chatbot",
  "title": "1주차 회고",
  "content": {
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "..."
  },
  "mood_before": "neutral",
  "mood_after": "good",
  "tags": ["마케팅", "전략", "분석"]
}
```

### 2.3 마이크로 로그 저장
- **Endpoint**: `POST /api/reflections/micro`
- **Headers**: `x-user-id: string`
- **Body**:
```json
{
  "activity_type": "프로젝트",
  "memo": "팀 미팅 진행",
  "mood": "good",
  "mood_reason": "팀원들과 소통이 잘 되었음",
  "tags": ["협업", "소통"]
}
```

---

## 3. 구현 예시

### 3.1 Node.js + Express 백엔드 (기본)

#### 프로젝트 구조
```
backend/
├── server.js           # 메인 서버
├── routes/
│   ├── spaces.js       # 스페이스 API
│   ├── reflections.js  # 회고 API
│   └── micro.js        # 마이크로 로그 API
├── supabase.js         # Supabase 클라이언트
└── package.json
```

#### server.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const spacesRoutes = require('./routes/spaces');
const reflectionsRoutes = require('./routes/reflections');
const microRoutes = require('./routes/micro');

const app = express();
const PORT = process.env.PORT || 8000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트
app.use('/api/spaces', spacesRoutes);
app.use('/api/v1/reflections', reflectionsRoutes);
app.use('/api/reflections/micro', microRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

#### supabase.js
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

#### routes/spaces.js
```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// 스페이스 생성
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '사용자 인증이 필요합니다' });
    }

    const { name, description, type, start_date, end_date, reflection_settings } = req.body;

    // Supabase에 데이터 삽입
    const { data, error } = await supabase
      .from('spaces')
      .insert([
        {
          user_id: userId,
          name: name,
          type: type,
          description: description,
          start_date: start_date,
          end_date: end_date,
          reflection_cycle: reflection_settings.cycle,
          reminder_enabled: reflection_settings.enabled,
          status: 'active',
          keywords: []
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ 
      success: true,
      data: data 
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 스페이스 목록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { status } = req.query;

    let query = supabase
      .from('spaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 스페이스 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('space_id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: '스페이스를 찾을 수 없습니다' });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
```

#### routes/reflections.js
```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// 회고 생성
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '사용자 인증이 필요합니다' });
    }

    const { 
      space_id, 
      template_id, 
      type, 
      title, 
      content, 
      mood_before, 
      mood_after, 
      tags 
    } = req.body;

    const { data, error } = await supabase
      .from('reflections')
      .insert([
        {
          user_id: userId,
          space_id: space_id || null,
          template_id: template_id || null,
          type: type,
          title: title,
          content: content,
          mood_before: mood_before,
          mood_after: mood_after,
          tags: tags || [],
          progress_score: null,
          ai_feedback: null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ 
      success: true,
      data: data 
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 회고 목록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { space_id, type, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('reflections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, parseInt(offset) + parseInt(limit) - 1);

    if (space_id) {
      query = query.eq('space_id', space_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      total: count,
      items: data 
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 회고 통계
router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { period = 'week' } = req.query;

    // 기간 계산
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    }

    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 통계 계산
    const stats = {
      total_reflections: data.length,
      consecutive_days: 0, // TODO: 계산 로직 추가
      active_spaces: new Set(data.map(r => r.space_id).filter(Boolean)).size,
      growth_keywords: [], // TODO: 태그 분석
      mood_summary: {
        good: data.filter(r => r.mood_after === 'good').length,
        neutral: data.filter(r => r.mood_after === 'neutral').length,
        bad: data.filter(r => r.mood_after === 'bad').length
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
```

#### routes/micro.js
```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// 마이크로 로그 생성
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '사용자 인증이 필요합니다' });
    }

    const { activity_type, memo, mood, mood_reason, tags } = req.body;

    const { data, error } = await supabase
      .from('micro_logs')
      .insert([
        {
          user_id: userId,
          activity_type: activity_type,
          memo: memo,
          mood: mood,
          mood_reason: mood_reason,
          tags: tags || []
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ 
      success: true,
      data: data 
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 마이크로 로그 목록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('micro_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
```

#### package.json
```json
{
  "name": "proof-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 4. 테이블 생성

### 4.1 Supabase SQL Editor에서 실행

```sql
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users 테이블 (간단한 인증용)
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  university VARCHAR(100),
  major VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- spaces 테이블
CREATE TABLE spaces (
  space_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reflection_cycle VARCHAR(20) NOT NULL,
  reminder_enabled BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  keywords JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaces_user_id ON spaces(user_id);
CREATE INDEX idx_spaces_status ON spaces(status);

-- reflections 테이블
CREATE TABLE reflections (
  reflection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
  space_id UUID REFERENCES spaces(space_id),
  template_id UUID,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200),
  content JSONB NOT NULL,
  ai_feedback TEXT,
  progress_score INTEGER,
  mood_before VARCHAR(20),
  mood_after VARCHAR(20),
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_space_id ON reflections(space_id);
CREATE INDEX idx_reflections_created_at ON reflections(created_at);

-- micro_logs 테이블
CREATE TABLE micro_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
  activity_type VARCHAR(20) NOT NULL,
  memo TEXT,
  mood VARCHAR(20) NOT NULL,
  mood_reason VARCHAR(100),
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_micro_logs_user_id ON micro_logs(user_id);
CREATE INDEX idx_micro_logs_created_at ON micro_logs(created_at);

-- 테스트 사용자 생성 (비밀번호: test123)
INSERT INTO users (user_id, password, name, email)
VALUES ('test_user', 'hashed_password_here', '테스트유저', 'test@example.com');
```

---

## 5. 실행 방법

### 5.1 백엔드 서버 시작

```bash
# 프로젝트 디렉토리 생성
mkdir proof-backend
cd proof-backend

# 패키지 설치
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D nodemon

# 위의 파일들을 생성한 후
npm run dev
```

### 5.2 프론트엔드 설정

프론트엔드는 이미 올바른 API를 호출하고 있으므로, 백엔드만 실행하면 됩니다.

```bash
# 프론트엔드 실행 (별도 터미널)
cd front
npm run dev
```

---

## 6. 테스트

### 6.1 스페이스 생성 테스트

```bash
curl -X POST http://localhost:8000/api/spaces \
  -H "Content-Type: application/json" \
  -H "x-user-id: test_user" \
  -d '{
    "name": "테스트 공모전",
    "description": "테스트용",
    "type": "공모전",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "reflection_settings": {
      "cycle": "weekly",
      "enabled": true
    }
  }'
```

### 6.2 회고 저장 테스트

```bash
curl -X POST http://localhost:8000/api/v1/reflections \
  -H "Content-Type: application/json" \
  -H "x-user-id: test_user" \
  -d '{
    "type": "chatbot",
    "title": "1주차 회고",
    "content": {
      "situation": "팀 프로젝트",
      "task": "마케팅 전략 수립",
      "action": "시장 조사",
      "result": "전략 완성"
    },
    "mood_before": "neutral",
    "mood_after": "good",
    "tags": ["마케팅", "전략"]
  }'
```

---

## 7. 트러블슈팅

### 문제: CORS 에러
**해결**: `cors` 미들웨어 추가 확인

### 문제: Supabase 연결 실패
**해결**: `.env` 파일의 URL과 KEY 확인

### 문제: 테이블이 없음
**해결**: SQL 스크립트 실행 확인

---

## 8. 다음 단계

1. ✅ 백엔드 API 구현 완료
2. ⏳ AI 피드백 생성 (Gemini API)
3. ⏳ 활동 추천 알고리즘
4. ⏳ 직무 시뮬레이션 저장

---

**문서 작성**: AI Assistant  
**최종 업데이트**: 2025-01-23
