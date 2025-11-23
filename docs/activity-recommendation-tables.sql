-- 활동 추천 시스템 데이터베이스 스키마

-- 1. activities (활동 정보)
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
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
    crawled_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- 상금/혜택
    prize_money BIGINT, -- 상금 (원)
    prize_details JSONB, -- {"1st": 1000000, "2nd": 500000}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_end_date ON activities(application_end_date);
CREATE INDEX IF NOT EXISTS idx_activities_fields ON activities USING GIN(fields);
CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activities_majors ON activities USING GIN(recommended_majors);
CREATE INDEX IF NOT EXISTS idx_activities_keywords ON activities USING GIN(keywords);

-- 2. user_bookmarks (사용자 북마크)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_activity ON user_bookmarks(activity_id);

-- 3. user_activity_applications (지원 내역)
CREATE TABLE IF NOT EXISTS user_activity_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'accepted', 'rejected', 'completed'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON user_activity_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_activity ON user_activity_applications(activity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON user_activity_applications(status);

-- 4. user_preferences (사용자 추천 설정)
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
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
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- 5. activity_recommendations (추천 로그)
CREATE TABLE IF NOT EXISTS activity_recommendations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    
    -- 추천 점수
    match_score DECIMAL(3,2) NOT NULL, -- 0.0 ~ 1.0
    reasons JSONB, -- {"major_match": 0.3, "keyword_match": 0.5}
    
    -- 사용자 반응
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bookmarked BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON activity_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON activity_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_activity ON activity_recommendations(activity_id);

-- Update timestamp trigger for activities
CREATE OR REPLACE FUNCTION update_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activity_timestamp
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

-- Update timestamp trigger for user_activity_applications
CREATE TRIGGER trigger_update_application_timestamp
    BEFORE UPDATE ON user_activity_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

-- Update timestamp trigger for user_preferences
CREATE TRIGGER trigger_update_preference_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

-- Increment bookmark count function
CREATE OR REPLACE FUNCTION increment_bookmark_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET bookmark_count = bookmark_count + 1
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- Decrement bookmark count function
CREATE OR REPLACE FUNCTION decrement_bookmark_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET bookmark_count = GREATEST(bookmark_count - 1, 0)
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_view_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET view_count = view_count + 1
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- View for active activities with days left
CREATE OR REPLACE VIEW v_active_activities AS
SELECT 
    a.*,
    CASE 
        WHEN a.application_end_date >= CURRENT_DATE THEN 
            (a.application_end_date - CURRENT_DATE)
        ELSE 0
    END as days_left,
    EXISTS(
        SELECT 1 FROM user_bookmarks ub 
        WHERE ub.activity_id = a.id
    ) as has_bookmarks
FROM activities a
WHERE a.status = 'active' 
  AND a.application_end_date >= CURRENT_DATE
ORDER BY a.application_end_date ASC;

-- 샘플 데이터 삽입
INSERT INTO activities (
    title, organization, category, type, description,
    fields, tags, keywords, recommended_majors,
    start_date, end_date, application_start_date, application_end_date,
    difficulty_level, prize_money, url, status, source
) VALUES
(
    '2025 AI 챌린지 해커톤',
    '네이버',
    'contest',
    '해커톤',
    'AI 기술을 활용한 혁신적인 서비스 개발 해커톤입니다.',
    ARRAY['IT', 'AI'],
    ARRAY['인공지능', '머신러닝', '딥러닝', '개발'],
    ARRAY['AI', '머신러닝', 'Python', 'TensorFlow'],
    ARRAY['컴퓨터공학', '소프트웨어공학', '인공지능학과'],
    '2025-02-01',
    '2025-02-03',
    '2025-01-01',
    '2025-01-25',
    'intermediate',
    10000000,
    'https://example.com/ai-hackathon',
    'active',
    'manual'
),
(
    '2025 창업 아이디어 공모전',
    '중소벤처기업부',
    'contest',
    '공모전',
    '혁신적인 창업 아이디어를 발굴하는 공모전입니다.',
    ARRAY['기획', '경영'],
    ARRAY['창업', '비즈니스', '아이디어'],
    ARRAY['창업', '비즈니스모델', '혁신'],
    ARRAY['경영학', '경제학', '전공무관'],
    '2025-03-01',
    '2025-05-31',
    '2025-01-15',
    '2025-02-28',
    'beginner',
    5000000,
    'https://example.com/startup-contest',
    'active',
    'manual'
),
(
    'UX/UI 디자인 공모전',
    '삼성전자',
    'contest',
    '공모전',
    '사용자 경험을 혁신하는 디자인 공모전입니다.',
    ARRAY['디자인'],
    ARRAY['UX', 'UI', '디자인', '사용자경험'],
    ARRAY['UX', 'UI', 'Figma', '프로토타입'],
    ARRAY['시각디자인', '산업디자인', '인터랙션디자인'],
    '2025-02-15',
    '2025-04-15',
    '2025-01-20',
    '2025-02-10',
    'intermediate',
    3000000,
    'https://example.com/ux-contest',
    'active',
    'manual'
),
(
    '대학생 IT 멘토링 프로그램',
    '구글',
    'internship',
    '멘토링',
    '현직 개발자와 함께하는 3개월 멘토링 프로그램입니다.',
    ARRAY['IT'],
    ARRAY['개발', '멘토링', '취업'],
    ARRAY['프로그래밍', '코딩', '개발자'],
    ARRAY['컴퓨터공학', '소프트웨어공학'],
    '2025-03-01',
    '2025-05-31',
    '2025-01-10',
    '2025-02-20',
    'beginner',
    0,
    'https://example.com/it-mentoring',
    'active',
    'manual'
),
(
    '빅데이터 분석 경진대회',
    '한국데이터산업진흥원',
    'contest',
    '경진대회',
    '공공 데이터를 활용한 빅데이터 분석 경진대회입니다.',
    ARRAY['IT', '데이터'],
    ARRAY['빅데이터', '데이터분석', '통계'],
    ARRAY['데이터분석', 'Python', 'R', '통계'],
    ARRAY['통계학', '컴퓨터공학', '산업공학'],
    '2025-02-01',
    '2025-04-30',
    '2025-01-05',
    '2025-01-31',
    'advanced',
    7000000,
    'https://example.com/bigdata-contest',
    'active',
    'manual'
)
ON CONFLICT (id) DO NOTHING;
