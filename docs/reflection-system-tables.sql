-- Reflection Templates Table
CREATE TABLE IF NOT EXISTS reflection_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON reflection_templates(category);
CREATE INDEX idx_templates_usage ON reflection_templates(usage_count DESC);

-- Reflection Spaces Table
CREATE TABLE IF NOT EXISTS reflection_spaces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reflection_cycle TEXT NOT NULL,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    next_reflection_date TIMESTAMP WITH TIME ZONE,
    total_reflections INTEGER DEFAULT 0,
    expected_reflections INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_spaces_user ON reflection_spaces(user_id);
CREATE INDEX idx_spaces_status ON reflection_spaces(status);
CREATE INDEX idx_spaces_next_date ON reflection_spaces(next_reflection_date);

-- Enhanced Reflections Table (add new columns)
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS space_id TEXT REFERENCES reflection_spaces(id) ON DELETE CASCADE;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES reflection_templates(id) ON DELETE SET NULL;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS progress_score INTEGER;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS ai_keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS ai_sentiment_score DECIMAL(3,2);
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS reflection_date DATE;

CREATE INDEX IF NOT EXISTS idx_reflections_space ON reflections(space_id);
CREATE INDEX IF NOT EXISTS idx_reflections_template ON reflections(template_id);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(reflection_date);
CREATE INDEX IF NOT EXISTS idx_reflections_mood ON reflections(mood);

-- AI Analysis Cache Table
CREATE TABLE IF NOT EXISTS reflection_ai_analysis (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_id TEXT REFERENCES reflection_spaces(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    metrics JSONB NOT NULL,
    strengths JSONB NOT NULL,
    improvements JSONB NOT NULL,
    next_steps JSONB NOT NULL,
    charts JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 hours')
);

CREATE INDEX idx_ai_analysis_user ON reflection_ai_analysis(user_id);
CREATE INDEX idx_ai_analysis_space ON reflection_ai_analysis(space_id);
CREATE INDEX idx_ai_analysis_expires ON reflection_ai_analysis(expires_at);

-- Growth Metrics Table
CREATE TABLE IF NOT EXISTS growth_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    avg_progress_score DECIMAL(3,2),
    total_reflections INTEGER DEFAULT 0,
    keyword_count INTEGER DEFAULT 0,
    completion_rate INTEGER DEFAULT 0,
    project_completion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_metrics_user_date ON growth_metrics(user_id, date DESC);

-- Update timestamp trigger for spaces
CREATE OR REPLACE FUNCTION update_reflection_space_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reflection_space_timestamp
    BEFORE UPDATE ON reflection_spaces
    FOR EACH ROW
    EXECUTE FUNCTION update_reflection_space_timestamp();

-- Update space reflections count trigger
CREATE OR REPLACE FUNCTION update_space_reflection_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reflection_spaces 
        SET total_reflections = total_reflections + 1 
        WHERE id = NEW.space_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reflection_spaces 
        SET total_reflections = total_reflections - 1 
        WHERE id = OLD.space_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_space_reflection_count
    AFTER INSERT OR DELETE ON reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_space_reflection_count();

-- Update template usage count trigger
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.template_id IS NOT NULL THEN
        UPDATE reflection_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_usage_count
    AFTER INSERT ON reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_template_usage_count();

-- Insert default reflection templates
INSERT INTO reflection_templates (id, name, description, category, questions) VALUES
(
    'kpt',
    'KPT 회고',
    '유지할 점(Keep), 문제점(Problem), 시도할 점(Try)을 정리하는 기본 회고 템플릿입니다.',
    '기본',
    '["Keep: 이번 활동에서 잘한 점, 유지하고 싶은 점은 무엇인가요?", 
      "Problem: 어려웠거나 개선이 필요한 점은 무엇인가요?", 
      "Try: 다음에 새롭게 시도하고 싶은 점은 무엇인가요?"]'::jsonb
),
(
    '4f',
    '4F 회고',
    '사실(Fact), 느낌(Feeling), 발견(Finding), 향후 행동(Future action)을 기록하는 심화 회고 템플릿입니다.',
    '심화',
    '["Fact: 이번 활동에서 있었던 객관적인 사실은 무엇인가요?", 
      "Feeling: 그때 어떤 감정을 느꼈나요?", 
      "Finding: 이 경험에서 무엇을 배웠나요?", 
      "Future action: 다음에는 어떻게 행동할 것인가요?"]'::jsonb
),
(
    'start-stop-continue',
    'Start-Stop-Continue 회고',
    '새로 시작할 것, 그만둘 것, 계속할 것을 정리하는 행동 중심 회고 템플릿입니다.',
    '기본',
    '["Start: 새롭게 시작해야 할 행동이나 습관은 무엇인가요?", 
      "Stop: 그만두어야 할 행동이나 습관은 무엇인가요?", 
      "Continue: 계속 유지해야 할 좋은 행동이나 습관은 무엇인가요?"]'::jsonb
),
(
    'mad-sad-glad',
    'Mad-Sad-Glad 회고',
    '화났던 것(Mad), 슬펐던 것(Sad), 기뻤던 것(Glad)을 기록하는 감정 중심 회고 템플릿입니다.',
    '감정',
    '["Mad: 화나거나 짜증났던 순간은 언제였나요?", 
      "Sad: 아쉽거나 슬펐던 순간은 언제였나요?", 
      "Glad: 기뻤거나 뿌듯했던 순간은 언제였나요?"]'::jsonb
),
(
    '5why',
    '5Why 분석',
    '문제의 근본 원인을 찾기 위해 5번의 "왜?"를 반복하는 분석 회고 템플릿입니다.',
    '분석',
    '["발생한 문제나 어려움은 무엇인가요?", 
      "왜 그런 일이 발생했나요? (1차)", 
      "왜 그렇게 되었나요? (2차)", 
      "더 깊이 들어가면, 왜 그런 상황이 되었나요? (3차)", 
      "근본적인 원인은 무엇인가요? (4차)", 
      "이 원인을 해결하기 위한 방법은 무엇인가요? (5차)"]'::jsonb
),
(
    'weekly-review',
    '주간 회고',
    '한 주를 돌아보며 성과, 어려움, 다음 주 계획을 정리하는 정기 회고 템플릿입니다.',
    '정기',
    '["이번 주 가장 큰 성과는 무엇인가요?", 
      "이번 주 가장 어려웠던 점은 무엇인가요?", 
      "이번 주 배운 가장 중요한 것은 무엇인가요?", 
      "다음 주에 집중할 3가지 목표는 무엇인가요?", 
      "이번 주 나에게 주고 싶은 피드백은 무엇인가요?"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create view for active spaces with reflection stats
CREATE OR REPLACE VIEW v_active_spaces AS
SELECT 
    s.*,
    COUNT(r.id) FILTER (WHERE r.reflection_date >= CURRENT_DATE - INTERVAL '30 days') as recent_reflections_30d,
    AVG(r.progress_score) as avg_progress_score,
    CASE 
        WHEN s.reflection_cycle = 'daily' THEN 
            (s.end_date - s.start_date) + 1
        WHEN s.reflection_cycle = 'weekly' THEN 
            CEIL((s.end_date - s.start_date)::numeric / 7)
        WHEN s.reflection_cycle = 'biweekly' THEN 
            CEIL((s.end_date - s.start_date)::numeric / 14)
        WHEN s.reflection_cycle = 'monthly' THEN 
            CEIL((s.end_date - s.start_date)::numeric / 30)
    END as expected_reflections_calc
FROM reflection_spaces s
LEFT JOIN reflections r ON s.id = r.space_id
WHERE s.status = 'active'
GROUP BY s.id;

-- Cleanup expired AI analysis cache (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM reflection_ai_analysis WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
