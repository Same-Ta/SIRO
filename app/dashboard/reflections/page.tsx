'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, TrendingUp, Calendar, BookOpen, Heart, Target } from 'lucide-react';

// 활동 타입별 아이콘 및 라벨 매핑
const getActivityInfo = (activityType: string) => {
  const map: Record<string, { icon: string; label: string }> = {
    contest: { icon: '🏆', label: '공모전' },
    club: { icon: '👥', label: '동아리' },
    project: { icon: '💻', label: '프로젝트' },
    internship: { icon: '💼', label: '인턴' },
    study: { icon: '📚', label: '스터디' },
    etc: { icon: '✨', label: '기타' },
  };
  return map[activityType] || { icon: '✨', label: '활동' };
};

export default function ReflectionsPage() {
  const router = useRouter();
  

  // 최근 마이크로 로그
  const { data: recentLogs } = useQuery({
    queryKey: ['micro-logs-recent'],
    queryFn: async () => {
      const response = await fetch('/api/v1/reflections/micro?limit=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
        },
      });
      return response.json();
    },
  });

  // STAR 회고 데이터도 조회
  const { data: starReflections } = useQuery({
    queryKey: ['star-reflections-recent'],
    queryFn: async () => {
      const response = await fetch('/api/v1/reflections?limit=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
        },
      });
      return response.json();
    },
  });

  // 이번주 통계
  const { data: weekStats } = useQuery({
    queryKey: ['week-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/reflections/stats?period=week', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
        },
      });
      return response.json();
    },
  });

  // 사용자 오늘의 컨디션 (0-100)
  const [health, setHealth] = useState<string>('50');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('today_health');
      if (saved) setHealth(saved);
    }
  }, []);
  
  // 마이크로 로그와 STAR 회고 합치기
  const microLogs = recentLogs?.data?.logs || [];
  const starReflectionsList = starReflections?.data?.reflections || [];
  const starLogs = starReflectionsList.map((reflection: any) => ({
    id: reflection.id,
    activity_type: 'reflection',
    activity_label: reflection.template_name || 'AI 회고',
    activity_icon: '✨',
    memo: Object.values(reflection.answers || {}).join(' ').substring(0, 100),
    date: reflection.created_at,
    tags: reflection.competencies || [],
    isStarReflection: true,
  }));
  
  // 날짜순으로 정렬하여 합치기
  const logs = [...microLogs, ...starLogs]
    .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
    .slice(0, 7);
  
  // 통계에 STAR 회고 포함
  const baseStats = weekStats?.data || {};
  const stats = {
    ...baseStats,
    total_logs: (baseStats.total_logs || 0) + starReflectionsList.length,
  };

  return (
    <div className="min-h-screen bg-[#F1F2F3]">
      <div className="max-w-6xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1B1C1E] mb-2">경험정리</h1>
              <p className="text-[#6B6D70]">경험을 기록하고, 성장 패턴을 발견하세요</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard/reflections/survey')}
                  className="btn-primary flex items-center gap-2 bg-gradient-to-r from-[#25A778] to-[#2DC98E]"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>AI 회고 시작하기</span>
                </button>
                {/* 팀 공유 기능은 스페이스 생성에서 관리합니다 */}
            </div>
          </div>

          {/* 오늘의 컨디션 (0-100) */}
          <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFFBF0] rounded-xl p-6 border-2 border-[#FFDAB9]/40 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#6B2A00] mb-2">오늘의 컨디션</h3>
                <p className="text-sm text-[#6B2A00] mb-3">오늘의 기분 혹은 팀의 상태를 0(매우 나쁨) ~ 100(매우 좋음)으로 체크해주세요.</p>
                <div className="flex items-center gap-3">
                  <input
                    id="healthRange"
                    type="range"
                    min={0}
                    max={100}
                    value={Number(health)}
                    className="w-64"
                    onChange={async (e) => {
                      const v = e.currentTarget.value;
                      setHealth(v);
                      localStorage.setItem('today_health', v);

                      // Save to backend
                      try {
                        await fetch('/api/v1/health-check', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
                          },
                          body: JSON.stringify({
                            health_score: parseInt(v),
                            date: new Date().toISOString().split('T')[0]
                          })
                        });
                      } catch (error) {
                        console.error('Failed to save health check:', error);
                      }
                    }}
                  />
                  <span className="text-sm text-[#6B6D70]">현재: <strong>{health}점</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 이번 주 통계 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-[#25A778]" />
              <h3 className="font-bold text-[#1B1C1E]">이번 주</h3>
            </div>
            <div className="text-3xl font-bold text-[#25A778] mb-1">
              {stats?.total_logs || 0}개
            </div>
            <p className="text-sm text-[#6B6D70]">활동 기록</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#DC2626]" />
              <h3 className="font-bold text-[#1B1C1E]">좋았던 경험</h3>
            </div>
            <div className="text-3xl font-bold text-[#DC2626] mb-1">
              {stats?.positive_logs || 0}개
            </div>
            <p className="text-sm text-[#6B6D70]">평소보다 기분 좋았던 날</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-[#418CC3]" />
              <h3 className="font-bold text-[#1B1C1E]">성장 추세</h3>
            </div>
            <div className="text-3xl font-bold text-[#418CC3] mb-1">
              {stats?.growth_trend || '→'}
            </div>
            <p className="text-sm text-[#6B6D70]">지난주 대비</p>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/reflections/survey')}
            className="card hover:shadow-lg transition-all cursor-pointer text-left bg-gradient-to-br from-[#25A778] to-[#2DC98E] text-white"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1">AI 회고 시작</h3>
                <p className="text-sm text-white/90">
                  설문으로 맞춤 템플릿 추천받고 회고하기
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/reflections/micro')}
            className="card hover:shadow-lg transition-all cursor-pointer text-left bg-gradient-to-br from-white to-[#E8F1FF]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#418CC3] rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#1B1C1E] mb-1">빠른 기록</h3>
                <p className="text-sm text-[#6B6D70]">
                  간단하게 오늘의 활동 기록하기
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* 최근 기록 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1B1C1E]">최근 7일 기록</h2>
            <button
              onClick={() => router.push('/dashboard/reflections/history')}
              className="text-sm text-[#25A778] hover:text-[#186D50] font-medium"
            >
              전체보기 →
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#CACBCC]" />
              </div>
              <p className="text-[#6B6D70] mb-4">아직 기록이 없어요</p>
              <button
                onClick={() => {
                    router.push('/dashboard/reflections/micro');
                }}
                className="btn-primary"
              >
                첫 기록 시작하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => {
                const activityInfo = log.isStarReflection 
                  ? { icon: log.activity_icon || '✨', label: log.activity_label || 'AI 회고' }
                  : getActivityInfo(log.activity_type);
                
                return (
                  <div
                    key={log.id}
                    className="p-4 bg-[#F8F9FA] rounded-xl hover:bg-white border-2 border-transparent hover:border-[#EAEBEC] transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/reflections/${log.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">{activityInfo.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#1B1C1E]">{activityInfo.label}</span>
                          {log.isStarReflection && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
                              AI
                            </span>
                          )}
                          <span className="text-xs text-[#6B6D70]">
                            {new Date(log.date || log.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        {log.memo && (
                          <p className="text-sm text-[#6B6D70] line-clamp-1">{log.memo}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {log.tags?.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-white rounded text-xs text-[#6B6D70]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* mood icon removed - health check replaces daily mood */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Nudge - 다음 행동 제안 */}
        {stats?.action_nudge && (
          <div className="card mt-6 bg-gradient-to-br from-[#DDF3EB] to-white border-2 border-[#25A778]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#25A778] rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#186D50] mb-2">
                  💡 다음 행동 제안
                </h3>
                <p className="text-[#186D50] mb-4">
                  {stats.action_nudge.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.action_nudge.actions?.map((action: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => router.push(action.link)}
                      className="px-4 py-2 bg-white text-[#25A778] rounded-lg text-sm font-medium hover:bg-[#F8F9FA] transition-all"
                    >
                      {action.label} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 팀 초대 모달 제거: 스페이스 생성에서 초대 기능 제공 */}
      </div>
    </div>
  );
}
