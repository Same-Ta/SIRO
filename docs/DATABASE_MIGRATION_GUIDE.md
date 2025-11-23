# Supabase 데이터베이스 마이그레이션 가이드

## 1. Claude Desktop MCP를 사용한 마이그레이션

### 전제 조건
- Claude Desktop에 Supabase MCP가 설정되어 있어야 합니다
- `docs/setup-mcp.ps1` 스크립트를 실행했거나
- `docs/SUPABASE_MCP_SETUP.md`의 수동 설정을 완료했어야 합니다

### 마이그레이션 실행 방법

#### Claude Desktop에서 실행:

1. **Claude Desktop을 열고 새 채팅을 시작합니다**

2. **다음과 같이 요청합니다:**

```
migrations/001_create_tables.sql 파일의 내용을 읽어서 
Supabase 프로젝트 xyrbiuogwtmcjwqkojrb에 마이그레이션을 적용해줘
```

또는

```
apply_migration을 사용해서 다음 SQL을 실행해줘:

[migrations/001_create_tables.sql의 내용을 복사해서 붙여넣기]
```

#### 직접 MCP 도구 사용:

```
프로젝트 ID: xyrbiuogwtmcjwqkojrb
마이그레이션 이름: create_proof_tables

다음 SQL을 실행해줘:
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  ...
);
...
```

## 2. Supabase Dashboard를 사용한 마이그레이션

### 방법 1: SQL Editor 사용

1. **Supabase Dashboard 접속**
   - URL: https://supabase.com/dashboard/project/xyrbiuogwtmcjwqkojrb

2. **SQL Editor로 이동**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 실행**
   - "New query" 클릭
   - `migrations/001_create_tables.sql` 파일의 내용 전체를 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **결과 확인**
   - 에러 없이 완료되면 성공
   - "Table Editor"에서 테이블들이 생성되었는지 확인

### 방법 2: Table Editor 사용

1. **Table Editor로 이동**
2. "Create new table" 버튼 클릭
3. 각 테이블을 수동으로 생성

## 3. 생성되는 테이블 목록

### 핵심 테이블
- ✅ `users` - 사용자 정보
- ✅ `spaces` - 프로젝트/활동 스페이스
- ✅ `space_members` - 스페이스 멤버
- ✅ `reflections` - 회고 데이터
- ✅ `reflection_templates` - 회고 템플릿
- ✅ `micro_logs` - 마이크로 로그
- ✅ `activities` - 활동 추천 데이터
- ✅ `bookmarks` - 북마크
- ✅ `job_simulation_results` - 직무 시뮬레이션 결과
- ✅ `career_survey_results` - 커리어 설문 결과

### 샘플 데이터
- 테스트 유저 2명
- 기본 회고 템플릿 3개 (STAR, KPT, 자유형식)
- 샘플 활동 3개

## 4. 마이그레이션 검증

### SQL로 테이블 확인:

```sql
-- 생성된 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 각 테이블의 레코드 수 확인
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'spaces', COUNT(*) FROM spaces
UNION ALL
SELECT 'reflections', COUNT(*) FROM reflections
UNION ALL
SELECT 'activities', COUNT(*) FROM activities;
```

### Claude Desktop으로 확인:

```
Supabase 프로젝트 xyrbiuogwtmcjwqkojrb의 테이블 목록을 보여줘
```

## 5. API 테스트

### 스페이스 생성 테스트:

```powershell
curl -X POST http://localhost:8000/api/spaces `
  -H "Content-Type: application/json" `
  -H "x-user-id: test_user" `
  -d '{
    "name": "2024 마케팅 공모전",
    "description": "전국 대학생 마케팅 공모전 참여",
    "type": "공모전",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "reflection_settings": {
      "cycle": "weekly",
      "enabled": true
    }
  }'
```

### 회고 생성 테스트:

```powershell
curl -X POST http://localhost:8000/api/reflections `
  -H "Content-Type: application/json" `
  -H "x-user-id: test_user" `
  -d '{
    "type": "chatbot",
    "title": "1주차 회고",
    "content": {
      "situation": "팀 프로젝트 시작",
      "task": "마케팅 전략 수립",
      "action": "시장 조사 및 분석",
      "result": "기본 전략 완성"
    },
    "mood_before": "neutral",
    "mood_after": "good",
    "tags": ["마케팅", "전략", "분석"]
  }'
```

## 6. 트러블슈팅

### 문제: "Could not find the table" 에러

**원인**: 테이블이 생성되지 않음

**해결**:
1. 마이그레이션 SQL을 다시 실행
2. Supabase Dashboard에서 테이블 존재 확인
3. RLS 정책이 너무 제한적인지 확인

### 문제: 권한 에러

**원인**: Row Level Security (RLS) 정책

**해결**:
```sql
-- RLS 임시 비활성화 (개발 중)
ALTER TABLE spaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
```

### 문제: Foreign Key 제약 위반

**원인**: 참조하는 user_id가 없음

**해결**:
```sql
-- 테스트 유저 추가
INSERT INTO users (user_id, name, email)
VALUES ('test_user', '테스트 유저', 'test@example.com')
ON CONFLICT (user_id) DO NOTHING;
```

## 7. 다음 단계

✅ 마이그레이션 완료 후:

1. **API 서버 재시작**
   ```powershell
   cd "c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\back"
   .\venv\Scripts\Activate.ps1
   python run.py
   ```

2. **프론트엔드에서 테스트**
   - 스페이스 생성 기능 테스트
   - 회고 작성 기능 테스트

3. **데이터 확인**
   - Supabase Dashboard에서 데이터 확인
   - 또는 API로 조회

---

**작성일**: 2025-11-23
**프로젝트**: PROOF Backend
**Supabase Project**: xyrbiuogwtmcjwqkojrb
