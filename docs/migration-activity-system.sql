"""
Supabase 마이그레이션: 활동 추천 시스템 테이블 생성

Supabase SQL Editor에서 실행하세요.
"""

-- 불필요한 테이블 삭제 (프로젝트와 관련 없음)
DROP TABLE IF EXISTS reflection_settings CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- activities 테이블 생성
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(500) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    target_audience TEXT[],
    start_date DATE,
    end_date DATE,
    application_start_date DATE,
    application_end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    fields VARCHAR(100)[],
    tags VARCHAR(50)[],
    keywords VARCHAR(100)[],
    recommended_majors VARCHAR(100)[],
    difficulty_level VARCHAR(20),
    url TEXT UNIQUE,
    image_url TEXT,
    apply_url TEXT,
    source VARCHAR(100),
    crawled_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    prize_money BIGINT,
    prize_details JSONB,
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
CREATE INDEX IF NOT EXISTS idx_activities_url ON activities(url);

-- user_bookmarks 테이블
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_activity ON user_bookmarks(activity_id);

-- user_activity_applications 테이블
CREATE TABLE IF NOT EXISTS user_activity_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'applied',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON user_activity_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_activity ON user_activity_applications(activity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON user_activity_applications(status);

-- user_preferences 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    interested_fields VARCHAR(100)[],
    interested_categories VARCHAR(50)[],
    skill_keywords VARCHAR(100)[],
    exclude_categories VARCHAR(50)[],
    min_prize_money BIGINT,
    preferred_difficulty VARCHAR(20),
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_frequency VARCHAR(20) DEFAULT 'weekly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- activity_recommendations 테이블
CREATE TABLE IF NOT EXISTS activity_recommendations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    match_score DECIMAL(3,2) NOT NULL,
    reasons JSONB,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bookmarked BOOLEAN DEFAULT FALSE,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON activity_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON activity_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_activity ON activity_recommendations(activity_id);

-- 트리거 함수
CREATE OR REPLACE FUNCTION update_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거
DROP TRIGGER IF EXISTS trigger_update_activity_timestamp ON activities;
CREATE TRIGGER trigger_update_activity_timestamp
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

DROP TRIGGER IF EXISTS trigger_update_application_timestamp ON user_activity_applications;
CREATE TRIGGER trigger_update_application_timestamp
    BEFORE UPDATE ON user_activity_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

DROP TRIGGER IF EXISTS trigger_update_preference_timestamp ON user_preferences;
CREATE TRIGGER trigger_update_preference_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_timestamp();

-- 북마크 카운트 함수
CREATE OR REPLACE FUNCTION increment_bookmark_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET bookmark_count = bookmark_count + 1
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_bookmark_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET bookmark_count = GREATEST(bookmark_count - 1, 0)
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(activity_uuid TEXT)
RETURNS void AS $$
BEGIN
    UPDATE activities
    SET view_count = view_count + 1
    WHERE id = activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- 샘플 데이터 삽입
INSERT INTO activities (
    title, organization, category, type, description,
    fields, tags, keywords, recommended_majors,
    application_end_date, difficulty_level, prize_money,
    url, status, source
) VALUES
(
    '2025 네이버 AI 해커톤',
    '네이버',
    'contest',
    '해커톤',
    'AI 기술을 활용한 혁신적인 서비스 개발 해커톤입니다. 팀 단위로 참가하여 48시간 동안 AI 서비스를 개발합니다.',
    ARRAY['IT', 'AI'],
    ARRAY['인공지능', '머신러닝', '딥러닝', '해커톤'],
    ARRAY['AI', '머신러닝', 'Python', 'TensorFlow', 'PyTorch'],
    ARRAY['컴퓨터공학', '소프트웨어공학', '인공지능학과', '전공무관'],
    '2025-02-28',
    'intermediate',
    10000000,
    'https://example.com/naver-ai-hackathon-2025',
    'active',
    'manual'
),
(
    '카카오 서포터즈 8기 모집',
    '카카오',
    'club',
    '서포터즈',
    '카카오 서비스를 경험하고 홍보하는 대학생 서포터즈입니다. 6개월 활동이며 다양한 혜택이 제공됩니다.',
    ARRAY['기획', '마케팅'],
    ARRAY['서포터즈', 'SNS', '마케팅', '브랜딩'],
    ARRAY['마케팅', 'SNS', '콘텐츠기획', '브랜드'],
    ARRAY['경영학', '광고홍보학', '미디어커뮤니케이션', '전공무관'],
    '2025-01-31',
    'beginner',
    0,
    'https://example.com/kakao-supporters-8',
    'active',
    'manual'
),
(
    '2025 대학생 광고 공모전',
    '한국광고총연합회',
    'contest',
    '공모전',
    '창의적인 광고 아이디어를 발굴하는 공모전입니다. 인쇄, 영상, 디지털 등 다양한 매체의 광고 작품을 출품할 수 있습니다.',
    ARRAY['기획', '디자인'],
    ARRAY['광고', '공모전', '크리에이티브'],
    ARRAY['광고기획', '디자인', '영상제작', '카피라이팅'],
    ARRAY['광고홍보학', '시각디자인', '미디어커뮤니케이션', '전공무관'],
    '2025-03-15',
    'beginner',
    5000000,
    'https://example.com/ad-contest-2025',
    'active',
    'manual'
),
(
    'UX/UI 디자인 공모전',
    '삼성전자',
    'contest',
    '공모전',
    '사용자 경험을 혁신하는 UX/UI 디자인 공모전입니다. 모바일 앱, 웹사이트, IoT 기기 등의 디자인을 제안할 수 있습니다.',
    ARRAY['디자인'],
    ARRAY['UX', 'UI', '디자인', '사용자경험'],
    ARRAY['UX', 'UI', 'Figma', '프로토타입', '사용자리서치'],
    ARRAY['시각디자인', '산업디자인', '인터랙션디자인', '전공무관'],
    '2025-02-20',
    'intermediate',
    3000000,
    'https://example.com/samsung-ux-contest',
    'active',
    'manual'
),
(
    '대학생 창업 동아리 모집',
    '중소벤처기업부',
    'club',
    '동아리',
    '예비 창업자를 위한 창업 동아리입니다. 멘토링, 사무공간, 창업 지원금 등이 제공됩니다.',
    ARRAY['경영', '기획'],
    ARRAY['창업', '스타트업', '비즈니스'],
    ARRAY['창업', '비즈니스모델', '사업계획서', '투자'],
    ARRAY['경영학', '경제학', '전공무관'],
    '2025-01-25',
    'beginner',
    0,
    'https://example.com/startup-club-2025',
    'active',
    'manual'
),
(
    '빅데이터 분석 프로젝트',
    '한국데이터산업진흥원',
    'project',
    '프로젝트',
    '공공 데이터를 활용한 빅데이터 분석 프로젝트입니다. 데이터 분석 역량을 키우고 실전 경험을 쌓을 수 있습니다.',
    ARRAY['IT', '데이터'],
    ARRAY['빅데이터', '데이터분석', '통계'],
    ARRAY['데이터분석', 'Python', 'R', '통계', '머신러닝'],
    ARRAY['통계학', '컴퓨터공학', '산업공학', '전공무관'],
    '2025-03-10',
    'intermediate',
    7000000,
    'https://example.com/bigdata-project-2025',
    'active',
    'manual'
),
(
    'AI 스타트업 해커톤',
    '구글 스타트업',
    'contest',
    '해커톤',
    'AI 기반 스타트업 아이디어를 구현하는 해커톤입니다. 우수 팀에게는 투자 유치 기회가 제공됩니다.',
    ARRAY['IT', '경영'],
    ARRAY['AI', '스타트업', '해커톤'],
    ARRAY['인공지능', '창업', '비즈니스모델', '프로토타입'],
    ARRAY['컴퓨터공학', '경영학', '전공무관'],
    '2025-02-15',
    'advanced',
    15000000,
    'https://example.com/google-ai-hackathon',
    'active',
    'manual'
),
(
    '환경 보호 캠페인 서포터즈',
    '환경부',
    'club',
    '서포터즈',
    '환경 보호 활동을 기획하고 실천하는 서포터즈입니다. 캠페인 활동, SNS 홍보 등을 진행합니다.',
    ARRAY['환경', '사회'],
    ARRAY['환경', '캠페인', '봉사'],
    ARRAY['환경보호', '지속가능', '캠페인', 'SNS'],
    ARRAY['환경공학', '생명과학', '전공무관'],
    '2025-01-20',
    'beginner',
    0,
    'https://example.com/env-supporters-2025',
    'active',
    'manual'
)
ON CONFLICT (url) DO NOTHING;

-- 활성 활동 뷰
CREATE OR REPLACE VIEW v_active_activities AS
SELECT 
    a.*,
    CASE 
        WHEN a.application_end_date >= CURRENT_DATE THEN 
            (a.application_end_date - CURRENT_DATE)
        ELSE 0
    END as days_left
FROM activities a
WHERE a.status = 'active' 
  AND a.application_end_date >= CURRENT_DATE
ORDER BY a.application_end_date ASC;
