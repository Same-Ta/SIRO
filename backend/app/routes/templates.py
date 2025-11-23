from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..database import get_supabase
from ..auth import get_current_user
from ..schemas import ReflectionTemplateResponse, TemplateRecommendRequest

router = APIRouter(prefix="/api/v1/templates", tags=["Templates"])

@router.get("", response_model=List[ReflectionTemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """회고 템플릿 목록 조회"""
    query = supabase.table("reflection_templates").select("*").eq("is_active", True)
    
    if category:
        query = query.eq("category", category)
    
    response = query.order("usage_count", desc=True).execute()
    return response.data

@router.get("/{template_id}", response_model=ReflectionTemplateResponse)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """특정 회고 템플릿 상세 조회"""
    response = supabase.table("reflection_templates").select("*").eq("id", template_id).eq("is_active", True).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")
    
    return response.data[0]

@router.post("/recommend", response_model=ReflectionTemplateResponse)
async def recommend_template(
    request: TemplateRecommendRequest,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """AI 기반 회고 템플릿 추천
    
    - 최근 감정 상태와 활동 유형을 분석하여 적합한 템플릿 추천
    - 감정이 부정적이면 Mad-Sad-Glad, 분석이 필요하면 5Why 등
    """
    # 간단한 규칙 기반 추천 로직
    recent_moods = request.recent_moods
    space_type = request.space_type
    
    # 부정적 감정이 많으면 감정 중심 템플릿
    negative_count = sum(1 for mood in recent_moods if mood in ['bad', 'terrible'])
    if negative_count >= len(recent_moods) * 0.5:
        template_id = 'mad-sad-glad'
    # 공모전/프로젝트는 KPT 추천
    elif space_type in ['공모전', '프로젝트']:
        template_id = 'kpt'
    # 스터디는 4F 추천
    elif space_type == '스터디':
        template_id = '4f'
    # 정기적인 활동은 주간 회고
    else:
        template_id = 'weekly-review'
    
    response = supabase.table("reflection_templates").select("*").eq("id", template_id).execute()
    
    if not response.data:
        # 기본 템플릿 반환
        response = supabase.table("reflection_templates").select("*").eq("id", "kpt").execute()
    
    template = response.data[0]
    template['is_ai_recommended'] = True
    return template

@router.get("/categories/list")
async def list_categories(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """회고 템플릿 카테고리 목록"""
    return {
        "categories": [
            {"id": "기본", "name": "기본 회고"},
            {"id": "심화", "name": "심화 회고"},
            {"id": "감정", "name": "감정 회고"},
            {"id": "분석", "name": "분석 회고"},
            {"id": "정기", "name": "정기 회고"}
        ]
    }

@router.get("/popular/top")
async def get_popular_templates(
    limit: int = 3,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """인기 템플릿 조회"""
    response = supabase.table("reflection_templates")\
        .select("id, name, category, usage_count")\
        .eq("is_active", True)\
        .order("usage_count", desc=True)\
        .limit(limit)\
        .execute()
    
    return {"templates": response.data}
