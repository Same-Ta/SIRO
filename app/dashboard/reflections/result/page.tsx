'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { reflectionTemplates } from '@/lib/reflection-templates';
import { generatePortfolio } from '@/lib/gemini';

export default function ReflectionResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('reflection_result');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
      setLoading(false);
    } else {
      // No result found, redirect
      router.push('/dashboard/reflections');
    }
  }, [router]);

  useEffect(() => {
    if (!result) return;
    let mounted = true;
    (async () => {
      try {
        const templateObj = Object.values(reflectionTemplates).find((t: any) => t.id === result.template);
        const templateName = templateObj?.name;
        const p = await generatePortfolio(result.answers, templateName, result.competencies);
        if (mounted) setPortfolio(p);
      } catch (e) {
        console.error('포트폴리오 생성 실패', e);
      }
    })();

    return () => { mounted = false; };
  }, [result]);

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const template = Object.values(reflectionTemplates).find(t => t.id === result.template);
  const { answers, competencies = [] } = result;
 
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
          'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
        },
        body: JSON.stringify({
          template_id: result.template,
          template_name: result.templateName || template?.name,
          answers: answers,
          competencies: competencies.map((c: any) => c.name),
          competency_scores: competencies.reduce((acc: any, c: any) => {
            acc[c.name] = c.score;
            return acc;
          }, {}),
          competency_analysis: {
            competencies: competencies,
            summary: result.summary
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('회고가 저장되었습니다! 🎉');
        router.push('/dashboard/reflections');
      } else {
        alert(`저장 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            ✅ 회고 완료
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            당신의 경험 회고 결과
          </h1>
          <p className="text-gray-600">
            작성하신 내용을 바탕으로 경험을 정리하고 역량을 분석했습니다
          </p>
        </motion.div>

        {/* Competency Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>💎</span>
            발휘한 역량 분석
          </h2>

          <div className="space-y-6">
            {Array.isArray(competencies) && competencies.length > 0 ? (
              competencies.map((comp: any, index: number) => (
                <motion.div
                  key={comp.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{comp.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(comp.score)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.score}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                  />
                </div>
                
                {/* Evidence from user's response */}
                {comp.evidence && (
                  <div className="mb-3 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-600 mb-1">발휘된 부분:</p>
                    <p className="text-gray-700 italic">&ldquo;{comp.evidence}&rdquo;</p>
                  </div>
                )}
                
                {/* AI Analysis / Reason */}
                {(comp.reason || comp.analysis) && (
                  <div className="mb-3 p-3 bg-white rounded-lg">
                    {comp.reason && (
                      <>
                        <p className="text-sm font-semibold text-gray-600 mb-1">이 역량이 발휘된 이유:</p>
                        <p className="text-gray-700 font-medium mb-2">{comp.reason}</p>
                      </>
                    )}

                    {comp.analysis && (
                      <>
                        <p className="text-sm font-semibold text-gray-600 mb-1">분석:</p>
                        <p className="text-gray-700">{comp.analysis}</p>
                      </>
                    )}
                  </div>
                )}
                
                {comp.keywords && comp.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {comp.keywords.map((keyword: string) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-white text-blue-700 text-sm rounded-full border border-blue-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                역량 분석 데이터가 없습니다.
              </div>
            )}
          </div>
        </motion.div>

        {/* Experience Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>{template?.icon}</span>
            {template?.name} 회고 내용
          </h2>

          <div className="space-y-6">
            {template?.questions.map((question: any, index: number) => (
              <div key={question.key} className="pb-6 border-b border-gray-200 last:border-0">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {question.label}
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap pl-8">
                  {answers[question.key] || '(작성되지 않음)'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Format - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span>
              포트폴리오
            </h2>
            <button
              onClick={() => {
                const portfolioText = document.getElementById('portfolio-content')?.innerText || '';
                navigator.clipboard.writeText(portfolioText);
                alert('포트폴리오가 클립보드에 복사되었습니다!');
              }}
              className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              📋 복사하기
            </button>
          </div>
          
          <div id="portfolio-content" className="space-y-6">
            {/* Title */}
            {portfolio?.title && (
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">{portfolio.title}</h3>
                {portfolio?.role && (
                  <p className="text-sm text-gray-500 mt-1">{portfolio.role}</p>
                )}
              </div>
            )}

            {/* Overview */}
            {portfolio?.overview && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">개요</h4>
                <p className="text-gray-800 leading-relaxed">{portfolio.overview}</p>
              </div>
            )}

            {/* Actions */}
            {portfolio?.actions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">주요 활동</h4>
                <div className="text-gray-800 leading-relaxed space-y-1">
                  {String(portfolio.actions).split('\n').map((line: string, i: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    // Bullet point로 시작하는 경우
                    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{trimmed}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Results */}
            {portfolio?.results && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">성과</h4>
                <p className="text-gray-800 leading-relaxed">{portfolio.results}</p>
              </div>
            )}

            {/* Key Takeaways */}
            {portfolio?.key_takeaways && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">핵심 역량 및 배운 점</h4>
                <p className="text-gray-800 leading-relaxed">{portfolio.key_takeaways}</p>
              </div>
            )}

            {/* Fallback if no portfolio generated */}
            {!portfolio && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">포트폴리오를 생성하고 있습니다...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        {result.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 mb-6 border border-purple-100"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🤖</span>
              AI 종합 인사이트
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>{result.summary}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          <button
            onClick={() => router.push('/dashboard/reflections/survey')}
            className="px-8 py-3 bg-white text-gray-700 rounded-xl font-medium border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            새 회고 시작
          </button>
        </motion.div>
      </div>
    </div>
  );
}
