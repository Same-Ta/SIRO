'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, FileText, BarChart3, Zap, Clock, Sparkles } from 'lucide-react';

export default function ReflectionHomePage() {
  const router = useRouter();

  // 최근 회고 목록
  const { data: recentReflections } = useQuery({
    queryKey: ['recent-reflections'],
    queryFn: async () => {
      const userId = localStorage.getItem('x-user-id') || 'dev-user-default';
      const response = await fetch('/api/v1/reflections?limit=5', {
        headers: { 'x-user-id': userId },
      });
      if (!response.ok) return { data: [] };
      const result = await response.json();
      // 백엔드가 { data: { reflections: [...] } } 구조로 반환
      return { data: result.data?.reflections || [] };
    },
  });

  // 진행중인 스페이스
  const { data: activeSpaces } = useQuery({
    queryKey: ['active-spaces'],
    queryFn: async () => {
      const userId = localStorage.getItem('x-user-id') || 'dev-user-default';
      const response = await fetch('/api/v1/spaces', {
        headers: { 'x-user-id': userId },
      });
      if (!response.ok) return { data: [] };
      const result = await response.json();
      // 백엔드가 배열을 직접 반환하므로 { data: result }로 래핑
      return { data: Array.isArray(result) ? result : [] };
    },
  });

  // 성장 통계
  const { data: growthStats } = useQuery({
    queryKey: ['growth-stats'],
    queryFn: async () => {
      try {
        const userId = localStorage.getItem('x-user-id') || 'dev-user-default';
        const response = await fetch('/api/v1/reflections/stats', {
          headers: { 'x-user-id': userId },
        });
        if (!response.ok) {
          // API 실패 시 기본값 반환
          return {
            data: {
              total_reflections: 0,
              this_week_reflections: 0,
              streak_days: 0,
              active_spaces: 0,
              total_keywords: 0,
            }
          };
        }
        return response.json();
      } catch (error) {
        console.error('Stats fetch failed:', error);
        return {
          data: {
            total_reflections: 0,
            this_week_reflections: 0,
            streak_days: 0,
            active_spaces: 0,
            total_keywords: 0,
          }
        };
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#F1F2F3]">
      <div className="max-w-7xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B1C1E] mb-2">회고 홈</h1>
          <p className="text-[#6B6D70]">
            경험을 정리하고 성장을 추적하세요
          </p>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/spaces/new')}
            className="card hover:shadow-lg transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#DDF3EB] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#25A778] transition-colors">
                <Plus className="w-7 h-7 text-[#25A778] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1B1C1E] mb-1">
                  스페이스 생성
                </h3>
                <p className="text-sm text-[#6B6D70]">
                  새로운 활동 시작하기
                </p>
              </div>
            </div>
          </button>

          {/* 팀 초대 카드 제거 (요청에 따라) */}

          <button
            onClick={() => router.push('/dashboard/reflections/analysis')}
            className="card hover:shadow-lg transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F0E8FF] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#9C6BB3] transition-colors">
                <BarChart3 className="w-7 h-7 text-[#9C6BB3] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1B1C1E] mb-1">성장 분석</h3>
                <p className="text-sm text-[#6B6D70]">AI 인사이트 확인</p>
              </div>
            </div>
          </button>
        </div>

        {/* 성장 통계 */}
        {growthStats?.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="text-sm text-[#6B6D70] mb-2">총 회고</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#1B1C1E]">
                  {growthStats.data.total_reflections}
                </div>
                <div className="text-sm text-[#25A778] mb-1">
                  +{growthStats.data.this_week_reflections} 이번주
                </div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-[#6B6D70] mb-2">연속 작성</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#25A778]">
                  {growthStats.data.streak_days}
                </div>
                <div className="text-sm text-[#6B6D70] mb-1">일</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-[#6B6D70] mb-2">활동 스페이스</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#418CC3]">
                  {growthStats.data.active_spaces}
                </div>
                <div className="text-sm text-[#6B6D70] mb-1">개</div>
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-[#6B6D70] mb-2">성장 키워드</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#9C6BB3]">
                  {growthStats.data.total_keywords}
                </div>
                <div className="text-sm text-[#6B6D70] mb-1">개</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 회고 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#1B1C1E]">
                최근 회고
              </h2>
              <button
                onClick={() => router.push('/dashboard/reflections')}
                className="text-sm text-[#25A778] hover:text-[#186D50] font-medium"
              >
                전체보기
              </button>
            </div>

            <div className="space-y-4">
              {Array.isArray(recentReflections?.data) && recentReflections.data.length > 0 ? (
                recentReflections.data.slice(0, 3).map((reflection: any) => (
                  <div
                    key={reflection.id}
                    onClick={() =>
                      router.push(`/dashboard/reflections/${reflection.id}`)
                    }
                    className="card hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: '#DDF3EB',
                              color: '#186D50',
                            }}
                          >
                            {reflection.space_name || reflection.project_name || '개인 회고'}
                          </span>
                          <span className="text-xs text-[#6B6D70]">
                            {new Date(
                              reflection.reflection_date || reflection.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#1B1C1E] line-clamp-2">
                          {reflection.content || reflection.ai_feedback || '회고 내용'}
                        </p>
                      </div>
                      {reflection.progress_score && (
                        <div className="flex-shrink-0 ml-4 w-12 h-12 bg-[#DDF3EB] rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-[#25A778]">
                            {reflection.progress_score}
                          </span>
                        </div>
                      )}
                    </div>
                    {reflection.ai_feedback && (
                      <div className="bg-[#F1F2F3] p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-[#25A778]" />
                          <span className="text-xs font-medium text-[#6B6D70]">
                            AI 피드백
                          </span>
                        </div>
                        <p className="text-sm text-[#6B6D70] line-clamp-2">
                          {reflection.ai_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : null}

              {(!Array.isArray(recentReflections?.data) ||
                recentReflections.data.length === 0) && (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 bg-[#F1F2F3] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#CACBCC]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#1B1C1E] mb-2">
                    아직 회고가 없습니다
                  </h3>
                  <p className="text-[#6B6D70] mb-4">
                    첫 회고를 작성하고 성장을 기록하세요
                  </p>
                  <button
                    onClick={() =>
                      router.push('/dashboard/reflections/chatbot')
                    }
                    className="btn-primary"
                  >
                    AI 회고 시작하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 진행중인 스페이스 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#1B1C1E]">
                진행중인 스페이스
              </h2>
              <button
                onClick={() => router.push('/dashboard/spaces')}
                className="text-sm text-[#25A778] hover:text-[#186D50] font-medium"
              >
                전체보기
              </button>
            </div>

            <div className="space-y-3">
              {Array.isArray(activeSpaces?.data) && activeSpaces.data.length > 0 ? (
                activeSpaces.data.map((space: any) => (
                  <div
                    key={space.id}
                    onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                    className="card hover:shadow-lg transition-all cursor-pointer"
                  >
                    <h3 className="font-semibold text-[#1B1C1E] mb-2">
                      {space.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B6D70]">
                        팀원 {space.team_size || 1}명
                      </span>
                      <span className="text-[#25A778] font-medium">
                        회고 {space.total_reflections || 0}회
                      </span>
                    </div>
                    {space.next_reflection_date && (
                      <div className="mt-3 pt-3 border-t border-[#EAEBEC]">
                        <div className="flex items-center gap-2 text-xs text-[#6B6D70]">
                          <Clock className="w-4 h-4" />
                          다음 회고:{' '}
                          {new Date(
                            space.next_reflection_date
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : null}

              {(!Array.isArray(activeSpaces?.data) || activeSpaces.data.length === 0) && (
                <div className="card text-center py-8">
                  <p className="text-[#6B6D70] mb-4">
                    진행중인 스페이스가 없습니다
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/spaces/new')}
                    className="btn-primary text-sm"
                  >
                    스페이스 생성
                  </button>
                </div>
              )}
            </div>

            {/* AI 추천 */}
            <div className="mt-6 card border-2 border-[#25A778]/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#25A778] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1B1C1E] mb-1">
                    AI 추천
                  </h3>
                  <p className="text-sm text-[#6B6D70] mb-3">
                    이번 주에 회고를 3회 작성했어요. 꾸준한 기록이 성장의
                    밑거름이 됩니다!
                  </p>
                  <button
                    onClick={() =>
                      router.push('/dashboard/reflections/analysis')
                    }
                    className="text-sm text-[#25A778] hover:text-[#186D50] font-medium"
                  >
                    성장 분석 보기 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
