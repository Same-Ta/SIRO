'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface JobScore {
  job_id: string;
  name: string;
  score: number;
}

interface SurveyResult {
  preference_top3: JobScore[];
  fit_top3: JobScore[];
  recommended_job: { job_id: string; name: string; score: number; reason?: string };
}

interface CareerResultProps {
  result: SurveyResult;
  onSelectJob: (jobId: string) => void;
  onBack?: () => void;
}

// 직무별 아이콘 매핑
const JOB_ICONS: Record<string, string> = {
  marketing: '📢',
  hr: '👥',
  brand: '💡',
  strategy: '🎯',
  finance: '💰',
  sales: '🤝',
  data: '📊',
  operations: '⚙️',
};

// 직무별 색상 테마
const JOB_COLORS: Record<string, string> = {
  marketing: 'from-pink-500 to-rose-500',
  hr: 'from-blue-500 to-indigo-500',
  brand: 'from-purple-500 to-violet-500',
  strategy: 'from-emerald-500 to-teal-500',
  finance: 'from-yellow-500 to-orange-500',
  sales: 'from-cyan-500 to-blue-500',
  data: 'from-indigo-500 to-purple-500',
  operations: 'from-gray-500 to-slate-600',
};

export default function CareerResult({ result, onSelectJob, onBack }: CareerResultProps) {
  const { preference_top3, fit_top3, recommended_job } = result;

  const renderJobCard = (job: JobScore, rank: number, type: 'preference' | 'fit') => {
    const score = job.score;
    const gradientClass = JOB_COLORS[job.job_id] || 'from-gray-500 to-slate-500';
    const icon = JOB_ICONS[job.job_id] || '✨';

    return (
      <motion.div
        key={`${type}-${job.job_id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300"
        onClick={() => onSelectJob(job.job_id)}
      >
        {/* 순위 배지 */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
            {rank}
          </div>
          <div className="text-4xl">{icon}</div>
        </div>

        {/* 직무명 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.name}</h3>

        {/* 점수 바 */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">적합도</span>
            <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${gradientClass}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: rank * 0.1 }}
            />
          </div>
        </div>

      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
          >
            ← 돌아가기
          </button>
        )}

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 당신의 진로 분석 결과
          </h1>
          <p className="text-lg text-gray-600">
            당신에게 가장 잘 맞는 직무를 찾았어요!
          </p>
        </motion.div>

        {/* 추천 직무 강조 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 mb-12 text-white text-center shadow-2xl"
        >
          <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-4">
            설문 기반 추천 직무
          </div>
          <div className="text-6xl mb-4">{JOB_ICONS[recommended_job.job_id] || '✨'}</div>
          <h2 className="text-3xl font-bold mb-2">
            {recommended_job.name}
          </h2>
          <p className="text-lg opacity-90 mb-6">
            종합 점수: {recommended_job.score.toFixed(1)}점 • 당신의 선호도와 역량이 가장 잘 맞는 직무입니다
          </p>
          <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm opacity-90">
              <strong>💡 이런 점이 잘 맞아요:</strong><br/>
              • 선호도 점수: {preference_top3.find(j => j.job_id === recommended_job.job_id)?.score.toFixed(1) || 'N/A'}점<br/>
              • 역량 적합도 점수: {fit_top3.find(j => j.job_id === recommended_job.job_id)?.score.toFixed(1) || 'N/A'}점
            </p>
          </div>
          <button
            onClick={() => onSelectJob(recommended_job.job_id)}
            className="px-8 py-3 bg-white text-purple-600 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            {recommended_job.name} 스펙체크 시작하기 →
          </button>
          <p className="text-sm opacity-75 mt-4">
            세부 직무를 더 구체적으로 분석해보세요
          </p>
        </motion.div>

        {/* 결과 섹션 */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 선호도 Top 3 */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">💝 선호도 Top 3</h2>
              <p className="text-gray-600">당신이 하고 싶어하는 직무예요</p>
            </div>
            <div className="space-y-4">
              {preference_top3.map((job: JobScore, index: number) => renderJobCard(job, index + 1, 'preference'))}
            </div>
          </div>

          {/* 적합도 Top 3 */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 역량 적합도 Top 3</h2>
              <p className="text-gray-600">당신이 잘할 수 있는 직무예요</p>
            </div>
            <div className="space-y-4">
              {fit_top3.map((job: JobScore, index: number) => renderJobCard(job, index + 1, 'fit'))}
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-white rounded-3xl p-8 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">📌 다음 단계</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 font-bold mr-3">1.</span>
              <span>위 직무 중 하나를 선택하여 <strong>스펙체크</strong>를 진행하세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 font-bold mr-3">2.</span>
              <span>스펙체크 결과를 바탕으로 세부 직무 유형(예: 그로스 마케터)을 확인하세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 font-bold mr-3">3.</span>
              <span>최종 선택한 직무 기반으로 맞춤형 활동(공모전, 인턴 등)을 추천받으세요.</span>
            </li>
          </ul>
        </motion.div>

        {/* 재설문 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← 처음부터 다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}
