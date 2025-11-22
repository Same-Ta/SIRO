# 회고 시스템 데이터베이스 설정 가이드

## 개요
이 문서는 회고 시스템을 위한 Supabase 데이터베이스 테이블 생성 및 설정 가이드입니다.

## 1. Supabase 대시보드 접속

1. https://supabase.com 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 선택

## 2. 회고 시스템 테이블 생성

### 단계 1: 기본 테이블 생성

`docs/reflection-system-tables.sql` 파일의 전체 내용을 복사하여 SQL Editor에 붙여넣고 실행합니다.

이 스크립트는 다음을 생성합니다:

#### 2.1 reflection_templates (회고 템플릿)
- 6개의 기본 템플릿 포함 (KPT, 4F, Start-Stop-Continue, Mad-Sad-Glad, 5Why, Weekly Review)
- JSONB 형식의 질문 저장
- 사용 횟수 자동 증가

#### 2.2 reflection_spaces (회고 스페이스)
- 프로젝트/활동별 회고 컨테이너
- 회고 주기 관리 (daily, weekly, biweekly, monthly)
- 다음 회고 날짜 자동 계산
- 완료율 추적

#### 2.3 reflections 테이블 수정
- space_id, template_id 컬럼 추가
- mood, progress_score 컬럼 추가
- ai_keywords, ai_sentiment_score 컬럼 추가
- reflection_date 컬럼 추가

#### 2.4 reflection_ai_analysis (AI 분석 캐시)
- 12시간 만료 캐시
- 성장 분석 결과 저장
- JSONB로 차트 데이터 저장

#### 2.5 growth_metrics (성장 메트릭)
- 일일 메트릭 자동 계산
- 평균 진행도, 완료율, 키워드 수 추적

### 단계 2: 트리거 및 함수 확인

스크립트 실행 후 다음 트리거가 자동으로 생성됩니다:

1. **trigger_update_reflection_space_timestamp**: 스페이스 수정 시 updated_at 자동 업데이트
2. **trigger_update_space_reflection_count**: 회고 생성/삭제 시 total_reflections 자동 증가/감소
3. **trigger_update_template_usage_count**: 템플릿 사용 시 usage_count 자동 증가

### 단계 3: 뷰 확인

**v_active_spaces**: 활성 스페이스와 통계를 조인한 뷰

```sql
SELECT * FROM v_active_spaces LIMIT 5;
```

## 3. 데이터 확인

### 3.1 템플릿 확인
```sql
SELECT id, name, category, array_length(questions, 1) as question_count
FROM reflection_templates;
```

예상 결과: 6개 템플릿 (kpt, 4f, start-stop-continue, mad-sad-glad, 5why, weekly-review)

### 3.2 테이블 구조 확인
```sql
-- 스페이스 테이블
\d reflection_spaces;

-- 회고 테이블
\d reflections;

-- AI 분석 테이블
\d reflection_ai_analysis;

-- 메트릭 테이블
\d growth_metrics;
```

## 4. Row Level Security (RLS) 설정

보안을 위해 RLS를 활성화합니다:

```sql
-- reflection_spaces RLS
ALTER TABLE reflection_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spaces"
ON reflection_spaces FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own spaces"
ON reflection_spaces FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own spaces"
ON reflection_spaces FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own spaces"
ON reflection_spaces FOR DELETE
USING (auth.uid()::text = user_id);

-- reflections RLS (기존에 없다면)
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
ON reflections FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own reflections"
ON reflections FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own reflections"
ON reflections FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own reflections"
ON reflections FOR DELETE
USING (auth.uid()::text = user_id);

-- reflection_ai_analysis RLS
ALTER TABLE reflection_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI analysis"
ON reflection_ai_analysis FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own AI analysis"
ON reflection_ai_analysis FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- growth_metrics RLS
ALTER TABLE growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
ON growth_metrics FOR SELECT
USING (auth.uid()::text = user_id);

-- reflection_templates는 모든 사용자가 읽을 수 있음
ALTER TABLE reflection_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
ON reflection_templates FOR SELECT
USING (true);
```

## 5. 인덱스 최적화 확인

스크립트에 포함된 인덱스:

```sql
-- 확인
\di reflection_*
\di growth_metrics_*
```

## 6. 배치 작업 설정 (선택사항)

### 6.1 Supabase Edge Functions 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Edge Function 생성
supabase functions new reflection-reminders
supabase functions new daily-metrics
```

### 6.2 Cron Jobs 설정

Supabase 대시보드에서:
1. Database > Extensions
2. `pg_cron` 활성화
3. SQL Editor에서:

```sql
-- 매시간 리마인더 전송 (현재는 애플리케이션에서 처리)
SELECT cron.schedule(
  'send-reflection-reminders',
  '0 * * * *',  -- 매시간
  $$
  SELECT net.http_post(
    url:='YOUR_API_URL/batch/send-reminders',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- 매일 자정 메트릭 계산
SELECT cron.schedule(
  'calculate-daily-metrics',
  '0 0 * * *',  -- 매일 자정
  $$
  SELECT net.http_post(
    url:='YOUR_API_URL/batch/calculate-metrics',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- 매일 만료 캐시 정리
SELECT cron.schedule(
  'cleanup-expired-cache',
  '0 2 * * *',  -- 매일 오전 2시
  $$
  DELETE FROM reflection_ai_analysis WHERE expires_at < NOW();
  $$
);
```

## 7. 테스트

### 7.1 템플릿 API 테스트
```bash
curl -X GET "http://localhost:8000/api/v1/templates" \
  -H "x-user-id: YOUR_USER_ID"
```

### 7.2 스페이스 생성 테스트
```bash
curl -X POST "http://localhost:8000/api/v1/spaces" \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "name": "테스트 프로젝트",
    "type": "프로젝트",
    "description": "테스트 회고 스페이스",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "reflection_cycle": "weekly",
    "reminder_enabled": true
  }'
```

### 7.3 회고 작성 테스트
```bash
curl -X POST "http://localhost:8000/api/v1/reflections" \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "space_id": "SPACE_ID",
    "template_id": "kpt",
    "answers": [
      {"question": "Keep: ...", "answer": "팀워크가 좋았습니다"},
      {"question": "Problem: ...", "answer": "시간 관리가 어려웠습니다"},
      {"question": "Try: ...", "answer": "데일리 스탠드업을 도입하겠습니다"}
    ],
    "mood": "good",
    "progress_score": 8,
    "reflection_date": "2025-01-15"
  }'
```

## 8. 모니터링

### 8.1 활성 스페이스 모니터링
```sql
SELECT 
  user_id,
  COUNT(*) as active_space_count,
  SUM(total_reflections) as total_reflections
FROM reflection_spaces
WHERE status = 'active'
GROUP BY user_id;
```

### 8.2 템플릿 사용 통계
```sql
SELECT 
  id,
  name,
  category,
  usage_count
FROM reflection_templates
ORDER BY usage_count DESC;
```

### 8.3 AI 캐시 현황
```sql
SELECT 
  COUNT(*) as active_cache_count,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count
FROM reflection_ai_analysis;
```

## 9. 문제 해결

### 9.1 트리거가 작동하지 않는 경우
```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname LIKE '%reflection%';

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_space_reflection_count ON reflections;
-- (스크립트에서 해당 트리거 부분만 다시 실행)
```

### 9.2 외래 키 오류
```sql
-- 외래 키 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE '%reflection%';
```

## 10. 다음 단계

1. ✅ 데이터베이스 테이블 생성 완료
2. ✅ 기본 템플릿 삽입 완료
3. ✅ API 라우트 구현 완료
4. ⏳ OpenAI GPT-4 API 통합
5. ⏳ Redis 캐싱 구현
6. ⏳ 프로덕션 배포

## 참고 자료

- Supabase 문서: https://supabase.com/docs
- FastAPI 문서: https://fastapi.tiangolo.com
- PostgreSQL 문서: https://www.postgresql.org/docs/
