-- 공모전/프로젝트/대외활동 활동 테이블 생성
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('contest', 'external_activity', 'project', 'club', 'volunteer', 'internship')),
    target_jobs TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    benefits TEXT,
    eligibility TEXT,
    start_date DATE,
    end_date DATE,
    application_start DATE,
    application_end DATE,
    activity_url TEXT,
    image_url TEXT,
    contact_info TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    source_site TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 북마크 테이블
CREATE TABLE IF NOT EXISTS user_activity_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_target_jobs ON activities USING GIN(target_jobs);
CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_application_end ON activities(application_end DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_activity_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_activity_id ON user_activity_bookmarks(activity_id);

-- RLS 정책 활성화
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_bookmarks ENABLE ROW LEVEL SECURITY;

-- activities 테이블: 모든 사용자가 읽기 가능
CREATE POLICY "Activities are viewable by everyone" ON activities
    FOR SELECT USING (true);

-- user_activity_bookmarks: 자신의 북마크만 관리 가능
CREATE POLICY "Users can view own bookmarks" ON user_activity_bookmarks
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can insert own bookmarks" ON user_activity_bookmarks
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete own bookmarks" ON user_activity_bookmarks
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');
