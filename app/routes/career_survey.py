from fastapi import APIRouter, Depends, HTTPException, Header, Query
from supabase import Client
from app.database import get_supabase
from typing import Dict, List

router = APIRouter()

@router.get("/questions")
async def get_questions(
    survey_type: str = Query(...),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """설문 질문 조회 - 커리어 설문 질문을 조회합니다"""
    if survey_type == "general":
        return {
            "questions": [
                {"id": 1, "question": "선호하는 직무는?", "type": "choice"},
                {"id": 2, "question": "중요하게 생각하는 가치는?", "type": "text"}
            ]
        }
    elif survey_type == "spec_check":
        return {
            "questions": [
                {"id": 1, "question": "학점은?", "type": "number"},
                {"id": 2, "question": "어학 점수는?", "type": "number"}
            ]
        }
    return {"questions": []}

@router.post("/submit")
async def submit_survey(
    survey_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """일반 설문 제출 - 일반 커리어 설문을 제출합니다"""
    result_data = {
        "user_id": x_user_id,
        "survey_type": "general",
        "answers": survey_data.get("answers"),
        "preference_top3": [
            {"job": "마케터", "score": 85},
            {"job": "기획자", "score": 80}
        ]
    }
    
    response = supabase.table("career_survey_results").insert(result_data).execute()
    return response.data[0] if response.data else result_data

@router.post("/spec-check/submit")
async def submit_spec_check(
    survey_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """스펙 체크 설문 제출 - 스펙 체크 설문을 제출합니다"""
    result_data = {
        "user_id": x_user_id,
        "survey_type": "spec_check",
        "answers": survey_data.get("answers"),
        "fit_top3": [
            {"job": "데이터 분석가", "score": 90},
            {"job": "마케터", "score": 85}
        ]
    }
    
    response = supabase.table("career_survey_results").insert(result_data).execute()
    return response.data[0] if response.data else result_data

@router.get("/results")
async def list_survey_results(
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """설문 결과 목록 - 사용자의 설문 결과 목록을 조회합니다"""
    response = supabase.table("career_survey_results").select("*").eq("user_id", x_user_id).execute()
    return response.data

@router.get("/results/{survey_id}")
async def get_survey_result(
    survey_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """설문 결과 상세 - 특정 설문 결과를 조회합니다"""
    response = supabase.table("career_survey_results").select("*").eq("survey_id", survey_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="설문 결과를 찾을 수 없습니다")
    return response.data[0]
