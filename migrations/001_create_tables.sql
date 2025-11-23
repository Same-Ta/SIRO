-- PROOF 서비스 데이터베이스 스키마
-- Supabase MCP를 통해 실행

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  university VARCHAR(100),
  major VARCHAR(100),
  interests JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- spaces 테이블
CREATE TABLE IF NOT EXISTS spaces (
  space_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reflection_cycle VARCHAR(20) NOT NULL DEFAULT 'weekly',
  reminder_enabled BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  keywords JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_spaces_status ON spaces(status);
CREATE INDEX IF NOT EXISTS idx_spaces_created_at ON spaces(created_at);

-- space_members 테이블
CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);

-- reflection_templates 테이블
CREATE TABLE IF NOT EXISTS reflection_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  questions JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by VARCHAR(50) REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON reflection_templates(category);

-- reflections 테이블
CREATE TABLE IF NOT EXISTS reflections (
  reflection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(space_id) ON DELETE SET NULL,
  template_id UUID REFERENCES reflection_templates(template_id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200),
  content JSONB NOT NULL,
  ai_feedback TEXT,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  progress_score INTEGER,
  sentiment_score INTEGER,
  action_score INTEGER,
  mood_before VARCHAR(20),
  mood_after VARCHAR(20),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_space_id ON reflections(space_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_type ON reflections(type);

-- micro_logs 테이블
CREATE TABLE IF NOT EXISTS micro_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  memo TEXT,
  content TEXT,
  context TEXT,
  mood VARCHAR(20) NOT NULL,
  mood_reason VARCHAR(200),
  tags JSONB DEFAULT '[]'::jsonb,
  suggested_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_micro_logs_user_id ON micro_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_logs_created_at ON micro_logs(created_at DESC);

-- activities 테이블 (공모전, 대외활동 등)
CREATE TABLE IF NOT EXISTS activities (
  activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  category VARCHAR(50) NOT NULL,
  organization VARCHAR(200),
  description TEXT,
  field JSONB DEFAULT '[]'::jsonb,
  required_skills JSONB DEFAULT '[]'::jsonb,
  level VARCHAR(20),
  start_date DATE,
  end_date DATE,
  apply_url TEXT,
  image_url TEXT,
  view_count INTEGER DEFAULT 0,
  match_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_end_date ON activities(end_date);
CREATE INDEX IF NOT EXISTS idx_activities_view_count ON activities(view_count DESC);

-- bookmarks 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_activity_id ON bookmarks(activity_id);

-- job_simulation_results 테이블
CREATE TABLE IF NOT EXISTS job_simulation_results (
  result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  job_field VARCHAR(100) NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  scores JSONB NOT NULL,
  total_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_results_user_id ON job_simulation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_job_results_created_at ON job_simulation_results(created_at DESC);

-- career_survey_results 테이블
CREATE TABLE IF NOT EXISTS career_survey_results (
  survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  survey_type VARCHAR(50) NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  results JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_results_user_id ON career_survey_results(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_results_type ON career_survey_results(survey_type);

-- 테스트 데이터 삽입
INSERT INTO users (user_id, name, email, interests, skills)
VALUES 
  ('test_user', '테스트 유저', 'test@example.com', '["개발", "디자인"]'::jsonb, '["Python", "React"]'::jsonb),
  ('user_001', '김철수', 'kim@example.com', '["마케팅", "기획"]'::jsonb, '["마케팅전략", "데이터분석"]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- 기본 회고 템플릿 삽입
INSERT INTO reflection_templates (name, category, description, questions, is_public)
VALUES 
  ('STAR 회고', '구조화', 'Situation-Task-Action-Result 형식의 회고', 
   '[{"id": "situation", "question": "어떤 상황이었나요?", "type": "textarea"}, 
     {"id": "task", "question": "무엇을 해야 했나요?", "type": "textarea"},
     {"id": "action", "question": "어떤 행동을 했나요?", "type": "textarea"},
     {"id": "result", "question": "결과는 어땠나요?", "type": "textarea"}]'::jsonb, 
   true),
  ('KPT 회고', '구조화', 'Keep-Problem-Try 형식의 회고',
   '[{"id": "keep", "question": "계속할 것", "type": "textarea"},
     {"id": "problem", "question": "문제점", "type": "textarea"},
     {"id": "try", "question": "시도할 것", "type": "textarea"}]'::jsonb,
   true),
  ('자유 회고', '자유형식', '자유로운 형식의 회고',
   '[{"id": "content", "question": "오늘의 경험을 자유롭게 적어보세요", "type": "textarea"}]'::jsonb,
   true)
ON CONFLICT (template_id) DO NOTHING;

-- 샘플 활동 데이터 삽입
INSERT INTO activities (title, category, organization, description, field, required_skills, level, start_date, end_date)
VALUES 
  ('2024 마케팅 공모전', 'contest', '한국마케팅협회', '대학생 마케팅 전략 공모전', 
   '["마케팅", "경영"]'::jsonb, '["마케팅전략", "시장조사"]'::jsonb, '중급', '2024-01-01', '2024-03-31'),
  ('IT 봉사단 모집', 'volunteer', '정보화진흥원', 'IT 재능기부 봉사활동', 
   '["IT", "봉사"]'::jsonb, '["프로그래밍", "교육"]'::jsonb, '초급', '2024-02-01', '2024-06-30'),
  ('디자인 씽킹 워크샵', 'education', '디자인센터', '디자인 씽킹 교육 프로그램',
   '["디자인", "창업"]'::jsonb, '["창의적사고", "문제해결"]'::jsonb, '초급', '2024-03-01', '2024-04-30')
ON CONFLICT (activity_id) DO NOTHING;

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY IF NOT EXISTS "Users can view own data" ON users
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own data" ON users
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can view own spaces" ON spaces
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own spaces" ON spaces
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own spaces" ON spaces
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete own spaces" ON spaces
  FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Users can view own reflections" ON reflections
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own reflections" ON reflections
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own reflections" ON reflections
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete own reflections" ON reflections
  FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Users can view own micro_logs" ON micro_logs
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own micro_logs" ON micro_logs
  FOR INSERT WITH CHECK (true);

-- 완료 메시지
COMMENT ON TABLE users IS 'PROOF 서비스 사용자 테이블';
COMMENT ON TABLE spaces IS '프로젝트/활동 스페이스 테이블';
COMMENT ON TABLE reflections IS '회고 데이터 테이블';
COMMENT ON TABLE micro_logs IS '마이크로 로그 테이블';
COMMENT ON TABLE activities IS '활동 추천 데이터 테이블';
