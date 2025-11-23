"""AI 서비스 유틸리티"""
from typing import Dict, List, Optional
import json
import re

class AIService:
    """AI 기반 분석 및 추천 서비스"""
    
    @staticmethod
    def generate_reflection_feedback(reflection_content: str, reflection_type: str = "general") -> Dict:
        """
        회고 내용 분석 및 AI 피드백 생성
        
        Args:
            reflection_content: 회고 내용
            reflection_type: 회고 타입 (general, weekly, monthly, project)
        
        Returns:
            AI 피드백 딕셔너리
        """
        # 간단한 키워드 기반 분석
        keywords = {
            "긍정": ["성장", "배움", "성취", "개선", "향상", "발전", "성공", "좋았", "잘했"],
            "부정": ["어려움", "실패", "부족", "힘들", "문제", "걱정", "아쉬움"],
            "행동": ["시도", "도전", "노력", "계획", "실행", "진행"],
            "감정": ["기쁨", "즐거움", "뿌듯", "만족", "불안", "답답", "고민"]
        }
        
        analysis = {
            "긍정": 0,
            "부정": 0,
            "행동": 0,
            "감정": 0
        }
        
        content_lower = reflection_content.lower()
        for category, words in keywords.items():
            for word in words:
                if word in content_lower:
                    analysis[category] += 1
        
        # 피드백 생성
        feedback_parts = []
        
        if analysis["긍정"] > analysis["부정"]:
            feedback_parts.append("긍정적인 성장 마인드가 돋보입니다.")
        
        if analysis["행동"] > 2:
            feedback_parts.append("적극적으로 행동하고 실천하는 모습이 인상적입니다.")
        
        if analysis["부정"] > 0:
            feedback_parts.append("어려움을 인지하고 있다는 것 자체가 성장의 시작입니다.")
        
        if not feedback_parts:
            feedback_parts.append("자신을 돌아보는 시간을 가지셨네요. 계속해서 회고를 작성하며 성장해나가세요.")
        
        # 개선 제안
        suggestions = []
        if analysis["부정"] > analysis["긍정"]:
            suggestions.append("긍정적인 측면도 함께 기록해보세요")
        if analysis["행동"] == 0:
            suggestions.append("다음에는 구체적인 행동 계획을 포함해보세요")
        if len(reflection_content) < 50:
            suggestions.append("조금 더 자세히 작성하면 더 깊은 인사이트를 얻을 수 있습니다")
        
        return {
            "feedback": " ".join(feedback_parts),
            "suggestions": suggestions,
            "sentiment_score": min(10, max(1, 5 + analysis["긍정"] - analysis["부정"])),
            "action_score": min(10, analysis["행동"]),
            "keywords_found": analysis
        }
    
    @staticmethod
    def generate_micro_log_tags(log_content: str, context: Optional[str] = None) -> List[str]:
        """
        마이크로 로그 내용 분석 및 태그 생성
        
        Args:
            log_content: 로그 내용
            context: 추가 컨텍스트 (선택)
        
        Returns:
            생성된 태그 리스트
        """
        # 카테고리별 키워드 매핑
        tag_keywords = {
            "개발": ["코드", "프로그래밍", "개발", "버그", "디버깅", "API", "데이터베이스", "알고리즘"],
            "공부": ["공부", "학습", "강의", "책", "독서", "강좌", "수업", "시험"],
            "협업": ["회의", "미팅", "팀", "협업", "논의", "발표", "공유", "커뮤니케이션"],
            "기획": ["기획", "아이디어", "계획", "전략", "설계", "구상"],
            "디자인": ["디자인", "UI", "UX", "화면", "레이아웃", "스타일"],
            "문제해결": ["해결", "수정", "개선", "최적화", "리팩토링"],
            "성취": ["완료", "달성", "성공", "배포", "출시", "구현"],
            "고민": ["고민", "선택", "결정", "방향", "판단"]
        }
        
        content_lower = log_content.lower()
        if context:
            content_lower += " " + context.lower()
        
        tags = []
        for tag, keywords in tag_keywords.items():
            for keyword in keywords:
                if keyword in content_lower:
                    tags.append(tag)
                    break
        
        # 중복 제거 및 최대 5개로 제한
        tags = list(set(tags))
        return tags[:5] if tags else ["일반"]
    
    @staticmethod
    def recommend_activities_for_user(
        user_interests: List[str],
        user_skills: List[str],
        activities: List[Dict]
    ) -> List[Dict]:
        """
        사용자 프로필 기반 활동 추천
        
        Args:
            user_interests: 사용자 관심사 목록
            user_skills: 사용자 스킬 목록
            activities: 전체 활동 목록
        
        Returns:
            추천 점수가 포함된 활동 리스트
        """
        scored_activities = []
        
        for activity in activities:
            score = 0
            
            # 필드 매칭
            activity_fields = activity.get("field", [])
            if isinstance(activity_fields, str):
                activity_fields = [activity_fields]
            
            for interest in user_interests:
                if any(interest.lower() in field.lower() for field in activity_fields):
                    score += 3
            
            # 필수 스킬 매칭
            required_skills = activity.get("required_skills", [])
            if isinstance(required_skills, str):
                required_skills = [required_skills]
            
            for skill in user_skills:
                if any(skill.lower() in req.lower() for req in required_skills):
                    score += 2
            
            # 카테고리 보너스
            category = activity.get("category", "")
            if "공모전" in category and "공모전" in " ".join(user_interests):
                score += 2
            if "대외활동" in category and "대외활동" in " ".join(user_interests):
                score += 2
            
            # 활동 레벨 매칭 (초급/중급/고급)
            activity_level = activity.get("level", "")
            if activity_level:
                # 사용자 스킬 개수로 레벨 추정
                user_level = "고급" if len(user_skills) > 5 else "중급" if len(user_skills) > 2 else "초급"
                if activity_level == user_level:
                    score += 1
            
            activity_with_score = activity.copy()
            activity_with_score["match_score"] = score
            activity_with_score["match_reason"] = AIService._generate_match_reason(
                score, user_interests, user_skills, activity
            )
            scored_activities.append(activity_with_score)
        
        # 점수 순으로 정렬
        scored_activities.sort(key=lambda x: x["match_score"], reverse=True)
        return scored_activities
    
    @staticmethod
    def _generate_match_reason(
        score: int,
        user_interests: List[str],
        user_skills: List[str],
        activity: Dict
    ) -> str:
        """매칭 이유 생성"""
        if score >= 5:
            return "당신의 관심사와 스킬에 매우 적합합니다"
        elif score >= 3:
            return "당신의 관심 분야와 관련이 있습니다"
        elif score >= 1:
            return "새로운 경험을 쌓을 수 있는 기회입니다"
        else:
            return "도전해볼 만한 활동입니다"
    
    @staticmethod
    def analyze_growth_story(reflections: List[Dict], period: str) -> Dict:
        """
        회고 데이터 기반 성장 스토리 생성
        
        Args:
            reflections: 회고 목록
            period: 기간 (week, month, quarter, year)
        
        Returns:
            성장 스토리 딕셔너리
        """
        if not reflections:
            return {
                "period": period,
                "summary": "아직 회고 데이터가 충분하지 않습니다.",
                "highlights": [],
                "growth_areas": [],
                "recommendations": ["꾸준히 회고를 작성해보세요"]
            }
        
        # 간단한 통계 분석
        total = len(reflections)
        
        # 키워드 추출
        all_content = " ".join([r.get("content", "") for r in reflections])
        growth_keywords = ["성장", "배움", "개선", "발전"]
        challenge_keywords = ["어려움", "도전", "문제"]
        
        growth_count = sum(1 for kw in growth_keywords if kw in all_content)
        challenge_count = sum(1 for kw in challenge_keywords if kw in all_content)
        
        period_text = {
            "week": "이번 주",
            "month": "이번 달",
            "quarter": "이번 분기",
            "year": "올해"
        }.get(period, period)
        
        summary = f"{period_text} 동안 {total}개의 회고를 작성하셨습니다. "
        if growth_count > challenge_count:
            summary += "긍정적인 성장을 이루고 계십니다."
        else:
            summary += "도전적인 경험들을 쌓아가고 계십니다."
        
        highlights = [
            f"총 {total}개의 회고 작성",
            f"성장 관련 키워드 {growth_count}회 언급",
            f"도전 관련 키워드 {challenge_count}회 언급"
        ]
        
        growth_areas = ["자기성찰", "꾸준함"] if total >= 5 else ["시작하는 용기"]
        
        recommendations = [
            "다양한 회고 템플릿을 활용해보세요",
            "회고를 바탕으로 구체적인 액션 플랜을 세워보세요"
        ]
        
        return {
            "period": period,
            "summary": summary,
            "highlights": highlights,
            "growth_areas": growth_areas,
            "recommendations": recommendations,
            "total_reflections": total
        }
