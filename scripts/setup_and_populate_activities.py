"""
Activities 테이블 생성 및 샘플 데이터 삽입
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_supabase
from datetime import datetime, timedelta

def create_tables():
    """테이블 생성"""
    supabase = get_supabase()
    
    print("=" * 60)
    print("📋 Activities 테이블 생성 시작")
    print("=" * 60)
    
    # 테이블 생성 SQL
    create_table_sql = """
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
    """
    
    try:
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✅ Activities 테이블 생성 완료")
    except Exception as e:
        print(f"⚠️  테이블 생성 오류 (이미 존재할 수 있음): {e}")
    
    # 인덱스 생성
    index_sqls = [
        "CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);",
        "CREATE INDEX IF NOT EXISTS idx_activities_target_jobs ON activities USING GIN(target_jobs);",
        "CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);",
        "CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);",
        "CREATE INDEX IF NOT EXISTS idx_activities_application_end ON activities(application_end DESC) WHERE is_active = TRUE;",
    ]
    
    for sql in index_sqls:
        try:
            supabase.rpc('exec_sql', {'sql': sql}).execute()
            print(f"✅ 인덱스 생성: {sql[:50]}...")
        except Exception as e:
            print(f"⚠️  인덱스 생성 오류: {e}")

def insert_sample_data():
    """샘플 데이터 삽입"""
    supabase = get_supabase()
    
    print("\n" + "=" * 60)
    print("💾 샘플 대외활동 데이터 삽입 시작")
    print("=" * 60)
    
    today = datetime.now()
    
    sample_activities = [
        {
            "title": "2025 대학생 마케팅 전략 공모전",
            "organization": "한국마케팅협회",
            "category": "contest",
            "target_jobs": ["마케팅", "전략기획"],
            "tags": ["공모전", "마케팅", "대학생", "수상", "상금"],
            "description": "대학생을 대상으로 한 마케팅 전략 공모전입니다. 실제 기업의 브랜드 리뉴얼 전략을 제안해주세요. 우수작은 실제 마케팅 캠페인에 반영될 수 있습니다.",
            "benefits": "대상 500만원, 최우수상 300만원, 우수상 100만원, 인턴십 기회 제공",
            "eligibility": "전국 4년제 대학생 (휴학생 포함), 팀 단위 지원 (2-4인)",
            "application_start": (today + timedelta(days=-10)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/contest/marketing2025",
            "location": "온라인",
            "source_site": "wevity",
            "is_active": True,
        },
        {
            "title": "청년 창업 아이디어 공모전",
            "organization": "중소벤처기업부",
            "category": "contest",
            "target_jobs": ["전략기획", "마케팅", "개발"],
            "tags": ["공모전", "창업", "청년", "사업화", "정부지원"],
            "description": "혁신적인 창업 아이디어를 발굴하는 공모전입니다. 사회 문제 해결형 비즈니스 모델을 제안해주세요. 최종 선정 시 사업화 자금을 지원받을 수 있습니다.",
            "benefits": "최종 선정 시 사업화 자금 최대 1억원 지원, 멘토링 프로그램 제공",
            "eligibility": "만 39세 이하 청년 (예비창업자, 3년 이내 창업자)",
            "application_start": (today + timedelta(days=-5)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=45)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/startup-contest",
            "location": "전국",
            "source_site": "wevity",
            "is_active": True,
        },
        {
            "title": "○○기업 대학생 마케팅 서포터즈 8기",
            "organization": "○○기업",
            "category": "external_activity",
            "target_jobs": ["마케팅", "브랜딩"],
            "tags": ["대외활동", "마케팅", "서포터즈", "SNS", "콘텐츠"],
            "description": "SNS 마케팅 활동, 제품 리뷰, 캠페인 기획 등 다양한 마케팅 활동을 수행합니다. 실무 마케팅 경험을 쌓고 싶은 대학생을 모집합니다.",
            "benefits": "활동비 월 30만원 지급, 우수 활동자 인턴 채용 우대, 수료증 발급",
            "eligibility": "대학생 및 대학원생 (전공 무관)",
            "application_start": (today + timedelta(days=-3)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=35)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=215)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/supporters",
            "location": "서울/온라인",
            "source_site": "linkareer",
            "is_active": True,
        },
        {
            "title": "△△ 앱 서비스 대학생 체험단 모집",
            "organization": "△△ 스타트업",
            "category": "external_activity",
            "target_jobs": ["마케팅", "기타"],
            "tags": ["대외활동", "체험단", "앱", "리뷰", "대학생"],
            "description": "신규 앱 서비스를 체험하고 피드백을 제공하는 활동입니다. 서비스 개선에 직접 참여할 수 있는 기회입니다.",
            "benefits": "활동 수료증, 소정의 활동비 지급, 앱 내 무료 이용권 제공",
            "eligibility": "스마트폰 보유 대학생, SNS 활동 가능자",
            "application_start": (today + timedelta(days=-7)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=15)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=25)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=115)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/app-tester",
            "location": "온라인",
            "source_site": "linkareer",
            "is_active": True,
        },
        {
            "title": "소셜벤처 청년 인턴십 프로그램",
            "organization": "소셜벤처 협회",
            "category": "internship",
            "target_jobs": ["전략기획", "마케팅", "개발"],
            "tags": ["인턴십", "소셜벤처", "청년", "사회공헌", "경력"],
            "description": "소셜벤처에서 실무 경험을 쌓는 인턴십 프로그램입니다. 사회 문제 해결 비즈니스에 관심 있는 청년을 모집합니다.",
            "benefits": "인턴 활동비 월 150만원 지급, 수료증 발급, 정규직 채용 연계",
            "eligibility": "대학생 및 졸업 2년 이내 청년",
            "application_start": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=35)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=50)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=140)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/internship",
            "location": "서울",
            "source_site": "thinggood",
            "is_active": True,
        },
        {
            "title": "UX/UI 디자인 공모전",
            "organization": "한국디자인협회",
            "category": "contest",
            "target_jobs": ["디자인", "개발"],
            "tags": ["공모전", "디자인", "UX", "UI", "앱디자인"],
            "description": "모바일 앱의 UX/UI를 개선하는 디자인 공모전입니다. 사용자 경험을 고려한 창의적인 디자인을 제안해주세요.",
            "benefits": "대상 300만원, 최우수상 200만원, 우수상 100만원",
            "eligibility": "디자인 전공 대학생 또는 디자인에 관심 있는 청년",
            "application_start": (today + timedelta(days=-15)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=25)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/design-contest",
            "location": "온라인",
            "source_site": "wevity",
            "is_active": True,
        },
        {
            "title": "빅데이터 분석 경진대회",
            "organization": "한국데이터산업진흥원",
            "category": "contest",
            "target_jobs": ["데이터분석", "개발"],
            "tags": ["공모전", "빅데이터", "AI", "머신러닝", "분석"],
            "description": "공공 데이터를 활용한 빅데이터 분석 경진대회입니다. Python, R 등을 사용하여 데이터 분석 및 시각화를 수행하세요.",
            "benefits": "대상 1,000만원, 최우수상 500만원, 우수상 300만원",
            "eligibility": "대학생 및 일반인 (개인 또는 팀)",
            "application_start": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=60)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/bigdata-contest",
            "location": "온라인",
            "source_site": "wevity",
            "is_active": True,
        },
        {
            "title": "IT 기업 개발자 동아리 모집",
            "organization": "○○ IT 기업",
            "category": "club",
            "target_jobs": ["개발"],
            "tags": ["동아리", "개발", "프로그래밍", "프로젝트", "스터디"],
            "description": "웹/앱 개발 실력을 키우고 싶은 대학생들의 개발자 동아리입니다. 팀 프로젝트를 통해 실무 경험을 쌓을 수 있습니다.",
            "benefits": "개발 장비 지원, 프로젝트 멘토링, 수료 시 수료증",
            "eligibility": "프로그래밍 기초 지식 보유자",
            "application_start": (today + timedelta(days=-5)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=210)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/dev-club",
            "location": "서울",
            "source_site": "linkareer",
            "is_active": True,
        },
        {
            "title": "환경 캠페인 봉사단 모집",
            "organization": "환경운동연합",
            "category": "volunteer",
            "target_jobs": ["기타"],
            "tags": ["봉사", "환경", "캠페인", "사회공헌"],
            "description": "환경 보호 캠페인을 기획하고 실행하는 봉사활동입니다. 지속가능한 미래를 위한 활동에 참여하세요.",
            "benefits": "봉사활동 시간 인증, 활동 수료증",
            "eligibility": "환경에 관심 있는 누구나",
            "application_start": (today + timedelta(days=-20)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=110)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/volunteer",
            "location": "전국",
            "source_site": "thinggood",
            "is_active": True,
        },
        {
            "title": "글로벌 스타트업 인턴 프로그램",
            "organization": "글로벌 액셀러레이터",
            "category": "internship",
            "target_jobs": ["전략기획", "마케팅", "개발", "영업"],
            "tags": ["인턴십", "스타트업", "글로벌", "영어", "해외"],
            "description": "해외 진출을 준비하는 스타트업에서 인턴 경험을 쌓을 수 있는 프로그램입니다. 글로벌 비즈니스 실무를 배울 수 있습니다.",
            "benefits": "인턴 급여 월 200만원, 해외 연수 기회, 추천서 제공",
            "eligibility": "영어 의사소통 가능자 (토익 700점 이상)",
            "application_start": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
            "application_end": (today + timedelta(days=40)).strftime("%Y-%m-%d"),
            "start_date": (today + timedelta(days=60)).strftime("%Y-%m-%d"),
            "end_date": (today + timedelta(days=150)).strftime("%Y-%m-%d"),
            "activity_url": "https://www.example.com/global-intern",
            "location": "서울/온라인",
            "source_site": "linkareer",
            "is_active": True,
        },
    ]
    
    saved_count = 0
    error_count = 0
    
    for activity in sample_activities:
        try:
            # 중복 체크
            existing = supabase.table("activities")\
                .select("id")\
                .eq("activity_url", activity["activity_url"])\
                .execute()
            
            if existing.data:
                print(f"  ♻️  이미 존재: {activity['title'][:40]}...")
                continue
            
            # 삽입
            supabase.table("activities").insert(activity).execute()
            print(f"  ✅ 저장 완료: {activity['title'][:40]}...")
            saved_count += 1
            
        except Exception as e:
            print(f"  ❌ 저장 실패: {activity['title'][:40]}... - {e}")
            error_count += 1
    
    print(f"\n✨ 완료: {saved_count}개 저장, {error_count}개 실패")

if __name__ == "__main__":
    print("\n🚀 Activities 테이블 설정 및 샘플 데이터 삽입 시작\n")
    
    # 1. 테이블 생성 (선택적)
    # create_tables()
    
    # 2. 샘플 데이터 삽입
    insert_sample_data()
    
    print("\n" + "=" * 60)
    print("✅ 모든 작업 완료!")
    print("=" * 60)
