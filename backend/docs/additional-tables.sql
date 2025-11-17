-- ================================================
-- PROOF 백엔드 완전 구현을 위한 추가 테이블
-- ================================================

-- 1. reflection_settings (회고 설정)
CREATE TABLE IF NOT EXISTS reflection_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('daily', 'weekly', 'biweekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  reminder_time TIME,
  questions JSONB DEFAULT '[]'::jsonb,
  next_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. reflections (회고 데이터)
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('daily', 'weekly', 'biweekly', 'monthly')),
  content TEXT NOT NULL,
  answers JSONB DEFAULT '[]'::jsonb,
  mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'normal', 'bad', 'terrible')),
  progress_score INTEGER CHECK (progress_score >= 1 AND progress_score <= 10),
  ai_feedback TEXT,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  extracted_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. activities (추천 활동)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('contest', 'project', 'club', 'internship')),
  category VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  organization VARCHAR(200),
  description TEXT,
  level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  deadline DATE,
  prize VARCHAR(200),
  tags TEXT[],
  url TEXT,
  image_url TEXT,
  requirements JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  prizes JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. bookmarks (북마크)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- 5. team_members (팀원)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  is_leader BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 인덱스 생성
-- ================================================

-- reflection_settings 인덱스
CREATE INDEX IF NOT EXISTS idx_reflection_settings_user_id ON reflection_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_settings_log_id ON reflection_settings(log_id);
CREATE INDEX IF NOT EXISTS idx_reflection_settings_project_id ON reflection_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_reflection_settings_next_reminder ON reflection_settings(next_reminder_at) WHERE enabled = true;

-- reflections 인덱스
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_log_id ON reflections(log_id);
CREATE INDEX IF NOT EXISTS idx_reflections_project_id ON reflections(project_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_cycle ON reflections(cycle);

-- activities 인덱스
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_level ON activities(level);
CREATE INDEX IF NOT EXISTS idx_activities_deadline ON activities(deadline);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);

-- bookmarks 인덱스
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_activity_id ON bookmarks(activity_id);

-- team_members 인덱스
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ================================================
-- 트리거: updated_at 자동 업데이트
-- ================================================

-- reflection_settings 트리거
CREATE OR REPLACE FUNCTION update_reflection_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reflection_settings_updated_at
  BEFORE UPDATE ON reflection_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_reflection_settings_updated_at();

-- reflections 트리거
CREATE OR REPLACE FUNCTION update_reflections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reflections_updated_at
  BEFORE UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_reflections_updated_at();

-- ================================================
-- 샘플 데이터: activities
-- ================================================

INSERT INTO activities (type, category, title, organization, description, level, deadline, prize, tags, url, image_url) VALUES
('contest', 'marketing', '2024 롯데 마케팅 공모전', '롯데그룹', '혁신적인 마케팅 전략을 제안하는 공모전', 'intermediate', '2024-12-31', '대상 500만원', ARRAY['마케팅', '전략기획', '브랜딩'], 'https://www.lotte.co.kr/contest', 'https://example.com/lotte.jpg'),
('contest', 'strategy', '현대카드 비즈니스 전략 공모전', '현대카드', '혁신적인 비즈니스 전략 제안', 'advanced', '2024-11-30', '대상 300만원', ARRAY['전략기획', '경영분석'], 'https://www.hyundaicard.com', 'https://example.com/hyundai.jpg'),
('internship', 'finance', 'KB국민은행 디지털금융 인턴', 'KB국민은행', '디지털 금융 혁신 프로젝트 참여', 'beginner', '2024-10-31', '인턴 수료증', ARRAY['금융', '디지털혁신'], 'https://www.kbstar.com', 'https://example.com/kb.jpg'),
('club', 'development', '서버랩 D-1 학회', '서강대학교', '서버 개발 및 클라우드 학습', 'intermediate', NULL, NULL, ARRAY['개발', '서버', '클라우드'], 'https://serverlab.com', 'https://example.com/serverlab.jpg'),
('project', 'strategy', '경영전략 프로젝트 챌린지', '한국경영학회', '기업 전략 분석 및 제안', 'intermediate', '2024-12-15', '우수상 200만원', ARRAY['전략기획', '경영분석', '컨설팅'], 'https://kma.or.kr', 'https://example.com/kma.jpg')
ON CONFLICT DO NOTHING;

-- ================================================
-- 완료
-- ================================================

-- 모든 테이블이 생성되었습니다.
-- 다음 명령어로 테이블 목록 확인:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
