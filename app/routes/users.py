from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import Client
from app.database import get_supabase
from typing import Dict, Optional

router = APIRouter()

@router.get("/me")
async def get_me(
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """내 정보 조회 - 현재 로그인한 사용자의 정보를 조회합니다"""
    response = supabase.table("users").select("*").eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return response.data[0]

@router.patch("/me")
async def update_me(
    user_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """내 정보 수정 - 사용자 정보를 수정합니다"""
    response = supabase.table("users").update(user_data).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return response.data[0]
