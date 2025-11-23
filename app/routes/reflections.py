from fastapi import APIRouter, Depends, HTTPException, Header, Query
from supabase import Client
from app.database import get_supabase
from app.utils.ai_service import AIService
from typing import Dict, List, Optional

router = APIRouter()
ai_service = AIService()

@router.get("")
async def list_reflections(
    x_user_id: str = Header(..., alias="x-user-id"),
    space_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """회고 목록 조회 - 사용자의 회고 목록을 조회합니다"""
    query = supabase.table("reflections").select("*").eq("user_id", x_user_id).order("created_at", desc=True).range(offset, offset + limit - 1)
    if space_id:
        query = query.eq("space_id", space_id)
    if type:
        query = query.eq("type", type)
    response = query.execute()
    
    reflections = response.data if response.data else []
    for reflection in reflections:
        if "ai_suggestions" not in reflection or reflection["ai_suggestions"] is None:
            reflection["ai_suggestions"] = []
    
    return reflections

@router.post("")
async def create_reflection(
    reflection_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """회고 생성 - 새로운 회고를 생성합니다"""
    reflection_data["user_id"] = x_user_id
    
    # 기본값 보장
    if "ai_suggestions" not in reflection_data:
        reflection_data["ai_suggestions"] = []
    
    response = supabase.table("reflections").insert(reflection_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="회고 생성 실패")
    
    result = response.data[0]
    if "ai_suggestions" not in result or result["ai_suggestions"] is None:
        result["ai_suggestions"] = []
    
    return result

@router.get("/{reflection_id}")
async def get_reflection(
    reflection_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """회고 상세 조회 - 특정 회고의 상세 정보를 조회합니다"""
    response = supabase.table("reflections").select("*").eq("reflection_id", reflection_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="회고를 찾을 수 없습니다")
    
    reflection = response.data[0]
    if "ai_suggestions" not in reflection or reflection["ai_suggestions"] is None:
        reflection["ai_suggestions"] = []
    
    return reflection

@router.patch("/{reflection_id}")
async def update_reflection(
    reflection_id: str,
    reflection_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """회고 수정 - 회고 내용을 수정합니다"""
    response = supabase.table("reflections").update(reflection_data).eq("reflection_id", reflection_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="회고를 찾을 수 없습니다")
    return response.data[0]

@router.delete("/{reflection_id}", status_code=204)
async def delete_reflection(
    reflection_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
):
    """회고 삭제 - 회고를 삭제합니다"""
    response = supabase.table("reflections").delete().eq("reflection_id", reflection_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="회고를 찾을 수 없습니다")
    return None

@router.post("/{reflection_id}/ai-feedback")
async def generate_ai_feedback(
    reflection_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """AI 피드백 생성 - 회고에 대한 AI 피드백을 생성합니다"""
    reflection = supabase.table("reflections").select("*").eq("reflection_id", reflection_id).eq("user_id", x_user_id).execute()
    if not reflection.data:
        raise HTTPException(status_code=404, detail="회고를 찾을 수 없습니다")
    
    reflection_data = reflection.data[0]
    content = reflection_data.get("content", "")
    reflection_type = reflection_data.get("type", "general")
    
    # AI 피드백 생성
    ai_analysis = ai_service.generate_reflection_feedback(content, reflection_type)
    
    # 데이터베이스 업데이트
    response = supabase.table("reflections").update({
        "ai_feedback": ai_analysis["feedback"],
        "ai_suggestions": ai_analysis["suggestions"],
        "sentiment_score": ai_analysis["sentiment_score"],
        "action_score": ai_analysis["action_score"]
    }).eq("reflection_id", reflection_id).execute()
    
    return ai_analysis

@router.get("/stats")
async def get_stats(
    x_user_id: str = Header(..., alias="x-user-id"),
    period: str = Query("week"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """회고 통계 조회 - 사용자의 회고 통계를 조회합니다"""
    from datetime import datetime, timedelta
    
    # 기간 계산
    now = datetime.now()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=7)
    
    start_date_str = start_date.isoformat()
    
    # 기간 내 회고 데이터 조회
    response = supabase.table("reflections").select("*").eq("user_id", x_user_id).gte("created_at", start_date_str).execute()
    
    reflections = response.data if response.data else []
    total_reflections = len(reflections)
    
    # 진행도 점수 평균 계산
    progress_scores = [r.get("progress_score", 0) for r in reflections if r.get("progress_score")]
    avg_progress_score = sum(progress_scores) / len(progress_scores) if progress_scores else 0
    
    # 감정 점수 평균 계산
    sentiment_scores = [r.get("sentiment_score", 0) for r in reflections if r.get("sentiment_score")]
    avg_sentiment_score = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    
    # 액션 점수 평균 계산
    action_scores = [r.get("action_score", 0) for r in reflections if r.get("action_score")]
    avg_action_score = sum(action_scores) / len(action_scores) if action_scores else 0
    
    # 완료율 계산 (진행도 점수 8 이상인 회고 비율)
    completed = sum(1 for r in reflections if r.get("progress_score", 0) >= 8)
    completion_rate = (completed / total_reflections * 100) if total_reflections > 0 else 0
    
    # 회고 타입별 분포
    type_distribution = {}
    for r in reflections:
        r_type = r.get("type", "general")
        type_distribution[r_type] = type_distribution.get(r_type, 0) + 1
    
    # 주간 트렌드 (최근 4주)
    weekly_counts = []
    for i in range(4):
        week_start = now - timedelta(days=7 * (i + 1))
        week_end = now - timedelta(days=7 * i)
        week_start_str = week_start.isoformat()
        week_end_str = week_end.isoformat()
        
        week_response = supabase.table("reflections").select("id", count="exact").eq("user_id", x_user_id).gte("created_at", week_start_str).lte("created_at", week_end_str).execute()
        weekly_counts.insert(0, week_response.count if hasattr(week_response, 'count') else 0)
    
    return {
        "period": period,
        "total_reflections": total_reflections,
        "avg_progress_score": round(avg_progress_score, 2),
        "avg_sentiment_score": round(avg_sentiment_score, 2),
        "avg_action_score": round(avg_action_score, 2),
        "completion_rate": round(completion_rate, 2),
        "type_distribution": type_distribution,
        "weekly_trend": weekly_counts,
        "has_data": total_reflections > 0
    }

@router.get("/story")
async def get_growth_story(
    x_user_id: str = Header(..., alias="x-user-id"),
    period: str = Query(...),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """성장 스토리 조회 - 기간별 성장 스토리를 조회합니다"""
    # 기간에 따른 회고 데이터 조회
    response = supabase.table("reflections").select("*").eq("user_id", x_user_id).order("created_at", desc=True).limit(100).execute()
    
    reflections = response.data if response.data else []
    
    # AI 기반 성장 스토리 생성
    growth_story = ai_service.analyze_growth_story(reflections, period)
    
    return growth_story

@router.get("/micro")
async def list_micro_logs(
    x_user_id: str = Header(..., alias="x-user-id"),
    limit: int = Query(20),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """마이크로 로그 목록 조회 - 사용자의 마이크로 로그 목록을 조회합니다"""
    response = supabase.table("micro_logs").select("*").eq("user_id", x_user_id).order("created_at", desc=True).limit(limit).execute()
    
    # 프론트엔드 호환성을 위해 suggested_tags 필드 보장
    logs = response.data if response.data else []
    for log in logs:
        if "suggested_tags" not in log:
            log["suggested_tags"] = log.get("tags", [])
        if "tags" not in log:
            log["tags"] = []
        if "suggested_tags" not in log or log["suggested_tags"] is None:
            log["suggested_tags"] = []
    
    return logs

@router.post("/micro")
async def create_micro_log(
    log_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """마이크로 로그 생성 - 간단한 활동 기록을 생성합니다"""
    log_data["user_id"] = x_user_id
    
    # AI 태그 자동 생성
    content = log_data.get("content", "")
    context = log_data.get("context", "")
    if content:
        suggested_tags = ai_service.generate_micro_log_tags(content, context)
        log_data["tags"] = suggested_tags
        log_data["suggested_tags"] = suggested_tags
    else:
        log_data["tags"] = []
        log_data["suggested_tags"] = []
    
    response = supabase.table("micro_logs").insert(log_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="마이크로 로그 생성 실패")
    
    result = response.data[0]
    # 프론트엔드 호환성을 위해 suggested_tags 필드 보장
    if "suggested_tags" not in result:
        result["suggested_tags"] = result.get("tags", [])
    
    return result

@router.post("/micro/{log_id}/tags")
async def generate_ai_tags(
    log_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """AI 태그 생성 - 마이크로 로그에 AI 태그를 생성합니다"""
    log = supabase.table("micro_logs").select("*").eq("log_id", log_id).eq("user_id", x_user_id).execute()
    if not log.data:
        raise HTTPException(status_code=404, detail="로그를 찾을 수 없습니다")
    
    log_data = log.data[0]
    content = log_data.get("content", "")
    context = log_data.get("context", "")
    
    # AI 태그 생성
    ai_tags = ai_service.generate_micro_log_tags(content, context)
    
    # 데이터베이스 업데이트
    response = supabase.table("micro_logs").update({"tags": ai_tags}).eq("log_id", log_id).execute()
    
    return {"tags": ai_tags}
