from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.config import settings
from app.routes import (
    auth, users, spaces, reflections, 
    templates, activities, bookmarks,
    job_simulation, career_survey
)

app = FastAPI(
    title="PROOF API",
    description="PROOF 서비스 REST API 명세서",
    version="1.0.0",
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

# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(spaces.router, prefix="/api/spaces", tags=["Spaces"])
app.include_router(reflections.router, prefix="/api/reflections", tags=["Reflections", "Micro Logs"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Activities"])
app.include_router(job_simulation.router, prefix="/api/job-simulation", tags=["Job Simulation"])
app.include_router(career_survey.router, prefix="/api/survey", tags=["Career Survey"])

@app.get("/", tags=["Health Check"])
async def root():
    """루트 엔드포인트"""
    return {
        "message": "PROOF API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/api/docs"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "ok",
        "environment": settings.environment,
        "timestamp": datetime.now().isoformat()
    }
