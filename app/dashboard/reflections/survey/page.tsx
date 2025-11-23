'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { surveyQuestions } from '@/lib/reflection-templates';

export default function ReflectionSurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const currentQuestion = surveyQuestions[currentStep];
  const progress = ((currentStep + 1) / surveyQuestions.length) * 100;

  const handleOptionSelect = (value: string) => {
    if (currentQuestion.type === 'multiple') {
      const newSelected = selectedOptions.includes(value)
        ? selectedOptions.filter(v => v !== value)
        : [...selectedOptions, value];
      setSelectedOptions(newSelected);
    } else {
      setSelectedOptions([value]);
    }
  };

  const handleNext = () => {
    // Save answer
    const answer = currentQuestion.type === 'multiple' ? selectedOptions : selectedOptions[0];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      // Navigate to recommendation page with survey results
      const queryParams = new URLSearchParams();
      queryParams.set('survey', JSON.stringify({ ...answers, [currentQuestion.id]: answer }));
      router.push(`/dashboard/reflections/template-recommendation?${queryParams.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const prevAnswer = answers[surveyQuestions[currentStep - 1].id];
      setSelectedOptions(Array.isArray(prevAnswer) ? prevAnswer : [prevAnswer]);
    }
  };

  const canProceed = selectedOptions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              질문 {currentStep + 1} / {surveyQuestions.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptions.includes(option.value);
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full p-5 rounded-xl border-2 transition-all text-left
                      flex items-center gap-4
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {currentQuestion.type === 'multiple' && (
              <p className="text-sm text-gray-500 mt-4">
                여러 개 선택 가능합니다
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              ← 이전
            </motion.button>
          )}
          
          <motion.button
            onClick={handleNext}
            disabled={!canProceed}
            whileHover={canProceed ? { scale: 1.02 } : {}}
            whileTap={canProceed ? { scale: 0.98 } : {}}
            className={`
              flex-1 px-6 py-3 rounded-xl font-medium transition-all
              ${canProceed
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {currentStep === surveyQuestions.length - 1 ? '완료 →' : '다음 →'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
