from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    university: Optional[str] = None
    major: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    profile_image: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Log schemas
class LogBase(BaseModel):
    title: str
    content: str
    reflection: Optional[str] = None
    date: date
    period: Optional[str] = None
    tags: Optional[List[str]] = []
    project_id: Optional[str] = None

class LogCreate(LogBase):
    pass

class LogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    reflection: Optional[str] = None
    date: Optional[date] = None
    period: Optional[str] = None
    tags: Optional[List[str]] = None
    project_id: Optional[str] = None

class LogResponse(LogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: str
    tags: Optional[List[str]] = []
    thumbnail_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    status: str = "active"
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Evidence schemas
class EvidenceBase(BaseModel):
    type: str
    file_name: str
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    project_id: Optional[str] = None

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceResponse(EvidenceBase):
    id: str
    user_id: str
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Peer Endorsement schemas
class PeerEndorsementBase(BaseModel):
    to_user_id: str
    project_id: str
    role: Optional[str] = None
    comment: Optional[str] = None
    keyword_ids: Optional[List[str]] = []

class PeerEndorsementCreate(PeerEndorsementBase):
    pass

class PeerEndorsementResponse(PeerEndorsementBase):
    id: str
    from_user_id: str
    status: str = "pending"
    responded_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Portfolio schemas
class PortfolioBase(BaseModel):
    title: str
    target_job: Optional[str] = None
    template: Optional[str] = None
    settings: Optional[dict] = {}

class PortfolioCreate(PortfolioBase):
    project_ids: Optional[List[str]] = []

class PortfolioResponse(PortfolioBase):
    id: str
    user_id: str
    pdf_url: Optional[str] = None
    web_url: Optional[str] = None
    status: str = "draft"
    generated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Keyword schemas
class KeywordBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class KeywordCreate(KeywordBase):
    pass

class KeywordResponse(KeywordBase):
    id: str
    
    class Config:
        from_attributes = True

# Reflection Template schemas
class ReflectionTemplateBase(BaseModel):
    id: str
    name: str
    description: str
    category: str  # 기본, 심화, 감정, 분석, 정기
    questions: List[str]

class ReflectionTemplateResponse(ReflectionTemplateBase):
    usage_count: int = 0
    is_ai_recommended: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Reflection Space schemas
class ReflectionSpaceBase(BaseModel):
    name: str
    type: str  # 공모전, 프로젝트, 동아리, 스터디
    description: Optional[str] = None
    start_date: date
    end_date: date
    reflection_cycle: str  # daily, weekly, biweekly, monthly
    reminder_enabled: bool = True

class ReflectionSpaceCreate(ReflectionSpaceBase):
    pass

class ReflectionSpaceResponse(ReflectionSpaceBase):
    id: str
    user_id: str
    next_reflection_date: Optional[datetime] = None
    total_reflections: int = 0
    expected_reflections: Optional[int] = None
    status: str = "active"  # active, paused, completed
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Enhanced Reflection schemas
class ReflectionSettingsBase(BaseModel):
    log_id: Optional[str] = None
    project_id: Optional[str] = None
    space_id: Optional[str] = None
    cycle: str  # daily, weekly, biweekly, monthly
    enabled: bool = True
    reminder_time: Optional[str] = None
    questions: Optional[List[str]] = []

class ReflectionSettingsCreate(ReflectionSettingsBase):
    pass

class ReflectionSettingsResponse(ReflectionSettingsBase):
    id: str
    user_id: str
    next_reminder_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ReflectionBase(BaseModel):
    space_id: str
    template_id: str
    answers: List[dict]  # [{"question": "...", "answer": "..."}]
    mood: str  # great, good, normal, bad, terrible
    progress_score: int  # 1-10
    reflection_date: date

class ReflectionCreate(ReflectionBase):
    pass

class ReflectionDetail(BaseModel):
    id: str
    space_id: str
    space_name: Optional[str] = None
    user_id: str
    template_id: str
    template_name: Optional[str] = None
    answers: List[dict]
    mood: str
    progress_score: int
    ai_feedback: Optional[str] = None
    ai_keywords: Optional[List[str]] = []
    ai_sentiment_score: Optional[float] = None
    reflection_date: date
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class GrowthStatsResponse(BaseModel):
    avg_progress: float
    completion_rate: int
    keyword_count: int
    project_completion: int

class RecentReflectionResponse(BaseModel):
    id: str
    space: dict
    template_name: str
    mood: str
    progress_score: int
    ai_feedback: Optional[str] = None
    reflection_date: date
    created_at: datetime

class ReflectionUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    progress_score: Optional[int] = None

class ReflectionResponse(ReflectionBase):
    id: str
    user_id: str
    ai_feedback: Optional[str] = None
    ai_suggestions: Optional[List[str]] = []
    ai_keywords: Optional[List[str]] = []
    ai_sentiment_score: Optional[float] = None
    extracted_keywords: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# AI Analysis schemas
class AIAnalysisResponse(BaseModel):
    summary: str
    metrics: dict
    strengths: List[dict]
    improvements: List[dict]
    next_steps: List[dict]
    charts: dict
    generated_at: datetime
    expires_at: datetime

class KeywordTrendResponse(BaseModel):
    keyword: str
    count: int
    trend: str  # up, down, stable
    change_percentage: int

class TemplateRecommendRequest(BaseModel):
    recent_moods: List[str]
    space_type: str

class CycleRecommendRequest(BaseModel):
    type: str
    start_date: date
    end_date: date

# Activity schemas
class ActivityBase(BaseModel):
    type: str  # contest, project, club, internship
    category: Optional[str] = None
    title: str
    organization: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None  # beginner, intermediate, advanced
    deadline: Optional[date] = None
    prize: Optional[str] = None
    tags: Optional[List[str]] = []
    url: Optional[str] = None
    image_url: Optional[str] = None

class ActivityCreate(ActivityBase):
    requirements: Optional[dict] = {}
    timeline: Optional[List[dict]] = []
    prizes: Optional[List[dict]] = []

class ActivityResponse(ActivityBase):
    id: str
    requirements: Optional[dict] = {}
    timeline: Optional[List[dict]] = []
    prizes: Optional[List[dict]] = []
    match_score: Optional[float] = None
    match_reasons: Optional[List[str]] = []
    is_bookmarked: bool = False
    is_active: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bookmark schemas
class BookmarkResponse(BaseModel):
    activity_id: str
    title: str
    type: str
    deadline: Optional[date] = None
    bookmarked_at: datetime

# Notification schemas
class NotificationBase(BaseModel):
    type: str
    title: str
    content: str
    link: Optional[str] = None

class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Team Member schemas
class TeamMemberBase(BaseModel):
    name: str
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    is_leader: bool = False

class TeamMemberCreate(TeamMemberBase):
    project_id: str

class TeamMemberResponse(TeamMemberBase):
    id: str
    project_id: str
    user_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Activity Recommendation schemas
class ActivityBase(BaseModel):
    title: str
    organization: str
    category: str  # contest, project, club, study, internship
    type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    target_audience: Optional[List[str]] = []
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    application_start_date: Optional[date] = None
    application_end_date: Optional[date] = None
    fields: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    keywords: Optional[List[str]] = []
    recommended_majors: Optional[List[str]] = []
    difficulty_level: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    apply_url: Optional[str] = None
    prize_money: Optional[int] = None
    prize_details: Optional[dict] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityResponse(ActivityBase):
    id: str
    status: str
    view_count: int
    bookmark_count: int
    source: Optional[str] = None
    crawled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # 추천 관련 (optional)
    match_score: Optional[float] = None
    match_reasons: Optional[dict] = None
    is_bookmarked: Optional[bool] = False
    has_applied: Optional[bool] = False
    days_left: Optional[int] = None
    
    class Config:
        from_attributes = True

class BookmarkCreate(BaseModel):
    activity_id: str

class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    activity_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    activity_id: str
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    activity_id: str
    status: str
    applied_at: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Activity 정보 (optional)
    activity: Optional[ActivityResponse] = None
    
    class Config:
        from_attributes = True

class UserPreferencesBase(BaseModel):
    interested_fields: Optional[List[str]] = []
    interested_categories: Optional[List[str]] = []
    skill_keywords: Optional[List[str]] = []
    exclude_categories: Optional[List[str]] = []
    min_prize_money: Optional[int] = None
    preferred_difficulty: Optional[str] = None
    notification_enabled: bool = True
    notification_frequency: str = "weekly"

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(UserPreferencesBase):
    pass

class UserPreferencesResponse(UserPreferencesBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: str
    user_id: str
    activity_id: str
    match_score: float
    reasons: Optional[dict] = None
    clicked: bool
    clicked_at: Optional[datetime] = None
    bookmarked: bool
    applied: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Generic response
class SuccessResponse(BaseModel):
    success: bool = True
    data: dict
    message: Optional[str] = None
    timestamp: datetime

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict
    timestamp: datetime
