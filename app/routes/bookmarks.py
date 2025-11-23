from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import Client
from app.database import get_supabase
from typing import Dict, List

router = APIRouter()

@router.get("")
async def list_bookmarks(
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """북마크 목록 조회 - 사용자의 북마크 목록을 조회합니다"""
    response = supabase.table("bookmarks").select("*").eq("user_id", x_user_id).execute()
    return response.data

@router.post("")
async def create_bookmark(
    bookmark_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """북마크 추가 - 활동을 북마크에 추가합니다"""
    bookmark_data["user_id"] = x_user_id
    response = supabase.table("bookmarks").insert(bookmark_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="북마크 추가 실패")
    return response.data[0]

@router.delete("/{bookmark_id}", status_code=204)
async def delete_bookmark(
    bookmark_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
):
    """북마크 삭제 - 북마크를 삭제합니다"""
    response = supabase.table("bookmarks").delete().eq("bookmark_id", bookmark_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="북마크를 찾을 수 없습니다")
    return None
