-- STAR 회고 저장 테이블 생성
CREATE TABLE IF NOT EXISTS star_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    answers JSONB NOT NULL,
    competencies TEXT[] NOT NULL,
    competency_scores JSONB NOT NULL,
    competency_analysis JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_star_reflections_user_id ON star_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_star_reflections_created_at ON star_reflections(created_at DESC);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_star_reflections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_star_reflections_updated_at
    BEFORE UPDATE ON star_reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_star_reflections_updated_at();

-- 코멘트 추가
COMMENT ON TABLE star_reflections IS 'STAR 기법 기반 경험 회고 저장';
COMMENT ON COLUMN star_reflections.user_id IS '사용자 ID';
COMMENT ON COLUMN star_reflections.template_id IS '회고 템플릿 ID';
COMMENT ON COLUMN star_reflections.template_name IS '회고 템플릿 이름';
COMMENT ON COLUMN star_reflections.answers IS 'STAR 답변 (situation, task, action, result)';
COMMENT ON COLUMN star_reflections.competencies IS '발휘된 역량 목록';
COMMENT ON COLUMN star_reflections.competency_scores IS '역량별 점수';
COMMENT ON COLUMN star_reflections.competency_analysis IS '역량 분석 상세 결과 (evidence, reason, analysis, summary 포함)';
