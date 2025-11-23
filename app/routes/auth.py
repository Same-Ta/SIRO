from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.database import get_supabase
from typing import Dict

router = APIRouter()

@router.post("/register")
async def register(
    user_data: Dict,
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """회원가입 - 새로운 사용자를 등록합니다"""
    existing = supabase.table("users").select("user_id").eq("user_id", user_data.get("user_id")).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="이미 존재하는 사용자")
    
    response = supabase.table("users").insert({
        "user_id": user_data.get("user_id"),
        "name": user_data.get("name"),
        "email": user_data.get("email"),
        "password": user_data.get("password"),
        "university": user_data.get("university"),
        "major": user_data.get("major")
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="잘못된 요청")
    return response.data[0]

@router.post("/login")
async def login(
    credentials: Dict,
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """로그인 - 사용자 인증을 수행합니다"""
    user_response = supabase.table("users").select("*").eq("user_id", credentials.get("user_id")).eq("password", credentials.get("password")).execute()
    if not user_response.data:
        raise HTTPException(status_code=401, detail="인증 실패")
    return {"user": user_response.data[0], "token": "dummy_token"}
