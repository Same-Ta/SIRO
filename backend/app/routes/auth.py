from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
from app.database import get_supabase
from app.utils.jwt import create_access_token, create_refresh_token, verify_token
from app.utils.auth import get_current_user_id

router = APIRouter()

class RegisterRequest(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str
    name: str
    university: Optional[str] = None
    major: Optional[str] = None
    studentId: Optional[str] = None
    targetJob: Optional[str] = None

class LoginRequest(BaseModel):
    """로그인 요청"""
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    """토큰 갱신 요청"""
    refreshToken: str

@router.post("/register")
async def register(request: RegisterRequest):
    """회원가입"""
    try:
        supabase = get_supabase()
        
        # 이메일 중복 체크
        existing = supabase.table("users").select("id").eq("email", request.email).execute()
        if existing.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "이미 존재하는 이메일입니다."
                }
            }
        
        # bcrypt로 비밀번호 해싱
        password_bytes = request.password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        # 사용자 생성
        response = supabase.table("users").insert({
            "email": request.email,
            "password_hash": password_hash,
            "name": request.name,
            "university": request.university,
            "major": request.major,
        }).execute()
        
        user = response.data[0]
        user_id = user["id"]
        
        # JWT 토큰 생성
        access_token = create_access_token({"user_id": user_id, "email": request.email})
        refresh_token = create_refresh_token({"user_id": user_id})
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "email": user["email"],
                "name": user["name"],
                "accessToken": access_token,
                "refreshToken": refresh_token
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

@router.post("/login")
async def login(request: LoginRequest):
    """로그인"""
    try:
        supabase = get_supabase()
        
        # 이메일로 사용자 조회
        response = supabase.table("users").select("*").eq("email", request.email).execute()
        
        if not response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
                }
            }
        
        user = response.data[0]
        
        # bcrypt로 비밀번호 검증
        password_bytes = request.password.encode('utf-8')
        password_hash_bytes = user["password_hash"].encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, password_hash_bytes):
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
                }
            }
        
        user_id = user["id"]
        
        # JWT 토큰 생성
        access_token = create_access_token({"user_id": user_id, "email": user["email"]})
        refresh_token = create_refresh_token({"user_id": user_id})
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "email": user["email"],
                "name": user["name"],
                "accessToken": access_token,
                "refreshToken": refresh_token
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user_id)):
    """로그아웃"""
    # 클라이언트에서 토큰 삭제
    return {
        "success": True,
        "data": None,
        "error": None
    }

@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """토큰 갱신"""
    try:
        # Refresh Token 검증
        payload = verify_token(request.refreshToken, "refresh")
        
        if not payload or "user_id" not in payload:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "유효하지 않은 토큰입니다."
                }
            }
        
        user_id = payload["user_id"]
        
        # 사용자 존재 확인
        supabase = get_supabase()
        user_response = supabase.table("users").select("email").eq("id", user_id).execute()
        
        if not user_response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "사용자를 찾을 수 없습니다."
                }
            }
        
        # 새 Access Token 생성
        new_access_token = create_access_token({
            "user_id": user_id,
            "email": user_response.data[0]["email"]
        })
        
        return {
            "success": True,
            "data": {
                "accessToken": new_access_token
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }
