"""
Health Check 엔드포인트
사용자의 매일 건강 상태 (기분/팀 상태) 기록
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.database import get_supabase
from app.utils.auth import get_current_user

router = APIRouter()

class HealthCheckCreate(BaseModel):
    health_score: int  # 0-100
    date: Optional[str] = None  # ISO date string, defaults to today
    notes: Optional[str] = None

class HealthCheckResponse(BaseModel):
    id: str
    user_id: str
    health_score: int
    date: str
    notes: Optional[str]
    created_at: str

@router.post("/health-check", response_model=dict)
async def create_health_check(
    data: HealthCheckCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    오늘의 컨디션(기분/팀 상태) 기록
    0~100 스케일로 기록
    """
    user_id = current_user["id"]
    check_date = data.date or datetime.now().date().isoformat()
    
    # Validate score
    if not 0 <= data.health_score <= 100:
        raise HTTPException(status_code=400, detail="health_score must be between 0 and 100")
    
    # Insert or update (upsert by user_id + date)
    result = supabase.table("health_checks").upsert({
        "user_id": user_id,
        "health_score": data.health_score,
        "date": check_date,
        "notes": data.notes,
        "updated_at": datetime.now().isoformat()
    }, on_conflict="user_id,date").execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save health check")
    
    return {
        "success": True,
        "data": result.data[0]
    }

@router.get("/health-check/latest", response_model=dict)
async def get_latest_health_check(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    사용자의 가장 최근 헬스체크 조회
    """
    user_id = current_user["id"]
    
    result = supabase.table("health_checks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("date", desc=True)\
        .limit(1)\
        .execute()
    
    if not result.data:
        return {
            "success": True,
            "data": None
        }
    
    return {
        "success": True,
        "data": result.data[0]
    }

@router.get("/health-check/history", response_model=dict)
async def get_health_check_history(
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    사용자의 헬스체크 히스토리 조회 (최근 30일)
    """
    user_id = current_user["id"]
    
    result = supabase.table("health_checks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("date", desc=True)\
        .limit(limit)\
        .execute()
    
    return {
        "success": True,
        "data": result.data
    }
