'use client';

import { useState } from 'react';
import { User, GraduationCap, Briefcase, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Target, TrendingUp, Award, ChevronRight, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import SkillCheckup from '@/components/SkillCheckup';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  graduationYear: string;
  desiredJob: string;
  location: string;
  introduction: string;
  
  // 스펙 정보
  gpa: string;
  maxGpa: string;
  toeicScore: string;
  opic: string;
  certifications: string[];
  awards: string[];
  activities: string[];
  languages: string[];
}

interface SkillScore {
  name: string;
  score: number;
  userScore: number;
  averageScore: number;
  category: '강점' | '보완점';
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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'competency'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showSkillCheck, setShowSkillCheck] = useState(false);
  const [hasCompletedSkillCheck, setHasCompletedSkillCheck] = useState(false);
  const [skillCheckResult, setSkillCheckResult] = useState<SkillCheckResult | null>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '홍길동',
    email: 'hong@example.com',
    phone: '010-1234-5678',
    university: '서울대학교',
    major: 'Business',
    graduationYear: '2025-02',
    desiredJob: '마케팅/그로스',
    location: '서울',
    introduction: '데이터 기반 마케팅 전략을 수립하고 실행하는 것을 좋아합니다.',
    
    gpa: '3.8',
    maxGpa: '4.5',
    toeicScore: '920',
    opic: 'IH',
    certifications: ['ADsP(데이터분석 준전문가)', 'Google Analytics 인증'],
    awards: ['2024 마케팅 공모전 대상', '학과 우수상'],
    activities: ['마케팅 동아리 회장', '대외활동 2회'],
    languages: ['영어(상)', '중국어(중)']
  });

  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  // 역량 데이터를 진단 결과에서 생성
  const getSkillScores = (): SkillScore[] => {
    if (!skillCheckResult) return [];

    // 학과별 역량 이름 매핑
    const SKILL_NAMES: { [key: string]: { [key: string]: string } } = {
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

    const scores = Object.entries(skillCheckResult.scores).map(([skillKey, score]) => {
      const normalizedScore = score / 20; // 0-5 범위로 변환
      const averageScore = 2.8 + Math.random() * 1.0;
      const isStrength = skillCheckResult.strengths.includes(skillKey);
      const koreanName = SKILL_NAMES[profile.major]?.[skillKey] || skillKey;
      
      return {
        name: koreanName,
        score: normalizedScore,
        userScore: normalizedScore,
        averageScore: parseFloat(averageScore.toFixed(1)),
        category: isStrength ? '강점' as const : '보완점' as const
      };
    });

    return scores;
  };

  const skillScores = getSkillScores();

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSkillCheckComplete = (result: SkillCheckResult) => {
    setHasCompletedSkillCheck(true);
    setSkillCheckResult(result);
    setShowSkillCheck(false);
    console.log('Skill check result:', result);
  };

  if (showSkillCheck) {
    return <SkillCheckup department={profile.major as 'Business' | 'Economics' | 'Statistics'} onComplete={handleSkillCheckComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">내 정보 분석</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSkillCheck(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                역량 재진단
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="bg-white px-8 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-bold transition-colors relative ${
                activeTab === 'profile'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              내 정보
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('competency')}
              className={`px-6 py-4 font-bold transition-colors relative ${
                activeTab === 'competency'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              내 역량
              {activeTab === 'competency' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-8">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* 종합 정보 */}
              <div className="bg-white rounded-lg p-8">
                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-gray-600 text-lg">취업 준비 현황</span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{profile.name}</span>
                    <span className="text-gray-500">/ {profile.major === 'Business' ? '경영학과' : profile.major === 'Economics' ? '경제학과' : '통계학과'}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                      </svg>
                      <span className="text-indigo-600 font-bold text-sm">역량 진단 완료</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  </div>
                </div>

                {/* 학업 및 스펙 정보 */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-700 font-bold text-lg">학업 및 어학 성적</span>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                      )}
                    </div>
                    
                    {/* 학점 */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-600 font-medium">학점</span>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedProfile.gpa}
                              onChange={(e) => setEditedProfile({ ...editedProfile, gpa: e.target.value })}
                              className="w-20 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center"
                            />
                            <span className="text-gray-400">/</span>
                            <input
                              type="text"
                              value={editedProfile.maxGpa}
                              onChange={(e) => setEditedProfile({ ...editedProfile, maxGpa: e.target.value })}
                              className="w-20 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-center"
                            />
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">{profile.gpa} / {profile.maxGpa}</span>
                        )}
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full"
                          style={{ width: `${(parseFloat(profile.gpa) / parseFloat(profile.maxGpa)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">{profile.university}</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {Math.round((parseFloat(profile.gpa) / parseFloat(profile.maxGpa)) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* 어학 점수 */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 font-medium">어학 성적</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">TOEIC</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedProfile.toeicScore}
                                onChange={(e) => setEditedProfile({ ...editedProfile, toeicScore: e.target.value })}
                                className="w-24 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center"
                              />
                            ) : (
                              <span className="text-xl font-bold text-gray-900">{profile.toeicScore}점</span>
                            )}
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                              style={{ width: `${(parseFloat(profile.toeicScore) / 990) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">상위 {100 - Math.round((parseFloat(profile.toeicScore) / 990) * 100)}%</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">OPIc</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedProfile.opic}
                                onChange={(e) => setEditedProfile({ ...editedProfile, opic: e.target.value })}
                                className="w-24 px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                              />
                            ) : (
                              <span className="text-xl font-bold text-gray-900">{profile.opic}</span>
                            )}
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">높은 수준</span>
                        </div>
                      </div>
                    </div>

                    {/* 수정 버튼 */}
                    {isEditing && (
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          onClick={handleCancel}
                          className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          저장
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 스펙 요약 */}
                  <div className="pt-6 border-t">
                    <h3 className="text-gray-700 font-bold text-lg mb-4">보유 스펙</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">{profile.certifications.length}</div>
                        <div className="text-sm text-gray-600 mt-1">자격증</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">{profile.awards.length}</div>
                        <div className="text-sm text-gray-600 mt-1">수상</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{profile.activities.length}</div>
                        <div className="text-sm text-gray-600 mt-1">활동</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{profile.languages.length}</div>
                        <div className="text-sm text-gray-600 mt-1">언어</div>
                      </div>
                    </div>
                  </div>

                  {/* 상세 스펙 */}
                  <div className="pt-6 border-t">
                    <h3 className="text-gray-700 font-bold text-lg mb-4">상세 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 자격증 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">자격증</h4>
                        </div>
                        <div className="space-y-2">
                          {profile.certifications.map((cert, index) => (
                            <div key={index} className="px-3 py-2 bg-purple-50 border border-purple-100 text-purple-700 rounded-lg text-sm">
                              {cert}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 수상 경력 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-semibold text-gray-900">수상 경력</h4>
                        </div>
                        <div className="space-y-2">
                          {profile.awards.map((award, index) => (
                            <div key={index} className="px-3 py-2 bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-lg text-sm">
                              {award}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 대외활동 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">대외활동</h4>
                        </div>
                        <div className="space-y-2">
                          {profile.activities.map((activity, index) => (
                            <div key={index} className="px-3 py-2 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm">
                              {activity}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 언어 능력 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">언어 능력</h4>
                        </div>
                        <div className="space-y-2">
                          {profile.languages.map((lang, index) => (
                            <div key={index} className="px-3 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm">
                              {lang}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 역량 진단 결과가 없을 때 */}
              {!hasCompletedSkillCheck ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">역량 진단을 먼저 완료해주세요</h2>
                  <p className="text-gray-600 mb-8">
                    {profile.major === 'Business' ? '경영학과' : profile.major === 'Economics' ? '경제학과' : '통계학과'} 맞춤 역량 진단으로<br />
                    나의 강점과 보완점을 파악할 수 있습니다
                  </p>
                  <button
                    onClick={() => setShowSkillCheck(true)}
                    className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    역량 진단 시작하기
                  </button>
                </div>
              ) : (
                /* 역량 진단 결과 대시보드 */
                <div className="bg-white rounded-lg p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {profile.major === 'Business' ? '경영' : profile.major === 'Economics' ? '경제' : '통계'} 분야에서 필요한 핵심 역량입니다.
                      </h2>
                      <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                        <span className="text-sm font-medium text-gray-700">나</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 border-l-2 border-dashed border-gray-400"></div>
                        <span className="text-sm text-gray-500">참여자 평균</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 border-l-2 border-gray-300"></div>
                        <span className="text-sm text-gray-400">업계 기대 수준</span>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <HelpCircle className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    주어진 요구사항에 따라 서비스를 설계하고 코드를 작성하는 구체적인 개발 활동을 의미해요.
                  </p>
                </div>

                {/* 강점 섹션 */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-blue-600">강점</h3>
                  </div>
                  <div className="space-y-4">
                    {skillScores
                      .filter(skill => skill.category === '강점')
                      .map((skill, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700 font-medium">{skill.name}</span>
                            <span className="text-blue-600 font-bold text-lg">{skill.score}</span>
                          </div>
                          <div className="relative h-3 bg-gray-100 rounded-full">
                            {/* 업계 기대 수준 (회색 점선) */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300" style={{ left: '80%' }}>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                            </div>
                            {/* 참여자 평균 (회색 실선) */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: `${(skill.averageScore / 5) * 100}%` }}>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                            {/* 내 점수 바 */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                              style={{ width: `${(skill.userScore / 5) * 100}%` }}
                            >
                              <div className="absolute -top-1 right-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                            {/* 녹색 평균 초과 표시 */}
                            {skill.userScore > skill.averageScore && (
                              <div 
                                className="absolute top-0 h-full bg-green-400 opacity-30 rounded-full"
                                style={{ 
                                  left: `${(skill.averageScore / 5) * 100}%`,
                                  width: `${((skill.userScore - skill.averageScore) / 5) * 100}%`
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 보완점 섹션 */}
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-red-600">보완점</h3>
                  </div>
                  <div className="space-y-4">
                    {skillScores
                      .filter(skill => skill.category === '보완점')
                      .map((skill, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700 font-medium">{skill.name}</span>
                            <span className={`font-bold text-lg ${skill.score < 3 ? 'text-red-600' : 'text-blue-600'}`}>
                              {skill.score}
                            </span>
                          </div>
                          <div className="relative h-3 bg-gray-100 rounded-full">
                            {/* 업계 기대 수준 */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300" style={{ left: '80%' }}>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                            </div>
                            {/* 참여자 평균 */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: `${(skill.averageScore / 5) * 100}%` }}>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                            {/* 내 점수 바 */}
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full ${
                                skill.score < 3 
                                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                                  : 'bg-gradient-to-r from-blue-600 to-blue-500'
                              }`}
                              style={{ width: `${(skill.userScore / 5) * 100}%` }}
                            >
                              <div className={`absolute -top-1 right-0 w-2 h-2 rounded-full ${
                                skill.score < 3 ? 'bg-red-500' : 'bg-blue-600'
                              }`}></div>
                            </div>
                            {/* 평균 미달 표시 (빨간색) */}
                            {skill.userScore < skill.averageScore && (
                              <div 
                                className="absolute top-0 h-full bg-red-400 opacity-30 rounded-full"
                                style={{ 
                                  left: `${(skill.userScore / 5) * 100}%`,
                                  width: `${((skill.averageScore - skill.userScore) / 5) * 100}%`
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                  {/* 하단 안내 */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">역량 개발 가이드</p>
                        <p className="text-sm text-blue-700">
                          보완점으로 표시된 역량은 맞춤 학습 자료와 프로젝트를 통해 향상시킬 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
