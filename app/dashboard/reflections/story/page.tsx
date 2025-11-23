'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Heart, AlertCircle, Target, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function StoryViewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('month'); // week, month, quarter

  // 스토리 데이터 가져오기
  const { data: storyData, isLoading } = useQuery({
    queryKey: ['story-view', period],
    queryFn: async () => {
      const response = await fetch(`/api/reflections/story?period=${period}`, {
        headers: {
          'x-user-id': localStorage.getItem('x-user-id') || '',
        },
      });
      return response.json();
    },
  });

  const story = storyData?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F2F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#25A778] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6D70]">스토리를 생성하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F2F3]">
      <div className="max-w-4xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#6B6D70] hover:text-[#1B1C1E] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1B1C1E]">나의 성장 스토리</h1>
                <p className="text-sm text-[#6B6D70]">{story?.period_label || '최근 활동 요약'}</p>
              </div>
            </div>

            {/* 기간 선택 */}
            <div className="flex gap-2">
              {[
                { id: 'week', label: '최근 1주' },
                { id: 'month', label: '최근 1개월' },
                { id: 'quarter', label: '최근 3개월' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === p.id
                      ? 'bg-[#25A778] text-white'
                      : 'bg-white text-[#6B6D70] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 인트로 */}
        <div className="card mb-6 bg-gradient-to-br from-[#DDF3EB] to-[#E8F1FF] border-none">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#25A778]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#186D50] mb-2">
                {story?.intro_title || `지난 ${story?.total_days || 0}일 동안의 여정`}
              </h2>
              <p className="text-[#186D50] leading-relaxed">
                {story?.intro_message || 'ProoF에 기록된 경험을 분석해 보았어요.'}
              </p>
            </div>
          </div>
        </div>

        {/* 1. 활동 요약 */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#25A778]" />
            <h2 className="text-xl font-bold text-[#1B1C1E]">내가 많이 했던 활동</h2>
          </div>
          
          <div className="space-y-3">
            {story?.activity_summary?.map((activity: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{activity.icon}</div>
                  <div>
                    <div className="font-medium text-[#1B1C1E]">{activity.label}</div>
                    <div className="text-xs text-[#6B6D70]">{activity.count}회 활동</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#25A778]">{activity.count}</div>
              </div>
            )) || <p className="text-[#6B6D70]">아직 활동 기록이 없어요</p>}
          </div>
        </div>

        {/* 2. 기분 좋았던 순간 */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#DC2626]" />
            <h2 className="text-xl font-bold text-[#1B1C1E]">나를 기분 좋게 만든 순간들</h2>
          </div>

          <div className="bg-[#FEF3F2] rounded-xl p-4 mb-4 border border-[#DC2626]/20">
            <p className="text-[#B91C1C]">
              평소보다 기분이 좋아진 활동 <span className="font-bold">{story?.positive_count || 0}회</span> 중,
            </p>
          </div>

          <div className="space-y-2">
            {story?.positive_patterns?.map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#F8F9FA] rounded-lg">
                <div className="text-2xl flex-shrink-0">{pattern.icon}</div>
                <div>
                  <div className="font-medium text-[#1B1C1E]">{pattern.count}회는</div>
                  <div className="text-sm text-[#6B6D70]">&ldquo;{pattern.label}&rdquo;과 관련</div>
                </div>
              </div>
            )) || <p className="text-[#6B6D70]">아직 패턴을 찾기에 데이터가 부족해요</p>}
          </div>
        </div>

        {/* 3. 힘들었던 순간 */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#D77B0F]" />
            <h2 className="text-xl font-bold text-[#1B1C1E]">나를 지치게 한 순간들</h2>
          </div>

          <div className="bg-[#FEF9F3] rounded-xl p-4 mb-4 border border-[#D77B0F]/20">
            <p className="text-[#C2410C]">
              평소보다 힘들었던 활동 <span className="font-bold">{story?.negative_count || 0}회</span> 중,
            </p>
          </div>

          <div className="space-y-2">
            {story?.negative_patterns?.map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#F8F9FA] rounded-lg">
                <div className="text-2xl flex-shrink-0">{pattern.icon}</div>
                <div>
                  <div className="font-medium text-[#1B1C1E]">{pattern.count}회는</div>
                  <div className="text-sm text-[#6B6D70]">&ldquo;{pattern.label}&rdquo;과 연결</div>
                </div>
              </div>
            )) || <p className="text-[#6B6D70]">아직 패턴을 찾기에 데이터가 부족해요</p>}
          </div>
        </div>

        {/* 4. ProoF가 보는 강점 */}
        <div className="card mb-6 bg-gradient-to-br from-[#DDF3EB] to-white border-2 border-[#25A778]">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#25A778]" />
            <h2 className="text-xl font-bold text-[#1B1C1E]">ProoF가 보는 님의 강점 후보</h2>
          </div>

          <div className="text-[#186D50] leading-relaxed mb-4">
            {story?.strength_analysis || '아직 충분한 데이터가 없어요. 조금 더 기록해주세요!'}
          </div>

          <div className="flex flex-wrap gap-2">
            {story?.suggested_tracks?.map((track: string, idx: number) => (
              <span key={idx} className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#25A778] border border-[#25A778]/20">
                {track}
              </span>
            ))}
          </div>
        </div>

        {/* 5. 다음 제안 (Action Nudge) */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#25A778]" />
            <h2 className="text-xl font-bold text-[#1B1C1E]">다음 {period === 'week' ? '1주' : period === 'month' ? '1개월' : '3개월'} 제안</h2>
          </div>

          <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
            <p className="text-[#1B1C1E] leading-relaxed">
              {story?.next_suggestion || '더 많은 경험을 쌓아보세요!'}
            </p>
          </div>

          <div className="space-y-3">
            {story?.recommended_activities?.map((activity: any, idx: number) => (
              <div key={idx} className="p-4 bg-white border-2 border-[#EAEBEC] rounded-xl hover:border-[#25A778] transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="font-bold text-[#1B1C1E]">{activity.title}</div>
                </div>
                <p className="text-sm text-[#6B6D70] ml-11">{activity.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/dashboard/recommendations')}
            className="btn-primary w-full mt-4"
          >
            추천 활동 더 보기
          </button>
        </div>
      </div>
    </div>
  );
}
