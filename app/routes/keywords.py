from fastapi import APIRouter, HTTPException, Header
from datetime import datetime
from app.database import get_supabase
from app.schemas import SuccessResponse

router = APIRouter(prefix="/keywords", tags=["keywords"])

@router.get("", response_model=SuccessResponse)
async def list_keywords():
    """키워드 마스터 목록 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("keywords").select("*").execute()
        
        return SuccessResponse(
            data={"keywords": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user", response_model=SuccessResponse)
async def get_user_keywords(x_user_id: str = Header(..., alias="x-user-id")):
    """사용자의 키워드 조회 (경험 수 포함)"""
    try:
        supabase = get_supabase()
        response = supabase.table("user_keywords").select("""
            *,
            keywords (
                id,
                name,
                category
            )
        """).eq("user_id", x_user_id).execute()
        
        return SuccessResponse(
            data={"user_keywords": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/user/{keyword_id}", response_model=SuccessResponse)
async def add_user_keyword(keyword_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """사용자에게 키워드 추가"""
    try:
        supabase = get_supabase()
        
        # 기존 키워드 확인
        existing = supabase.table("user_keywords").select("*").eq("user_id", x_user_id).eq("keyword_id", keyword_id).execute()
        
        if existing.data:
            # 경험 수 증가
            response = supabase.table("user_keywords").update({
                "experience_count": existing.data[0]["experience_count"] + 1
            }).eq("user_id", x_user_id).eq("keyword_id", keyword_id).execute()
        else:
            # 새 키워드 추가
            response = supabase.table("user_keywords").insert({
                "user_id": x_user_id,
                "keyword_id": keyword_id,
                "experience_count": 1
            }).execute()
        
        return SuccessResponse(
            data={"user_keyword": response.data[0]},
            message="Keyword added successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/user/{keyword_id}", response_model=SuccessResponse)
async def remove_user_keyword(keyword_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """사용자 키워드 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("user_keywords").delete().eq("user_id", x_user_id).eq("keyword_id", keyword_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User keyword not found")
        
        return SuccessResponse(
            message="Keyword removed successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/log/{log_id}", response_model=SuccessResponse)
async def get_log_keywords(log_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """특정 로그의 키워드 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("log_keywords").select("""
            *,
            keywords (
                id,
                name,
                category
            )
        """).eq("log_id", log_id).execute()
        
        return SuccessResponse(
            data={"log_keywords": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/log/{log_id}/{keyword_id}", response_model=SuccessResponse)
async def add_log_keyword(log_id: str, keyword_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """로그에 키워드 연결"""
    try:
        supabase = get_supabase()
        response = supabase.table("log_keywords").insert({
            "log_id": log_id,
            "keyword_id": keyword_id
        }).execute()
        
        return SuccessResponse(
            data={"log_keyword": response.data[0]},
            message="Keyword added to log successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
