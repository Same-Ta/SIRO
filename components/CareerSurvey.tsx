'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 타입 정의
interface Question {
  id: string;
  type: 'likert' | 'text' | 'multiple_choice' | 'single_choice';
  text: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  optional?: boolean;
  allow_multiple?: boolean;
}

interface SurveyData {
  survey_id?: string;
  title: string;
  description: string;
  questions: Question[];
  response_labels?: Record<string, string>;
}

interface GeneralSurveyResult {
  survey_id: string;
  submitted_at: string;
  total_questions: number;
  job_scores: Record<string, number>;
  preference_top3: Array<{ job_id: string; name: string; icon?: string; score: number; rank: number }>;
  fit_top3: Array<{ job_id: string; name: string; icon?: string; score: number; rank: number }>;
  recommended_job: { job_id: string; name: string; icon?: string; score: number; rank: number; reason?: string };
  insights: string[];
}

interface SpecCheckResult {
  job_category: string;
  submitted_at: string;
  total_questions: number;
  score_map: Record<string, number>;
  top_specializations: Array<{ subtype_id: string; name: string; description?: string; score: number; reason?: string }>;
  recommended_specialization: { subtype_id: string; name: string; description?: string; score: number; reason?: string };
  preference_top3: Array<{ subtype_id: string; name: string; score: number; reason?: string }>;
  fit_top3: Array<{ subtype_id: string; name: string; score: number; reason?: string }>;
  insights: string[];
}

interface CareerSurveyProps {
  surveyType: 'general' | 'spec-check';
  jobCategory?: string;
  onComplete: (result: GeneralSurveyResult | SpecCheckResult) => void;
  onBack?: () => void;
}

export default function CareerSurvey({ surveyType, jobCategory, onComplete, onBack }: CareerSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const surveySlug = surveyType === 'general'
    ? 'survey-general'
    : jobCategory
    ? `spec-check-${jobCategory}`
    : '';

  // 설문 데이터 로드
  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveySlug) {
        setError('설문 정보를 확인할 수 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/data/${surveySlug}.json`);
        if (!response.ok) {
          throw new Error('설문 데이터를 찾을 수 없습니다.');
        }
        const data = await response.json();
        setSurveyData(data);
      } catch (err) {
        console.error('Failed to load survey:', err);
        setError('설문 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSurvey();
  }, [surveySlug]);

  if (isLoading || !surveyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = surveyData.questions[currentStep];
  const progress = ((currentStep + 1) / surveyData.questions.length) * 100;

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < surveyData.questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!surveySlug) {
        throw new Error('설문 식별자가 없습니다.');
      }
      // 먼저 상대경로로 요청 시도, 실패하면 로컬 백엔드(포트 5000)로 폴백합니다.
      const relativeEndpoint =
        surveyType === 'general'
          ? '/api/v1/survey/submit'
          : '/api/v1/survey/spec-check/submit';

      const fallbackEndpoint =
        surveyType === 'general'
          ? 'http://localhost:5000/api/v1/survey/submit'
          : 'http://localhost:5000/api/v1/survey/spec-check/submit';

      const payload =
        surveyType === 'general'
          ? { survey_id: surveySlug, answers }
          : { job_category: jobCategory, answers };

      let response: Response | null = null
      let lastError: any = null

      const tryFetch = async (url: string) => {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          return res
        } catch (err) {
          lastError = err
          return null
        }
      }

      // 1) 상대경로 시도
      response = await tryFetch(relativeEndpoint)

      // 2) 상대경로에서 네트워크 에러가 발생하거나 404/500 등일 경우 포트 5000 폴백
      if (!response) {
        response = await tryFetch(fallbackEndpoint)
      }

      if (!response) {
        throw new Error((lastError as any)?.message || '서버에 연결할 수 없습니다.')
      }

      if (!response.ok) {
        // 서버가 응답했지만 에러를 반환한 경우 가능한 상세 메시지를 표시
        let message = '설문 제출 중 오류가 발생했습니다.'
        try {
          const text = await response.text()
          if (text) message = text
        } catch (e) {
          // ignore
        }
        throw new Error(message)
      }

      const result = await response.json()
      // 성공 시 부모 컴포넌트에게 결과 전달
      onComplete(result)
      // 일반 설문인 경우 추천 직무를 localStorage에 보관 (안전망)
      if (surveyType === 'general' && (result as any)?.recommended_job?.job_id) {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('recommended_job', (result as any).recommended_job.job_id)
          }
        } catch (e) {
          console.warn('Failed to save recommended_job to localStorage', e)
        }
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      // 가능한 에러 메시지를 사용자에게 노출하여 디버깅을 용이하게 합니다.
  const message = (error as any)?.message || String(error) || '설문 제출 중 오류가 발생했습니다.'
      alert(message)
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.optional) return true;
    if (currentQuestion.type === 'text') return answer && answer.trim().length > 0;
    return answer !== undefined && answer !== null;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-semibold">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white"
            >
              돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  const responseLabels = surveyData.response_labels;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← 돌아가기
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{surveyData.title}</h1>
          <p className="text-gray-600">{surveyData.description}</p>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              질문 {currentStep + 1} / {surveyData.questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% 완료</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 질문 카드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-lg p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.text}</h2>

            {/* Likert Scale */}
            {currentQuestion.type === 'likert' && (
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(currentQuestion.id, value)}
                    className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all ${
                      answers[currentQuestion.id] === value
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl">
                      {value === 1 && '😐'}
                      {value === 2 && '🙂'}
                      {value === 3 && '😊'}
                      {value === 4 && '😄'}
                      {value === 5 && '🤩'}
                    </div>
                    <div className="text-sm font-medium text-gray-700">{responseLabels?.[value.toString()] || value}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 텍스트 입력 */}
            {currentQuestion.type === 'text' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none min-h-[120px]"
              />
            )}

            {/* 단일 선택 */}
            {currentQuestion.type === 'single_choice' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    className={`w-full py-4 px-6 rounded-2xl border-2 text-left transition-all ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 다중 선택 */}
            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => {
                  const selected = (answers[currentQuestion.id] || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const current = answers[currentQuestion.id] || [];
                        const updated = selected
                          ? current.filter((v: string) => v !== option.value)
                          : [...current, option.value];
                        handleAnswer(currentQuestion.id, updated);
                      }}
                      className={`w-full py-4 px-6 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-full font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="px-8 py-3 rounded-full font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? '제출 중...' : currentStep === surveyData.questions.length - 1 ? '완료' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
