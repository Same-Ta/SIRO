from fastapi import APIRouter, HTTPException, Header
from datetime import datetime
from app.database import get_supabase
from app.schemas import PeerEndorsementCreate, SuccessResponse

router = APIRouter(prefix="/endorsements", tags=["endorsements"])

@router.post("", response_model=SuccessResponse)
async def create_endorsement(
    endorsement: PeerEndorsementCreate,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """동료 인증 요청 생성"""
    try:
        supabase = get_supabase()
        
        # 동료 인증 생성
        response = supabase.table("peer_endorsements").insert({
            "from_user_id": x_user_id,
            "to_user_id": endorsement.to_user_id,
            "project_id": endorsement.project_id,
            "role": endorsement.role,
            "comment": endorsement.comment,
            "status": "pending"
        }).execute()
        
        endorsement_id = response.data[0]["id"]
        
        # 키워드 연결
        if endorsement.keyword_ids:
            keyword_records = [
                {"endorsement_id": endorsement_id, "keyword_id": kid}
                for kid in endorsement.keyword_ids
            ]
            supabase.table("endorsement_keywords").insert(keyword_records).execute()
        
        return SuccessResponse(
            data={"endorsement": response.data[0]},
            message="Endorsement request created successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sent", response_model=SuccessResponse)
async def list_sent_endorsements(x_user_id: str = Header(..., alias="x-user-id")):
    """내가 보낸 인증 요청 목록"""
    try:
        supabase = get_supabase()
        response = supabase.table("peer_endorsements").select("*").eq("from_user_id", x_user_id).order("created_at", desc=True).execute()
        
        return SuccessResponse(
            data={"endorsements": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/received", response_model=SuccessResponse)
async def list_received_endorsements(x_user_id: str = Header(..., alias="x-user-id")):
    """내가 받은 인증 요청 목록"""
    try:
        supabase = get_supabase()
        response = supabase.table("peer_endorsements").select("*").eq("to_user_id", x_user_id).order("created_at", desc=True).execute()
        
        return SuccessResponse(
            data={"endorsements": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{endorsement_id}/approve", response_model=SuccessResponse)
async def approve_endorsement(endorsement_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """동료 인증 승인"""
    try:
        supabase = get_supabase()
        response = supabase.table("peer_endorsements").update({
            "status": "approved",
            "responded_at": datetime.now().isoformat()
        }).eq("id", endorsement_id).eq("to_user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Endorsement not found or unauthorized")
        
        return SuccessResponse(
            data={"endorsement": response.data[0]},
            message="Endorsement approved successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{endorsement_id}/reject", response_model=SuccessResponse)
async def reject_endorsement(endorsement_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """동료 인증 거절"""
    try:
        supabase = get_supabase()
        response = supabase.table("peer_endorsements").update({
            "status": "rejected",
            "responded_at": datetime.now().isoformat()
        }).eq("id", endorsement_id).eq("to_user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Endorsement not found or unauthorized")
        
        return SuccessResponse(
            data={"endorsement": response.data[0]},
            message="Endorsement rejected",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{endorsement_id}/keywords", response_model=SuccessResponse)
async def get_endorsement_keywords(endorsement_id: str):
    """동료 인증의 키워드 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("endorsement_keywords").select("""
            *,
            keywords (
                id,
                name,
                category
            )
        """).eq("endorsement_id", endorsement_id).execute()
        
        return SuccessResponse(
            data={"keywords": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
