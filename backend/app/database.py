from supabase import create_client, Client
from app.config import settings
from typing import Optional
import logging
import traceback

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """Supabase 클라이언트 반환 (싱글톤)"""
    global _supabase_client
    if _supabase_client is None:
        try:
            # proxy 인자를 제거하고 기본 설정만 사용
            _supabase_client = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_service_key
            )
            logger.info("Supabase 클라이언트 초기화 성공")
        except Exception:
            # 콘솔에 전체 스택트레이스 출력 (디버깅용)
            print(traceback.format_exc())
            logger.exception("Supabase 클라이언트 초기화 실패")
            raise
    return _supabase_client

async def ensure_reflection_table(template_id: str) -> str:
    """
    회고 템플릿에 맞는 테이블 이름 반환
    모든 템플릿은 통합 reflections 테이블 사용 (template_id로 구분)
    """
    # 모든 템플릿은 통합 reflections 테이블 사용
    logger.info(f"템플릿 {template_id} - 통합 reflections 테이블 사용")
    return "reflections"
