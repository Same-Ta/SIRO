from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from datetime import datetime
from typing import Optional
from app.database import get_supabase
from app.schemas import SuccessResponse

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("", response_model=SuccessResponse)
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    x_user_id: str = Header(..., alias="x-user-id")
):
    """파일 업로드"""
    try:
        # 파일 크기 검증 (10MB)
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="파일 크기는 10MB를 초과할 수 없습니다")
        
        # 파일 형식 검증
        allowed_types = {
            "profile": ["image/jpeg", "image/png", "image/webp"],
            "evidence": ["image/jpeg", "image/png", "application/pdf"],
            "document": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        }
        
        if type not in allowed_types:
            raise HTTPException(status_code=400, detail="잘못된 파일 타입입니다")
        
        if file.content_type not in allowed_types[type]:
            raise HTTPException(status_code=400, detail=f"허용되지 않는 파일 형식입니다. 허용: {', '.join(allowed_types[type])}")
        
        # TODO: Supabase Storage 업로드
        # supabase = get_supabase()
        # file_path = f"{type}/{x_user_id}/{file.filename}"
        # upload_response = supabase.storage.from_("files").upload(file_path, file_content)
        
        # 임시 URL (실제로는 Supabase Storage URL)
        file_url = f"https://supabase.co/storage/{type}/{x_user_id}/{file.filename}"
        
        return SuccessResponse(
            data={
                "file_url": file_url,
                "file_name": file.filename,
                "file_size": file_size,
                "mime_type": file.content_type
            },
            message="파일이 업로드되었습니다",
            timestamp=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evidence", response_model=SuccessResponse)
async def upload_evidence(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    evidence_type: str = Form(...),
    x_user_id: str = Header(..., alias="x-user-id")
):
    """증명서 업로드 (OCR 포함)"""
    try:
        supabase = get_supabase()
        
        # 파일 업로드
        file_content = await file.read()
        file_size = len(file_content)
        
        # TODO: Supabase Storage 업로드
        file_url = f"https://supabase.co/storage/evidence/{x_user_id}/{file.filename}"
        
        # TODO: OCR 처리 (Google Vision API)
        ocr_text = "수상증명서\n홍길동\n최우수상"
        ocr_confidence = 0.95
        
        # TODO: 키워드 자동 추출
        verified_keywords = ["기획력", "리더십"]
        
        # evidence 테이블에 저장
        response = supabase.table("evidence").insert({
            "user_id": x_user_id,
            "project_id": project_id,
            "type": evidence_type,
            "file_name": file.filename,
            "file_url": file_url,
            "file_size": file_size,
            "mime_type": file.content_type,
            "ocr_text": ocr_text,
            "ocr_confidence": ocr_confidence
        }).execute()
        
        return SuccessResponse(
            data={
                "evidence_id": response.data[0]["id"],
                "file_url": file_url,
                "ocr_text": ocr_text,
                "ocr_confidence": ocr_confidence,
                "verified_keywords": verified_keywords
            },
            message="증명서가 업로드되었습니다",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
