from fastapi import APIRouter, HTTPException, Header
from datetime import datetime, timedelta
from app.database import get_supabase
from app.schemas import SuccessResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=SuccessResponse)
async def get_dashboard_stats(
    x_user_id: str = Header(..., alias="x-user-id")
):
    """대시보드 통계"""
    try:
        supabase = get_supabase()
        
        # 전체 통계
        logs_count = supabase.table("logs").select("id", count="exact").eq("user_id", x_user_id).execute()
        projects_count = supabase.table("projects").select("id", count="exact").eq("user_id", x_user_id).execute()
        keywords_count = supabase.table("user_keywords").select("id", count="exact").eq("user_id", x_user_id).execute()
        reflections_count = supabase.table("reflections").select("id", count="exact").eq("user_id", x_user_id).execute()
        
        # 회고 스페이스 통계
        active_spaces = supabase.table("reflection_spaces")\
            .select("id", count="exact")\
            .eq("user_id", x_user_id)\
            .eq("status", "active")\
            .execute()
        
        # 활성 프로젝트
        active_projects = supabase.table("projects").select("id", count="exact").eq("user_id", x_user_id).eq("status", "active").execute()
        
        # 이번 주 통계
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        this_week_logs = supabase.table("logs").select("id", count="exact").eq("user_id", x_user_id).gte("created_at", week_ago).execute()
        this_week_reflections = supabase.table("reflections")\
            .select("id", count="exact")\
            .eq("user_id", x_user_id)\
            .gte("reflection_date", (datetime.now() - timedelta(days=7)).date().isoformat())\
            .execute()
        
        # 이번 달 통계
        month_ago = (datetime.now() - timedelta(days=30)).isoformat()
        this_month_logs = supabase.table("logs").select("id", count="exact").eq("user_id", x_user_id).gte("created_at", month_ago).execute()
        this_month_reflections = supabase.table("reflections")\
            .select("id", count="exact")\
            .eq("user_id", x_user_id)\
            .gte("reflection_date", (datetime.now() - timedelta(days=30)).date().isoformat())\
            .execute()
        
        # 평균 진행 점수
        reflections_data = supabase.table("reflections")\
            .select("progress_score")\
            .eq("user_id", x_user_id)\
            .execute()
        
        scores = [r.get('progress_score', 0) for r in reflections_data.data if r.get('progress_score')]
        avg_progress = sum(scores) / len(scores) if scores else 0
        
        # 연속 작성일 계산
        recent_dates = supabase.table("reflections")\
            .select("reflection_date")\
            .eq("user_id", x_user_id)\
            .order("reflection_date", desc=True)\
            .limit(30)\
            .execute()
        
        streak_days = calculate_streak(recent_dates.data)
        
        return SuccessResponse(
            data={
                "total_logs": logs_count.count or 0,
                "total_projects": projects_count.count or 0,
                "total_keywords": keywords_count.count or 0,
                "total_reflections": reflections_count.count or 0,
                "active_projects": active_projects.count or 0,
                "active_spaces": active_spaces.count or 0,
                "reflection_streak": streak_days,
                "avg_progress_score": round(avg_progress, 2),
                "this_week": {
                    "logs": this_week_logs.count or 0,
                    "reflections": this_week_reflections.count or 0
                },
                "this_month": {
                    "logs": this_month_logs.count or 0,
                    "reflections": this_month_reflections.count or 0
                }
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def calculate_streak(reflections_data):
    """연속 작성일 계산"""
    if not reflections_data:
        return 0
    
    from datetime import date
    
    dates = sorted([
        datetime.fromisoformat(r['reflection_date']).date() 
        if isinstance(r['reflection_date'], str) 
        else r['reflection_date']
        for r in reflections_data
    ], reverse=True)
    
    if not dates:
        return 0
    
    today = date.today()
    streak = 0
    current_date = today
    
    for reflection_date in dates:
        if reflection_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        elif reflection_date < current_date:
            # 날짜가 건너뛰어짐
            break
    
    return streak

@router.get("/recent-activity", response_model=SuccessResponse)
async def get_recent_activity(
    x_user_id: str = Header(..., alias="x-user-id")
):
    """최근 활동 조회"""
    try:
        supabase = get_supabase()
        
        # 최근 로그
        recent_logs = supabase.table("logs").select("""
            id,
            title,
            created_at,
            projects (name)
        """).eq("user_id", x_user_id).order("created_at", desc=True).limit(5).execute()
        
        # 최근 회고
        recent_reflections = supabase.table("reflections").select("""
            id,
            ai_feedback,
            mood,
            reflection_date,
            created_at,
            reflection_spaces (name)
        """).eq("user_id", x_user_id).order("created_at", desc=True).limit(5).execute()
        
        activities = []
        
        for log in recent_logs.data:
            project_name = log.get("projects", {}).get("name", "알 수 없음") if log.get("projects") else "알 수 없음"
            activities.append({
                "type": "log",
                "title": log["title"],
                "project_name": project_name,
                "created_at": log["created_at"]
            })
        
        for reflection in recent_reflections.data:
            space_name = reflection.get("reflection_spaces", {}).get("name", "알 수 없음") if reflection.get("reflection_spaces") else "알 수 없음"
            snippet = reflection.get("ai_feedback", "")[:50] + "..." if reflection.get("ai_feedback") else "회고 작성"
            activities.append({
                "type": "reflection",
                "title": f"{space_name} 회고",
                "snippet": snippet,
                "mood": reflection.get("mood"),
                "reflection_date": reflection.get("reflection_date"),
                "created_at": reflection["created_at"]
            })
        
        # 시간순 정렬
        activities.sort(key=lambda x: x["created_at"], reverse=True)
        
        return SuccessResponse(
            data=activities[:10],
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reflection-overview", response_model=SuccessResponse)
async def get_reflection_overview(
    x_user_id: str = Header(..., alias="x-user-id")
):
    """회고 개요 (대시보드용)"""
    try:
        supabase = get_supabase()
        
        # 활성 스페이스 목록
        spaces = supabase.table("reflection_spaces")\
            .select("id, name, type, total_reflections, expected_reflections, next_reflection_date")\
            .eq("user_id", x_user_id)\
            .eq("status", "active")\
            .order("next_reflection_date")\
            .limit(5)\
            .execute()
        
        # 최근 회고
        recent_reflections = supabase.table("reflections")\
            .select("id, mood, progress_score, reflection_date, reflection_spaces(name)")\
            .eq("user_id", x_user_id)\
            .order("reflection_date", desc=True)\
            .limit(5)\
            .execute()
        
        # 오늘 작성해야 할 회고
        today = datetime.now().date()
        due_today = [
            space for space in spaces.data 
            if space.get('next_reflection_date') and 
            datetime.fromisoformat(space['next_reflection_date']).date() <= today
        ]
        
        return SuccessResponse(
            data={
                "active_spaces": spaces.data,
                "recent_reflections": recent_reflections.data,
                "due_today_count": len(due_today),
                "due_today": due_today
            },
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
