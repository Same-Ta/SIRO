"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// 스펙체크: Gemini 챗봇과 대화하며 역량 평가
// - 사용자와 자유로운 대화를 통해 역량을 평가합니다
// - STAR 기법이 아닌 자연스러운 대화로 진행됩니다

export default function SpecCheckPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  // 스펙체크는 바로 챗봇 페이지로 이동
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <div className="text-6xl mb-6">💼</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">스펙체크</h1>
        <p className="text-gray-700 mb-8">
          AI와 대화하며 나의 역량을 평가하고<br/>
          강점과 개선점을 발견해보세요.
        </p>
        <button
          onClick={() => router.push('/dashboard/spec-check/chat')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all text-lg"
        >
          스펙체크 시작하기 →
        </button>
      </div>
    </div>
  )
}
