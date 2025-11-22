"""
회고 리마인더 및 메트릭 계산 배치 작업

실행 방법:
- 시간별 리마인더: python -m app.batch.reflection_jobs send_reminders
- 일일 메트릭 계산: python -m app.batch.reflection_jobs calculate_daily_metrics
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database import get_supabase
from app.config import settings

async def send_reflection_reminders():
    """회고 리마인더 전송 (시간별 실행)"""
    print(f"[{datetime.now()}] 회고 리마인더 전송 시작")
    
    try:
        supabase = get_supabase()
        
        # 다음 회고 날짜가 오늘인 활성 스페이스 조회
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        spaces_response = supabase.table("reflection_spaces")\
            .select("*, users(email, name)")\
            .eq("status", "active")\
            .eq("reminder_enabled", True)\
            .gte("next_reflection_date", today_start.isoformat())\
            .lte("next_reflection_date", today_end.isoformat())\
            .execute()
        
        spaces = spaces_response.data
        
        if not spaces:
            print("전송할 리마인더가 없습니다")
            return
        
        print(f"{len(spaces)}개의 리마인더를 전송합니다")
        
        # 알림 생성
        for space in spaces:
            user = space.get('users', {})
            user_id = space['user_id']
            
            notification_data = {
                "user_id": user_id,
                "type": "reminder",
                "title": "회고 작성 시간입니다",
                "message": f"'{space['name']}' 스페이스의 회고를 작성해주세요",
                "link": f"/spaces/{space['id']}/reflect",
                "is_read": False
            }
            
            supabase.table("notifications").insert(notification_data).execute()
            
            print(f"  - {user.get('name', 'Unknown')} ({user.get('email')}): {space['name']}")
        
        print(f"[{datetime.now()}] 회고 리마인더 전송 완료")
        
    except Exception as e:
        print(f"[ERROR] 리마인더 전송 실패: {str(e)}")
        raise

async def calculate_daily_metrics():
    """일일 성장 메트릭 계산 (매일 자정 실행)"""
    print(f"[{datetime.now()}] 일일 메트릭 계산 시작")
    
    try:
        supabase = get_supabase()
        
        # 어제 날짜
        yesterday = (datetime.now() - timedelta(days=1)).date()
        
        # 모든 활성 사용자 조회
        users_response = supabase.table("users").select("id").execute()
        users = users_response.data
        
        print(f"{len(users)}명의 사용자 메트릭 계산")
        
        for user in users:
            user_id = user['id']
            
            # 어제까지의 회고 데이터
            reflections_response = supabase.table("reflections")\
                .select("progress_score, ai_keywords")\
                .eq("user_id", user_id)\
                .lte("reflection_date", yesterday.isoformat())\
                .execute()
            
            reflections = reflections_response.data
            
            if not reflections:
                continue
            
            # 평균 진행 점수
            scores = [r.get('progress_score', 0) for r in reflections if r.get('progress_score')]
            avg_progress = sum(scores) / len(scores) if scores else 0
            
            # 키워드 수
            all_keywords = set()
            for r in reflections:
                keywords = r.get('ai_keywords', [])
                if isinstance(keywords, list):
                    all_keywords.update(keywords)
            
            keyword_count = len(all_keywords)
            
            # 완료율 계산
            spaces_response = supabase.table("reflection_spaces")\
                .select("total_reflections, expected_reflections")\
                .eq("user_id", user_id)\
                .eq("status", "active")\
                .execute()
            
            spaces = spaces_response.data
            total_actual = sum(s.get('total_reflections', 0) for s in spaces)
            total_expected = sum(s.get('expected_reflections', 1) for s in spaces)
            completion_rate = int((total_actual / total_expected) * 100) if total_expected > 0 else 0
            
            # 프로젝트 완료 수
            projects_response = supabase.table("reflection_spaces")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("status", "completed")\
                .execute()
            
            project_completion_count = projects_response.count or 0
            
            # 메트릭 저장
            metric_data = {
                "user_id": user_id,
                "date": yesterday.isoformat(),
                "avg_progress_score": round(avg_progress, 2),
                "total_reflections": len(reflections),
                "keyword_count": keyword_count,
                "completion_rate": min(completion_rate, 100),
                "project_completion_count": project_completion_count
            }
            
            # Upsert (존재하면 업데이트, 없으면 삽입)
            try:
                supabase.table("growth_metrics").upsert(metric_data).execute()
                print(f"  - User {user_id}: 평균 {avg_progress:.1f}점, 완료율 {completion_rate}%")
            except Exception as e:
                print(f"  - [ERROR] User {user_id}: {str(e)}")
        
        print(f"[{datetime.now()}] 일일 메트릭 계산 완료")
        
    except Exception as e:
        print(f"[ERROR] 메트릭 계산 실패: {str(e)}")
        raise

async def cleanup_expired_cache():
    """만료된 AI 분석 캐시 정리 (매일 실행)"""
    print(f"[{datetime.now()}] 만료된 캐시 정리 시작")
    
    try:
        supabase = get_supabase()
        
        response = supabase.table("reflection_ai_analysis")\
            .delete()\
            .lt("expires_at", datetime.now().isoformat())\
            .execute()
        
        deleted_count = len(response.data) if response.data else 0
        print(f"{deleted_count}개의 만료된 캐시 삭제")
        print(f"[{datetime.now()}] 캐시 정리 완료")
        
    except Exception as e:
        print(f"[ERROR] 캐시 정리 실패: {str(e)}")
        raise

async def update_space_status():
    """종료일이 지난 스페이스 상태 업데이트 (매일 실행)"""
    print(f"[{datetime.now()}] 스페이스 상태 업데이트 시작")
    
    try:
        supabase = get_supabase()
        
        today = datetime.now().date()
        
        response = supabase.table("reflection_spaces")\
            .update({"status": "completed"})\
            .eq("status", "active")\
            .lt("end_date", today.isoformat())\
            .execute()
        
        updated_count = len(response.data) if response.data else 0
        print(f"{updated_count}개의 스페이스 완료 처리")
        print(f"[{datetime.now()}] 스페이스 상태 업데이트 완료")
        
    except Exception as e:
        print(f"[ERROR] 스페이스 상태 업데이트 실패: {str(e)}")
        raise

def main():
    """메인 실행 함수"""
    if len(sys.argv) < 2:
        print("사용법: python -m app.batch.reflection_jobs <command>")
        print("Commands:")
        print("  send_reminders         - 회고 리마인더 전송 (시간별)")
        print("  calculate_daily_metrics - 일일 메트릭 계산 (매일 자정)")
        print("  cleanup_cache          - 만료 캐시 정리 (매일)")
        print("  update_status          - 스페이스 상태 업데이트 (매일)")
        print("  run_all_daily          - 모든 일일 작업 실행")
        return
    
    command = sys.argv[1]
    
    if command == "send_reminders":
        asyncio.run(send_reflection_reminders())
    elif command == "calculate_daily_metrics":
        asyncio.run(calculate_daily_metrics())
    elif command == "cleanup_cache":
        asyncio.run(cleanup_expired_cache())
    elif command == "update_status":
        asyncio.run(update_space_status())
    elif command == "run_all_daily":
        asyncio.run(calculate_daily_metrics())
        asyncio.run(cleanup_expired_cache())
        asyncio.run(update_space_status())
    else:
        print(f"알 수 없는 명령: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
