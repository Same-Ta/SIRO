from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.config import settings
from app.routes import (
    auth, users, logs, projects, keywords, 
    evidence, endorsements, portfolios,
    reflections, recommendations, ai,
    dashboard, search, notifications, upload
)

app = FastAPI(
    title="PROOF Backend API",
    description="상경계열 학생 경험 관리 플랫폼 (FastAPI + Supabase)",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 (프론트엔드 API 명세서에 맞춰 /api/v1 제거)
app.include_router(auth.router, prefix="/auth", tags=["인증"])
app.include_router(users.router, prefix="/users", tags=["사용자 관리"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["경험 활동 추천"])
app.include_router(logs.router, prefix="/api/logs", tags=["경험 로그"])
app.include_router(reflections.router, prefix="/api/reflections", tags=["회고 시스템"])
app.include_router(projects.router, prefix="/api/activities", tags=["활동 관리"])
app.include_router(keywords.router, prefix="/api/keywords", tags=["키워드 관리"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI 분석"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["포트폴리오"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["알림"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["대시보드"])
app.include_router(search.router, prefix="/api/search", tags=["검색"])
app.include_router(upload.router, prefix="/api/upload", tags=["파일 업로드"])
app.include_router(evidence.router, prefix="/api/verifications", tags=["증명 및 인증"])
app.include_router(endorsements.router, prefix="/api/endorsements", tags=["동료 인증"])

@app.get("/", tags=["Health Check"])
async def root():
    """루트 엔드포인트"""
    return {
        "message": "PROOF Backend API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/api/docs"
    }

@app.get("/api/v1/health", tags=["Health Check"])
async def health_check():
    """서버 상태 확인"""
    return {
        "success": True,
        "data": {
            "status": "ok",
            "environment": settings.environment,
            "timestamp": datetime.now().isoformat()
        }
    }
