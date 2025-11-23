'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, TrendingUp, Target, Lightbulb, ExternalLink, Bookmark, Calendar, Users } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { RecommendedActivity } from '@/types/activity';

interface JobResultProps {
  topJob: string;
  topJobName: string;
  scores: {
    MKT: number;
    PM: number;
    DATA: number;
    DEV: number;
    DESIGN: number;
    PEOPLE: number;
  };
  onClose: () => void;
}

const jobDescriptions: {[key: string]: {
  description: string;
  strengths: string[];
  recommendations: string[];
}} = {
  MKT: {
    description: '당신은 사용자의 마음을 움직이고, 서비스의 가치를 효과적으로 전달하는 데 강점이 있습니다. 시장을 읽고 전략을 세우는 마케팅/그로스 직무가 잘 맞을 것 같아요!',
    strengths: [
      '사용자 관점에서 생각하는 능력',
      '빠른 시장 트렌드 파악',
      '효과적인 커뮤니케이션',
      '데이터 기반 의사결정'
    ],
    recommendations: [
      '마케팅 인턴십이나 그로스 해킹 프로젝트',
      'GA, 메타 광고 등 디지털 마케팅 툴 학습',
      'A/B 테스트와 사용자 분석 경험 쌓기',
      '브랜딩 및 콘텐츠 마케팅 스터디'
    ]
  },
  PM: {
    description: '프로젝트의 전체 그림을 보고, 팀을 이끌며 목표를 달성하는 데 탁월한 능력을 보이셨어요. 서비스 기획자나 PM으로서 큰 잠재력이 있습니다!',
    strengths: [
      '전체 프로젝트 관리 능력',
      '우선순위 설정과 의사결정',
      '팀원 간 조율과 커뮤니케이션',
      '목표 지향적 사고방식'
    ],
    recommendations: [
      'PM 스쿨이나 기획 부트캠프 참여',
      '실제 서비스 기획 문서(PRD) 작성 연습',
      '사용자 인터뷰 및 시장조사 경험',
      '데이터 분석 툴 기초 학습'
    ]
  },
  DATA: {
    description: '데이터로 문제를 정의하고 해결책을 찾는 데 뛰어난 능력을 가지고 있습니다. 데이터 분석가나 데이터 사이언티스트로서의 길이 열려있어요!',
    strengths: [
      '논리적이고 분석적인 사고',
      '숫자와 지표를 통한 의사결정',
      '문제의 본질을 파악하는 능력',
      '객관적이고 체계적인 접근'
    ],
    recommendations: [
      'SQL, Python 등 데이터 분석 툴 학습',
      '실제 데이터셋으로 분석 프로젝트 진행',
      '통계학과 머신러닝 기초 공부',
      '데이터 시각화 (Tableau, Power BI) 학습'
    ]
  },
  DEV: {
    description: '실제로 작동하는 것을 만들고, 기술적 문제를 해결하는 데 흥미와 적성을 보입니다. 개발자/엔지니어로서의 진로가 잘 맞을 것 같아요!',
    strengths: [
      '기술적 문제 해결 능력',
      '논리적이고 체계적인 사고',
      '새로운 기술 학습에 대한 열정',
      '완성도 높은 구현 추구'
    ],
    recommendations: [
      '관심 있는 분야(웹/앱/백엔드) 개발 언어 학습',
      '토이 프로젝트나 오픈소스 기여',
      '알고리즘 및 자료구조 공부',
      '개발자 커뮤니티 참여 (GitHub, 스터디)'
    ]
  },
  DESIGN: {
    description: '사용자 경험을 세심하게 고려하고, 직관적이고 아름다운 인터페이스를 만드는 데 관심이 많습니다. UX/UI 디자이너로서 성장할 수 있어요!',
    strengths: [
      '사용자 중심적 사고방식',
      '미적 감각과 디테일에 대한 집중',
      '사용성과 경험 개선 의지',
      '창의적 문제 해결'
    ],
    recommendations: [
      'Figma, Adobe XD 등 디자인 툴 학습',
      'UI/UX 포트폴리오 프로젝트 진행',
      '사용자 리서치와 테스트 경험',
      '디자인 시스템과 접근성 공부'
    ]
  },
  PEOPLE: {
    description: '사람들과의 관계를 중요하게 여기고, 팀의 화합과 성장을 이끄는 데 강점이 있습니다. HR이나 조직문화 담당자로서의 적성이 보여요!',
    strengths: [
      '뛰어난 공감 능력과 소통 스킬',
      '갈등 조정 및 팀워크 구축',
      '사람에 대한 이해와 관심',
      '조직 문화와 분위기 개선 의지'
    ],
    recommendations: [
      'HR 인턴십이나 관련 프로젝트',
      '조직문화와 리더십 관련 서적 탐독',
      '멘토링이나 교육 봉사 활동',
      '채용, 교육, 평가 제도 사례 연구'
    ]
  },
  HR: {
    description: '사람들과의 관계를 중요하게 여기고, 팀의 화합과 성장을 이끄는 데 강점이 있습니다. HR이나 조직문화 담당자로서의 적성이 보여요!',
    strengths: [
      '뛰어난 공감 능력과 소통 스킬',
      '갈등 조정 및 팀워크 구축',
      '사람에 대한 이해와 관심',
      '조직 문화와 분위기 개선 의지'
    ],
    recommendations: [
      'HR 인턴십이나 관련 프로젝트',
      '조직문화와 리더십 관련 서적 탐독',
      '멘토링이나 교육 봉사 활동',
      '채용, 교육, 평가 제도 사례 연구'
    ]
  },
  FIN: {
    description: '숫자와 논리로 문제를 분석하고, 재무적 관점에서 최적의 해결책을 찾는 데 강점이 있습니다. 재무분석가나 회계사로서 큰 잠재력이 있어요!',
    strengths: [
      '꼼꼼한 숫자 검증 능력',
      '논리적이고 분석적인 사고',
      '원칙과 규정 준수',
      '재무적 의사결정 지원'
    ],
    recommendations: [
      '회계/재무 인턴십 경험',
      'Excel, 회계 프로그램 학습',
      '재무제표 분석 프로젝트',
      '세무사, 회계사 자격증 준비'
    ]
  }
};

export default function JobResultModal({ topJob, topJobName, scores, onClose }: JobResultProps) {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [recommendedActivities, setRecommendedActivities] = useState<RecommendedActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const jobInfo = jobDescriptions[topJob] || jobDescriptions['PM'];
  
  // 직무 코드를 한글 직무명으로 매핑
  const jobToTargetJob: {[key: string]: string} = {
    MKT: '마케팅',
    PM: '전략기획',
    DATA: '데이터분석',
    DEV: '개발',
    DESIGN: '디자인',
    PEOPLE: '인사',
    HR: '인사',
    FIN: '재무',
    TECH: '개발'
  };

  // Recharts용 데이터 변환
  const radarData = [
    { subject: '마케팅', value: scores.MKT, fullMark: 20 },
    { subject: 'PM', value: scores.PM, fullMark: 20 },
    { subject: '데이터', value: scores.DATA, fullMark: 20 },
    { subject: '개발', value: scores.DEV, fullMark: 20 },
    { subject: '디자인', value: scores.DESIGN, fullMark: 20 },
    { subject: '피플', value: scores.PEOPLE, fullMark: 20 }
  ];

  useEffect(() => {
    // Gemini API로 AI 분석 생성
    generateAIAnalysis();
    // 맞춤 대외활동 추천
    fetchRecommendedActivities();
  }, []);

  const generateAIAnalysis = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/gemini/career-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topJob,
          topJobName,
          scores
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.analysis || '당신의 강점을 살려 꾸준히 성장해나가세요! 💪');
      } else {
        setAiAnalysis('분석 결과를 기반으로 당신에게 가장 잘 맞는 직무를 찾았어요. 추천하는 경험들을 통해 더 성장할 수 있을 거예요!');
      }
    } catch (error) {
      setAiAnalysis('시뮬레이션을 통해 당신의 강점과 성향을 파악했습니다. 이제 실전 경험을 쌓아보세요!');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const fetchRecommendedActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const targetJob = jobToTargetJob[topJob] || '전략기획';
      const accessToken = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');
      
      const params = new URLSearchParams({
        limit: '6',
        sort: 'match_score'
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(
        `http://localhost:8000/api/recommendations/activities?${params}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.activities) {
          setRecommendedActivities(data.data.activities.slice(0, 3)); // 상위 3개만
        }
      }
    } catch (error) {
      console.error('추천 활동 조회 실패:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleBookmark = async (activityId: string) => {
    const activity = recommendedActivities.find(r => r.activity.id === activityId);
    if (!activity) return;

    const method = activity.activity.is_bookmarked ? 'DELETE' : 'POST';
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/activities/${activityId}/bookmark`,
        { method, headers }
      );

      if (response.ok) {
        setRecommendedActivities(prev =>
          prev.map(r =>
            r.activity.id === activityId
              ? {
                  ...r,
                  activity: {
                    ...r.activity,
                    is_bookmarked: !r.activity.is_bookmarked,
                    bookmark_count: r.activity.bookmark_count + (method === 'POST' ? 1 : -1)
                  }
                }
              : r
          )
        );
        toast.success(method === 'POST' ? '북마크에 추가되었습니다' : '북마크에서 제거되었습니다');
      }
    } catch (error) {
      console.error('북마크 처리 실패:', error);
      toast.error('북마크 처리에 실패했습니다');
    }
  };

  const calculateDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return null;
    const days = Math.floor(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-[#DDF3EB] via-[#E8F1FF] to-[#F0E7FF] border-b border-[#EAEBEC] p-8 rounded-t-3xl flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1B1C1E]">시뮬레이션 결과</h2>
              <p className="text-sm text-[#6B6D70] mt-1">당신의 성향과 직무 적합도 분석</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/70 rounded-xl transition-all">
            <X className="w-6 h-6 text-[#6B6D70]" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* 결과 요약 */}
          <div className="bg-gradient-to-br from-[#DDF3EB] to-[#E8F1FF] rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-full mb-4 shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-[#1B1C1E] mb-2">
              {topJobName}
            </h3>
            <p className="text-lg text-[#6B6D70] max-w-2xl mx-auto leading-relaxed">
              {jobInfo.description}
            </p>
          </div>

          {/* 레이더 차트 */}
          <div className="bg-white border-2 border-[#EAEBEC] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-[#25A778]" />
              <h4 className="text-xl font-bold text-[#1B1C1E]">직무별 적합도</h4>
            </div>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#EAEBEC" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#6B6D70', fontSize: 14, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 20]} tick={{ fill: '#CACBCC' }} />
                  <Radar
                    name="점수"
                    dataKey="value"
                    stroke="#25A778"
                    fill="#25A778"
                    fillOpacity={0.5}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(scores).map(([key, value]) => {
                const names: {[k: string]: string} = {
                  MKT: '마케팅', PM: 'PM', DATA: '데이터', 
                  DEV: '개발', DESIGN: '디자인', PEOPLE: '피플'
                };
                return (
                  <div key={key} className="bg-[#F8F9FA] rounded-xl p-4">
                    <div className="text-sm text-[#6B6D70] mb-1">{names[key]}</div>
                    <div className="text-2xl font-bold text-[#25A778]">{value}점</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 강점 분석 */}
          <div className="bg-white border-2 border-[#EAEBEC] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#25A778]" />
              <h4 className="text-xl font-bold text-[#1B1C1E]">당신의 강점</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {jobInfo.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-[#DDF3EB] rounded-xl">
                  <div className="w-8 h-8 bg-[#25A778] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-[#1B1C1E] leading-relaxed">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 추천 활동 */}
          <div className="bg-white border-2 border-[#EAEBEC] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-6 h-6 text-[#25A778]" />
              <h4 className="text-xl font-bold text-[#1B1C1E]">이런 경험을 추천해요</h4>
            </div>
            <div className="space-y-3">
              {jobInfo.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-xl hover:bg-[#DDF3EB] transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[#1B1C1E] font-medium">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤 활동 추천 (백엔드 연동) */}
          <div className="bg-gradient-to-br from-[#E8F7F2] to-[#DDF3EB] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#1B1C1E]">{topJobName}에 딱 맞는 활동</h4>
                <p className="text-sm text-[#5E6772] mt-1">당신의 직무와 매칭도가 높은 실전 경험</p>
              </div>
            </div>

            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#25A778] border-t-transparent"></div>
              </div>
            ) : recommendedActivities.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {recommendedActivities.map((rec) => {
                  const daysLeft = calculateDaysLeft(rec.activity.end_date);
                  return (
                    <div
                      key={rec.activity.id}
                      className="bg-white border-2 border-[#EAEBEC] rounded-2xl p-8 hover:border-[#25A778] hover:shadow-2xl transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#25A778] to-[#2DC98E] text-white text-sm font-bold rounded-full shadow-md">
                              🎯 매칭도 {Math.round(rec.match_score * 100)}%
                            </span>
                            <span className="inline-flex items-center px-3 py-1.5 bg-[#DDF3EB] text-[#186D50] text-xs font-bold rounded-lg">
                              {rec.activity.category}
                            </span>
                            {daysLeft !== null && daysLeft <= 7 && (
                              <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-lg animate-pulse">
                                ⏰ 마감 D-{daysLeft}
                              </span>
                            )}
                          </div>
                          <h5 className="text-2xl font-bold text-[#1B1C1E] mb-2 group-hover:text-[#25A778] transition-colors">
                            {rec.activity.title}
                          </h5>
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-[#5E6772]" />
                            <p className="text-base text-[#5E6772] font-medium">{rec.activity.organization}</p>
                          </div>
                          
                          {/* 설명 */}
                          {rec.activity.description && (
                            <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
                              <p className="text-base text-[#1B1C1E] leading-relaxed">
                                {rec.activity.description}
                              </p>
                            </div>
                          )}

                          {/* 추천 이유 - 강조 */}
                          {rec.match_reasons && rec.match_reasons.length > 0 && (
                            <div className="bg-gradient-to-r from-[#DDF3EB] to-[#E8F7F2] rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-[#25A778]" />
                                <p className="text-sm font-bold text-[#186D50]">왜 이 활동을 추천하나요?</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {rec.match_reasons.map((reason, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center text-sm bg-white text-[#1B1C1E] px-4 py-2 rounded-lg font-medium shadow-sm"
                                  >
                                    ✓ {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 직무 태그와 키워드 */}
                          <div className="space-y-3 mb-4">
                            {rec.activity.target_jobs && rec.activity.target_jobs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[#5E6772] mb-2">추천 직무</p>
                                <div className="flex flex-wrap gap-2">
                                  {rec.activity.target_jobs.map((job, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1.5 bg-[#E8F1FF] text-[#418CC3] text-sm font-semibold rounded-lg"
                                    >
                                      💼 {job}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rec.activity.tags && rec.activity.tags.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[#5E6772] mb-2">관련 키워드</p>
                                <div className="flex flex-wrap gap-2">
                                  {rec.activity.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-sm bg-[#F8F9FA] text-[#5E6772] px-3 py-1.5 rounded-lg font-medium"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 혜택 */}
                          {rec.activity.benefits && Array.isArray(rec.activity.benefits) && rec.activity.benefits.length > 0 && (
                            <div className="bg-[#FFF8E7] border-2 border-[#FFE58F] rounded-xl p-4 mb-4">
                              <p className="text-sm font-bold text-[#D48806] mb-2">🎁 이런 혜택이 있어요</p>
                              <ul className="space-y-1">
                                {rec.activity.benefits.map((benefit: string, idx: number) => (
                                  <li key={idx} className="text-sm text-[#1B1C1E] flex items-start gap-2">
                                    <span className="text-[#D48806] mt-0.5">•</span>
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 하단 정보 */}
                          <div className="flex items-center justify-between pt-4 border-t-2 border-[#EAEBEC]">
                            <div className="flex items-center gap-4 text-sm text-[#5E6772]">
                              {rec.activity.end_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span className="font-medium">{new Date(rec.activity.end_date).toLocaleDateString('ko-KR')}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">{rec.activity.view_count || 0}명 조회</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmark(rec.activity.id);
                              }}
                              className="p-3 hover:bg-[#F8F9FA] rounded-xl transition-colors group"
                            >
                              <Bookmark
                                className={`w-6 h-6 ${
                                  rec.activity.is_bookmarked
                                    ? 'fill-[#25A778] text-[#25A778]'
                                    : 'text-[#C8CBD0] group-hover:text-[#25A778]'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-3 pt-6 border-t-2 border-[#EAEBEC]">
                        <a
                          href={rec.activity.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-[#25A778] to-[#2DC98E] text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all text-base"
                        >
                          <ExternalLink className="w-5 h-5" />
                          상세 정보 보러가기
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#5E6772] mb-2">추천할 활동을 찾지 못했습니다</p>
                <p className="text-sm text-[#9AA1AC]">나중에 다시 확인해주세요</p>
              </div>
            )}
          </div>

          {/* AI 코치 분석 */}
          <div className="bg-gradient-to-br from-[#F0E7FF] to-[#E8F1FF] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#1B1C1E]">AI COACH의 한마디</h4>
            </div>
            {isLoadingAI ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <p className="text-[#1B1C1E] leading-relaxed whitespace-pre-wrap">
                {aiAnalysis}
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-[#25A778] to-[#2DC98E] text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
