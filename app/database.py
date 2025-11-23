from supabase import create_client, Client
from app.config import settings
from typing import Optional

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """Supabase 클라이언트 반환 (싱글톤)"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_key  # Service Key 사용 (백엔드)
        )
    return _supabase_client
