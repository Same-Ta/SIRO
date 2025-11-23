from fastapi import APIRouter, Depends, HTTPException, Header
from supabase import Client
from app.database import get_supabase
from typing import Dict, List

router = APIRouter()

@router.post("/start")
async def start_simulation(
    simulation_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """직무 시뮬레이션 시작 - 직무 시뮬레이션을 시작합니다"""
    return {
        "simulation_id": "sim_123",
        "questions": [
            {"question": "질문1", "options": ["A", "B", "C", "D"]},
            {"question": "질문2", "options": ["A", "B", "C", "D"]}
        ]
    }

@router.post("/submit")
async def submit_simulation(
    submission_data: Dict,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """시뮬레이션 답변 제출 - 시뮬레이션 결과를 제출하고 분석 결과를 받습니다"""
    result_data = {
        "user_id": x_user_id,
        "department": submission_data.get("department"),
        "answers": submission_data.get("answers"),
        "scores": {"MKT": 85, "PM": 75, "DATA": 65},
        "top_job": "마케터"
    }
    
    response = supabase.table("job_simulation_results").insert(result_data).execute()
    return response.data[0] if response.data else result_data

@router.get("/results")
async def list_results(
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> List[Dict]:
    """시뮬레이션 결과 목록 - 사용자의 시뮬레이션 결과 목록을 조회합니다"""
    response = supabase.table("job_simulation_results").select("*").eq("user_id", x_user_id).execute()
    return response.data

@router.get("/results/{result_id}")
async def get_result(
    result_id: str,
    x_user_id: str = Header(..., alias="x-user-id"),
    supabase: Client = Depends(get_supabase)
) -> Dict:
    """시뮬레이션 결과 상세 - 특정 시뮬레이션 결과를 조회합니다"""
    response = supabase.table("job_simulation_results").select("*").eq("result_id", result_id).eq("user_id", x_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다")
    return response.data[0]
