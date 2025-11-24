'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const mockLogs = [
    { 
      id: 1, 
      project: '서버랩 D-1',
      title: '디프만 15기 디자이너 작곡', 
      date: '2024 상반기',
      period: '서류 준비',
      keywords: ['협업', '리더십', 'React']
    },
    { 
      id: 2, 
      project: '2차 면접 D-2',
      title: '2024 네이버 공채', 
      date: '2024 상반기',
      period: '서류 준비',
      keywords: ['코딩', '문제해결', 'Python']
    },
    { 
      id: 3, 
      project: '2차 면접 D-2',
      title: '토스 어시스턴트 계약직', 
      date: '2024 상반기',
      period: '면접 합격',
      keywords: ['디자인', 'UX', 'Figma']
    },
    { 
      id: 4, 
      project: '1차 면접 D-9',
      title: '카카오 BX 어시스턴트', 
      date: '2024 상반기',
      period: '서류 합격',
      keywords: ['협업', '개발']
    },
    { 
      id: 5, 
      project: '2차 면접 D-12',
      title: '현대자동차 채용 전환형 인턴', 
      date: '2024 상반기',
      period: '면접 합격',
      keywords: ['인턴', '전환']
    }
  ]

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내 공고</h1>
            <p className="text-sm text-gray-500 mt-1">진행중인 채용 공고를 관리하세요</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:bg-gray-50 transition-all">
              내 정보 가져오기
            </button>
            <Link 
              href="/dashboard/spaces/new"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
            >
              + 새 스페이스
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">현재 진행중인 공고 모아보기</h2>
        </div>

        {/* Logs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {mockLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
            >
              {/* Project Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-bold text-indigo-600">{log.project}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>

              {/* Date Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                  {log.date}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-base text-gray-900 mb-3 line-clamp-2 min-h-[48px]">
                {log.title}
              </h3>

              {/* Period */}
              <div className="mb-4">
                <span className="text-sm text-gray-500 font-medium">{log.period}</span>
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-2">
                {log.keywords.map((keyword, index) => (
                  <span 
                    key={index} 
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      index % 3 === 0 
                        ? 'bg-blue-50 text-blue-700' 
                        : index % 3 === 1 
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-pink-50 text-pink-700'
                    }`}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* All Logs Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">모든 공고</h2>
            <button className="text-sm text-gray-500 font-medium hover:text-gray-700">
              간략히 보기
            </button>
          </div>
        </div>

        {/* All Logs List */}
        <div className="space-y-4">
          {mockLogs.slice(0, 3).map((log) => (
            <div 
              key={log.id}
              className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <span className="text-sm font-medium text-gray-500 w-24">{log.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm font-bold text-indigo-600 w-32">{log.project}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 flex-1">{log.title}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-500 font-medium">{log.period}</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
