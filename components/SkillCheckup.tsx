'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Target, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface SkillCheckupProps {
  department: 'Business' | 'Economics' | 'Statistics';
  onComplete: (result: SkillCheckResult) => void;
}

interface SkillCheckResult {
  department: string;
  scores: {
    [key: string]: number;
  };
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
}

// 학과별 역량 질문
const QUESTIONS = {
  Business: [
    { id: 1, skill: 'strategic_thinking', question: '시장 분석 및 경쟁 전략을 수립할 수 있나요?', weight: 1.2 },
    { id: 2, skill: 'marketing', question: '마케팅 캠페인을 기획하고 실행한 경험이 있나요?', weight: 1.3 },
    { id: 3, skill: 'data_analysis', question: 'Excel이나 데이터 분석 도구를 활용할 수 있나요?', weight: 1.0 },
    { id: 4, skill: 'finance', question: '재무제표를 읽고 기업 가치를 평가할 수 있나요?', weight: 1.1 },
    { id: 5, skill: 'leadership', question: '팀을 이끌거나 프로젝트를 관리한 경험이 있나요?', weight: 1.2 },
    { id: 6, skill: 'communication', question: '프레젠테이션이나 보고서 작성에 자신이 있나요?', weight: 1.0 },
    { id: 7, skill: 'business_model', question: '비즈니스 모델 캔버스를 작성할 수 있나요?', weight: 1.1 },
    { id: 8, skill: 'strategic_thinking', question: 'SWOT 분석 등 전략적 분석 프레임워크를 활용할 수 있나요?', weight: 1.2 },
    { id: 9, skill: 'marketing', question: 'SNS 마케팅이나 디지털 광고를 집행한 경험이 있나요?', weight: 1.3 },
    { id: 10, skill: 'data_analysis', question: '데이터를 시각화하고 인사이트를 도출할 수 있나요?', weight: 1.0 },
    { id: 11, skill: 'finance', question: '투자 분석이나 재무 모델링을 해본 적이 있나요?', weight: 1.1 },
    { id: 12, skill: 'leadership', question: '조직 내 갈등을 조정하거나 해결한 경험이 있나요?', weight: 1.2 },
    { id: 13, skill: 'communication', question: '이해관계자를 설득하거나 협상한 경험이 있나요?', weight: 1.0 },
    { id: 14, skill: 'business_model', question: '린 스타트업이나 애자일 방법론을 적용해본 적이 있나요?', weight: 1.1 },
    { id: 15, skill: 'strategic_thinking', question: '시장 트렌드를 분석하고 기회를 포착할 수 있나요?', weight: 1.2 }
  ],
  Economics: [
    { id: 1, skill: 'macro_economics', question: '거시경제 지표(GDP, 실업률 등)를 해석할 수 있나요?', weight: 1.3 },
    { id: 2, skill: 'micro_economics', question: '수요-공급 곡선과 시장 균형을 이해하고 있나요?', weight: 1.2 },
    { id: 3, skill: 'econometrics', question: '회귀분석 등 계량경제학 기법을 활용할 수 있나요?', weight: 1.4 },
    { id: 4, skill: 'data_analysis', question: 'R, Python, Stata 등의 통계 프로그램을 사용할 수 있나요?', weight: 1.3 },
    { id: 5, skill: 'policy_analysis', question: '정책의 경제적 효과를 분석할 수 있나요?', weight: 1.2 },
    { id: 6, skill: 'financial_economics', question: '금융시장과 자산 가격 결정 이론을 이해하고 있나요?', weight: 1.1 },
    { id: 7, skill: 'game_theory', question: '게임이론을 활용한 전략적 분석을 할 수 있나요?', weight: 1.0 },
    { id: 8, skill: 'macro_economics', question: '통화정책과 재정정책의 효과를 설명할 수 있나요?', weight: 1.3 },
    { id: 9, skill: 'micro_economics', question: '시장 실패와 정부 개입의 필요성을 논할 수 있나요?', weight: 1.2 },
    { id: 10, skill: 'econometrics', question: '시계열 분석이나 패널 데이터 분석을 수행할 수 있나요?', weight: 1.4 },
    { id: 11, skill: 'data_analysis', question: '경제 데이터를 수집하고 시각화할 수 있나요?', weight: 1.3 },
    { id: 12, skill: 'policy_analysis', question: '비용-편익 분석을 통해 정책을 평가할 수 있나요?', weight: 1.2 },
    { id: 13, skill: 'financial_economics', question: '포트폴리오 이론과 자산 배분을 이해하고 있나요?', weight: 1.1 },
    { id: 14, skill: 'game_theory', question: '내쉬 균형 등 게임이론의 핵심 개념을 설명할 수 있나요?', weight: 1.0 },
    { id: 15, skill: 'policy_analysis', question: '경제 정책의 파급효과를 예측할 수 있나요?', weight: 1.2 }
  ],
  Statistics: [
    { id: 1, skill: 'probability', question: '확률 분포와 통계적 추론을 이해하고 있나요?', weight: 1.3 },
    { id: 2, skill: 'regression', question: '선형회귀와 로지스틱 회귀를 구현할 수 있나요?', weight: 1.4 },
    { id: 3, skill: 'machine_learning', question: '머신러닝 알고리즘(의사결정나무, SVM 등)을 활용할 수 있나요?', weight: 1.5 },
    { id: 4, skill: 'programming', question: 'Python이나 R로 데이터 분석 코드를 작성할 수 있나요?', weight: 1.4 },
    { id: 5, skill: 'data_visualization', question: 'Tableau, PowerBI 등으로 데이터를 시각화할 수 있나요?', weight: 1.2 },
    { id: 6, skill: 'sql', question: 'SQL로 데이터베이스를 조회하고 조작할 수 있나요?', weight: 1.3 },
    { id: 7, skill: 'statistical_testing', question: '가설검정과 신뢰구간을 계산할 수 있나요?', weight: 1.2 },
    { id: 8, skill: 'probability', question: '베이즈 정리와 조건부 확률을 적용할 수 있나요?', weight: 1.3 },
    { id: 9, skill: 'regression', question: '다중공선성, 이분산성 등 회귀 진단을 수행할 수 있나요?', weight: 1.4 },
    { id: 10, skill: 'machine_learning', question: '교차검증과 하이퍼파라미터 튜닝을 할 수 있나요?', weight: 1.5 },
    { id: 11, skill: 'programming', question: 'pandas, numpy 등 데이터 처리 라이브러리를 사용할 수 있나요?', weight: 1.4 },
    { id: 12, skill: 'data_visualization', question: 'matplotlib, seaborn으로 그래프를 그릴 수 있나요?', weight: 1.2 },
    { id: 13, skill: 'sql', question: 'JOIN, GROUP BY 등 복잡한 SQL 쿼리를 작성할 수 있나요?', weight: 1.3 },
    { id: 14, skill: 'statistical_testing', question: 'ANOVA, 카이제곱 검정 등을 수행할 수 있나요?', weight: 1.2 },
    { id: 15, skill: 'machine_learning', question: '딥러닝 기초(신경망, CNN, RNN)를 이해하고 있나요?', weight: 1.5 }
  ]
};

// 학과별 역량 이름
const SKILL_NAMES = {
  Business: {
    strategic_thinking: '전략적 사고',
    marketing: '마케팅',
    data_analysis: '데이터 분석',
    finance: '재무/회계',
    leadership: '리더십',
    communication: '커뮤니케이션',
    business_model: '비즈니스 모델'
  },
  Economics: {
    macro_economics: '거시경제학',
    micro_economics: '미시경제학',
    econometrics: '계량경제학',
    data_analysis: '데이터 분석',
    policy_analysis: '정책 분석',
    financial_economics: '금융경제학',
    game_theory: '게임이론'
  },
  Statistics: {
    probability: '확률/통계',
    regression: '회귀분석',
    machine_learning: '머신러닝',
    programming: '프로그래밍',
    data_visualization: '데이터 시각화',
    sql: 'SQL/데이터베이스',
    statistical_testing: '통계적 검정'
  }
};

export default function SkillCheckup({ department, onComplete }: SkillCheckupProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<SkillCheckResult | null>(null);

  const questions = QUESTIONS[department];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (score: number) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: score });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      // 결과 계산
      setTimeout(() => calculateResult(), 300);
    }
  };

  const calculateResult = () => {
    const skillScores: { [key: string]: { total: number; count: number; weight: number } } = {};
    
    // 각 역량별 점수 계산
    questions.forEach(q => {
      const answer = answers[q.id] || 0;
      if (!skillScores[q.skill]) {
        skillScores[q.skill] = { total: 0, count: 0, weight: 0 };
      }
      skillScores[q.skill].total += answer * q.weight;
      skillScores[q.skill].count += 1;
      skillScores[q.skill].weight += q.weight;
    });

    // 평균 점수 계산 (0-100 스케일)
    const scores: { [key: string]: number } = {};
    Object.keys(skillScores).forEach(skill => {
      scores[skill] = Math.round((skillScores[skill].total / skillScores[skill].weight) * 20);
    });

    // 약점과 강점 파악
    const sortedSkills = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const weaknesses = sortedSkills.slice(0, 2).map(([skill]) => SKILL_NAMES[department][skill as keyof typeof SKILL_NAMES[typeof department]]);
    const strengths = sortedSkills.slice(-2).map(([skill]) => SKILL_NAMES[department][skill as keyof typeof SKILL_NAMES[typeof department]]);

    // 추천사항 생성
    const recommendations = generateRecommendations(department, weaknesses);

    const finalResult: SkillCheckResult = {
      department,
      scores,
      weaknesses,
      strengths,
      recommendations
    };

    setResult(finalResult);
    setShowResult(true);
  };

  const generateRecommendations = (dept: string, weaknesses: string[]): string[] => {
    const recommendations: { [key: string]: { [key: string]: string[] } } = {
      Business: {
        '전략적 사고': ['경영전략 온라인 강의 수강', 'MBA 케이스 스터디 분석', '컨설팅 공모전 참여'],
        '마케팅': ['디지털 마케팅 실습 프로젝트', 'Google Analytics 인증 취득', 'SNS 마케팅 캠페인 기획'],
        '데이터 분석': ['Excel 고급 기능 학습', 'SQL 기초 강의 수강', '데이터 분석 공모전 참여'],
        '재무/회계': ['재무제표 읽기 강의', 'CFA Level 1 준비', '기업 가치평가 프로젝트'],
        '리더십': ['팀 프로젝트 리더 경험', '리더십 워크샵 참여', '멘토링 활동'],
        '커뮤니케이션': ['프레젠테이션 스킬 향상', '글쓰기 강의 수강', 'TED 강연 분석'],
        '비즈니스 모델': ['스타트업 인턴십', '비즈니스 모델 캔버스 실습', '창업 동아리 활동']
      },
      Economics: {
        '거시경제학': ['거시경제학 심화 강의', '경제 지표 분석 연습', '중앙은행 리포트 읽기'],
        '미시경제학': ['미시경제학 문제풀이', '시장 분석 프로젝트', '산업조직론 학습'],
        '계량경제학': ['계량경제학 실습', 'R/Stata 프로그래밍', '경제 데이터 분석 프로젝트'],
        '데이터 분석': ['Python 데이터 분석', '경제 데이터 시각화', 'Kaggle 대회 참여'],
        '정책 분석': ['정책 분석 사례 연구', '비용편익분석 학습', '정부 기관 인턴십'],
        '금융경제학': ['금융시장 이론 학습', 'CFA 준비', '투자 분석 프로젝트'],
        '게임이론': ['게임이론 문제풀이', '전략적 의사결정 사례 분석', '협상론 학습']
      },
      Statistics: {
        '확률/통계': ['수리통계학 복습', '확률론 심화 학습', '통계적 추론 연습'],
        '회귀분석': ['회귀분석 실습', 'GLM 학습', '회귀 진단 연습'],
        '머신러닝': ['머신러닝 온라인 강의', 'scikit-learn 실습', 'Kaggle 프로젝트'],
        '프로그래밍': ['Python 코딩 테스트', '알고리즘 학습', '오픈소스 기여'],
        '데이터 시각화': ['Tableau 자격증', 'D3.js 학습', '인포그래픽 제작'],
        'SQL/데이터베이스': ['SQL 문제풀이', '데이터베이스 설계', 'NoSQL 학습'],
        '통계적 검정': ['통계검정 실습', '실험 설계 학습', 'A/B 테스트 프로젝트']
      }
    };

    const result: string[] = [];
    weaknesses.forEach(weakness => {
      const recs = recommendations[dept][weakness];
      if (recs) result.push(...recs);
    });

    return result.slice(0, 5);
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (showResult && result) {
    // 레이더 차트 데이터
    const radarData = Object.entries(result.scores).map(([skill, score]) => ({
      skill: SKILL_NAMES[department][skill as keyof typeof SKILL_NAMES[typeof department]],
      value: score,
      fullMark: 100
    }));

    // 바 차트 데이터
    const barData = Object.entries(result.scores)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, score]) => ({
        skill: SKILL_NAMES[department][skill as keyof typeof SKILL_NAMES[typeof department]],
        score: score
      }));

    return (
      <div className="fixed inset-0 z-50 bg-[#F5F6FA] overflow-y-auto">
        <div className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">역량 체크업 결과</h1>
                <p className="text-gray-500 mt-1">
                  {department === 'Business' ? '경영학과' : department === 'Economics' ? '경제학과' : '통계학과'} 맞춤 분석 리포트
                </p>
              </div>
              <button
                onClick={() => onComplete(result)}
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 종합 점수 카드 */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm font-semibold mb-3">
                      종합 분석 완료
                    </div>
                    <h3 className="text-4xl font-bold mb-2">
                      평균 {Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length)}점
                    </h3>
                    <p className="text-white/90 text-base">
                      15개 문항 분석을 통해 7개 핵심 역량을 평가했습니다
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white/90 mb-2">
                    {Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length)}
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                    Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length) >= 80 
                      ? 'bg-green-500' 
                      : Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length) >= 60 
                      ? 'bg-yellow-500' 
                      : 'bg-orange-500'
                  }`}>
                    {Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length) >= 80 ? '우수함' :
                     Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length) >= 60 ? '양호함' : '발전 가능'}
                  </div>
                </div>
              </div>
            </div>

            {/* 강점과 약점 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">강점 역량</h3>
                </div>
                <div className="space-y-3">
                  {result.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">개선 필요 역량</h3>
                </div>
                <div className="space-y-3">
                  {result.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 레이더 차트 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">역량 분포</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Radar
                      name="점수"
                      dataKey="value"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 바 차트 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">역량별 점수</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#10B981' : entry.score >= 50 ? '#F59E0B' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 추천 학습 경로 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">추천 학습 경로</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-xl hover:border-indigo-300 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{rec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowResult(false);
                  setCurrentQuestion(0);
                  setAnswers({});
                }}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                다시 검사하기
              </button>
              <button
                onClick={() => onComplete(result)}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">역량 체크업</h2>
                <p className="text-indigo-100 text-sm">
                  {department === 'Business' ? '경영학과' : department === 'Economics' ? '경제학과' : '통계학과'} 맞춤 설문
                </p>
              </div>
            </div>
            <button
              onClick={() => onComplete({ department, scores: {}, weaknesses: [], strengths: [], recommendations: [] })}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 프로그레스 */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">진행률</span>
              <span className="font-bold">{currentQuestion + 1} / {questions.length}</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 질문 영역 */}
        <div className="p-8">
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
              질문 {currentQuestion + 1}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {questions[currentQuestion].question}
            </h3>
            <p className="text-gray-500">
              5점 척도로 응답해주세요 (1점: 전혀 아니다 ~ 5점: 매우 그렇다)
            </p>
          </div>

          {/* 답변 선택 */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleAnswer(score)}
                className={`py-8 px-4 rounded-xl border-2 transition-all ${
                  answers[questions[currentQuestion].id] === score
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className={`text-3xl font-bold mb-2 ${
                  answers[questions[currentQuestion].id] === score ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {score}
                </div>
                <div className="text-sm text-gray-600 font-medium whitespace-pre-line">
                  {score === 1 ? '전혀\n아니다' : score === 2 ? '아니다' : score === 3 ? '보통' : score === 4 ? '그렇다' : '매우\n그렇다'}
                </div>
              </button>
            ))}
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between">
            <button
              onClick={goBack}
              disabled={currentQuestion === 0}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              이전
            </button>
            <div className="text-sm text-gray-500 flex items-center">
              <span className="font-semibold text-indigo-600">{Math.round(progress)}%</span>
              <span className="ml-1">완료</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
