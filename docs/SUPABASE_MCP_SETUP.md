# Supabase MCP 서버 설정 가이드

## 1. Claude Desktop 설정

### Windows 설정 경로
`%APPDATA%\Claude\claude_desktop_config.json`

### 설정 내용
아래 내용을 위 경로의 파일에 추가하세요:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xyrbiuogwtmcjwqkojrb.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cmJpdW9nd3RtY2p3cWtvanJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTA5NDUsImV4cCI6MjA3NDc2Njk0NX0.AFau_18T-iVIc9gIGoTbvOhq42H8VDfpJ0rKvmHfAHA"
      }
    }
  }
}
```

## 2. 설정 적용

1. Claude Desktop을 완전히 종료합니다
2. 위 설정 파일을 저장합니다
3. Claude Desktop을 다시 시작합니다
4. 새 채팅에서 MCP 서버가 활성화되었는지 확인합니다

## 3. MCP 서버 확인

Claude Desktop에서 다음 명령으로 확인:
- "Show me the available MCP tools"
- "List Supabase tables"

## 4. 사용 가능한 MCP 도구

### 데이터베이스 관리
- `list_tables`: 테이블 목록 조회
- `execute_sql`: SQL 쿼리 실행
- `apply_migration`: 마이그레이션 적용

### 프로젝트 관리
- `list_projects`: 프로젝트 목록
- `get_project`: 프로젝트 상세 정보
- `create_project`: 새 프로젝트 생성

### 기타
- `search_docs`: Supabase 문서 검색
- `get_advisors`: 보안 및 성능 조언

## 5. 예제 사용법

### 테이블 목록 조회
```
MCP: list_tables for project xyrbiuogwtmcjwqkojrb
```

### SQL 실행
```
MCP: execute_sql
SELECT * FROM users LIMIT 5;
```

### 마이그레이션 적용
```
MCP: apply_migration
CREATE TABLE IF NOT EXISTS test_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);
```

## 6. 트러블슈팅

### MCP 서버가 보이지 않는 경우
1. Claude Desktop 완전 재시작
2. npx 설치 확인: `npm install -g npx`
3. 설정 파일 경로 확인

### 연결 오류
1. SUPABASE_URL 확인
2. SUPABASE_SERVICE_ROLE_KEY 확인
3. 인터넷 연결 확인

## 7. 보안 주의사항

⚠️ **SERVICE_ROLE_KEY는 절대 공개 저장소에 커밋하지 마세요!**
- 이 키는 모든 권한을 가지고 있습니다
- .gitignore에 이 파일을 추가하세요
- 프로덕션 환경에서는 별도의 키 관리 시스템을 사용하세요

---

**설정일**: 2025-11-23
**프로젝트**: PROOF Backend
**Supabase URL**: https://xyrbiuogwtmcjwqkojrb.supabase.co
