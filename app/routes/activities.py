from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import Optional
from datetime import datetime, date
from ..database import get_supabase

router = APIRouter(prefix='/api', tags=['Activity Recommendations'])

def map_activity_fields(activity: dict) -> dict:
    mapped = activity.copy()
    if 'activity_url' in mapped:
        mapped['url'] = mapped.pop('activity_url')
    if 'application_end' in mapped:
        mapped['application_deadline'] = mapped.pop('application_end')
    return mapped

def calculate_match_score(user_data: dict, activity: dict) -> tuple:
    score = 0.5
    reasons = ['추천 활동']
    return round(score, 2), reasons

@router.get('/activities')
async def list_recommended_activities(
    category: Optional[str] = Query(None),
    field: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query('recommended'),
    x_user_id: Optional[str] = Header(None, alias='x-user-id'),
    supabase = Depends(get_supabase)
):
    query = supabase.table('activities').select('*').eq('is_active', True).limit(limit)
    if category:
        query = query.eq('category', category)
    if field:
        query = query.contains('target_jobs', [field])
    
    activities_response = query.execute()
    activities = activities_response.data or []
    
    result_activities = []
    for activity in activities:
        mapped_activity = map_activity_fields(activity)
        mapped_activity['is_bookmarked'] = False
        activity_data = {'activity': mapped_activity, 'match_score': 0.8, 'match_reasons': ['추천 활동']}
        result_activities.append(activity_data)
    
    return {'success': True, 'data': {'activities': result_activities, 'total_count': len(result_activities), 'page': 1, 'limit': limit}}

@router.get('/recommendations/activities')
async def list_recommended_activities_alias(
    category: Optional[str] = Query(None),
    field: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query('recommended'),
    x_user_id: Optional[str] = Header(None, alias='x-user-id'),
    supabase = Depends(get_supabase)
):
    return await list_recommended_activities(category, field, limit, sort, x_user_id, supabase)
