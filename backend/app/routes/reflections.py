"""
회고 v3 시스템 API
- Micro Log (초라이트 기록)
- Preference Pulse (취향 탐지)
- Action Nudge (행동 제안)
- Story View (스토리 생성)
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
from app.database import get_supabase, ensure_reflection_table
from app.utils.auth import get_current_user_id
from collections import Counter
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ===== Pydantic Models =====

class MicroLogCreate(BaseModel):
    """초라이트 기록 생성 요청"""
    activity_type: str  # contest | club | project | internship | study | etc
    memo: Optional[str] = None
    mood_compare: str  # worse | same | better
    reason: Optional[str] = None  # positive_001~006 | negative_001~006
    tags: Optional[List[str]] = []
    date: date
    space_id: Optional[str] = None  # 스페이스 연동

# ===== Micro Log Endpoints =====

@router.post("/micro")
async def create_micro_log(
    log_data: MicroLogCreate,
    user_id: str = Depends(get_current_user_id)
):
    """초라이트 기록 작성"""
    try:
        supabase = get_supabase()
        
        # 유효성 검증
        if log_data.activity_type not in ['contest', 'club', 'project', 'internship', 'study', 'etc']:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_ACTIVITY_TYPE",
                    "message": "잘못된 활동 유형입니다"
                }
            }
        
        if log_data.mood_compare not in ['worse', 'same', 'better']:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_MOOD_COMPARE",
                    "message": "잘못된 기분 비교값입니다"
                }
            }
        
        # mood_compare가 'same'이 아닐 때 reason 필수
        if log_data.mood_compare != 'same' and not log_data.reason:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "REASON_REQUIRED",
                    "message": "기분 이유를 선택해주세요"
                }
            }
        
        # memo 길이 체크
        if log_data.memo and len(log_data.memo) > 500:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "MEMO_TOO_LONG",
                    "message": "메모는 500자 이내로 작성해주세요"
                }
            }
        
        # 로그 저장
        insert_data = {
            "user_id": user_id,
            "activity_type": log_data.activity_type,
            "memo": log_data.memo,
            "mood_compare": log_data.mood_compare,
            "reason": log_data.reason,
            "tags": log_data.tags or [],
            "date": str(log_data.date),
            "space_id": log_data.space_id
        }
        
        response = supabase.table("micro_logs").insert(insert_data).execute()
        
        if not response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "CREATE_FAILED",
                    "message": "기록 저장에 실패했습니다"
                }
            }
        
        log = response.data[0]
        
        return {
            "success": True,
            "data": {
                "id": log["id"],
                "user_id": log["user_id"],
                "activity_type": log["activity_type"],
                "memo": log["memo"],
                "mood_compare": log["mood_compare"],
                "reason": log["reason"],
                "tags": log["tags"],
                "date": log["date"],
                "created_at": log["created_at"]
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


@router.delete("/micro/{log_id}")
async def delete_micro_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """단일 마이크로 로그 삭제"""
    try:
        supabase = get_supabase()
        # 소유자 확인 및 삭제
        check = supabase.table("micro_logs").select("id, user_id").eq("id", log_id).single().execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="마이크로 로그를 찾을 수 없습니다")
        if check.data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")

        res = supabase.table("micro_logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
        return {"success": True, "data": {"id": log_id}, "error": None}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}

@router.get("/micro")
async def get_micro_logs(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    activity_type: Optional[str] = None
):
    """초라이트 기록 목록 조회"""
    try:
        supabase = get_supabase()
        
        # 쿼리 빌드
        query = supabase.table("micro_logs").select("*", count="exact").eq("user_id", user_id)
        
        # 날짜 필터
        if date_from:
            query = query.gte("date", str(date_from))
        if date_to:
            query = query.lte("date", str(date_to))
        
        # 활동 유형 필터
        if activity_type:
            query = query.eq("activity_type", activity_type)
        
        # 정렬 및 페이지네이션
        query = query.order("date", desc=True).order("created_at", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
        return {
            "success": True,
            "data": {
                "logs": response.data or [],
                "total": response.count or 0,
                "limit": limit,
                "offset": offset
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

# ===== Stats Endpoint =====

@router.get("/stats")
async def get_reflection_stats(
    user_id: str = Depends(get_current_user_id),
    period: str = Query("week", regex="^(week|month)$")
):
    """회고 통계 조회"""
    try:
        supabase = get_supabase()
        
        # 기간 계산
        days = 7 if period == "week" else 30
        start_date = datetime.now().date() - timedelta(days=days)
        
        # 기간 내 로그 조회
        response = supabase.table("micro_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", str(start_date)) \
            .execute()
        
        logs = response.data or []
        total_logs = len(logs)
        
        if total_logs == 0:
            return {
                "success": True,
                "data": {
                    "period": period,
                    "total_logs": 0,
                    "positive_logs": 0,
                    "neutral_logs": 0,
                    "negative_logs": 0,
                    "growth_trend": 0,
                    "most_active_type": None,
                    "activity_distribution": {},
                    "top_tags": []
                },
                "error": None
            }
        
        # 통계 계산
        positive_logs = len([log for log in logs if log["mood_compare"] == "better"])
        neutral_logs = len([log for log in logs if log["mood_compare"] == "same"])
        negative_logs = len([log for log in logs if log["mood_compare"] == "worse"])
        
        # 성장 트렌드 (긍정 - 부정) / 전체 * 100
        growth_trend = round(((positive_logs - negative_logs) / total_logs) * 100, 1)
        
        # 활동 유형 분포
        activity_distribution = dict(Counter([log["activity_type"] for log in logs]))
        most_active_type = max(activity_distribution, key=activity_distribution.get) if activity_distribution else None
        
        # Top 태그
        all_tags = []
        for log in logs:
            if log.get("tags"):
                all_tags.extend(log["tags"])
        
        tag_counts = Counter(all_tags)
        top_tags = [{"tag": tag, "count": count} for tag, count in tag_counts.most_common(5)]
        
        return {
            "success": True,
            "data": {
                "period": period,
                "total_logs": total_logs,
                "positive_logs": positive_logs,
                "neutral_logs": neutral_logs,
                "negative_logs": negative_logs,
                "growth_trend": growth_trend,
                "most_active_type": most_active_type,
                "activity_distribution": activity_distribution,
                "top_tags": top_tags
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

# ===== Story View Endpoint =====

@router.get("/story")
async def get_reflection_story(
    user_id: str = Depends(get_current_user_id),
    period: str = Query("week", regex="^(week|month|quarter)$")
):
    """스토리 뷰 생성"""
    try:
        supabase = get_supabase()
        
        # 기간 계산
        if period == "week":
            days = 7
            period_label = "이번 주"
        elif period == "month":
            days = 30
            period_label = "이번 달"
        else:  # quarter
            days = 90
            period_label = "이번 분기"
        
        start_date = datetime.now().date() - timedelta(days=days)
        
        # 기간 내 로그 조회
        response = supabase.table("micro_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", str(start_date)) \
            .order("date", desc=False) \
            .execute()
        
        logs = response.data or []
        
        if not logs:
            return {
                "success": True,
                "data": {
                    "period_label": period_label,
                    "total_days": days,
                    "activity_summary": [],
                    "positive_patterns": [],
                    "negative_patterns": [],
                    "strength_analysis": "아직 기록이 부족해요. 더 많은 경험을 기록해보세요!",
                    "suggested_tracks": [],
                    "next_suggestion": None
                },
                "error": None
            }
        
        # 활동 요약
        activity_counts = Counter([log["activity_type"] for log in logs])
        activity_icons = {
            "contest": "🏆",
            "club": "👥",
            "project": "💼",
            "internship": "💼",
            "study": "📚",
            "etc": "✨"
        }
        activity_labels = {
            "contest": "공모전/대외활동",
            "club": "학회/동아리",
            "project": "프로젝트",
            "internship": "인턴/아르바이트",
            "study": "자격증/공부",
            "etc": "기타"
        }
        activity_summary = [
            {
                "type": act_type,
                "count": count,
                "icon": activity_icons.get(act_type, "✨"),
                "label": activity_labels.get(act_type, "기타")
            }
            for act_type, count in activity_counts.most_common()
        ]
        
        # 긍정 패턴 분석
        positive_logs = [log for log in logs if log["mood_compare"] == "better"]
        positive_patterns = []
        
        if positive_logs:
            # reason 빈도 분석
            reason_map = {
                "positive_001": "사람들과 의견 주고받는 활동에서 에너지를 얻어요",
                "positive_002": "새로운 것을 배우는 과정을 즐겨요",
                "positive_003": "자신의 강점을 발휘할 수 있는 활동에서 빛나요",
                "positive_004": "누군가에게 도움이 되는 일에서 보람을 느껴요",
                "positive_005": "일이 술술 풀릴 때 기분이 좋아져요",
                "positive_006": "성과를 인정받을 때 뿌듯함을 느껴요"
            }
            reason_counts = Counter([log["reason"] for log in positive_logs if log.get("reason")])
            positive_patterns = [
                reason_map.get(reason, "긍정적인 경험을 많이 하고 있어요")
                for reason, _ in reason_counts.most_common(3)
            ]
        
        # 부정 패턴 분석
        negative_logs = [log for log in logs if log["mood_compare"] == "worse"]
        negative_patterns = []
        
        if negative_logs:
            reason_map = {
                "negative_001": "생각보다 잘 안 풀리는 상황에서 스트레스를 받아요",
                "negative_002": "사람들과 의견이 안 맞을 때 어려움을 느껴요",
                "negative_003": "시간이 오래 걸리는 작업에서 지쳐요",
                "negative_004": "자신이 못하는 부분이 드러날 때 힘들어해요",
                "negative_005": "하기 싫은 일을 억지로 할 때 에너지가 떨어져요",
                "negative_006": "결과가 기대에 못 미칠 때 실망해요"
            }
            reason_counts = Counter([log["reason"] for log in negative_logs if log.get("reason")])
            negative_patterns = [
                reason_map.get(reason, "어려운 경험도 있었어요")
                for reason, _ in reason_counts.most_common(2)
            ]
        
        # 강점 분석 (빈도 높은 태그 기반)
        all_positive_tags = []
        for log in positive_logs:
            if log.get("tags"):
                all_positive_tags.extend(log["tags"])
        
        strength_analysis = "아직 패턴이 명확하지 않아요. 더 많은 경험을 기록해보세요!"
        if all_positive_tags:
            top_tags = [tag for tag, _ in Counter(all_positive_tags).most_common(3)]
            strength_analysis = f"**{', '.join(top_tags)}** 분야에서 강점을 보이고 있어요."
        
        # 추천 진로 트랙 (간단 버전 - AI 통합 시 개선)
        suggested_tracks = [
            {
                "track": "기획/전략",
                "score": 75,
                "reason": "체계적인 활동 기록과 분석 능력"
            }
        ]
        
        # 다음 행동 제안
        next_suggestion = {
            "title": "더 다양한 경험 쌓기",
            "description": "지금까지의 경험을 바탕으로, 새로운 분야에도 도전해보세요.",
            "action": "추천 활동 보러가기",
            "recommended_activities": []
        }
        
        return {
            "success": True,
            "data": {
                "period_label": period_label,
                "total_days": days,
                "activity_summary": activity_summary,
                "positive_patterns": positive_patterns,
                "negative_patterns": negative_patterns,
                "strength_analysis": strength_analysis,
                "suggested_tracks": suggested_tracks,
                "next_suggestion": next_suggestion
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

# ===== STAR 회고 저장 엔드포인트 =====

class StarReflectionCreate(BaseModel):
    """STAR 회고 저장 요청"""
    template_id: str
    template_name: str
    answers: dict  # {situation, task, action, result}
    competencies: List[str]  # 역량명 리스트
    competency_scores: dict  # {역량명: 점수}
    competency_analysis: dict  # 전체 분석 결과 (evidence, reason, analysis 포함)

@router.post("")
async def create_reflection(
    reflection_data: StarReflectionCreate,
    user_id: str = Depends(get_current_user_id)
):
    """회고 저장 (모든 템플릿 지원)"""
    try:
        supabase = get_supabase()
        template_id = reflection_data.template_id
        
        # 통합 reflections 테이블 사용 (모든 템플릿 지원)
        table_name = await ensure_reflection_table(template_id)
        
        # 저장할 데이터 준비
        insert_data = {
            "user_id": user_id,
            "template_id": reflection_data.template_id,
            "template_name": reflection_data.template_name,
            "answers": reflection_data.answers,
            "competencies": reflection_data.competencies,
            "competency_scores": reflection_data.competency_scores,
            "competency_analysis": reflection_data.competency_analysis,
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"저장 시도: 테이블={table_name}, 템플릿={template_id}, 사용자={user_id}")
        
        # 통합 테이블에 저장
        response = supabase.table(table_name).insert(insert_data).execute()
        
        if not response.data:
            return {
                "success": False,
                "data": None,
                "error": {
                    "code": "CREATE_FAILED",
                    "message": "회고 저장에 실패했습니다"
                }
            }
        
        reflection = response.data[0]
        logger.info(f"저장 성공: ID={reflection.get('id')}, 템플릿={template_id}")
        
        return {
            "success": True,
            "data": {
                "id": reflection["id"],
                "user_id": reflection["user_id"],
                "template_id": reflection["template_id"],
                "template_name": reflection["template_name"],
                "created_at": reflection["created_at"]
            },
            "error": None
        }
    except Exception as e:
        logger.exception("회고 저장 오류")
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }

# ===== 이전 reflections 엔드포인트 (하위 호환성) =====

@router.get("")
async def list_reflections(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(50, le=100),
    template_id: Optional[str] = None
):
    """회고 목록 조회 (모든 템플릿 지원)"""
    try:
        supabase = get_supabase()
        
        # 통합 reflections 테이블에서 조회
        query = supabase.table("reflections") \
            .select("*") \
            .eq("user_id", user_id)
        
        # 특정 템플릿 필터링
        if template_id:
            query = query.eq("template_id", template_id)
            logger.info(f"조회: 템플릿={template_id}, 사용자={user_id}")
        else:
            logger.info(f"조회: 모든 템플릿, 사용자={user_id}")
        
        response = query \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        all_reflections = response.data or []
        logger.info(f"조회 결과: {len(all_reflections)}개")
        
        return {
            "success": True,
            "data": {
                "reflections": all_reflections
            },
            "error": None
        }
    except Exception as e:
        logger.exception("회고 목록 조회 오류")
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }


@router.delete("/{reflection_id}")
async def delete_reflection(
    reflection_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """단일 AI 회고(Reflection) 삭제"""
    try:
        supabase = get_supabase()

        # 소유자 확인
        check = supabase.table("reflections").select("id, user_id").eq("id", reflection_id).single().execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="회고를 찾을 수 없습니다")
        if check.data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")

        # 삭제
        supabase.table("reflections").delete().eq("id", reflection_id).eq("user_id", user_id).execute()

        return {"success": True, "data": {"id": reflection_id}, "error": None}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("회고 삭제 오류")
        return {"success": False, "data": None, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}

@router.get("/growth-stats")
async def get_growth_stats(user_id: str = Depends(get_current_user_id)):
    """성장 통계 조회 (하위 호환)"""
    return {
        "success": True,
        "data": {
            "avg_progress": 0,
            "completion_rate": 0,
            "keyword_count": 0,
            "project_completion": 0
        },
        "error": None
    }
