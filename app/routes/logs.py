from fastapi import APIRouter, HTTPException, Header, Query
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import LogCreate, LogUpdate, SuccessResponse

router = APIRouter(prefix="/logs", tags=["logs"])

@router.post("", response_model=SuccessResponse)
async def create_log(log: LogCreate, x_user_id: str = Header(..., alias="x-user-id")):
    """경험 로그 생성"""
    try:
        supabase = get_supabase()
        response = supabase.table("logs").insert({
            "user_id": x_user_id,
            "project_id": log.project_id,
            "title": log.title,
            "content": log.content,
            "reflection": log.reflection,
            "date": log.date.isoformat() if log.date else None,
            "period": log.period,
            "tags": log.tags,
        }).execute()
        
        return SuccessResponse(
            data={"log": response.data[0]},
            message="Log created successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=SuccessResponse)
async def list_logs(
    x_user_id: str = Header(..., alias="x-user-id"),
    project_id: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """경험 로그 목록 조회 (페이지네이션, 필터)"""
    try:
        supabase = get_supabase()
        query = supabase.table("logs").select("*", count="exact").eq("user_id", x_user_id)
        
        if project_id:
            query = query.eq("project_id", project_id)
        if period:
            query = query.eq("period", period)
        
        offset = (page - 1) * limit
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return SuccessResponse(
            data={
                "logs": response.data,
                "total": response.count,
                "page": page,
                "limit": limit
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{log_id}", response_model=SuccessResponse)
async def get_log(log_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """경험 로그 상세 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("logs").select("*").eq("id", log_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        return SuccessResponse(
            data={"log": response.data[0]},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{log_id}", response_model=SuccessResponse)
async def update_log(log_id: str, log_update: LogUpdate, x_user_id: str = Header(..., alias="x-user-id")):
    """경험 로그 수정"""
    try:
        supabase = get_supabase()
        update_data = log_update.model_dump(exclude_unset=True)
        
        if "date" in update_data and update_data["date"]:
            update_data["date"] = update_data["date"].isoformat()
        
        response = supabase.table("logs").update(update_data).eq("id", log_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        return SuccessResponse(
            data={"log": response.data[0]},
            message="Log updated successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{log_id}", response_model=SuccessResponse)
async def delete_log(log_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """경험 로그 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("logs").delete().eq("id", log_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found")
        
        return SuccessResponse(
            message="Log deleted successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
