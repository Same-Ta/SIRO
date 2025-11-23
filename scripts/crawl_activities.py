"""
공모전/대외활동 크롤링 스크립트
주요 사이트: 위비티(Wevity), 링커리어, 씽굿
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Optional
import time
import os
import sys

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_supabase


class ActivityCrawler:
    """대외활동 크롤러"""
    
    def __init__(self):
        self.supabase = get_supabase()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # 직무별 키워드 매핑
        self.job_keywords = {
            "전략기획": ["전략", "기획", "컨설팅", "비즈니스", "경영"],
            "마케팅": ["마케팅", "브랜딩", "광고", "홍보", "SNS", "콘텐츠"],
            "데이터분석": ["데이터", "분석", "AI", "머신러닝", "통계", "빅데이터"],
            "개발": ["개발", "프로그래밍", "코딩", "소프트웨어", "앱", "웹"],
            "디자인": ["디자인", "UI", "UX", "그래픽", "일러스트"],
            "영업": ["영업", "세일즈", "영업기획", "고객관리"],
            "인사": ["인사", "HR", "채용", "조직문화"],
            "재무": ["재무", "회계", "금융", "투자", "경제"],
        }
    
    def categorize_by_job(self, title: str, description: str) -> List[str]:
        """제목과 설명을 분석하여 관련 직무 추출"""
        target_jobs = []
        combined_text = f"{title} {description}".lower()
        
        for job, keywords in self.job_keywords.items():
            if any(keyword.lower() in combined_text for keyword in keywords):
                target_jobs.append(job)
        
        return target_jobs if target_jobs else ["기타"]
    
    def extract_tags(self, title: str, description: str) -> List[str]:
        """제목과 설명에서 태그 추출"""
        tags = []
        combined_text = f"{title} {description}"
        
        # 일반적인 태그 키워드
        tag_keywords = [
            "공모전", "대외활동", "인턴", "대학생", "청년",
            "마케팅", "기획", "디자인", "개발", "데이터",
            "온라인", "오프라인", "팀", "개인", "무료", "유료",
            "수상", "취업", "경력", "포트폴리오", "네트워킹"
        ]
        
        for keyword in tag_keywords:
            if keyword in combined_text:
                tags.append(keyword)
        
        return list(set(tags))[:10]  # 중복 제거 및 최대 10개
    
    def crawl_wevity(self) -> List[Dict]:
        """위비티 공모전 크롤링"""
        print("🔍 위비티 크롤링 시작...")
        activities = []
        
        try:
            # 위비티 공모전 리스트 페이지 (예시)
            url = "https://www.wevity.com/?c=find&s=1&gub=1"
            
            # Note: 실제 크롤링 시 robots.txt 확인 및 이용약관 준수 필요
            # 현재는 구조 예시만 작성
            
            print("⚠️  실제 크롤링은 사이트 정책 확인 후 구현 필요")
            print("   현재는 샘플 데이터를 생성합니다.")
            
            # 샘플 데이터 생성
            sample_activities = [
                {
                    "title": "2025 대학생 마케팅 공모전",
                    "organization": "○○기업",
                    "category": "contest",
                    "description": "대학생을 대상으로 한 마케팅 전략 공모전입니다. 브랜드 리뉴얼 전략을 제안해주세요.",
                    "benefits": "대상 500만원, 최우수상 300만원, 우수상 100만원, 인턴십 기회 제공",
                    "eligibility": "전국 4년제 대학생 (휴학생 포함)",
                    "application_start": "2025-01-01",
                    "application_end": "2025-02-28",
                    "url": "https://www.wevity.com/sample1",
                    "source_site": "wevity",
                },
                {
                    "title": "청년 창업 아이디어 공모전",
                    "organization": "중소벤처기업부",
                    "category": "contest",
                    "description": "혁신적인 창업 아이디어를 발굴하는 공모전입니다. 사업계획서를 제출해주세요.",
                    "benefits": "최종 선정 시 사업화 자금 최대 1억원 지원",
                    "eligibility": "만 39세 이하 청년",
                    "application_start": "2025-01-15",
                    "application_end": "2025-03-15",
                    "url": "https://www.wevity.com/sample2",
                    "source_site": "wevity",
                },
            ]
            
            activities.extend(sample_activities)
            
        except Exception as e:
            print(f"❌ 위비티 크롤링 오류: {e}")
        
        return activities
    
    def crawl_linkareer(self) -> List[Dict]:
        """링커리어 대외활동 크롤링"""
        print("🔍 링커리어 크롤링 시작...")
        activities = []
        
        try:
            print("⚠️  실제 크롤링은 사이트 정책 확인 후 구현 필요")
            print("   현재는 샘플 데이터를 생성합니다.")
            
            # 샘플 데이터
            sample_activities = [
                {
                    "title": "○○기업 대학생 마케팅 서포터즈 5기",
                    "organization": "○○기업",
                    "category": "external_activity",
                    "description": "SNS 마케팅 활동, 제품 리뷰, 캠페인 기획 등 다양한 마케팅 활동을 수행합니다.",
                    "benefits": "활동비 월 30만원, 우수 활동자 인턴 채용 우대",
                    "eligibility": "대학생 및 대학원생",
                    "application_start": "2025-01-10",
                    "application_end": "2025-02-10",
                    "start_date": "2025-03-01",
                    "end_date": "2025-08-31",
                    "url": "https://linkareer.com/sample1",
                    "source_site": "linkareer",
                },
                {
                    "title": "△△ 앱 서비스 대학생 체험단",
                    "organization": "△△ 스타트업",
                    "category": "external_activity",
                    "description": "신규 앱 서비스를 체험하고 피드백을 제공하는 활동입니다.",
                    "benefits": "활동 수료증, 소정의 활동비 지급",
                    "eligibility": "스마트폰 보유 대학생",
                    "application_start": "2025-01-20",
                    "application_end": "2025-02-20",
                    "start_date": "2025-03-01",
                    "end_date": "2025-05-31",
                    "url": "https://linkareer.com/sample2",
                    "source_site": "linkareer",
                },
            ]
            
            activities.extend(sample_activities)
            
        except Exception as e:
            print(f"❌ 링커리어 크롤링 오류: {e}")
        
        return activities
    
    def crawl_thinggood(self) -> List[Dict]:
        """씽굿 크롤링"""
        print("🔍 씽굿 크롤링 시작...")
        activities = []
        
        try:
            print("⚠️  실제 크롤링은 사이트 정책 확인 후 구현 필요")
            print("   현재는 샘플 데이터를 생성합니다.")
            
            # 샘플 데이터
            sample_activities = [
                {
                    "title": "소셜벤처 청년 인턴십 프로그램",
                    "organization": "소셜벤처 협회",
                    "category": "internship",
                    "description": "소셜벤처에서 실무 경험을 쌓는 인턴십 프로그램입니다.",
                    "benefits": "인턴 활동비 지급, 수료증 발급, 채용 연계",
                    "eligibility": "대학생 및 졸업 2년 이내 청년",
                    "application_start": "2025-02-01",
                    "application_end": "2025-03-01",
                    "start_date": "2025-04-01",
                    "end_date": "2025-06-30",
                    "url": "https://thinggood.co.kr/sample1",
                    "source_site": "thinggood",
                },
            ]
            
            activities.extend(sample_activities)
            
        except Exception as e:
            print(f"❌ 씽굿 크롤링 오류: {e}")
        
        return activities
    
    def save_to_supabase(self, activities: List[Dict]):
        """크롤링한 데이터를 Supabase에 저장"""
        print(f"\n💾 Supabase에 {len(activities)}개 활동 저장 중...")
        
        saved_count = 0
        error_count = 0
        
        for activity in activities:
            try:
                # 직무 분류 및 태그 추출
                target_jobs = self.categorize_by_job(
                    activity.get("title", ""),
                    activity.get("description", "")
                )
                tags = self.extract_tags(
                    activity.get("title", ""),
                    activity.get("description", "")
                )
                
                # 데이터 준비
                data = {
                    "title": activity["title"],
                    "organization": activity["organization"],
                    "category": activity["category"],
                    "target_jobs": target_jobs,
                    "tags": tags,
                    "description": activity.get("description"),
                    "benefits": activity.get("benefits"),
                    "eligibility": activity.get("eligibility"),
                    "start_date": activity.get("start_date"),
                    "end_date": activity.get("end_date"),
                    "application_start": activity.get("application_start"),
                    "application_end": activity.get("application_end"),
                    "url": activity["url"],
                    "source_site": activity["source_site"],
                    "is_active": True,
                    "scraped_at": datetime.now().isoformat(),
                }
                
                # 중복 체크 (URL 기준)
                existing = self.supabase.table("activities")\
                    .select("id")\
                    .eq("url", data["url"])\
                    .execute()
                
                if existing.data:
                    # 기존 데이터 업데이트
                    self.supabase.table("activities")\
                        .update(data)\
                        .eq("url", data["url"])\
                        .execute()
                    print(f"  ♻️  업데이트: {activity['title'][:30]}...")
                else:
                    # 새로운 데이터 삽입
                    self.supabase.table("activities")\
                        .insert(data)\
                        .execute()
                    print(f"  ✅ 저장: {activity['title'][:30]}...")
                
                saved_count += 1
                time.sleep(0.1)  # API 부하 방지
                
            except Exception as e:
                print(f"  ❌ 저장 실패: {activity.get('title', 'Unknown')} - {e}")
                error_count += 1
        
        print(f"\n✨ 완료: {saved_count}개 저장, {error_count}개 실패")
    
    def run(self):
        """크롤링 실행"""
        print("=" * 60)
        print("🚀 대외활동 크롤링 시작")
        print("=" * 60)
        
        all_activities = []
        
        # 각 사이트 크롤링
        all_activities.extend(self.crawl_wevity())
        time.sleep(2)  # 사이트 간 간격
        
        all_activities.extend(self.crawl_linkareer())
        time.sleep(2)
        
        all_activities.extend(self.crawl_thinggood())
        
        # Supabase에 저장
        if all_activities:
            self.save_to_supabase(all_activities)
        else:
            print("⚠️  크롤링된 데이터가 없습니다.")
        
        print("\n" + "=" * 60)
        print("✅ 크롤링 완료!")
        print("=" * 60)


if __name__ == "__main__":
    crawler = ActivityCrawler()
    crawler.run()
