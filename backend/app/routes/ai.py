from fastapi import APIRouter, HTTPException, Header, Depends
from datetime import datetime
from typing import List
from pydantic import BaseModel
from app.database import get_supabase
from app.schemas import SuccessResponse
from app.utils.auth import get_current_user_id
import os

router = APIRouter()

class TagSuggestionRequest(BaseModel):
    """AI 태그 제안 요청"""
    activity_type: str
    memo: str

@router.post("/suggest-tags")
async def suggest_tags(
    request: TagSuggestionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """AI 태그 제안 (회고 v3 시스템용)"""
    try:
        # 간단한 키워드 매핑 (실제로는 Gemini API 사용)
        activity_keywords = {
            "contest": ["기획", "발표", "팀워크", "아이디어"],
            "club": ["협업", "리더십", "네트워킹", "팀빌딩"],
            "project": ["개발", "문제해결", "디자인", "기획"],
            "internship": ["업무", "실무경험", "커뮤니케이션", "전문성"],
            "study": ["학습", "성장", "집중", "자기계발"],
            "etc": ["경험", "활동", "참여", "도전"]
        }
        
        # memo에서 키워드 추출 (간단한 버전)
        memo_lower = request.memo.lower()
        suggested = []
        
        # 활동 유형 기반 태그
        base_tags = activity_keywords.get(request.activity_type, ["활동"])
        suggested.extend(base_tags[:3])
        
        # memo에 특정 단어 포함 시 추가 태그
        if "발표" in request.memo or "프레젠테이션" in request.memo:
            suggested.append("발표")
        if "회의" in request.memo:
            suggested.append("회의")
        if "기획" in request.memo:
            suggested.append("기획")
        if "디자인" in request.memo:
            suggested.append("디자인")
        if "코딩" in request.memo or "개발" in request.memo:
            suggested.append("개발")
        if "분석" in request.memo or "데이터" in request.memo:
            suggested.append("데이터분석")
        
        # 중복 제거 및 최대 5개
        unique_tags = list(dict.fromkeys(suggested))[:5]
        
        return {
            "success": True,
            "data": {
                "tags": unique_tags
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "AI_ERROR",
                "message": str(e)
            }
        }

@router.post("/extract-keywords", response_model=SuccessResponse)
async def extract_keywords(
    data: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """키워드 추출 (AI 기반)"""
    try:
        content = data.get("content", "")
        
        # TODO: OpenAI GPT-4 API 호출
        # prompt = f"다음 텍스트에서 역량 키워드를 추출해주세요: {content}"
        
        # 임시 키워드 (실제로는 AI API 사용)
        keywords = [
            {"text": "데이터분석", "color": "blue", "confidence": 0.92},
            {"text": "팀워크", "color": "purple", "confidence": 0.89},
            {"text": "리더십", "color": "yellow", "confidence": 0.87}
        ]
        
        suggested_tags = [
            {"text": "협업", "bgColor": "#DDF3EB", "textColor": "#186D50"},
            {"text": "분석", "bgColor": "#DDF3EB", "textColor": "#186D50"}
        ]
        
        return SuccessResponse(
            data={
                "keywords": keywords,
                "suggestedTags": suggested_tags
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-feedback", response_model=SuccessResponse)
async def generate_feedback(
    data: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """회고 피드백 생성 (AI 기반)"""
    try:
        reflection_content = data.get("reflection_content", "")
        progress_score = data.get("progress_score", 5)
        mood = data.get("mood", "good")
        previous_reflections = data.get("previous_reflections", [])
        
        # TODO: OpenAI GPT-4 API 호출
        # context = "\n".join(previous_reflections)
        # prompt = f"이전 회고: {context}\n현재 회고: {reflection_content}\n기분: {mood}\n진행도: {progress_score}\n\n피드백을 제공해주세요."
        
        # 임시 피드백 (실제로는 AI API 사용)
        feedback = "훌륭한 진행 상황입니다. 데이터 분석 완료는 프로젝트의 중요한 이정표입니다. 꾸준히 발전하고 있습니다."
        
        suggestions = [
            "다음 단계로 시각화 작업을 진행해보세요",
            "팀원들과 분석 결과를 공유하면 좋을 것 같습니다",
            "문서화를 시작하면 나중에 도움이 될 것입니다"
        ]
        
        improvement_areas = [
            "시간 관리: 다음에는 분석 단계를 세분화하여 시간 예측을 개선해보세요"
        ]
        
        strengths = [
            "꼼꼼한 데이터 분석",
            "결과에 대한 만족도 높음",
            "지속적인 노력"
        ]
        
        return SuccessResponse(
            data={
                "feedback": feedback,
                "suggestions": suggestions,
                "improvement_areas": improvement_areas,
                "strengths": strengths
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze-project", response_model=SuccessResponse)
async def analyze_project(
    data: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """프로젝트 AI 분석 및 요약"""
    try:
        project_id = data.get("project_id")
        
        supabase = get_supabase()
        
        # 프로젝트 정보 가져오기
        project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # 프로젝트의 로그 가져오기
        logs = supabase.table("logs").select("*").eq("project_id", project_id).execute()
        
        # TODO: OpenAI GPT-4 API로 프로젝트 분석
        # all_content = "\n".join([log["content"] for log in logs.data])
        
        ai_summary = "이 프로젝트는 데이터 분석과 팀워크를 중심으로 진행되었습니다. 주요 성과로는 효율적인 협업과 문제 해결 능력 향상이 있습니다."
        
        # 프로젝트 테이블 업데이트
        supabase.table("projects").update({
            "ai_summary": ai_summary
        }).eq("id", project_id).execute()
        
        return SuccessResponse(
            data={
                "ai_summary": ai_summary,
                "total_logs": len(logs.data),
                "key_achievements": ["데이터 분석 완료", "팀워크 향상", "문제 해결"]
            },
            timestamp=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
