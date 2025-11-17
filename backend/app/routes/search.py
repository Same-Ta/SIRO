from fastapi import APIRouter, HTTPException, Header, Query
from datetime import datetime
from app.database import get_supabase
from app.schemas import SuccessResponse

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=SuccessResponse)
async def search(
    x_user_id: str = Header(..., alias="x-user-id"),
    q: str = Query(..., min_length=1),
    type: str = Query("all")
):
    """통합 검색"""
    try:
        supabase = get_supabase()
        results = {
            "logs": [],
            "projects": [],
            "keywords": [],
            "reflections": [],
            "spaces": [],
            "templates": []
        }
        
        if type in ["all", "logs"]:
            # 로그 검색
            logs = supabase.table("logs").select("id, title, content").eq("user_id", x_user_id).ilike("title", f"%{q}%").execute()
            results["logs"] = [
                {
                    "id": log["id"],
                    "title": log["title"],
                    "snippet": log.get("content", "")[:100] + "..." if log.get("content") else ""
                }
                for log in logs.data
            ]
        
        if type in ["all", "projects"]:
            # 프로젝트 검색
            projects = supabase.table("projects").select("id, name").eq("user_id", x_user_id).ilike("name", f"%{q}%").execute()
            results["projects"] = [
                {
                    "id": project["id"],
                    "name": project["name"]
                }
                for project in projects.data
            ]
        
        if type in ["all", "keywords"]:
            # 키워드 검색
            keywords = supabase.table("keywords").select("id, name").ilike("name", f"%{q}%").execute()
            results["keywords"] = [
                {
                    "id": keyword["id"],
                    "name": keyword["name"]
                }
                for keyword in keywords.data
            ]
        
        if type in ["all", "reflections"]:
            # 회고 검색 (AI 피드백 또는 답변 내용)
            reflections = supabase.table("reflections")\
                .select("id, space_id, ai_feedback, reflection_date, mood")\
                .eq("user_id", x_user_id)\
                .or_(f"ai_feedback.ilike.%{q}%")\
                .limit(10)\
                .execute()
            
            results["reflections"] = [
                {
                    "id": r["id"],
                    "space_id": r.get("space_id"),
                    "snippet": r.get("ai_feedback", "")[:100] + "..." if r.get("ai_feedback") else "",
                    "date": r.get("reflection_date"),
                    "mood": r.get("mood")
                }
                for r in reflections.data
            ]
        
        if type in ["all", "spaces"]:
            # 회고 스페이스 검색
            spaces = supabase.table("reflection_spaces")\
                .select("id, name, type, status")\
                .eq("user_id", x_user_id)\
                .ilike("name", f"%{q}%")\
                .execute()
            
            results["spaces"] = [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "type": s.get("type"),
                    "status": s.get("status")
                }
                for s in spaces.data
            ]
        
        if type in ["all", "templates"]:
            # 템플릿 검색
            templates = supabase.table("reflection_templates")\
                .select("id, name, category, description")\
                .eq("is_active", True)\
                .or_(f"name.ilike.%{q}%,description.ilike.%{q}%")\
                .execute()
            
            results["templates"] = [
                {
                    "id": t["id"],
                    "name": t["name"],
                    "category": t.get("category"),
                    "description": t.get("description")
                }
                for t in templates.data
            ]
        
        return SuccessResponse(
            data=results,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
