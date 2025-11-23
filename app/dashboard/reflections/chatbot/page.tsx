'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { reflectionTemplates, competencyKeywords } from '@/lib/reflection-templates';
import { createStarReflectionChat, analyzeCompetencies } from '@/lib/gemini';

function ChatbotReflectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; content: string; questionKey?: string }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && !initialized) {
      const selectedTemplate = Object.values(reflectionTemplates).find(
        t => t.id === templateId
      );
      if (selectedTemplate) {
        setTemplate(selectedTemplate);
        setInitialized(true);

        // Gemini 챗봇 초기화
        try {
          chatSessionRef.current = createStarReflectionChat();
        } catch (error) {
          console.error('Gemini 초기화 실패:', error);
        }

        // 자연스러운 시작 메시지 (한 번에)
        setTimeout(async () => {
          if (chatSessionRef.current) {
            try {
              const result = await chatSessionRef.current.sendMessage(
                `사용자가 ${selectedTemplate.name} 회고를 시작합니다. 간단히 인사하고, 첫 번째 질문(Situation - 상황)을 자연스럽게 물어봐주세요. 한 메시지로 보내주세요.`
              );
              const greeting = result.response.text();
              
              setMessages([{
                role: 'bot',
                content: greeting,
                questionKey: selectedTemplate.questions[0].key
              }]);
            } catch (error) {
              console.error('첫 질문 생성 실패:', error);
            }
          }
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (content: string, questionKey?: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content, questionKey }]);
      setIsTyping(false);
    }, 800);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'user', content }]);
  };

  const askNextQuestion = (templateData: any, index: number) => {
    if (index < templateData.questions.length) {
      const question = templateData.questions[index];
      addBotMessage(`**${question.label}**\n\n${question.prompt}`, question.key);
    } else {
      // All questions completed
      completeReflection();
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !template || !chatSessionRef.current) return;

    const userAnswer = userInput;
    const currentQuestion = template.questions[currentQuestionIndex];
    
    // 답변 저장
    setAnswers(prev => ({ ...prev, [currentQuestion.key]: userAnswer }));
    setMessages(prev => [...prev, { role: 'user', content: userAnswer }]);
    setUserInput('');
    setIsTyping(true);

    try {
      // 다음 질문으로
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // 다음 질문이 있는지 확인
      if (nextIndex < template.questions.length) {
        const nextQuestion = template.questions[nextIndex];
        // Gemini에게 응답과 다음 질문을 함께 요청
        const result = await chatSessionRef.current.sendMessage(
          `사용자 답변: "${userAnswer}"

이 답변에 공감하며 짧게 반응하고, 바로 다음 질문(${nextQuestion.label})을 자연스럽게 이어서 물어봐주세요. 한 메시지에 담아주세요.`
        );
        const combinedResponse = result.response.text();
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: combinedResponse,
            questionKey: nextQuestion.key
          }]);
          setIsTyping(false);
        }, 800);
      } else {
        // 마지막 답변에 대한 공감 메시지
        const result = await chatSessionRef.current.sendMessage(
          `사용자 답변: "${userAnswer}"

마지막 답변에 공감하며, 모든 질문이 끝났음을 알리는 따뜻한 마무리 멘트를 해주세요.`
        );
        const finalResponse = result.response.text();

        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'bot', 
            content: finalResponse
          }]);
          setIsTyping(false);
          
          // 역량 분석 시작
          setTimeout(() => {
            completeReflection();
          }, 2000);
        }, 800);
      }
    } catch (error) {
      console.error('Gemini 응답 실패:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: '죄송합니다, 응답 중 오류가 발생했습니다. 다시 말씀해주시겠어요?'
      }]);
    }
  };

  const extractCompetencies = (answersData: Record<string, string>) => {
    const competencies: Array<{ name: string; score: number; keywords: string[] }> = [];
    const allText = Object.values(answersData).join(' ').toLowerCase();

    Object.entries(competencyKeywords).forEach(([competency, keywords]) => {
      const foundKeywords = keywords.filter(keyword => 
        allText.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        competencies.push({
          name: competency,
          score: Math.min(100, foundKeywords.length * 20 + Math.random() * 20),
          keywords: foundKeywords
        });
      }
    });

    // Sort by score and take top 5
    return competencies
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const completeReflection = async () => {
    try {
      // Gemini를 사용한 역량 분석
      const analysisResult = await analyzeCompetencies(answers);
      
      // 백엔드에 저장
      try {
        const response = await fetch('/api/v1/reflections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
            'x-user-id': localStorage.getItem('x-user-id') || 'dev-user-default',
          },
          body: JSON.stringify({
            template_id: template.id,
            template_name: template.name,
            answers: answers,
            competencies: analysisResult.competencies.map((c: any) => c.name),
            competency_scores: analysisResult.competencies.reduce((acc: any, c: any) => {
              acc[c.name] = c.score;
              return acc;
            }, {}),
            competency_analysis: analysisResult,
            created_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          console.error('저장 실패');
        }
      } catch (error) {
        console.error('저장 중 오류:', error);
      }

      // 세션에도 저장 (결과 페이지에서 사용)
      sessionStorage.setItem('reflection_result', JSON.stringify({
        template: template.id,
        templateName: template.name,
        answers,
        competencies: analysisResult.competencies,
        summary: analysisResult.summary,
        createdAt: new Date().toISOString()
      }));

      // 결과 페이지로 이동
      router.push('/dashboard/reflections/result');
    } catch (error) {
      console.error('역량 분석 실패:', error);
      // 에러 시 기본 분석 사용
      const fallbackCompetencies = extractCompetencies(answers);
      sessionStorage.setItem('reflection_result', JSON.stringify({
        template: template.id,
        templateName: template.name,
        answers,
        competencies: fallbackCompetencies,
        createdAt: new Date().toISOString()
      }));
      router.push('/dashboard/reflections/result');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8F9FA] z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-bold text-gray-800 text-lg">{template.name}</h1>
                <p className="text-sm text-gray-500">
                  질문 {currentQuestionIndex + 1} / {template.questions.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[75%] p-4 rounded-2xl whitespace-pre-wrap text-[15px] leading-relaxed
                      ${message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }
                    `}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4"
              >
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="답변을 입력하세요... (Shift+Enter로 줄바꿈)"
                rows={3}
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[15px]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                className={`
                  px-8 py-3 rounded-xl font-medium transition-all self-end
                  ${userInput.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                전송
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 답변은 자유롭게 작성해주세요. 구체적으로 작성할수록 정확한 역량 분석이 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatbotReflectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ChatbotReflectionContent />
    </Suspense>
  );
}
