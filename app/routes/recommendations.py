from fastapi import APIRouter, HTTPException, Header, Query
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import ActivityCreate, SuccessResponse

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/activities", response_model=SuccessResponse)
async def list_activities(
    x_user_id: str = Header(..., alias="x-user-id"),
    type: str = Query("all"),
    category: str = Query("all"),
    level: str = Query("all"),
    limit: int = Query(20, ge=1, le=100)
):
    """추천 활동 목록 조회"""
    try:
        supabase = get_supabase()
        query = supabase.table("activities").select("*", count="exact").eq("is_active", True)
        
        if type != "all":
            query = query.eq("type", type)
        if category != "all":
            query = query.eq("category", category)
        if level != "all":
            query = query.eq("level", level)
        
        response = query.order("deadline").limit(limit).execute()
        
        # 북마크 상태 확인
        bookmarks_response = supabase.table("bookmarks").select("activity_id").eq("user_id", x_user_id).execute()
        bookmarked_ids = [b["activity_id"] for b in bookmarks_response.data]
        
        # 매칭 점수 추가 (간단한 알고리즘)
        for activity in response.data:
            activity["is_bookmarked"] = activity["id"] in bookmarked_ids
            activity["match_score"] = 0.85  # TODO: 실제 매칭 알고리즘 구현
            activity["match_reasons"] = [
                "귀하의 전공과 일치합니다",
                "관심 키워드와 일치합니다"
            ]
        
        return SuccessResponse(
            data={
                "recommendations": response.data,
                "total": response.count or 0,
                "personalized": True
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/activities/{activity_id}", response_model=SuccessResponse)
async def get_activity(
    activity_id: str,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """활동 상세 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("activities").select("*").eq("id", activity_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        activity = response.data[0]
        
        # 유사 활동 찾기 (같은 카테고리)
        similar = supabase.table("activities").select("id, title").eq("category", activity.get("category")).neq("id", activity_id).limit(3).execute()
        activity["similar_activities"] = similar.data
        
        # 연관 키워드
        activity["related_keywords"] = activity.get("tags", [])
        
        return SuccessResponse(
            data=activity,
            timestamp=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/activities/{activity_id}/bookmark", response_model=SuccessResponse)
async def bookmark_activity(
    activity_id: str,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """활동 북마크"""
    try:
        supabase = get_supabase()
        
        # 중복 체크
        existing = supabase.table("bookmarks").select("id").eq("user_id", x_user_id).eq("activity_id", activity_id).execute()
        
        if existing.data:
            return SuccessResponse(
                data={"is_bookmarked": True},
                message="이미 북마크에 추가되어 있습니다",
                timestamp=datetime.now()
            )
        
        supabase.table("bookmarks").insert({
            "user_id": x_user_id,
            "activity_id": activity_id
        }).execute()
        
        return SuccessResponse(
            data={"is_bookmarked": True},
            message="북마크에 추가되었습니다",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/activities/{activity_id}/bookmark", response_model=SuccessResponse)
async def unbookmark_activity(
    activity_id: str,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """북마크 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("bookmarks").delete().eq("user_id", x_user_id).eq("activity_id", activity_id).execute()
        
        return SuccessResponse(
            data={"is_bookmarked": False},
            message="북마크가 제거되었습니다",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/bookmarks", response_model=SuccessResponse)
async def list_bookmarks(
    x_user_id: str = Header(..., alias="x-user-id")
):
    """북마크 목록 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("bookmarks").select("""
            activity_id,
            created_at,
            activities (
                id,
                title,
                type,
                deadline
            )
        """).eq("user_id", x_user_id).order("created_at", desc=True).execute()
        
        bookmarks = []
        for item in response.data:
            if item.get("activities"):
                activity = item["activities"]
                bookmarks.append({
                    "activity_id": activity["id"],
                    "title": activity["title"],
                    "type": activity["type"],
                    "deadline": activity.get("deadline"),
                    "bookmarked_at": item["created_at"]
                })
        
        return SuccessResponse(
            data={"bookmarks": bookmarks},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/activities", response_model=SuccessResponse)
async def create_activity(activity: ActivityCreate):
    """활동 생성 (관리자용)"""
    try:
        supabase = get_supabase()
        response = supabase.table("activities").insert({
            "type": activity.type,
            "category": activity.category,
            "title": activity.title,
            "organization": activity.organization,
            "description": activity.description,
            "level": activity.level,
            "deadline": activity.deadline.isoformat() if activity.deadline else None,
            "prize": activity.prize,
            "tags": activity.tags,
            "url": activity.url,
            "image_url": activity.image_url,
            "requirements": activity.requirements,
            "timeline": activity.timeline,
            "prizes": activity.prizes,
            "is_active": True
        }).execute()
        
        return SuccessResponse(
            data={"activity": response.data[0]},
            message="활동이 생성되었습니다",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
