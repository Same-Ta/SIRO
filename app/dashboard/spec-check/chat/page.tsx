'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createCareerBotChat } from '@/lib/gemini';

export default function SpecCheckChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Gemini 챗봇 초기화
    try {
      chatSessionRef.current = createCareerBotChat();
      
      // 초기 인사 메시지
      setTimeout(() => {
        setMessages([
          {
            role: 'bot',
            content: '안녕하세요! 👋\n\n저는 여러분의 역량을 함께 평가해드릴 AI 코치입니다.\n\n편안하게 대화하듯이 답변해주세요. 여러분의 경험과 강점에 대해 이야기 나눠볼까요?\n\n먼저, 가장 자신있는 분야나 역량이 있다면 말씀해주세요!'
          }
        ]);
      }, 500);
    } catch (error) {
      console.error('Gemini 초기화 실패:', error);
      setMessages([
        {
          role: 'bot',
          content: '죄송합니다. 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chatSessionRef.current) return;

    const userMessage = userInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setUserInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessage(userMessage);
      const botResponse = result.response.text();

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: botResponse 
        }]);
        setIsTyping(false);

        // 대화가 충분히 진행되면 완료 제안
        if (messages.length >= 10) {
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              role: 'bot', 
              content: '충분히 이야기를 나눈 것 같네요! 😊\n\n지금까지의 대화를 바탕으로 역량 분석 결과를 확인하시겠어요?'
            }]);
            setIsComplete(true);
          }, 2000);
        }
      }, 800);
    } catch (error) {
      console.error('Gemini 응답 실패:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: '죄송합니다. 응답 중 오류가 발생했습니다. 다시 한 번 말씀해주시겠어요?'
      }]);
    }
  };

  const handleComplete = () => {
    // 역량 분석 결과 페이지로 이동
    const conversationData = {
      messages: messages.filter(m => m.role === 'user').map(m => m.content),
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('spec_check_result', JSON.stringify(conversationData));
    router.push('/dashboard/spec-check/result');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F9FA] z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💼</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-lg">스펙체크</h1>
                <p className="text-sm text-gray-500">AI와 대화하며 역량 평가</p>
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
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
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

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-6"
              >
                <button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  역량 분석 결과 보기 →
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        {!isComplete && (
          <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  rows={3}
                  className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-[15px]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all self-end
                    ${userInput.trim()
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  전송
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 자연스럽게 대화하듯이 답변해주세요. 구체적일수록 정확한 역량 분석이 가능합니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
