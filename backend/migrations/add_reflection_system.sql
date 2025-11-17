-- Migration: Add Reflection v3 System
-- Date: 2025-11-14
-- Description: users 테이블에 baseline_mood 추가 및 micro_logs 테이블 생성

-- 1. users 테이블에 baseline_mood 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS baseline_mood VARCHAR(20) CHECK (baseline_mood IN ('tired', 'neutral', 'positive'));

COMMENT ON COLUMN users.baseline_mood IS '사용자 평소 기분 상태 (회고 v3 시스템)';

-- 2. micro_logs 테이블 생성
CREATE TABLE IF NOT EXISTS micro_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('contest', 'club', 'project', 'internship', 'study', 'etc')),
  memo TEXT,
  mood_compare VARCHAR(20) NOT NULL CHECK (mood_compare IN ('worse', 'same', 'better')),
  reason VARCHAR(50),
  tags JSONB DEFAULT '[]'::jsonb,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_micro_logs_user_id ON micro_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_logs_date ON micro_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_logs_user_date ON micro_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_logs_tags ON micro_logs USING GIN(tags);

-- 4. 제약 조건 추가
ALTER TABLE micro_logs 
ADD CONSTRAINT IF NOT EXISTS chk_reason_when_not_same 
CHECK (
  (mood_compare = 'same' AND reason IS NULL) OR
  (mood_compare != 'same' AND reason IS NOT NULL)
);

-- 5. 코멘트 추가
COMMENT ON TABLE micro_logs IS '회고 v3 시스템 - 초라이트 기록 (Micro Log)';
COMMENT ON COLUMN micro_logs.activity_type IS '활동 유형: contest(공모전), club(동아리), project(프로젝트), internship(인턴), study(공부), etc(기타)';
COMMENT ON COLUMN micro_logs.memo IS '활동 메모 (최대 500자)';
COMMENT ON COLUMN micro_logs.mood_compare IS '베이스라인 대비 기분: worse(나쁨), same(같음), better(좋음)';
COMMENT ON COLUMN micro_logs.reason IS '무드 이유 코드 (positive_001~006 또는 negative_001~006)';
COMMENT ON COLUMN micro_logs.tags IS 'AI 제안 또는 사용자 선택 태그 배열 (JSON)';
COMMENT ON COLUMN micro_logs.date IS '활동 날짜';
