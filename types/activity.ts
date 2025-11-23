// types/activity.ts

/**
 * 활동 카테고리
 */
export type ActivityCategory =
  | "contest"           // 공모전
  | "external_activity" // 대외활동
  | "project"           // 프로젝트
  | "club"              // 동아리/학회
  | "volunteer"         // 봉사활동
  | "internship";       // 인턴십

/**
 * 직무 타입
 */
export type TargetJob =
  | "전략기획"
  | "마케팅"
  | "데이터분석"
  | "개발"
  | "디자인"
  | "영업"
  | "인사"
  | "재무"
  | "기타";

/**
 * 활동 정보
 */
export interface Activity {
  id: string;
  title: string;
  organization: string;
  category: ActivityCategory;
  target_jobs: string[];
  tags: string[];
  description?: string;
  benefits?: string;
  eligibility?: string;
  start_date?: string;
  end_date?: string;
  application_start?: string;
  application_end?: string;
  url?: string;
  image_url?: string;
  contact_info?: string;
  location?: string;
  is_active: boolean;
  view_count: number;
  bookmark_count: number;
  source_site?: string;
  is_bookmarked: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * 추천 활동 (매칭 점수 포함)
 */
export interface RecommendedActivity {
  activity: Activity;
  match_score: number;
  match_reasons: string[];
}

/**
 * 추천 활동 목록 응답
 */
export interface RecommendationsResponse {
  success: boolean;
  data: {
    activities: RecommendedActivity[];
  };
}
