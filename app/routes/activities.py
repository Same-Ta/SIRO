from fastapi import APIRouter, Depends, HTTPException, Header, Query
from supabase import Client
from app.database import get_supabase
from app.utils.ai_service import AIService
from typing import Dict, List, Optional

router = APIRouter()
ai_service = AIService()

@router.get("")
async def list_activities(
    category: Optional[str] = Query(None),
    field: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("latest"),
    limit: int = Query(20),
    offset: int = Query(0),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """활동 목록 조회 - 추천 활동 목록을 조회합니다"""
    query = supabase.table("activities").select("*").range(offset, offset + limit - 1)
    if category:
        query = query.eq("category", category)
    if field:
        query = query.contains("field", field)
    if search:
        query = query.ilike("title", f"%{search}%")
    
    if sort == "deadline":
        query = query.order("end_date", desc=False)
    elif sort == "popular":
        query = query.order("view_count", desc=True)
    else:
        query = query.order("created_at", desc=True)
    
    response = query.execute()
    activities = response.data if response.data else []
    
    # 배열 필드 보장
    for activity in activities:
        if "field" not in activity or activity["field"] is None:
            activity["field"] = []
        elif isinstance(activity["field"], str):
            activity["field"] = [activity["field"]]
        if "required_skills" not in activity or activity["required_skills"] is None:
            activity["required_skills"] = []
        elif isinstance(activity["required_skills"], str):
            activity["required_skills"] = [activity["required_skills"]]
    
    return activities

@router.get("/{activity_id}")
async def get_activity(
    activity_id: str,
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """활동 상세 조회 - 특정 활동의 상세 정보를 조회합니다"""
    response = supabase.table("activities").select("*").eq("activity_id", activity_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="활동을 찾을 수 없습니다")
    
    activity = response.data[0]
    # 배열 필드 보장
    if "field" not in activity or activity["field"] is None:
        activity["field"] = []
    elif isinstance(activity["field"], str):
        activity["field"] = [activity["field"]]
    if "required_skills" not in activity or activity["required_skills"] is None:
        activity["required_skills"] = []
    elif isinstance(activity["required_skills"], str):
        activity["required_skills"] = [activity["required_skills"]]
    
    return activity

@router.get("/recommend")
async def recommend_activities(
    x_user_id: str = Header(..., alias="x-user-id"),
    limit: int = Query(10),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """맞춤 활동 추천 - 사용자에게 맞춤 활동을 추천합니다"""
    # 사용자 프로필 조회
    user_response = supabase.table("users").select("interests, skills").eq("user_id", x_user_id).execute()
    
    user_interests = []
    user_skills = []
    
    if user_response.data:
        user_data = user_response.data[0]
        user_interests = user_data.get("interests", [])
        user_skills = user_data.get("skills", [])
        
        # 문자열인 경우 리스트로 변환
        if isinstance(user_interests, str):
            user_interests = [user_interests]
        if isinstance(user_skills, str):
            user_skills = [user_skills]
    
    # 전체 활동 목록 조회
    activities_response = supabase.table("activities").select("*").limit(100).execute()
    all_activities = activities_response.data if activities_response.data else []
    
    if not all_activities:
        return []
    
    # AI 기반 추천
    recommended = ai_service.recommend_activities_for_user(
        user_interests=user_interests,
        user_skills=user_skills,
        activities=all_activities
    )
    
    return recommended[:limit]

@router.post("/{activity_id}/view")
async def increment_view(
    activity_id: str,
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """조회수 증가 - 활동 조회수를 증가시킵니다"""
    activity = supabase.table("activities").select("view_count").eq("activity_id", activity_id).execute()
    if not activity.data:
        raise HTTPException(status_code=404, detail="활동을 찾을 수 없습니다")
    
    new_count = (activity.data[0].get("view_count") or 0) + 1
    supabase.table("activities").update({"view_count": new_count}).eq("activity_id", activity_id).execute()
    return {"view_count": new_count}
