from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    
    # Server Configuration
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"
    
    # CORS
    # 개발 편의를 위해 로컬 프론트 여러 포트를 기본 허용 (필요시 .env 에서 덮어쓰기)
    # '*' 로 설정하면 모든 출처 허용(개발 전용). 운영환경에서는 .env 로 정확히 설정하세요.
    cors_origins: str = "*"
    
    # JWT Configuration
    jwt_secret_key: str = "your-secret-key-change-this-in-production-min-32-characters"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # OpenAI (AI 분석용)
    openai_api_key: str = ""
    openai_model: str = "gpt-4-turbo-preview"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()
