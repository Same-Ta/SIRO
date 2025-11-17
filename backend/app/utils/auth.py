from fastapi import Header, HTTPException
from typing import Optional

async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
) -> str:
    """현재 사용자 ID 가져오기 (Bearer Token 또는 x-user-id 헤더)"""
    
    # x-user-id 헤더 우선 (기존 방식 호환)
    if x_user_id:
        return x_user_id
    
    # Bearer Token 검증
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        from app.utils.jwt import verify_token
        payload = verify_token(token, "access")
        if payload and "user_id" in payload:
            return payload["user_id"]
    
    raise HTTPException(
        status_code=401,
        detail="인증이 필요합니다. Authorization 헤더 또는 x-user-id를 제공해주세요."
    )
