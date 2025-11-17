# PROOF Database Schema - Supabase 구성

**작성일**: 2024년 11월 14일  
**데이터베이스**: Supabase (PostgreSQL 기반)  
**연동 도구**: MCP (Model Context Protocol)

---

## 📋 개요

이 문서는 PROOF 서비스의 Supabase 데이터베이스 스키마를 정의합니다.
- **백엔드**: Python FastAPI (localhost:8000)
- **프론트엔드**: Next.js 14 (localhost:3000)
- **인증 방식**: x-user-id 헤더 기반 (Supabase Auth 미사용)

---

## 🗂️ 테이블 구조

### 1. users (사용자)
사용자 기본 정보를 저장합니다.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  university VARCHAR(100),
  major VARCHAR(100),
  profile_image TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 코멘트
COMMENT ON TABLE users IS '사용자 기본 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID (x-user-id로 사용)';
COMMENT ON COLUMN users.email IS '이메일 (로그인 ID)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 해시된 비밀번호';
```

---

### 2. projects (프로젝트)
사용자의 프로젝트/공모전/활동을 저장합니다.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  type VARCHAR(50),
  tags TEXT[],
  ai_summary TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- 체크 제약
ALTER TABLE projects ADD CONSTRAINT chk_projects_status 
  CHECK (status IN ('active', 'completed', 'archived'));

ALTER TABLE projects ADD CONSTRAINT chk_projects_type 
  CHECK (type IN ('contest', 'club', 'internship', 'project', 'other'));

-- 코멘트
COMMENT ON TABLE projects IS '프로젝트/공모전/활동';
COMMENT ON COLUMN projects.status IS '상태: active(진행중), completed(완료), archived(보관)';
COMMENT ON COLUMN projects.type IS '타입: contest(공모전), club(동아리), internship(인턴), project(프로젝트)';
COMMENT ON COLUMN projects.ai_summary IS 'AI가 생성한 프로젝트 요약';
```

---

### 3. logs (경험 로그/공고)
사용자의 일일 경험 기록 및 공고 정보를 저장합니다.

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  reflection TEXT,
  date DATE NOT NULL,
  period VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_project_id ON logs(project_id);
CREATE INDEX idx_logs_date ON logs(date DESC);
CREATE INDEX idx_logs_period ON logs(period);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- 전체 텍스트 검색 인덱스
CREATE INDEX idx_logs_title_trgm ON logs USING gin(title gin_trgm_ops);
CREATE INDEX idx_logs_content_trgm ON logs USING gin(content gin_trgm_ops);

-- 체크 제약
ALTER TABLE logs ADD CONSTRAINT chk_logs_period 
  CHECK (period IN ('서류 준비', '서류 합격', '면접 합격', NULL));

-- 코멘트
COMMENT ON TABLE logs IS '경험 로그 및 공고 정보';
COMMENT ON COLUMN logs.content IS '원본 텍스트 (사용자 입력)';
COMMENT ON COLUMN logs.reflection IS 'AI가 생성한 회고';
COMMENT ON COLUMN logs.period IS '진행 상태: 서류 준비, 서류 합격, 면접 합격';
```

---

### 4. keywords (역량 키워드 마스터)
역량 키워드 마스터 리스트입니다.

```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  related_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_keywords_category ON keywords(category);
CREATE INDEX idx_keywords_name ON keywords(name);

-- 코멘트
COMMENT ON TABLE keywords IS '역량 키워드 마스터 리스트';
COMMENT ON COLUMN keywords.category IS '카테고리: 전략기획, 마케팅, 개발 등';
COMMENT ON COLUMN keywords.related_keywords IS '연관 키워드 배열';
```

---

### 5. user_keywords (사용자-키워드 매핑)
사용자가 보유한 역량 키워드와 레벨을 저장합니다.

```sql
CREATE TABLE user_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, keyword_id)
);

-- 인덱스
CREATE INDEX idx_user_keywords_user_id ON user_keywords(user_id);
CREATE INDEX idx_user_keywords_keyword_id ON user_keywords(keyword_id);
CREATE INDEX idx_user_keywords_level ON user_keywords(level DESC);

-- 체크 제약
ALTER TABLE user_keywords ADD CONSTRAINT chk_user_keywords_level 
  CHECK (level >= 1 AND level <= 3);

-- 코멘트
COMMENT ON TABLE user_keywords IS '사용자별 역량 키워드 보유 현황';
COMMENT ON COLUMN user_keywords.level IS '레벨: 1(기본), 2(동료인증), 3(증명서)';
COMMENT ON COLUMN user_keywords.last_used_at IS '마지막 사용(언급)된 날짜';
```

---

### 6. log_keywords (로그-키워드 매핑)
로그와 키워드의 다대다 관계를 저장합니다.

```sql
CREATE TABLE log_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(log_id, keyword_id)
);

-- 인덱스
CREATE INDEX idx_log_keywords_log_id ON log_keywords(log_id);
CREATE INDEX idx_log_keywords_keyword_id ON log_keywords(keyword_id);

-- 코멘트
COMMENT ON TABLE log_keywords IS '로그-키워드 매핑 (다대다)';
COMMENT ON COLUMN log_keywords.confidence IS 'AI 추출 신뢰도 (0.00~1.00)';
```

---

### 7. evidence (증명서/증빙자료)
사용자의 증명서 및 증빙 자료를 저장합니다.

```sql
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  ocr_text TEXT,
  ocr_confidence DECIMAL(3,2),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_evidence_user_id ON evidence(user_id);
CREATE INDEX idx_evidence_project_id ON evidence(project_id);
CREATE INDEX idx_evidence_type ON evidence(type);

-- 체크 제약
ALTER TABLE evidence ADD CONSTRAINT chk_evidence_type 
  CHECK (type IN ('certificate', 'award', 'internship', 'document', 'other'));

-- 코멘트
COMMENT ON TABLE evidence IS '증명서 및 증빙 자료';
COMMENT ON COLUMN evidence.type IS '타입: certificate(수료증), award(수상), internship(인턴), document(문서)';
COMMENT ON COLUMN evidence.ocr_text IS 'OCR로 추출한 텍스트';
COMMENT ON COLUMN evidence.ocr_confidence IS 'OCR 신뢰도 (0.00~1.00)';
COMMENT ON COLUMN evidence.verified_at IS '검증 완료 시각';
```

---

### 8. peer_endorsements (동료 인증)
동료 간 역량 인증 정보를 저장합니다.

```sql
CREATE TABLE peer_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(100),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_endorsements_from_user ON peer_endorsements(from_user_id);
CREATE INDEX idx_endorsements_to_user ON peer_endorsements(to_user_id);
CREATE INDEX idx_endorsements_project ON peer_endorsements(project_id);
CREATE INDEX idx_endorsements_status ON peer_endorsements(status);

-- 체크 제약
ALTER TABLE peer_endorsements ADD CONSTRAINT chk_endorsements_status 
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE peer_endorsements ADD CONSTRAINT chk_endorsements_not_self 
  CHECK (from_user_id != to_user_id);

-- 코멘트
COMMENT ON TABLE peer_endorsements IS '동료 인증 (Lv.2 달성)';
COMMENT ON COLUMN peer_endorsements.status IS '상태: pending(대기), approved(승인), rejected(거부)';
COMMENT ON COLUMN peer_endorsements.role IS '프로젝트에서의 역할';
```

---

### 9. endorsement_keywords (인증-키워드 매핑)
동료 인증과 키워드의 다대다 관계를 저장합니다.

```sql
CREATE TABLE endorsement_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorsement_id UUID NOT NULL REFERENCES peer_endorsements(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endorsement_id, keyword_id)
);

-- 인덱스
CREATE INDEX idx_endorsement_keywords_endorsement ON endorsement_keywords(endorsement_id);
CREATE INDEX idx_endorsement_keywords_keyword ON endorsement_keywords(keyword_id);

-- 코멘트
COMMENT ON TABLE endorsement_keywords IS '동료 인증-키워드 매핑';
```

---

### 10. portfolios (포트폴리오)
생성된 포트폴리오 정보를 저장합니다.

```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  target_job VARCHAR(100),
  template VARCHAR(50),
  settings JSONB,
  pdf_url TEXT,
  web_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_status ON portfolios(status);

-- 체크 제약
ALTER TABLE portfolios ADD CONSTRAINT chk_portfolios_status 
  CHECK (status IN ('draft', 'generating', 'completed', 'failed'));

-- 코멘트
COMMENT ON TABLE portfolios IS '생성된 포트폴리오';
COMMENT ON COLUMN portfolios.settings IS '포트폴리오 설정 (JSON)';
COMMENT ON COLUMN portfolios.status IS '상태: draft(초안), generating(생성중), completed(완료), failed(실패)';
```

---

### 11. portfolio_projects (포트폴리오-프로젝트 매핑)
포트폴리오에 포함된 프로젝트를 저장합니다.

```sql
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, project_id)
);

-- 인덱스
CREATE INDEX idx_portfolio_projects_portfolio ON portfolio_projects(portfolio_id);
CREATE INDEX idx_portfolio_projects_project ON portfolio_projects(project_id);

-- 코멘트
COMMENT ON TABLE portfolio_projects IS '포트폴리오-프로젝트 매핑';
COMMENT ON COLUMN portfolio_projects.display_order IS '표시 순서';
```

---

### 12. notifications (알림)
사용자 알림을 저장합니다.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 코멘트
COMMENT ON TABLE notifications IS '사용자 알림';
COMMENT ON COLUMN notifications.type IS '알림 타입: endorsement_request, portfolio_ready 등';
COMMENT ON COLUMN notifications.read_at IS '읽은 시각 (NULL이면 읽지 않음)';
```

---

## 🔄 트리거 및 함수

### 1. updated_at 자동 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at 
  BEFORE UPDATE ON logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_keywords_updated_at 
  BEFORE UPDATE ON user_keywords 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at 
  BEFORE UPDATE ON portfolios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. 키워드 사용 시각 자동 업데이트
```sql
CREATE OR REPLACE FUNCTION update_keyword_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_keywords 
  SET last_used_at = (SELECT date FROM logs WHERE id = NEW.log_id)
  WHERE keyword_id = NEW.keyword_id 
    AND user_id = (SELECT user_id FROM logs WHERE id = NEW.log_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_keyword_last_used
  AFTER INSERT ON log_keywords
  FOR EACH ROW EXECUTE FUNCTION update_keyword_last_used();
```

---

### 3. 통계 집계 함수
```sql
-- 사용자 통계
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_logs BIGINT,
  total_projects BIGINT,
  total_keywords BIGINT,
  logs_this_week BIGINT,
  logs_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM logs WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM projects WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_keywords WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM logs WHERE user_id = p_user_id 
      AND date >= CURRENT_DATE - INTERVAL '7 days'),
    (SELECT COUNT(*) FROM logs WHERE user_id = p_user_id 
      AND date >= CURRENT_DATE - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 Row Level Security (RLS)

Supabase는 RLS를 권장하지만, 백엔드에서 x-user-id로 인증을 처리하므로 **RLS는 비활성화**합니다.

```sql
-- RLS 비활성화 (백엔드에서 인증 처리)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE peer_endorsements DISABLE ROW LEVEL SECURITY;
ALTER TABLE endorsement_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

---

## 📊 초기 데이터 (Seed Data)

### 1. 키워드 마스터 데이터
```sql
-- 전략기획 카테고리
INSERT INTO keywords (name, category, description) VALUES
  ('기획력', '전략기획', '문제를 정의하고 해결 방안을 제시하는 능력'),
  ('문제정의', '전략기획', '핵심 문제를 파악하고 정의하는 능력'),
  ('데이터분석', '전략기획', '데이터를 수집하고 분석하여 인사이트를 도출하는 능력');

-- 마케팅 카테고리
INSERT INTO keywords (name, category, description) VALUES
  ('브랜딩', '마케팅', '브랜드 아이덴티티를 구축하고 관리하는 능력'),
  ('콘텐츠기획', '마케팅', '효과적인 콘텐츠를 기획하고 제작하는 능력'),
  ('SNS마케팅', '마케팅', '소셜 미디어를 활용한 마케팅 능력');

-- 개발 카테고리
INSERT INTO keywords (name, category, description) VALUES
  ('프론트엔드', '개발', '사용자 인터페이스 개발 능력'),
  ('백엔드', '개발', '서버 및 데이터베이스 개발 능력'),
  ('React', '개발', 'React 프레임워크 활용 능력'),
  ('Python', '개발', 'Python 프로그래밍 능력');

-- 협업 역량
INSERT INTO keywords (name, category, description) VALUES
  ('팀워크', '협업역량', '팀원들과 협력하여 목표를 달성하는 능력'),
  ('리더십', '협업역량', '팀을 이끌고 방향을 제시하는 능력'),
  ('커뮤니케이션', '협업역량', '효과적으로 의사소통하는 능력');
```

---

## 🔍 유용한 쿼리

### 1. 사용자의 모든 공고 조회
```sql
SELECT 
  l.*,
  p.name as project_name,
  ARRAY_AGG(k.name) as keywords
FROM logs l
LEFT JOIN projects p ON l.project_id = p.id
LEFT JOIN log_keywords lk ON l.id = lk.log_id
LEFT JOIN keywords k ON lk.keyword_id = k.id
WHERE l.user_id = '사용자_ID'
GROUP BY l.id, p.name
ORDER BY l.date DESC;
```

### 2. 키워드별 로그 개수
```sql
SELECT 
  k.name,
  k.category,
  COUNT(lk.log_id) as log_count
FROM keywords k
LEFT JOIN log_keywords lk ON k.id = lk.keyword_id
LEFT JOIN logs l ON lk.log_id = l.id
WHERE l.user_id = '사용자_ID'
GROUP BY k.id, k.name, k.category
ORDER BY log_count DESC;
```

### 3. 프로젝트별 통계
```sql
SELECT 
  p.name,
  COUNT(DISTINCT l.id) as log_count,
  COUNT(DISTINCT lk.keyword_id) as keyword_count,
  MAX(l.date) as last_activity
FROM projects p
LEFT JOIN logs l ON p.id = l.project_id
LEFT JOIN log_keywords lk ON l.id = lk.log_id
WHERE p.user_id = '사용자_ID'
GROUP BY p.id, p.name
ORDER BY last_activity DESC;
```

---

## 📦 Storage 구성

Supabase Storage 버킷 구조:

### 1. profile-images
```
proof-files/
├── profile-images/
│   └── {user_id}/
│       └── avatar.jpg
```

**정책**:
- 최대 파일 크기: 5MB
- 허용 형식: JPG, PNG, WebP
- Public 읽기 가능

### 2. evidence-files
```
proof-files/
├── evidence/
│   └── {user_id}/
│       └── {evidence_id}/
│           └── document.pdf
```

**정책**:
- 최대 파일 크기: 10MB
- 허용 형식: PDF, JPG, PNG
- Private (소유자만 접근)

### 3. portfolio-files
```
proof-files/
├── portfolios/
│   └── {user_id}/
│       └── {portfolio_id}/
│           └── portfolio.pdf
```

**정책**:
- 최대 파일 크기: 20MB
- 허용 형식: PDF
- Private + 공유 링크 가능

---

## 🚀 MCP 연동 설정

### 1. Supabase 프로젝트 생성
```bash
# Supabase 대시보드에서 프로젝트 생성
# 리전: ap-northeast-1 (Tokyo) 권장
```

### 2. 환경 변수 설정
```env
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Python 연동 (FastAPI)
```python
from supabase import create_client, Client

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# 예시: 사용자 조회
user = supabase.table('users').select('*').eq('id', user_id).execute()

# 예시: 로그 생성
new_log = supabase.table('logs').insert({
    'user_id': user_id,
    'title': '제목',
    'content': '내용',
    'date': '2024-03-15'
}).execute()
```

---

## 📈 성능 최적화

### 1. 인덱스 전략
- **Primary Key**: 모든 테이블에 UUID 사용
- **Foreign Key**: user_id, project_id 등 자주 조인되는 컬럼
- **날짜 필드**: created_at, date 등 정렬/필터링에 사용
- **상태 필드**: status, type 등 필터링에 사용

### 2. 전체 텍스트 검색
```sql
-- pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 검색 쿼리
SELECT * FROM logs
WHERE title ILIKE '%검색어%' OR content ILIKE '%검색어%'
ORDER BY created_at DESC;
```

### 3. 연결 풀링
```python
# Python에서 연결 풀 설정
supabase = create_client(
    url=SUPABASE_URL,
    key=SUPABASE_KEY,
    options={
        'pool_size': 10,
        'max_overflow': 20
    }
)
```

---

## 🔄 마이그레이션 전략

### 1. 초기 마이그레이션
```sql
-- 001_create_tables.sql
-- 위의 모든 CREATE TABLE 문 실행
```

### 2. 스키마 변경
```sql
-- 002_add_column_example.sql
ALTER TABLE logs ADD COLUMN new_field VARCHAR(100);
```

### 3. 데이터 마이그레이션
```sql
-- 003_migrate_data_example.sql
UPDATE logs SET new_field = 'default_value' WHERE new_field IS NULL;
```

---

## 🧪 테스트 데이터

```sql
-- 테스트 사용자 생성
INSERT INTO users (id, email, password_hash, name, university, major)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  '$2b$12$test_password_hash',
  '홍길동',
  '서울대학교',
  '경영학과'
);

-- 테스트 프로젝트 생성
INSERT INTO projects (id, user_id, name, type, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '서버랩 D-1',
  'contest',
  'active'
);

-- 테스트 로그 생성
INSERT INTO logs (user_id, project_id, title, content, date, period)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '디프만 15기 디자이너 작곡',
  '오늘 학회 회의에서 데이터 분석안 다 갈아엎음...',
  '2024-03-15',
  '서류 준비'
);
```

---

## 📝 백업 및 복구

### 1. 자동 백업 (Supabase)
- 매일 자동 백업
- 7일간 보관
- Point-in-time Recovery (Pro 플랜)

### 2. 수동 백업
```bash
# pg_dump 사용
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > backup.sql
```

### 3. 복구
```bash
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  < backup.sql
```

---

## 🔒 보안 체크리스트

- ✅ RLS 비활성화 (백엔드 인증 사용)
- ✅ Service Key는 백엔드에서만 사용
- ✅ Anon Key는 프론트엔드에서 Storage 접근용
- ✅ 비밀번호는 bcrypt로 해싱
- ✅ SQL Injection 방지 (Parameterized Query)
- ✅ Foreign Key Constraint 설정
- ✅ 민감한 정보는 암호화 저장

---

## 📚 참고 문서

- [Supabase Database 문서](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)

---

**업데이트**: 2024년 11월 14일
