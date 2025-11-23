import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIRECTORIES = [
    PROJECT_ROOT / "backend" / "data",
    PROJECT_ROOT / "data",
    PROJECT_ROOT / "public" / "data",
]

TRAIT_LABELS = {
    "creativity": "창의적 기획",
    "analytical": "데이터 분석",
    "numerical": "수리 감각",
    "interpersonal": "대인 커뮤니케이션",
    "process": "프로세스 개선",
    "people_management": "인사/조직 관리",
    "product": "상품/서비스 기획",
    "branding": "브랜딩 감각",
    "growth": "그로스 실험",
    "presentation": "설득/프레젠테이션",
    "customer": "고객 관찰",
    "planning": "계획/운영",
    "content": "콘텐츠 제작",
    "agility": "우선순위 전환",
    "data_driven": "데이터 기반 의사결정",
    "relationship": "관계 구축",
    "systems": "시스템적 문제 해결",
    "pricing": "가격/손익 감각",
    "tools": "툴 활용",
    "collaboration": "협업 조율",
    "market_analysis": "시장/경쟁 분석",
    "routine": "루틴 업무 선호",
    "ux": "UX 관찰",
    "compliance": "규정 준수",
    "fast_feedback": "빠른 실행/피드백",
}


class SurveySubmission(BaseModel):
    survey_id: str = Field(..., description="설문 데이터 파일 슬러그 (예: survey-general)")
    answers: Dict[str, Any]
    user_id: Optional[str] = Field(default=None, description="사용자 ID (선택)")


class JobScore(BaseModel):
    job_id: str
    name: str
    icon: Optional[str] = None
    preference_score: float
    fit_score: float
    combined_score: float


class JobRecommendation(BaseModel):
    job_id: str
    name: str
    icon: Optional[str] = None
    score: float
    rank: int
    reason: Optional[str] = None


class SurveyResult(BaseModel):
    survey_id: str
    submitted_at: datetime
    total_questions: int
    job_scores: Dict[str, float]
    preference_top3: List[JobRecommendation]
    fit_top3: List[JobRecommendation]
    recommended_job: JobRecommendation
    insights: List[str]


class SpecCheckSubmission(BaseModel):
    job_category: str = Field(..., description="대분류 직무 ID (예: marketing)")
    answers: Dict[str, Any]


class SpecializationScore(BaseModel):
    subtype_id: str
    name: str
    description: Optional[str] = None
    score: float
    reason: Optional[str] = None


class SpecCheckResult(BaseModel):
    job_category: str
    submitted_at: datetime
    total_questions: int
    score_map: Dict[str, float]
    top_specializations: List[SpecializationScore]
    preference_top3: List[SpecializationScore]
    fit_top3: List[SpecializationScore]
    recommended_specialization: SpecializationScore
    insights: List[str]


def resolve_data_file(slug: str) -> Path:
    filename = slug if slug.endswith('.json') else f"{slug}.json"
    for base in DATA_DIRECTORIES:
        candidate = base / filename
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Survey data '{slug}' not found")


def load_survey_data(slug: str) -> Dict[str, Any]:
    file_path = resolve_data_file(slug)
    with file_path.open(encoding='utf-8') as fp:
        return json.load(fp)


def normalize_scores(scores: Dict[str, float]) -> Dict[str, float]:
    if not scores:
        return {}
    max_score = max(scores.values()) or 1
    return {k: round((v / max_score) * 100, 2) for k, v in scores.items()}


def translate_trait(trait_key: str) -> str:
    if not trait_key:
        return "핵심 역량"
    return TRAIT_LABELS.get(trait_key, trait_key.replace('_', ' ').title())


def build_reason(job_name: str, trait_totals: Dict[str, float]) -> str:
    if not trait_totals:
        return f"{job_name} 직무와의 종합 적합도가 가장 높습니다."
    top_traits = sorted(trait_totals.items(), key=lambda item: item[1], reverse=True)
    trait_labels = [translate_trait(key) for key, _ in top_traits[:2]]
    bullet = ' · '.join(trait_labels)
    return f"{job_name} 직무에 필요한 {bullet} 역량 점수가 높았습니다."


def calculate_general_scores(answers: Dict[str, Any], survey_data: Dict[str, Any]):
    scores = {cat['id']: 0.0 for cat in survey_data['job_categories']}
    trait_contributions = {cat['id']: defaultdict(float) for cat in survey_data['job_categories']}

    for question in survey_data['questions']:
        q_id = question['id']
        q_type = question.get('type', 'likert')
        answer = answers.get(q_id)
        if answer is None:
            continue

        category = question.get('category') or question.get('text', '기타 경험')

        if q_type == 'likert' and 'weights' in question:
            for job_id, weight in question['weights'].items():
                if job_id not in scores:
                    continue
                delta = float(answer) * float(weight)
                scores[job_id] += delta
                trait_contributions[job_id][category] += delta

        elif q_type == 'single_choice' and 'options' in question:
            selected = next((opt for opt in question['options'] if opt['value'] == answer), None)
            if not selected:
                continue
            for job_id, weight in selected.get('weights', {}).items():
                if job_id not in scores:
                    continue
                delta = float(weight) * 5
                scores[job_id] += delta
                trait_contributions[job_id][category] += delta

        elif q_type == 'multiple_choice' and 'options' in question and isinstance(answer, list):
            for option in question['options']:
                if option['value'] not in answer:
                    continue
                for job_id, weight in option.get('weights', {}).items():
                    if job_id not in scores:
                        continue
                    delta = float(weight) * 5
                    scores[job_id] += delta
                    trait_contributions[job_id][category] += delta

        elif q_type == 'text' and question.get('weights'):
            text_answer = str(answer).strip()
            if not text_answer:
                continue
            for job_id, weight in question['weights'].items():
                if job_id not in scores:
                    continue
                delta = float(weight)
                scores[job_id] += delta
                trait_contributions[job_id][category] += delta

    return scores, trait_contributions


def calculate_spec_scores(answers: Dict[str, Any], spec_data: Dict[str, Any]):
    subtypes = {sub['id']: sub for sub in spec_data['subtypes']}
    scores = {sub_id: 0.0 for sub_id in subtypes}
    question_contributions = {sub_id: defaultdict(float) for sub_id in subtypes}

    for question in spec_data['questions']:
        q_id = question['id']
        answer = answers.get(q_id)
        if answer is None:
            continue
        if 'weights' not in question:
            continue

        for subtype_id, weight in question['weights'].items():
            if subtype_id not in scores:
                continue
            delta = float(answer) * float(weight)
            scores[subtype_id] += delta
            question_contributions[subtype_id][question['text']] += delta

    return scores, question_contributions


@router.post("/submit", response_model=SurveyResult)
async def submit_survey(submission: SurveySubmission):
    try:
        survey_data = load_survey_data(submission.survey_id)
        raw_scores, trait_contributions = calculate_general_scores(submission.answers, survey_data)
        normalized_scores = normalize_scores(raw_scores)

        job_meta = {job['id']: job for job in survey_data['job_categories']}
        preference_weight = survey_data.get('scoring_rules', {}).get('preference_weight', 0.4)
        fit_weight = survey_data.get('scoring_rules', {}).get('fit_weight', 0.6)

        job_scores: List[JobScore] = []
        for job_id, meta in job_meta.items():
            score = normalized_scores.get(job_id, 0.0)
            preference_score = score
            fit_score = score
            combined = preference_score * preference_weight + fit_score * fit_weight
            job_scores.append(JobScore(
                job_id=job_id,
                name=meta['name'],
                icon=meta.get('icon'),
                preference_score=round(preference_score, 2),
                fit_score=round(fit_score, 2),
                combined_score=round(combined, 2)
            ))

        if not job_scores:
            raise HTTPException(status_code=400, detail="유효한 직무 점수를 계산하지 못했습니다.")

        preference_top3 = sorted(job_scores, key=lambda x: x.preference_score, reverse=True)[:3]
        fit_top3 = sorted(job_scores, key=lambda x: x.fit_score, reverse=True)[:3]
        recommended = max(job_scores, key=lambda x: x.combined_score)

        recommended_reason = build_reason(recommended.name, trait_contributions.get(recommended.job_id, {}))

        pref_payload = [
            JobRecommendation(
                job_id=item.job_id,
                name=item.name,
                icon=item.icon,
                score=item.preference_score,
                rank=index + 1,
            )
            for index, item in enumerate(preference_top3)
        ]

        fit_payload = [
            JobRecommendation(
                job_id=item.job_id,
                name=item.name,
                icon=item.icon,
                score=item.fit_score,
                rank=index + 1,
            )
            for index, item in enumerate(fit_top3)
        ]

        recommended_payload = JobRecommendation(
            job_id=recommended.job_id,
            name=recommended.name,
            icon=recommended.icon,
            score=recommended.combined_score,
            rank=1,
            reason=recommended_reason,
        )

        insights = [
            f"{recommended.name} 직무가 선호와 역량 모두에서 가장 높은 점수를 기록했어요.",
            "상위 직무들을 스펙체크에 저장하면 세부 직무 역량까지 분석할 수 있어요.",
        ]

        return SurveyResult(
            survey_id=submission.survey_id,
            submitted_at=datetime.now(),
            total_questions=len(survey_data['questions']),
            job_scores=normalized_scores,
            preference_top3=pref_payload,
            fit_top3=fit_payload,
            recommended_job=recommended_payload,
            insights=insights,
        )

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Server error: {exc}")


@router.get("/spec-check/{job_category}")
async def get_spec_check_survey(job_category: str):
    try:
        spec_data = load_survey_data(f"spec-check-{job_category}")
        return spec_data
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Server error: {exc}")


@router.post("/spec-check/submit", response_model=SpecCheckResult)
async def submit_spec_check(submission: SpecCheckSubmission):
    try:
        spec_slug = f"spec-check-{submission.job_category}"
        spec_data = load_survey_data(spec_slug)
        raw_scores, question_contributions = calculate_spec_scores(submission.answers, spec_data)
        normalized_scores = normalize_scores(raw_scores)

        subtype_lookup = {sub['id']: sub for sub in spec_data['subtypes']}
        specializations = [
            SpecializationScore(
                subtype_id=sub_id,
                name=subtype_lookup[sub_id]['name'],
                description=subtype_lookup[sub_id].get('description'),
                score=normalized_scores.get(sub_id, 0.0)
            )
            for sub_id in subtype_lookup
        ]

        top_specializations = sorted(specializations, key=lambda x: x.score, reverse=True)
        preference_top3 = top_specializations[:3]
        fit_top3 = top_specializations[:3]
        recommended = top_specializations[0]

        top_questions = sorted(
            question_contributions.get(recommended.subtype_id, {}).items(),
            key=lambda item: item[1],
            reverse=True,
        )[:2]

        if top_questions:
            question_summary = " / ".join([q[0] for q in top_questions])
            insight_msg = f"'{question_summary}' 문항에서 특히 높은 응답을 보여주셨어요."
            recommended_reason = f"'{question_summary}' 관련 문항 점수가 특히 높았습니다."
        else:
            insight_msg = f"{recommended.name} 관련 경험 점수가 가장 높게 나타났어요."
            recommended_reason = f"{recommended.name} 관련 경험 점수가 일관되게 높았습니다."

        recommended_with_reason = SpecializationScore(
            subtype_id=recommended.subtype_id,
            name=recommended.name,
            description=recommended.description,
            score=recommended.score,
            reason=recommended_reason,
        )

        insights = [
            f"{recommended.name}가 세부 직무 중 가장 높은 점수를 기록했습니다.",
            insight_msg,
        ]

        return SpecCheckResult(
            job_category=spec_data['job_category'],
            submitted_at=datetime.now(),
            total_questions=len(spec_data['questions']),
            score_map=normalized_scores,
            top_specializations=top_specializations,
            preference_top3=preference_top3,
            fit_top3=fit_top3,
            recommended_specialization=recommended_with_reason,
            insights=insights,
        )

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Server error: {exc}")
