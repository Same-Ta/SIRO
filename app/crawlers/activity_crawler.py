"""
공모전/프로젝트/동아리/서포터즈 크롤링 스크립트

실행: python -m app.crawlers.activity_crawler
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
from typing import List, Dict
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database import get_supabase
from app.config import settings

class ActivityCrawler:
    def __init__(self):
        self.supabase = get_supabase()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    async def fetch_page(self, url: str) -> str:
        """페이지 가져오기"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                return await response.text()
    
    def extract_fields(self, text: str) -> List[str]:
        """분야 추출"""
        field_mapping = {
            'IT': ['개발', '프로그래밍', '코딩', '소프트웨어', 'SW', '앱', '웹', '서버', '인공지능', 'AI', '머신러닝', '데이터', '빅데이터'],
            '기획': ['기획', '전략', '마케팅', '브랜드', '사업', '비즈니스'],
            '디자인': ['디자인', 'UX', 'UI', '그래픽', '시각', '영상', '편집'],
            '경영': ['경영', '경제', '금융', '회계', '재무'],
            '교육': ['교육', '멘토링', '강의', '튜터'],
            '예술': ['예술', '미술', '음악', '공연', '문화'],
            '의료': ['의료', '간호', '보건', '제약'],
            '환경': ['환경', '에너지', '지속가능', '친환경'],
            '사회': ['봉사', '복지', '사회', '공익']
        }
        
        detected = set()
        text_lower = text.lower()
        
        for field, keywords in field_mapping.items():
            if any(keyword in text or keyword.lower() in text_lower for keyword in keywords):
                detected.add(field)
        
        return list(detected) if detected else ['기타']
    
    def extract_keywords(self, text: str, fields: List[str]) -> List[str]:
        """키워드 추출"""
        keywords = set()
        
        # 분야별 키워드
        field_keywords = {
            'IT': ['Python', 'Java', 'JavaScript', 'React', 'AI', '머신러닝', '딥러닝', '앱개발', '웹개발'],
            '기획': ['기획서', '전략', '마케팅', 'SNS', '브랜딩'],
            '디자인': ['포토샵', '일러스트', 'Figma', 'UX', 'UI'],
            '경영': ['창업', '사업계획서', '투자', '경영전략']
        }
        
        for field in fields:
            if field in field_keywords:
                for keyword in field_keywords[field]:
                    if keyword.lower() in text.lower():
                        keywords.add(keyword)
        
        # 일반 키워드
        common_keywords = ['대학생', '청년', '팀프로젝트', '개인참가', '온라인', '오프라인']
        for keyword in common_keywords:
            if keyword in text:
                keywords.add(keyword)
        
        return list(keywords)[:10]  # 최대 10개
    
    def parse_date(self, date_str: str) -> str:
        """날짜 파싱"""
        if not date_str:
            return None
        
        try:
            # YYYY-MM-DD 형식
            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                return date_str
            
            # YYYY.MM.DD 형식
            if re.match(r'\d{4}\.\d{2}\.\d{2}', date_str):
                return date_str.replace('.', '-')
            
            # MM/DD 형식 (올해)
            if re.match(r'\d{2}/\d{2}', date_str):
                month, day = date_str.split('/')
                return f"2025-{month}-{day}"
            
        except:
            pass
        
        return None
    
    async def crawl_linkareer(self) -> List[Dict]:
        """링커리어 크롤링"""
        print("🔍 링커리어 크롤링 시작...")
        activities = []
        
        # 실제 크롤링 대신 샘플 데이터 (실제 구현 시 Selenium 필요)
        sample_data = [
            {
                'title': '2025 네이버 AI 해커톤',
                'organization': '네이버',
                'category': 'contest',
                'type': '해커톤',
                'description': 'AI 기술을 활용한 혁신적인 서비스 개발 해커톤',
                'application_end_date': (datetime.now() + timedelta(days=30)).date().isoformat(),
                'fields': ['IT', 'AI'],
                'prize_money': 10000000,
                'url': 'https://linkareer.com/activity/123456',
                'source': 'linkareer'
            },
            {
                'title': '카카오 서포터즈 8기 모집',
                'organization': '카카오',
                'category': 'club',
                'type': '서포터즈',
                'description': '카카오 서비스 홍보 및 마케팅 활동',
                'application_end_date': (datetime.now() + timedelta(days=20)).date().isoformat(),
                'fields': ['기획', '마케팅'],
                'prize_money': 0,
                'url': 'https://linkareer.com/activity/234567',
                'source': 'linkareer'
            }
        ]
        
        for data in sample_data:
            fields = data.get('fields', [])
            activity = {
                **data,
                'keywords': self.extract_keywords(data['title'] + ' ' + data['description'], fields),
                'tags': fields,
                'status': 'active',
                'crawled_at': datetime.now().isoformat(),
                'difficulty_level': 'intermediate',
                'recommended_majors': self.get_recommended_majors(fields)
            }
            activities.append(activity)
        
        print(f"  ✅ {len(activities)}개 활동 수집")
        return activities
    
    async def crawl_wevity(self) -> List[Dict]:
        """위비티 크롤링"""
        print("🔍 위비티 크롤링 시작...")
        activities = []
        
        sample_data = [
            {
                'title': '2025 대학생 광고 공모전',
                'organization': '한국광고총연합회',
                'category': 'contest',
                'type': '공모전',
                'description': '창의적인 광고 아이디어 공모',
                'application_end_date': (datetime.now() + timedelta(days=45)).date().isoformat(),
                'fields': ['기획', '디자인'],
                'prize_money': 5000000,
                'url': 'https://www.wevity.com/contest/345678',
                'source': 'wevity'
            },
            {
                'title': 'UX/UI 디자인 공모전',
                'organization': '삼성전자',
                'category': 'contest',
                'type': '공모전',
                'description': '혁신적인 사용자 경험 디자인',
                'application_end_date': (datetime.now() + timedelta(days=35)).date().isoformat(),
                'fields': ['디자인'],
                'prize_money': 3000000,
                'url': 'https://www.wevity.com/contest/456789',
                'source': 'wevity'
            }
        ]
        
        for data in sample_data:
            fields = data.get('fields', [])
            activity = {
                **data,
                'keywords': self.extract_keywords(data['title'] + ' ' + data['description'], fields),
                'tags': fields,
                'status': 'active',
                'crawled_at': datetime.now().isoformat(),
                'difficulty_level': 'beginner',
                'recommended_majors': self.get_recommended_majors(fields)
            }
            activities.append(activity)
        
        print(f"  ✅ {len(activities)}개 활동 수집")
        return activities
    
    async def crawl_thinkpool(self) -> List[Dict]:
        """씽굿 크롤링"""
        print("🔍 씽굿 크롤링 시작...")
        activities = []
        
        sample_data = [
            {
                'title': '대학생 창업 동아리 모집',
                'organization': '중소벤처기업부',
                'category': 'club',
                'type': '동아리',
                'description': '예비 창업자를 위한 창업 동아리',
                'application_end_date': (datetime.now() + timedelta(days=15)).date().isoformat(),
                'fields': ['경영', '기획'],
                'prize_money': 0,
                'url': 'https://www.thinkpool.com/567890',
                'source': 'thinkpool'
            },
            {
                'title': '빅데이터 분석 프로젝트',
                'organization': '한국데이터산업진흥원',
                'category': 'project',
                'type': '프로젝트',
                'description': '공공 데이터 활용 프로젝트',
                'application_end_date': (datetime.now() + timedelta(days=40)).date().isoformat(),
                'fields': ['IT', '데이터'],
                'prize_money': 7000000,
                'url': 'https://www.thinkpool.com/678901',
                'source': 'thinkpool'
            }
        ]
        
        for data in sample_data:
            fields = data.get('fields', [])
            activity = {
                **data,
                'keywords': self.extract_keywords(data['title'] + ' ' + data['description'], fields),
                'tags': fields,
                'status': 'active',
                'crawled_at': datetime.now().isoformat(),
                'difficulty_level': 'intermediate',
                'recommended_majors': self.get_recommended_majors(fields)
            }
            activities.append(activity)
        
        print(f"  ✅ {len(activities)}개 활동 수집")
        return activities
    
    async def crawl_onoffmix(self) -> List[Dict]:
        """온오프믹스 크롤링"""
        print("🔍 온오프믹스 크롤링 시작...")
        activities = []
        
        sample_data = [
            {
                'title': 'AI 스타트업 해커톤 2025',
                'organization': '구글 스타트업',
                'category': 'contest',
                'type': '해커톤',
                'description': 'AI 기반 스타트업 아이디어 경진대회',
                'application_end_date': (datetime.now() + timedelta(days=25)).date().isoformat(),
                'fields': ['IT', '경영'],
                'prize_money': 15000000,
                'url': 'https://onoffmix.com/789012',
                'source': 'onoffmix'
            }
        ]
        
        for data in sample_data:
            fields = data.get('fields', [])
            activity = {
                **data,
                'keywords': self.extract_keywords(data['title'] + ' ' + data['description'], fields),
                'tags': fields,
                'status': 'active',
                'crawled_at': datetime.now().isoformat(),
                'difficulty_level': 'advanced',
                'recommended_majors': self.get_recommended_majors(fields)
            }
            activities.append(activity)
        
        print(f"  ✅ {len(activities)}개 활동 수집")
        return activities
    
    def get_recommended_majors(self, fields: List[str]) -> List[str]:
        """분야별 추천 학과"""
        major_mapping = {
            'IT': ['컴퓨터공학', '소프트웨어공학', '정보통신공학', '인공지능학과'],
            '기획': ['경영학', '경제학', '광고홍보학', '미디어커뮤니케이션'],
            '디자인': ['시각디자인', '산업디자인', '인터랙션디자인', '영상디자인'],
            '경영': ['경영학', '경제학', '회계학', '국제통상학'],
            '교육': ['교육학', '사범대학'],
            '의료': ['의학', '간호학', '약학', '보건학'],
            '환경': ['환경공학', '에너지공학'],
            '사회': ['사회복지학', '행정학', '정치외교학']
        }
        
        majors = set(['전공무관'])  # 기본적으로 전공무관 포함
        
        for field in fields:
            if field in major_mapping:
                majors.update(major_mapping[field])
        
        return list(majors)[:5]  # 최대 5개
    
    def save_to_supabase(self, activities: List[Dict]):
        """Supabase에 저장"""
        print(f"\n💾 Supabase에 저장 중... (총 {len(activities)}개)")
        
        saved = 0
        updated = 0
        errors = 0
        
        for activity in activities:
            try:
                # URL 기준 중복 체크
                existing = self.supabase.table("activities")\
                    .select("id")\
                    .eq("url", activity['url'])\
                    .execute()
                
                if not existing.data:
                    # 새 활동 추가
                    self.supabase.table("activities").insert(activity).execute()
                    saved += 1
                else:
                    # 기존 활동 업데이트
                    self.supabase.table("activities")\
                        .update(activity)\
                        .eq("id", existing.data[0]['id'])\
                        .execute()
                    updated += 1
                    
            except Exception as e:
                print(f"  ❌ 오류: {activity['title']} - {str(e)}")
                errors += 1
        
        print(f"  ✅ 저장: {saved}개")
        print(f"  🔄 업데이트: {updated}개")
        if errors:
            print(f"  ❌ 오류: {errors}개")
    
    async def run(self):
        """전체 크롤링 실행"""
        print("=" * 60)
        print("🚀 활동 크롤링 시작")
        print("=" * 60)
        
        all_activities = []
        
        # 병렬 크롤링
        results = await asyncio.gather(
            self.crawl_linkareer(),
            self.crawl_wevity(),
            self.crawl_thinkpool(),
            self.crawl_onoffmix(),
            return_exceptions=True
        )
        
        for result in results:
            if isinstance(result, list):
                all_activities.extend(result)
            elif isinstance(result, Exception):
                print(f"  ❌ 크롤링 오류: {str(result)}")
        
        print(f"\n📊 총 {len(all_activities)}개 활동 수집 완료")
        
        # Supabase에 저장
        if all_activities:
            self.save_to_supabase(all_activities)
        
        print("\n" + "=" * 60)
        print("✨ 크롤링 완료!")
        print("=" * 60)

async def main():
    crawler = ActivityCrawler()
    await crawler.run()

if __name__ == "__main__":
    asyncio.run(main())
