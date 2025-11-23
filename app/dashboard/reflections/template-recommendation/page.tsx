'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { reflectionTemplates } from '@/lib/reflection-templates';

function TemplateRecommendationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surveyData, setSurveyData] = useState<any>(null);
  const [recommendedTemplates, setRecommendedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const surveyJson = searchParams.get('survey');
    if (surveyJson) {
      const data = JSON.parse(surveyJson);
      setSurveyData(data);
      
      // AI-based template recommendation logic
      const recommendations = getTemplateRecommendations(data);
      setRecommendedTemplates(recommendations);
      setLoading(false);
    }
  }, [searchParams]);

  const getTemplateRecommendations = (survey: any) => {
    const { experience_type, reflection_purpose, detail_level, focus_area } = survey;
    const recommendations: string[] = [];

    // Rule-based recommendation logic
    if (experience_type === 'project' || experience_type === 'problem') {
      recommendations.push('STAR');
    }
    
    if (reflection_purpose === 'emotional' || Array.isArray(focus_area) && focus_area.includes('emotion')) {
      recommendations.push('5F');
    }
    
    if (reflection_purpose === 'improvement' || experience_type === 'collaboration') {
      recommendations.push('KPT');
    }
    
    if (detail_level === 'moderate' || reflection_purpose === 'learning') {
      recommendations.push('4L');
    }
    
    if (reflection_purpose === 'achievement' || Array.isArray(focus_area) && focus_area.includes('result')) {
      recommendations.push('PMI');
    }

    // Ensure at least 2-3 recommendations
    if (recommendations.length === 0) {
      return ['STAR', 'KPT', '4L'];
    }
    
    return [...new Set(recommendations)].slice(0, 3);
  };

  const handleTemplateSelect = (templateId: string) => {
    router.push(`/dashboard/reflections/chatbot?template=${templateId}`);
  };

  const getRecommendationReason = (templateId: string) => {
    const reasons: Record<string, string> = {
      'STAR': '구조화된 방식으로 경험을 명확하게 정리하기에 적합합니다',
      '5F': '감정과 인사이트를 깊이 있게 탐구할 수 있습니다',
      'KPT': '실용적인 개선점을 빠르게 도출할 수 있습니다',
      '4L': '균형잡힌 관점에서 경험을 종합적으로 돌아볼 수 있습니다',
      'PMI': '객관적인 분석을 통해 다각도로 평가할 수 있습니다'
    };
    return reasons[templateId] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">AI가 당신에게 맞는 회고 템플릿을 추천하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            ✨ AI 추천 완료
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            당신에게 추천하는 회고 템플릿
          </h1>
          <p className="text-gray-600">
            설문 결과를 바탕으로 가장 적합한 템플릿을 선별했습니다
          </p>
        </motion.div>

        {/* Recommended Templates */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {recommendedTemplates.map((templateId, index) => {
            const template = reflectionTemplates[templateId as keyof typeof reflectionTemplates];
            
            return (
              <motion.div
                key={templateId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg z-10">
                    👑 최적 추천
                  </div>
                )}
                
                <button
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`
                    w-full h-full p-6 rounded-2xl border-2 transition-all text-left
                    hover:shadow-xl hover:scale-105 transform
                    ${index === 0 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                    }
                  `}
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mb-3">
                    {template.category}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">
                    💡 {getRecommendationReason(template.id)}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">질문 미리보기</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {template.questions.slice(0, 2).map((q, i) => (
                        <li key={i}>• {q.label}</li>
                      ))}
                      {template.questions.length > 2 && (
                        <li className="text-gray-400">• +{template.questions.length - 2}개 질문</li>
                      )}
                    </ul>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* All Templates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            다른 템플릿도 둘러보기
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.values(reflectionTemplates)
              .filter(t => !recommendedTemplates.includes(t.id))
              .map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard/reflections/survey')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← 설문 다시하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplateRecommendationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <TemplateRecommendationContent />
    </Suspense>
  );
}
