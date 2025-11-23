from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import EvidenceCreate, SuccessResponse

router = APIRouter(prefix="/evidence", tags=["evidence"])

@router.post("", response_model=SuccessResponse)
async def create_evidence(
    evidence: EvidenceCreate,
    x_user_id: str = Header(..., alias="x-user-id")
):
    """증빙 자료 생성 (파일 URL은 별도 업로드 후 전달)"""
    try:
        supabase = get_supabase()
        response = supabase.table("evidence").insert({
            "user_id": x_user_id,
            "type": evidence.type,
            "file_name": evidence.file_name,
            "file_url": evidence.file_url,
            "file_size": evidence.file_size,
            "mime_type": evidence.mime_type,
            "project_id": evidence.project_id,
        }).execute()
        
        return SuccessResponse(
            data={"evidence": response.data[0]},
            message="Evidence created successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=SuccessResponse)
async def list_evidence(
    x_user_id: str = Header(..., alias="x-user-id"),
    project_id: Optional[str] = None
):
    """증빙 자료 목록 조회"""
    try:
        supabase = get_supabase()
        query = supabase.table("evidence").select("*").eq("user_id", x_user_id)
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        response = query.order("created_at", desc=True).execute()
        
        return SuccessResponse(
            data={"evidence": response.data},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evidence_id}", response_model=SuccessResponse)
async def get_evidence(evidence_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """증빙 자료 상세 조회"""
    try:
        supabase = get_supabase()
        response = supabase.table("evidence").select("*").eq("id", evidence_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        return SuccessResponse(
            data={"evidence": response.data[0]},
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{evidence_id}", response_model=SuccessResponse)
async def delete_evidence(evidence_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """증빙 자료 삭제"""
    try:
        supabase = get_supabase()
        response = supabase.table("evidence").delete().eq("id", evidence_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        return SuccessResponse(
            message="Evidence deleted successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{evidence_id}/verify", response_model=SuccessResponse)
async def verify_evidence(evidence_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """증빙 자료 검증 처리"""
    try:
        supabase = get_supabase()
        response = supabase.table("evidence").update({
            "verified_at": datetime.now().isoformat()
        }).eq("id", evidence_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        return SuccessResponse(
            data={"evidence": response.data[0]},
            message="Evidence verified successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{evidence_id}/ocr", response_model=SuccessResponse)
async def process_ocr(evidence_id: str, x_user_id: str = Header(..., alias="x-user-id")):
    """증빙 자료 OCR 처리 (TODO: 실제 OCR 서비스 연동 필요)"""
    try:
        supabase = get_supabase()
        
        # TODO: 실제 OCR 처리 로직 구현 (예: OpenAI Vision API, Google Cloud Vision)
        # 현재는 더미 데이터로 처리
        ocr_text = "OCR processing placeholder"
        ocr_confidence = 0.95
        
        response = supabase.table("evidence").update({
            "ocr_text": ocr_text,
            "ocr_confidence": ocr_confidence
        }).eq("id", evidence_id).eq("user_id", x_user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        return SuccessResponse(
            data={"evidence": response.data[0]},
            message="OCR processed successfully",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
