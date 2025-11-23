'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Calendar, 
  Award,
  Users,
  TrendingUp,
  Filter,
  Search,
  Clock,
  Sparkles,
  Target,
  CheckCircle
} from 'lucide-react';

const JobSimulation = dynamic(() => import('@/components/JobSimulation'), { ssr: false });
const JobResult = dynamic(() => import('@/components/JobResult'), { ssr: false });

const categories = [
  { value: 'all', label: '전체' },
  { value: 'contest', label: '공모전' },
  { value: 'hackathon', label: '해커톤' },
  { value: 'external_activity', label: '대외활동' },
  { value: 'project', label: '프로젝트' },
  { value: 'club', label: '동아리' },
  { value: 'internship', label: '인턴십' },
  { value: 'volunteer', label: '봉사활동' },
];

const fields = [
  { value: 'all', label: '전체 분야', color: '#6B6D70' },
  { value: '마케팅', label: '마케팅', color: '#25A778' },
  { value: '전략기획', label: '전략기획', color: '#9C6BB3' },
  { value: '데이터분석', label: '데이터분석', color: '#418CC3' },
  { value: '개발', label: '개발', color: '#1971c2' },
  { value: '디자인', label: '디자인', color: '#D77B0F' },
  { value: '영업', label: '영업', color: '#DC2626' },
  { value: '인사', label: '인사', color: '#E67700' },
  { value: '재무', label: '재무', color: '#2F9E44' },
];

const sortOptions = [
  { value: 'match_score', label: '매칭도순', Icon: Target },
  { value: 'recommended', label: '추천순', Icon: Sparkles },
  { value: 'deadline', label: '마감임박순', Icon: Clock },
  { value: 'popular', label: '인기순', Icon: TrendingUp },
];

interface Activity {
  id: string;
  title: string;
  organization: string;
  category: string;
  target_jobs: string[];
  tags: string[];
  description: string;
  benefits: string[];
  eligibility: string;
  start_date?: string;
  end_date?: string;
  application_deadline?: string;
  url?: string;
  image_url?: string;
  location?: string;
  contact_info?: string;
  prize_money?: string;
  view_count: number;
  bookmark_count: number;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

interface RecommendedActivity {
  activity: Activity;
  match_score: number;
  match_reasons: string[];
}

// 목 데이터 생성 함수 (백엔드 API 에러시에만 사용)
function generateMockActivities(): RecommendedActivity[] {
  // 빈 배열 반환 - 백엔드 API를 사용하도록 강제
  return [];
  
  /* 기존 목 데이터
  const mockActivities: RecommendedActivity[] = [
    {
      activity: {
        id: '1',
        title: '2024 대학생 마케팅 공모전',
        organization: '한국마케팅협회',
        category: 'contest',
        target_jobs: ['마케팅', '전략기획'],
        tags: ['브랜딩', 'SNS마케팅', '캠페인'],
        description: 'SNS를 활용한 창의적인 마케팅 캠페인을 기획하고 실행하는 공모전입니다.',
        benefits: ['상금 500만원', '수료증 발급', '인턴 기회'],
        eligibility: '전국 대학생',
        start_date: '2024-10-01',
        end_date: '2024-12-31',
        url: 'https://example.com',
        image_url: '',
        location: '온라인',
        contact_info: 'marketing@example.com',
        prize_money: '5,000,000원',
        view_count: 1250,
        bookmark_count: 89,
        is_bookmarked: false,
        created_at: '2024-10-01',
        updated_at: '2024-10-01'
      },
      match_score: 0.92,
      match_reasons: ['전공 일치', '관심사 부합', '경험 수준 적합']
    },
    {
      activity: {
        id: '2',
        title: 'AI 해커톤 2024',
        organization: '테크 스타트업 연합',
        category: 'hackathon',
        target_jobs: ['개발', '데이터분석'],
        tags: ['AI', '머신러닝', '팀프로젝트'],
        description: '48시간 동안 AI 기술을 활용한 서비스를 개발하는 해커톤입니다.',
        benefits: ['상금 1000만원', '네트워킹', '취업 연계'],
        eligibility: '개발자, 기획자, 디자이너',
        start_date: '2024-11-15',
        end_date: '2024-11-30',
        url: 'https://example.com',
        image_url: '',
        location: '서울 강남구',
        contact_info: 'hackathon@example.com',
        prize_money: '10,000,000원',
        view_count: 2340,
        bookmark_count: 156,
        is_bookmarked: false,
        created_at: '2024-10-15',
        updated_at: '2024-10-15'
      },
      match_score: 0.88,
      match_reasons: ['기술 스택 일치', '팀 프로젝트 경험 보유']
    },
    {
      activity: {
        id: '3',
        title: '데이터 분석 스터디',
        organization: '대학생 연합 동아리',
        category: 'club',
        target_jobs: ['데이터분석', '전략기획'],
        tags: ['Python', '데이터시각화', '통계'],
        description: '매주 데이터 분석 프로젝트를 진행하며 실무 역량을 키우는 스터디입니다.',
        benefits: ['프로젝트 경험', '포트폴리오 구축', '네트워킹'],
        eligibility: '데이터 분석에 관심있는 대학생',
        start_date: '2024-11-01',
        end_date: '2025-02-28',
        url: 'https://example.com',
        image_url: '',
        location: '온라인',
        contact_info: 'study@example.com',
        prize_money: '',
        view_count: 890,
        bookmark_count: 67,
        is_bookmarked: false,
        created_at: '2024-10-20',
        updated_at: '2024-10-20'
      },
      match_score: 0.85,
      match_reasons: ['학습 방향 일치', '시간 투자 가능']
    },
    {
      activity: {
        id: '4',
        title: 'UX/UI 디자인 챌린지',
        organization: '디자인 협회',
        category: 'contest',
        target_jobs: ['디자인', '전략기획'],
        tags: ['UX', 'UI', '프로토타입'],
        description: '사용자 중심의 혁신적인 서비스 디자인을 제안하는 공모전입니다.',
        benefits: ['상금 300만원', '포트폴리오 리뷰', '멘토링'],
        eligibility: '디자인 전공 대학생',
        start_date: '2024-11-01',
        end_date: '2024-12-15',
        url: 'https://example.com',
        image_url: '',
        location: '온라인',
        contact_info: 'design@example.com',
        prize_money: '3,000,000원',
        view_count: 1560,
        bookmark_count: 112,
        is_bookmarked: false,
        created_at: '2024-10-25',
        updated_at: '2024-10-25'
      },
      match_score: 0.78,
      match_reasons: ['창의성 요구', '포트폴리오 구축 기회']
    },
    {
      activity: {
        id: '5',
        title: '소셜벤처 창업 경진대회',
        organization: '사회혁신재단',
        category: 'project',
        target_jobs: ['전략기획', '영업'],
        tags: ['창업', '소셜임팩트', '비즈니스모델'],
        description: '사회 문제를 해결하는 비즈니스 아이디어를 발굴하고 실행하는 프로그램입니다.',
        benefits: ['시드머니 지원', '멘토링', '사무공간 제공'],
        eligibility: '예비 창업자',
        start_date: '2024-11-10',
        end_date: '2025-01-31',
        url: 'https://example.com',
        image_url: '',
        location: '서울 마포구',
        contact_info: 'venture@example.com',
        prize_money: '20,000,000원',
        view_count: 1890,
        bookmark_count: 134,
        is_bookmarked: false,
        created_at: '2024-10-28',
        updated_at: '2024-10-28'
      },
      match_score: 0.82,
      match_reasons: ['기획력 활용', '팀워크 경험']
    },
    {
      activity: {
        id: '6',
        title: '글로벌 인턴십 프로그램',
        organization: '글로벌 기업 연합',
        category: 'internship',
        target_jobs: ['마케팅', '영업', '인사'],
        tags: ['해외인턴', '글로벌', '실무경험'],
        description: '글로벌 기업에서 3개월간 실무 경험을 쌓는 인턴십 프로그램입니다.',
        benefits: ['급여 지원', '숙소 제공', '정규직 전환 기회'],
        eligibility: '영어 가능한 대학생 및 졸업생',
        start_date: '2024-12-01',
        end_date: '2025-03-31',
        url: 'https://example.com',
        image_url: '',
        location: '해외',
        contact_info: 'intern@example.com',
        prize_money: '',
        view_count: 3450,
        bookmark_count: 278,
        is_bookmarked: false,
        created_at: '2024-11-01',
        updated_at: '2024-11-01'
      },
      match_score: 0.91,
      match_reasons: ['실무 경험 기회', '글로벌 역량 강화', '취업 연계']
    }
  ];

  return mockActivities;
  */
}

export default function RecommendationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedField, setSelectedField] = useState('all');
  const [sortBy, setSortBy] = useState('match_score');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // 활동 목록 조회
  const { data: activitiesData, isLoading, error } = useQuery({
    queryKey: ['recommendations', selectedCategory, selectedField, sortBy, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedField !== 'all') params.append('field', selectedField);
        params.append('sort', sortBy);
        params.append('limit', '60');  // 백엔드의 60개 데이터 모두 가져오기
        if (searchQuery) params.append('search', searchQuery);

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

        console.log('🔍 Fetching activities from:', `http://localhost:8000/api/recommendations/activities?${params}`);
        console.log('📋 Headers:', headers);

        // 먼저 /api/activities 경로 시도
        let url = `http://localhost:8000/api/activities?${params}`;
        let response = await fetch(url, { headers });
        
        // 404면 /api/recommendations/activities 시도
        if (response.status === 404) {
          console.log('⚠️ /api/activities 404, trying /api/recommendations/activities...');
          url = `http://localhost:8000/api/recommendations/activities?${params}`;
          response = await fetch(url, { headers });
        }
        
        console.log('📡 Final URL:', url);
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error(`백엔드 API 오류: ${response.status}. 백엔드 서버를 확인하세요.`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        console.log('📊 Activities count:', data?.data?.activities?.length || 0);
        
        return data;
      } catch (err) {
        console.error('❌ Fetch error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  // 북마크 토글
  const bookmarkMutation = useMutation({
    mutationFn: async ({ activityId, isBookmarked }: { activityId: string; isBookmarked: boolean }) => {
      const method = isBookmarked ? 'DELETE' : 'POST';
      
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
      
      const response = await fetch(`http://localhost:8000/api/activities/${activityId}/bookmark`, {
        method,
        headers,
      });
      
      if (!response.ok) {
        throw new Error('북마크 처리에 실패했습니다');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      toast.success('북마크가 업데이트되었습니다');
    },
    onError: () => {
      toast.error('북마크 처리에 실패했습니다');
    },
  });

  const recommendedActivities: RecommendedActivity[] = activitiesData?.data?.activities || [];
  
  console.log('🎯 Parsed recommendedActivities:', recommendedActivities);
  console.log('🎯 recommendedActivities length:', recommendedActivities.length);
  
  // 날짜 계산 헬퍼 함수
  const calculateDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return null;
    const days = Math.floor(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  };

  const handleBookmarkToggle = (activityId: string, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ activityId, isBookmarked });
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 3) return '#DC2626';
    if (daysLeft <= 7) return '#D77B0F';
    return '#6B6D70';
  };

  const handleSimulationComplete = (result: any) => {
    setSimulationResult(result);
    setShowSimulation(false);
    setShowResult(true);
  };

  const handleResultClose = () => {
    setShowResult(false);
    
    // 직무 시뮬레이션 결과를 기반으로 필터 설정
    if (simulationResult) {
      const jobToFieldMap: { [key: string]: string } = {
        MKT: '마케팅',
        PM: '기획',
        DATA: 'IT',
        DEV: 'IT',
        DESIGN: '디자인',
        PEOPLE: '경영'
      };
      
      const mappedField = jobToFieldMap[simulationResult.topJob] || 'all';
      setSelectedField(mappedField);
      setSortBy('match_score');
      
      toast.success('맞춤 활동을 확인해보세요! 🎉');
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    }
  };

  const formatPrizeMoney = (amount?: number) => {
    if (!amount) return null;
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(0)}억원`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`;
    return `${amount.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen bg-[#F1F2F3]">
      <div className="max-w-7xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B1C1E] mb-2">
            활동 추천
          </h1>
          <p className="text-[#6B6D70]">
            당신의 학과와 관심사에 맞는 실제 공모전, 프로젝트, 동아리를 추천합니다
          </p>
        </div>

        {/* AI 추천 배너 */}
        <div className="bg-white border border-[#EAEBEC] rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1B1C1E] mb-1">
              총 {recommendedActivities.length}개의 활동
            </h3>
            <p className="text-sm text-[#6B6D70]">
              데이터베이스 기반 실시간 추천
            </p>
          </div>
          <button
            onClick={() => setShowSimulation(true)}
            className="px-6 py-3 bg-[#25A778] text-white font-semibold rounded-lg hover:bg-[#1F8860] transition-colors"
          >
            AI 맞춤 추천받기
          </button>
        </div>

        {/* 필터 영역 */}
        <div className="card mb-6">
          {/* 검색 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6D70]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="활동명, 기관명, 키워드 검색..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="mb-6">
            <div className="border-b border-[#EAEBEC]">
              <div className="flex gap-0 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-6 py-3 font-medium whitespace-nowrap transition-all relative ${
                      selectedCategory === cat.value
                        ? 'text-[#25A778] font-bold'
                        : 'text-[#6B6D70] hover:text-[#1B1C1E]'
                    }`}
                  >
                    {cat.label}
                    {selectedCategory === cat.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25A778]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 분야 */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#1B1C1E] mb-2 block">
              관심 분야
            </label>
            <div className="flex gap-2 flex-wrap">
              {fields.map((field) => (
                <button
                  key={field.value}
                  onClick={() => setSelectedField(field.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedField === field.value
                      ? 'bg-[#25A778] text-white'
                      : 'bg-white border border-[#EAEBEC] text-[#6B6D70] hover:bg-[#F1F2F3]'
                  }`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div>
            <label className="text-sm font-medium text-[#1B1C1E] mb-2 block">
              정렬
            </label>
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === option.value
                      ? 'bg-[#1B1C1E] text-white'
                      : 'bg-white text-[#6B6D70] hover:bg-[#F1F2F3] border border-[#EAEBEC]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="card bg-red-50 border-2 border-red-200 text-center py-8">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              데이터를 불러오는데 실패했습니다
            </h3>
            <p className="text-red-600 text-sm mb-4">
              {(error as Error).message}
            </p>
            <p className="text-red-500 text-xs mb-4">
              백엔드 서버(http://localhost:8000)가 실행 중인지 확인하세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && !error && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#25A778]"></div>
            <p className="mt-4 text-[#6B6D70]">활동을 불러오는 중...</p>
          </div>
        )}

        {/* 활동 그리드 */}
        {!isLoading && recommendedActivities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedActivities.map((rec) => {
              const activity = rec.activity;
              const daysLeft = calculateDaysLeft(activity.end_date);
              return (
              <div
                key={activity.id}
                className="card hover:shadow-lg transition-all cursor-pointer group relative"
              >
                {/* 매칭 점수 배지 */}
                {rec.match_score > 0.7 && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 bg-[#25A778] text-white rounded-full text-xs font-bold flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {Math.round(rec.match_score * 100)}% 매칭
                    </div>
                  </div>
                )}

                {/* 이미지 */}
                {activity.image_url ? (
                  <div className="w-full h-40 bg-[#F1F2F3] rounded-lg mb-4 overflow-hidden">
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-[#DDF3EB] to-[#E8F1FF] rounded-lg mb-4 flex items-center justify-center">
                    <Award className="w-16 h-16 text-[#25A778] opacity-20" />
                  </div>
                )}

                {/* 카테고리 & 북마크 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-[#DDF3EB] text-[#186D50] rounded-md text-xs font-bold">
                      {activity.category}
                    </span>
                    {daysLeft !== null && daysLeft <= 7 && (
                      <span
                        className="px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: `${getDaysLeftColor(daysLeft)}20`,
                          color: getDaysLeftColor(daysLeft),
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        D-{daysLeft}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle(activity.id, activity.is_bookmarked);
                    }}
                    className="p-2 hover:bg-[#F1F2F3] rounded-lg transition-colors"
                  >
                    {activity.is_bookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-[#25A778]" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-[#6B6D70]" />
                    )}
                  </button>
                </div>

                {/* 제목 */}
                <h3 className="font-bold text-lg text-[#1B1C1E] mb-2 line-clamp-2 min-h-[56px]">
                  {activity.title}
                </h3>

                {/* 기관명 */}
                <div className="flex items-center gap-2 text-sm text-[#6B6D70] mb-3">
                  <Users className="w-4 h-4" />
                  {activity.organization}
                </div>

                {/* 설명 */}
                <p className="text-sm text-[#6B6D70] line-clamp-2 mb-4">
                  {activity.description}
                </p>

                {/* 분야 태그 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {activity.target_jobs.slice(0, 3).map((job, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-[#E8F1FF] text-[#418CC3]"
                    >
                      {job}
                    </span>
                  ))}
                  {activity.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={`tag-${idx}`}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-[#F8F9FA] text-[#6B6D70]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 하단 정보 */}
                <div className="pt-4 border-t border-[#EAEBEC] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#6B6D70]">
                    <Calendar className="w-4 h-4" />
                    {activity.end_date ? (
                      <>~{new Date(activity.end_date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}</>
                    ) : '상시 모집'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B6D70]">
                    <Users className="w-4 h-4" />
                    {activity.view_count || 0}
                  </div>
                </div>

                {/* 매칭 이유 */}
                {rec.match_reasons && rec.match_reasons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#EAEBEC]">
                    <div className="text-xs font-medium text-[#6B6D70] mb-2">
                      추천 이유
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.match_reasons.slice(0, 3).map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs px-2 py-1 bg-[#DDF3EB] text-[#186D50] rounded-md">
                          <CheckCircle className="w-3 h-3" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 외부 링크 버튼 */}
                <a
                  href={activity.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 btn-primary w-full flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  자세히 보기
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
            })}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && !error && recommendedActivities.length === 0 && (
          <div className="card text-center py-12">
            <Award className="w-16 h-16 text-[#CACBCC] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B1C1E] mb-2">
              추천 활동이 없습니다
            </h3>
            <p className="text-[#6B6D70] mb-4">
              필터를 변경하거나 백엔드에 활동 데이터를 추가해보세요
            </p>
            <div className="text-xs text-[#9AA1AC] mt-2">
              <p>현재 필터: 카테고리={selectedCategory}, 분야={selectedField}, 정렬={sortBy}</p>
              <p className="mt-1">API 응답 데이터: {JSON.stringify(activitiesData)}</p>
            </div>
          </div>
        )}
      </div>

      {/* 진로봇 모달 */}
      {showSimulation && (
        <JobSimulation
          onClose={() => setShowSimulation(false)}
          onComplete={handleSimulationComplete}
        />
      )}

      {showResult && simulationResult && (
        <JobResult
          topJob={simulationResult.topJob}
          topJobName={simulationResult.topJobName}
          scores={simulationResult.scores}
          onClose={handleResultClose}
        />
      )}
    </div>
  );
}
