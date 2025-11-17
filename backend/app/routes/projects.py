from fastapi import APIRouter, HTTPException, Header, Query
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import ProjectCreate, ProjectUpdate, SuccessResponse

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=SuccessResponse)
async def create_project(project: ProjectCreate, x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트 생성"""
    try:
        supabase = get_supabase()
        response = supabase.table("projects").insert({
            "user_id": x_user_id,
            "name": project.name,
            "description": project.description,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "status": project.status,
            "tags": project.tags,
            "thumbnail_url": project.thumbnail_url,
        }).execute()
        
        return SuccessResponse(
            data={"project": response.data[0]},
            message="Project created successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=SuccessResponse)
async def list_projects(
    x_user_id: str = Header(..., alias="x-user-id"),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """프로젝트 목록 조회 (페이지네이션, 상태 필터)"""
    try:
        supabase = get_supabase()
        query = supabase.table("projects").select("*", count="exact").eq("user_id", x_user_id)
        
        if status:
            query = query.eq("status", status)
        
        offset = (page - 1) * limit
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return SuccessResponse(
            data={
                "projects": response.data,
                "total": response.count,
                "page": page,
                "limit": limit
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}", response_model=SuccessResponse)
async def get_project(project_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트 상세 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return SuccessResponse(
            data={"project": response.data[0]},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{project_id}", response_model=SuccessResponse)
async def update_project(project_id: str, project_update: ProjectUpdate, x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트 수정"""
    try:
        supabase = get_supabase()
        update_data = project_update.model_dump(exclude_unset=True)
        
        if "start_date" in update_data and update_data["start_date"]:
            update_data["start_date"] = update_data["start_date"].isoformat()
        if "end_date" in update_data and update_data["end_date"]:
            update_data["end_date"] = update_data["end_date"].isoformat()
        
        response = supabase.table("projects").update(update_data).eq("id", project_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return SuccessResponse(
            data={"project": response.data[0]},
            message="Project updated successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{project_id}", response_model=SuccessResponse)
async def delete_project(project_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("projects").delete().eq("id", project_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return SuccessResponse(
            message="Project deleted successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}/logs", response_model=SuccessResponse)
async def get_project_logs(project_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트에 속한 경험 로그 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("logs").select("*").eq("project_id", project_id).eq("user_id", x_user_id).execute()
        
        return SuccessResponse(
            data={"logs": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/simple-list", response_model=SuccessResponse)
async def get_simple_project_list(x_user_id: str = Header(..., alias="x-user-id")):
    """프로젝트 간단 목록 (드롭다운용)"""
    try:
        supabase = get_supabase()
        response = supabase.table("projects").select("id, name").eq("user_id", x_user_id).eq("status", "active").execute()
        
        return SuccessResponse(
            data=response.data,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/members", response_model=SuccessResponse)
async def add_team_member(
    project_id: str,
    member_data: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """팀원 추가"""
    try:
        supabase = get_supabase()
        
        # 프로젝트 소유권 확인
        project = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", x_user_id).execute()
        if not project.data:
            raise HTTPException(status_code=403, detail="권한이 없습니다")
        
        response = supabase.table("team_members").insert({
            "project_id": project_id,
            "name": member_data.get("name"),
            "role": member_data.get("role"),
            "email": member_data.get("email"),
            "is_leader": member_data.get("is_leader", False)
        }).execute()
        
        return SuccessResponse(
            data={"member": response.data[0]},
            message="팀원이 추가되었습니다",
            timestamp=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}/members", response_model=SuccessResponse)
async def list_team_members(project_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """팀원 목록 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("team_members").select("*").eq("project_id", project_id).execute()
        
        return SuccessResponse(
            data={"members": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
