from fastapi import APIRouter, HTTPException, Header, Query
from datetime import datetime
from app.database import get_supabase
from app.schemas import SuccessResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=SuccessResponse)
async def list_notifications(
    x_user_id: str = Header(..., alias="x-user-id"),
    unread_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=100)
):
    """알림 목록 조회"""
    try:
        supabase = get_supabase()
        query = supabase.table("notifications").select("*").eq("user_id", x_user_id)
        
        if unread_only:
            query = query.is_("read_at", "null")
        
        response = query.order("created_at", desc=True).limit(limit).execute()
        
        # 읽지 않은 알림 개수
        unread_count_response = supabase.table("notifications").select("id", count="exact").eq("user_id", x_user_id).is_("read_at", "null").execute()
        
        return SuccessResponse(
            data=response.data,
            message=None,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{notification_id}/read", response_model=SuccessResponse)
async def mark_notification_as_read(
    notification_id: str,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """알림 읽음 처리"""
    try:
        supabase = get_supabase()
        response = supabase.table("notifications").update({
            "read_at": datetime.now().isoformat()
        }).eq("id", notification_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return SuccessResponse(
            data={},
            message="알림을 읽음 처리했습니다",
            timestamp=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/unread-count", response_model=SuccessResponse)
async def get_unread_count(
    x_user_id: str = Header(..., alias="x-user-id")
):
    """읽지 않은 알림 개수"""
    try:
        supabase = get_supabase()
        response = supabase.table("notifications").select("id", count="exact").eq("user_id", x_user_id).is_("read_at", "null").execute()
        
        return SuccessResponse(
            data={"count": response.count or 0},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("", response_model=SuccessResponse)
async def create_notification(
    data: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """알림 생성 (내부용)"""
    try:
        supabase = get_supabase()
        response = supabase.table("notifications").insert({
            "user_id": x_user_id,
            "type": data.get("type"),
            "title": data.get("title"),
            "content": data.get("content"),
            "link": data.get("link")
        }).execute()
        
        return SuccessResponse(
            data={"notification": response.data[0]},
            message="알림이 생성되었습니다",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
