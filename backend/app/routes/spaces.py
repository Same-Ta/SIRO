from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_supabase
from ..auth import get_current_user
from ..schemas import (
    ReflectionSpaceCreate, 
    ReflectionSpaceResponse,
    CycleRecommendRequest
)

router = APIRouter(prefix="/api/v1/spaces", tags=["Reflection Spaces"])

def calculate_next_reflection_date(start_date, cycle: str):
    """다음 회고 날짜 계산"""
    now = datetime.now().date()
    
    if cycle == "daily":
        return datetime.combine(now + timedelta(days=1), datetime.min.time())
    elif cycle == "weekly":
        days_ahead = 7 - now.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return datetime.combine(now + timedelta(days=days_ahead), datetime.min.time())
    elif cycle == "biweekly":
        days_ahead = 14 - (now - start_date).days % 14
        return datetime.combine(now + timedelta(days=days_ahead), datetime.min.time())
    elif cycle == "monthly":
        next_month = now.replace(day=start_date.day)
        if next_month <= now:
            if now.month == 12:
                next_month = next_month.replace(year=now.year + 1, month=1)
            else:
                next_month = next_month.replace(month=now.month + 1)
        return datetime.combine(next_month, datetime.min.time())
    
    return None

def calculate_expected_reflections(start_date, end_date, cycle: str):
    """예상 회고 횟수 계산"""
    days_diff = (end_date - start_date).days + 1
    
    if cycle == "daily":
        return days_diff
    elif cycle == "weekly":
        return (days_diff + 6) // 7
    elif cycle == "biweekly":
        return (days_diff + 13) // 14
    elif cycle == "monthly":
        return (days_diff + 29) // 30
    
    return 0

@router.post("", response_model=ReflectionSpaceResponse)
async def create_space(
    space: ReflectionSpaceCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """회고 스페이스 생성"""
    user_id = current_user['id']
    
    # 종료일이 시작일보다 이전인지 확인
    if space.end_date < space.start_date:
        raise HTTPException(status_code=400, detail="종료일은 시작일 이후여야 합니다")
    
    # 주기가 유효한지 확인
    valid_cycles = ["daily", "weekly", "biweekly", "monthly"]
    if space.reflection_cycle not in valid_cycles:
        raise HTTPException(status_code=400, detail=f"유효한 주기: {', '.join(valid_cycles)}")
    
    # 다음 회고 날짜 계산
    next_reflection_date = calculate_next_reflection_date(space.start_date, space.reflection_cycle)
    
    # 예상 회고 횟수 계산
    expected_reflections = calculate_expected_reflections(space.start_date, space.end_date, space.reflection_cycle)
    
    space_data = {
        "user_id": user_id,
        "name": space.name,
        "type": space.type,
        "description": space.description,
        "start_date": space.start_date.isoformat(),
        "end_date": space.end_date.isoformat(),
        "reflection_cycle": space.reflection_cycle,
        "reminder_enabled": space.reminder_enabled,
        "next_reflection_date": next_reflection_date.isoformat() if next_reflection_date else None,
        "expected_reflections": expected_reflections,
        "status": "active"
    }
    
    response = supabase.table("reflection_spaces").insert(space_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="스페이스 생성에 실패했습니다")
    
    return response.data[0]

@router.get("", response_model=List[ReflectionSpaceResponse])
async def list_spaces(
    status: Optional[str] = None,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """회고 스페이스 목록 조회"""
    user_id = current_user['id']
    
    query = supabase.table("reflection_spaces").select("*").eq("user_id", user_id)
    
    if status:
        query = query.eq("status", status)
    if type:
        query = query.eq("type", type)
    
    response = query.order("created_at", desc=True).execute()
    return response.data

@router.get("/{space_id}", response_model=ReflectionSpaceResponse)
async def get_space(
    space_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """특정 스페이스 상세 조회"""
    user_id = current_user['id']
    
    response = supabase.table("reflection_spaces")\
        .select("*")\
        .eq("id", space_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    
    return response.data[0]

@router.patch("/{space_id}", response_model=ReflectionSpaceResponse)
async def update_space(
    space_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """스페이스 수정"""
    user_id = current_user['id']
    
    # 스페이스 존재 확인
    check = supabase.table("reflection_spaces")\
        .select("*")\
        .eq("id", space_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not check.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    
    # 주기가 변경되면 다음 회고 날짜 재계산
    if "reflection_cycle" in updates:
        space_data = check.data[0]
        start_date = datetime.fromisoformat(space_data['start_date']).date()
        next_date = calculate_next_reflection_date(start_date, updates['reflection_cycle'])
        updates['next_reflection_date'] = next_date.isoformat() if next_date else None
    
    response = supabase.table("reflection_spaces")\
        .update(updates)\
        .eq("id", space_id)\
        .eq("user_id", user_id)\
        .execute()
    
    return response.data[0]

@router.delete("/{space_id}")
async def delete_space(
    space_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """스페이스 삭제 (상태를 completed로 변경)"""
    user_id = current_user['id']
    
    response = supabase.table("reflection_spaces")\
        .update({"status": "completed"})\
        .eq("id", space_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    
    return {"message": "스페이스가 완료 처리되었습니다"}

@router.post("/recommend-cycle")
async def recommend_reflection_cycle(
    request: CycleRecommendRequest,
    current_user: dict = Depends(get_current_user)
):
    """AI 기반 회고 주기 추천
    
    활동 유형과 기간에 따라 적절한 회고 주기 추천:
    - 공모전: 주간 (마일스톤 중심)
    - 프로젝트: 2주 (스프린트 중심)
    - 스터디: 주간 (정기 모임)
    - 동아리: 월간 (장기 활동)
    """
    activity_type = request.type
    days_diff = (request.end_date - request.start_date).days + 1
    
    # 규칙 기반 추천
    if activity_type == "공모전":
        if days_diff <= 7:
            recommended = "daily"
        elif days_diff <= 30:
            recommended = "weekly"
        else:
            recommended = "biweekly"
    elif activity_type == "프로젝트":
        if days_diff <= 14:
            recommended = "weekly"
        else:
            recommended = "biweekly"
    elif activity_type == "스터디":
        recommended = "weekly"
    elif activity_type == "동아리":
        if days_diff <= 60:
            recommended = "biweekly"
        else:
            recommended = "monthly"
    else:
        recommended = "weekly"
    
    expected = calculate_expected_reflections(request.start_date, request.end_date, recommended)
    
    return {
        "recommended_cycle": recommended,
        "expected_reflections": expected,
        "reason": f"{activity_type} 활동에 최적화된 주기입니다"
    }

@router.get("/{space_id}/stats")
async def get_space_stats(
    space_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """스페이스 통계 조회"""
    user_id = current_user['id']
    
    # 스페이스 확인
    space_response = supabase.table("reflection_spaces")\
        .select("*")\
        .eq("id", space_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not space_response.data:
        raise HTTPException(status_code=404, detail="스페이스를 찾을 수 없습니다")
    
    space = space_response.data[0]
    
    # 회고 통계
    reflections_response = supabase.table("reflections")\
        .select("mood, progress_score, ai_sentiment_score")\
        .eq("space_id", space_id)\
        .execute()
    
    reflections = reflections_response.data
    
    if not reflections:
        return {
            "total_reflections": 0,
            "expected_reflections": space['expected_reflections'],
            "completion_rate": 0,
            "avg_progress_score": 0,
            "mood_distribution": {},
            "avg_sentiment": 0
        }
    
    # 통계 계산
    total = len(reflections)
    expected = space['expected_reflections'] or 1
    completion_rate = int((total / expected) * 100)
    
    avg_progress = sum(r['progress_score'] for r in reflections if r.get('progress_score')) / total
    
    mood_counts = {}
    for r in reflections:
        mood = r.get('mood', 'unknown')
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    sentiments = [r['ai_sentiment_score'] for r in reflections if r.get('ai_sentiment_score')]
    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
    
    return {
        "total_reflections": total,
        "expected_reflections": expected,
        "completion_rate": min(completion_rate, 100),
        "avg_progress_score": round(avg_progress, 2),
        "mood_distribution": mood_counts,
        "avg_sentiment": round(avg_sentiment, 2)
    }
