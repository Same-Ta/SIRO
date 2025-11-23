from fastapi import APIRouter, Depends, HTTPException, Header, Query
from supabase import Client
from app.database import get_supabase
from typing import Dict, List, Optional

router = APIRouter()

@router.get("")
async def list_spaces(
    x_user_id: str = Header(..., alias="x-user-id"),
    status: Optional[str] = Query(None),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """스페이스 목록 조회 - 사용자의 스페이스 목록을 조회합니다"""
    query = supabase.table("spaces").select("*").eq("user_id", x_user_id)
    if status:
        query = query.eq("status", status)
    response = query.execute()
    return response.data

@router.post("")
async def create_space(
    space_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """스페이스 생성 - 새로운 스페이스를 생성합니다"""
    space_data["user_id"] = x_user_id
    response = supabase.table("spaces").insert(space_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="스페이스 생성 실패")
    return response.data[0]

@router.get("/{space_id}")
async def get_space(
    space_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """스페이스 상세 조회 - 특정 스페이스의 상세 정보를 조회합니다"""
    response = supabase.table("spaces").select("*").eq("space_id", space_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    return response.data[0]

@router.patch("/{space_id}")
async def update_space(
    space_id: str,
    space_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """스페이스 수정 - 스페이스 정보를 수정합니다"""
    response = supabase.table("spaces").update(space_data).eq("space_id", space_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    return response.data[0]

@router.delete("/{space_id}", status_code=204)
async def delete_space(
    space_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
):
    """스페이스 삭제 - 스페이스를 삭제합니다"""
    response = supabase.table("spaces").delete().eq("space_id", space_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    return None

@router.get("/{space_id}/members")
async def list_members(
    space_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """스페이스 멤버 목록 조회 - 스페이스의 멤버 목록을 조회합니다"""
    response = supabase.table("space_members").select("*").eq("space_id", space_id).execute()
    return response.data

@router.post("/{space_id}/members")
async def invite_member(
    space_id: str,
    member_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """스페이스 멤버 초대 - 스페이스에 멤버를 초대합니다"""
    member_data["space_id"] = space_id
    response = supabase.table("space_members").insert(member_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="멤버 초대 실패")
    return response.data[0]
