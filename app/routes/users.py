from fastapi import APIRouter, Depends, UploadFile, File
from datetime import datetime
from app.database import get_supabase
from pydantic import BaseModel
from typing import Optional
from app.utils.auth import get_current_user_id

router = APIRouter()

class UserUpdate(BaseModel):
    """사용자 정보 수정 요청"""
    name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    profileImage: Optional[str] = None

class BaselineMoodUpdate(BaseModel):
    """베이스라인 무드 설정 요청"""
    baseline_mood: str  # tired | neutral | positive

@router.get("/me")
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """내 정보 조회"""
    try:
        supabase = get_supabase()
        
        # 사용자 조회
        user_response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not user_response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "사용자를 찾을 수 없습니다"
                }
            }
        
        user = user_response.data[0]
        
        # 통계 정보 집계
        activities_count = supabase.table("projects").select("id", count="exact").eq("user_id", user_id).execute().count or 0
        logs_count = supabase.table("logs").select("id", count="exact").eq("user_id", user_id).execute().count or 0
        
        # 연속 기록 계산 (streak)
        # TODO: 실제 연속 기록 계산 로직 구현
        streak = 0
        
        return {
            "success": True,
            "data": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "university": user.get("university"),
                "major": user.get("major"),
                "profileImage": user.get("profile_image"),
                "baselineMood": user.get("baseline_mood"),
                "stats": {
                    "totalActivities": activities_count,
                    "totalLogs": logs_count,
                    "streak": streak
                },
                "createdAt": user["created_at"]
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

@router.put("/me")
async def update_user(
    user_update: UserUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """프로필 수정"""
    try:
        supabase = get_supabase()
        
        # 수정할 데이터 준비
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.university is not None:
            update_data["university"] = user_update.university
        if user_update.major is not None:
            update_data["major"] = user_update.major
        if user_update.profileImage is not None:
            update_data["profile_image"] = user_update.profileImage
        
        if not update_data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "NO_DATA",
                    "message": "수정할 데이터가 없습니다"
                }
            }
        
        # 사용자 정보 업데이트
        response = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if not response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "사용자를 찾을 수 없습니다"
                }
            }
        
        user = response.data[0]
        
        return {
            "success": True,
            "data": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "university": user.get("university"),
                "major": user.get("major"),
                "profileImage": user.get("profile_image")
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

class BaselineMoodUpdate(BaseModel):
    """베이스라인 무드 설정 요청"""
    baseline_mood: str  # tired | neutral | positive

@router.post("/baseline-mood")
async def set_baseline_mood(
    mood_update: BaselineMoodUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """베이스라인 무드 설정 (회고 v3)"""
    try:
        supabase = get_supabase()
        
        # 유효성 검증
        if mood_update.baseline_mood not in ['tired', 'neutral', 'positive']:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_MOOD",
                    "message": "잘못된 무드 값입니다"
                }
            }
        
        # 베이스라인 무드 업데이트
        response = supabase.table("users").update({
            "baseline_mood": mood_update.baseline_mood
        }).eq("user_id", user_id).execute()
        
        if not response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "사용자를 찾을 수 없습니다"
                }
            }
        
        user = response.data[0]
        
        return {
            "success": True,
            "data": {
                "user_id": user["user_id"],
                "baseline_mood": user["baseline_mood"],
                "updated_at": datetime.now().isoformat()
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

