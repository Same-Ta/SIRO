from fastapi import APIRouter, HTTPException, Header
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import PortfolioCreate, SuccessResponse

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

@router.post("", response_model=SuccessResponse)
async def create_portfolio(
    portfolio: PortfolioCreate,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """포트폴리오 생성"""
    try:
        supabase = get_supabase()
        
        # 포트폴리오 생성
        response = supabase.table("portfolios").insert({
            "user_id": x_user_id,
            "title": portfolio.title,
            "target_job": portfolio.target_job,
            "template": portfolio.template,
            "settings": portfolio.settings,
            "status": "draft"
        }).execute()
        
        portfolio_id = response.data[0]["id"]
        
        # 프로젝트 연결
        if portfolio.project_ids:
            project_records = [
                {
                    "portfolio_id": portfolio_id,
                    "project_id": pid,
                    "display_order": idx
                }
                for idx, pid in enumerate(portfolio.project_ids)
            ]
            supabase.table("portfolio_projects").insert(project_records).execute()
        
        return SuccessResponse(
            data={"portfolio": response.data[0]},
            message="Portfolio created successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=SuccessResponse)
async def list_portfolios(x_user_id: str = Header(..., alias="x-user-id")):
    """포트폴리오 목록 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("portfolios").select("*").eq("user_id", x_user_id).order("created_at", desc=True).execute()
        
        return SuccessResponse(
            data={"portfolios": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{portfolio_id}", response_model=SuccessResponse)
async def get_portfolio(portfolio_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """포트폴리오 상세 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        return SuccessResponse(
            data={"portfolio": response.data[0]},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{portfolio_id}", response_model=SuccessResponse)
async def update_portfolio(
    portfolio_id: str,
    portfolio_update: dict,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """포트폴리오 수정"""
    try:
        supabase = get_supabase()
        response = supabase.table("portfolios").update(portfolio_update).eq("id", portfolio_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        return SuccessResponse(
            data={"portfolio": response.data[0]},
            message="Portfolio updated successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{portfolio_id}", response_model=SuccessResponse)
async def delete_portfolio(portfolio_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """포트폴리오 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("portfolios").delete().eq("id", portfolio_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        return SuccessResponse(
            message="Portfolio deleted successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{portfolio_id}/projects", response_model=SuccessResponse)
async def get_portfolio_projects(portfolio_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """포트폴리오에 포함된 프로젝트 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("portfolio_projects").select("""
            *,
            projects (
                id,
                name,
                description,
                start_date,
                end_date,
                status,
                tags,
                thumbnail_url
            )
        """).eq("portfolio_id", portfolio_id).order("display_order").execute()
        
        return SuccessResponse(
            data={"projects": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{portfolio_id}/generate", response_model=SuccessResponse)
async def generate_portfolio(portfolio_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """포트폴리오 생성 (PDF/웹) - TODO: 실제 생성 로직 구현"""
    try:
        supabase = get_supabase()
        
        # TODO: 실제 포트폴리오 생성 로직 구현
        # 1. 프로젝트 데이터 가져오기
        # 2. 템플릿 적용
        # 3. PDF 생성 또는 웹 페이지 생성
        # 4. Supabase Storage에 업로드
        # 5. URL 저장
        
        pdf_url = "https://example.com/portfolio.pdf"  # 플레이스홀더
        web_url = "https://example.com/portfolio"  # 플레이스홀더
        
        response = supabase.table("portfolios").update({
            "pdf_url": pdf_url,
            "web_url": web_url,
            "status": "published",
            "generated_at": datetime.now().isoformat()
        }).eq("id", portfolio_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        return SuccessResponse(
            data={"portfolio": response.data[0]},
            message="Portfolio generated successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
