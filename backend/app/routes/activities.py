from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from ..database import get_supabase
from ..auth import get_current_user
from ..schemas import (
    ActivityCreate,
    ActivityResponse,
    BookmarkCreate,
    BookmarkResponse,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    UserPreferencesCreate,
    UserPreferencesUpdate,
    UserPreferencesResponse,
    SuccessResponse
)

router = APIRouter(prefix="/api/v1/recommendations", tags=["Activity Recommendations"])

def calculate_match_score(user_data: dict, activity: dict) -> tuple:
    """활동과 사용자 간 매칭 점수 계산"""
    score = 0.0
    reasons = {}
    
    # 1. 학과 매칭 (30%)
    user_major = user_data.get('major', '')
    activity_majors = activity.get('recommended_majors', [])
    if activity_majors and user_major:
        if user_major in activity_majors or '전공무관' in activity_majors:
            major_score = 0.3
            score += major_score
            reasons['major_match'] = major_score
    
    # 2. 키워드 매칭 (40%)
    user_keywords = user_data.get('skill_keywords', [])
    activity_keywords = activity.get('keywords', [])
    if user_keywords and activity_keywords:
        keyword_intersection = set(user_keywords) & set(activity_keywords)
        if keyword_intersection:
            keyword_score = min(0.4, (len(keyword_intersection) / max(len(user_keywords), 1)) * 0.4)
            score += keyword_score
            reasons['keyword_match'] = round(keyword_score, 2)
    
    # 3. 관심 분야 매칭 (20%)
    user_fields = user_data.get('interested_fields', [])
    activity_fields = activity.get('fields', [])
    if user_fields and activity_fields:
        field_intersection = set(user_fields) & set(activity_fields)
        if field_intersection:
            field_score = min(0.2, (len(field_intersection) / max(len(user_fields), 1)) * 0.2)
            score += field_score
            reasons['interest_match'] = round(field_score, 2)
    
    # 4. 난이도 매칭 (10%)
    user_difficulty = user_data.get('preferred_difficulty')
    activity_difficulty = activity.get('difficulty_level')
    if user_difficulty and activity_difficulty and user_difficulty == activity_difficulty:
        difficulty_score = 0.1
        score += difficulty_score
        reasons['difficulty_match'] = difficulty_score
    
    return round(score, 2), reasons

def calculate_days_left(end_date) -> int:
    """마감일까지 남은 일수 계산"""
    if not end_date:
        return 999
    
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date).date()
    elif isinstance(end_date, datetime):
        end_date = end_date.date()
    
    today = date.today()
    delta = (end_date - today).days
    return max(0, delta)

@router.get("/activities", response_model=SuccessResponse)
async def list_recommended_activities(
    category: Optional[str] = Query(None),
    fields: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    status: str = Query("active"),
    sort: str = Query("recommended"),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """개인화 추천 활동 조회"""
    user_id = current_user['id']
    
    # 사용자 정보 및 설정 조회
    user_response = supabase.table("users")\
        .select("major")\
        .eq("id", user_id)\
        .execute()
    
    user_data = user_response.data[0] if user_response.data else {}
    
    # 사용자 설정 조회
    prefs_response = supabase.table("user_preferences")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    
    if prefs_response.data:
        user_prefs = prefs_response.data[0]
        user_data.update({
            'interested_fields': user_prefs.get('interested_fields', []),
            'skill_keywords': user_prefs.get('skill_keywords', []),
            'preferred_difficulty': user_prefs.get('preferred_difficulty')
        })
    
    # 활동 조회
    query = supabase.table("activities")\
        .select("*")\
        .eq("status", status)\
        .gte("application_end_date", date.today().isoformat())
    
    if category:
        query = query.eq("category", category)
    
    if fields:
        fields_list = fields.split(',')
        query = query.overlaps("fields", fields_list)
    
    # 페이지네이션
    offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    activities_response = query.execute()
    activities = activities_response.data or []
    
    # 추천 점수 계산
    scored_activities = []
    for activity in activities:
        match_score, match_reasons = calculate_match_score(user_data, activity)
        activity_with_score = {
            **activity,
            'match_score': match_score,
            'match_reasons': match_reasons,
            'days_left': calculate_days_left(activity.get('application_end_date'))
        }
        scored_activities.append(activity_with_score)
    
    # 정렬
    if sort == "recommended":
        scored_activities.sort(key=lambda x: x['match_score'], reverse=True)
    elif sort == "deadline":
        scored_activities.sort(key=lambda x: x['days_left'])
    elif sort == "popular":
        scored_activities.sort(key=lambda x: x.get('bookmark_count', 0), reverse=True)
    
    # 북마크 정보 추가
    if scored_activities:
        activity_ids = [a['id'] for a in scored_activities]
        bookmarks_response = supabase.table("user_bookmarks")\
            .select("activity_id")\
            .eq("user_id", user_id)\
            .in_("activity_id", activity_ids)\
            .execute()
        
        bookmarked_ids = set(b['activity_id'] for b in (bookmarks_response.data or []))
        
        # 지원 정보 추가
        applications_response = supabase.table("user_activity_applications")\
            .select("activity_id")\
            .eq("user_id", user_id)\
            .in_("activity_id", activity_ids)\
            .execute()
        
        applied_ids = set(a['activity_id'] for a in (applications_response.data or []))
        
        for activity in scored_activities:
            activity['is_bookmarked'] = activity['id'] in bookmarked_ids
            activity['has_applied'] = activity['id'] in applied_ids
    
    return SuccessResponse(
        data={
            "activities": scored_activities,
            "total": len(scored_activities),
            "page": page,
            "per_page": limit
        },
        timestamp=datetime.now()
    )

@router.get("/activities/{activity_id}", response_model=SuccessResponse)
async def get_activity_detail(
    activity_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """활동 상세 조회"""
    user_id = current_user['id']
    
    # 활동 조회
    activity_response = supabase.table("activities")\
        .select("*")\
        .eq("id", activity_id)\
        .execute()
    
    if not activity_response.data:
        raise HTTPException(status_code=404, detail="활동을 찾을 수 없습니다")
    
    activity = activity_response.data[0]
    
    # 조회수 증가
    supabase.rpc("increment_view_count", {"activity_uuid": activity_id}).execute()
    activity['view_count'] = activity.get('view_count', 0) + 1
    
    # 북마크 여부 확인
    bookmark_response = supabase.table("user_bookmarks")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("activity_id", activity_id)\
        .execute()
    
    activity['is_bookmarked'] = len(bookmark_response.data or []) > 0
    
    # 지원 여부 확인
    application_response = supabase.table("user_activity_applications")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("activity_id", activity_id)\
        .execute()
    
    activity['has_applied'] = len(application_response.data or []) > 0
    activity['days_left'] = calculate_days_left(activity.get('application_end_date'))
    
    return SuccessResponse(
        data={"activity": activity},
        timestamp=datetime.now()
    )

@router.post("/activities/{activity_id}/bookmark", response_model=SuccessResponse)
async def bookmark_activity(
    activity_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """활동 북마크 추가"""
    user_id = current_user['id']
    
    # 활동 존재 확인
    activity_check = supabase.table("activities")\
        .select("id")\
        .eq("id", activity_id)\
        .execute()
    
    if not activity_check.data:
        raise HTTPException(status_code=404, detail="활동을 찾을 수 없습니다")
    
    # 중복 확인
    existing = supabase.table("user_bookmarks")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("activity_id", activity_id)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="이미 북마크한 활동입니다")
    
    # 북마크 생성
    bookmark_data = {
        "user_id": user_id,
        "activity_id": activity_id
    }
    
    response = supabase.table("user_bookmarks").insert(bookmark_data).execute()
    
    # 북마크 카운트 증가
    supabase.rpc("increment_bookmark_count", {"activity_uuid": activity_id}).execute()
    
    return SuccessResponse(
        data={"bookmark": response.data[0]},
        message="북마크가 추가되었습니다",
        timestamp=datetime.now()
    )

@router.delete("/activities/{activity_id}/bookmark", response_model=SuccessResponse)
async def unbookmark_activity(
    activity_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """활동 북마크 제거"""
    user_id = current_user['id']
    
    response = supabase.table("user_bookmarks")\
        .delete()\
        .eq("user_id", user_id)\
        .eq("activity_id", activity_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="북마크를 찾을 수 없습니다")
    
    # 북마크 카운트 감소
    supabase.rpc("decrement_bookmark_count", {"activity_uuid": activity_id}).execute()
    
    return SuccessResponse(
        data={},
        message="북마크가 제거되었습니다",
        timestamp=datetime.now()
    )

@router.get("/bookmarks", response_model=SuccessResponse)
async def list_bookmarks(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """북마크한 활동 목록 조회"""
    user_id = current_user['id']
    
    offset = (page - 1) * limit
    
    # 북마크 조회 (활동 정보 포함)
    response = supabase.table("user_bookmarks")\
        .select("*, activities(*)")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    bookmarks = response.data or []
    
    # days_left 추가
    for bookmark in bookmarks:
        if bookmark.get('activities'):
            activity = bookmark['activities']
            activity['days_left'] = calculate_days_left(activity.get('application_end_date'))
            activity['is_bookmarked'] = True
    
    return SuccessResponse(
        data={
            "bookmarks": bookmarks,
            "total": len(bookmarks),
            "page": page,
            "per_page": limit
        },
        timestamp=datetime.now()
    )

@router.post("/activities/{activity_id}/apply", response_model=SuccessResponse)
async def apply_to_activity(
    activity_id: str,
    application: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """활동 지원 기록"""
    user_id = current_user['id']
    
    # 활동 존재 확인
    activity_check = supabase.table("activities")\
        .select("id")\
        .eq("id", activity_id)\
        .execute()
    
    if not activity_check.data:
        raise HTTPException(status_code=404, detail="활동을 찾을 수 없습니다")
    
    # 중복 지원 확인
    existing = supabase.table("user_activity_applications")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("activity_id", activity_id)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="이미 지원한 활동입니다")
    
    # 지원 기록 생성
    application_data = {
        "user_id": user_id,
        "activity_id": activity_id,
        "notes": application.notes,
        "status": "applied",
        "applied_at": datetime.now().isoformat()
    }
    
    response = supabase.table("user_activity_applications")\
        .insert(application_data)\
        .execute()
    
    return SuccessResponse(
        data={"application": response.data[0]},
        message="지원이 완료되었습니다",
        timestamp=datetime.now()
    )

@router.get("/my-applications", response_model=SuccessResponse)
async def list_my_applications(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """내 지원 내역 조회"""
    user_id = current_user['id']
    
    offset = (page - 1) * limit
    
    query = supabase.table("user_activity_applications")\
        .select("*, activities(*)")\
        .eq("user_id", user_id)
    
    if status:
        query = query.eq("status", status)
    
    response = query.order("applied_at", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    applications = response.data or []
    
    # days_left 추가
    for application in applications:
        if application.get('activities'):
            activity = application['activities']
            activity['days_left'] = calculate_days_left(activity.get('application_end_date'))
    
    return SuccessResponse(
        data={
            "applications": applications,
            "total": len(applications),
            "page": page,
            "per_page": limit
        },
        timestamp=datetime.now()
    )

@router.patch("/my-applications/{application_id}", response_model=SuccessResponse)
async def update_application(
    application_id: str,
    update: ApplicationUpdate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """지원 내역 수정"""
    user_id = current_user['id']
    
    update_data = update.model_dump(exclude_unset=True)
    
    response = supabase.table("user_activity_applications")\
        .update(update_data)\
        .eq("id", application_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="지원 내역을 찾을 수 없습니다")
    
    return SuccessResponse(
        data={"application": response.data[0]},
        message="지원 내역이 수정되었습니다",
        timestamp=datetime.now()
    )

@router.post("/preferences", response_model=SuccessResponse)
async def save_preferences(
    preferences: UserPreferencesCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """추천 설정 저장"""
    user_id = current_user['id']
    
    prefs_data = preferences.model_dump()
    prefs_data['user_id'] = user_id
    
    # Upsert (존재하면 업데이트, 없으면 삽입)
    response = supabase.table("user_preferences")\
        .upsert(prefs_data)\
        .execute()
    
    return SuccessResponse(
        data={"preferences": response.data[0]},
        message="설정이 저장되었습니다",
        timestamp=datetime.now()
    )

@router.get("/preferences", response_model=SuccessResponse)
async def get_preferences(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """추천 설정 조회"""
    user_id = current_user['id']
    
    response = supabase.table("user_preferences")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        # 기본 설정 반환
        return SuccessResponse(
            data={
                "preferences": {
                    "user_id": user_id,
                    "interested_fields": [],
                    "interested_categories": [],
                    "skill_keywords": [],
                    "exclude_categories": [],
                    "notification_enabled": True,
                    "notification_frequency": "weekly"
                }
            },
            timestamp=datetime.now()
        )
    
    return SuccessResponse(
        data={"preferences": response.data[0]},
        timestamp=datetime.now()
    )

@router.get("/trending", response_model=SuccessResponse)
async def get_trending_activities(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """인기 활동 조회"""
    user_id = current_user['id']
    
    # 조회수와 북마크 수가 높은 활동
    response = supabase.table("activities")\
        .select("*")\
        .eq("status", "active")\
        .gte("application_end_date", date.today().isoformat())\
        .order("bookmark_count", desc=True)\
        .limit(limit)\
        .execute()
    
    activities = response.data or []
    
    # days_left 추가
    for activity in activities:
        activity['days_left'] = calculate_days_left(activity.get('application_end_date'))
    
    return SuccessResponse(
        data={"activities": activities},
        timestamp=datetime.now()
    )

@router.get("/deadline-soon", response_model=SuccessResponse)
async def get_deadline_soon_activities(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """마감 임박 활동 조회"""
    user_id = current_user['id']
    
    from datetime import timedelta
    
    deadline = date.today() + timedelta(days=days)
    
    response = supabase.table("activities")\
        .select("*")\
        .eq("status", "active")\
        .gte("application_end_date", date.today().isoformat())\
        .lte("application_end_date", deadline.isoformat())\
        .order("application_end_date")\
        .limit(limit)\
        .execute()
    
    activities = response.data or []
    
    # days_left 추가
    for activity in activities:
        activity['days_left'] = calculate_days_left(activity.get('application_end_date'))
    
    return SuccessResponse(
        data={"activities": activities},
        timestamp=datetime.now()
    )
