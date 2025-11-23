from fastapi import APIRouter, Depends, HTTPException, Header, Query
from supabase import Client
from app.database import get_supabase
from typing import Dict, List, Optional

router = APIRouter()

@router.get("")
async def list_templates(
    category: Optional[str] = Query(None),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """템플릿 목록 조회 - 회고 템플릿 목록을 조회합니다"""
    query = supabase.table("reflection_templates").select("*")
    if category:
        query = query.eq("category", category)
    response = query.execute()
    return response.data

@router.get("/{template_id}")
async def get_template(
    template_id: str,
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """템플릿 상세 조회 - 특정 템플릿의 상세 정보를 조회합니다"""
    response = supabase.table("reflection_templates").select("*").eq("template_id", template_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")
    return response.data[0]

@router.get("/recommend")
async def recommend_templates(
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """추천 템플릿 조회 - 사용자에게 적합한 템플릿을 추천합니다"""
    response = supabase.table("reflection_templates").select("*").limit(5).execute()
    return response.data
