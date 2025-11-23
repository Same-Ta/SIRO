'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

type ViewMode = 'intro' | 'major-select' | 'major-saved' | 'survey' | 'result'

interface SurveyResult {
  survey_id: string
  submitted_at: string
  total_questions: number
  job_scores: Record<string, number>
  preference_top3: Array<{ job_id: string; name: string; icon?: string; score: number; rank: number }>
  fit_top3: Array<{ job_id: string; name: string; icon?: string; score: number; rank: number }>
  recommended_job: { job_id: string; name: string; icon?: string; score: number; rank: number; reason?: string }
  insights: string[]
}

const CareerSurvey = dynamic(() => import('@/components/CareerSurvey'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">설문을 불러오는 중입니다...</p>
      </div>
    </div>
  ),
})

// 학과 → 직무 매핑 테이블
const MAJOR_OPTIONS = {
  '경영/경제': [
    { value: 'business', label: '경영학과', matchedJob: 'marketing' },
    { value: 'mis', label: '경영정보학과 (MIS)', matchedJob: 'data' },
    { value: 'economics', label: '경제학과', matchedJob: 'strategy' },
    { value: 'international_business', label: '국제경영학과', matchedJob: 'marketing' },
    { value: 'global_business', label: '글로벌비즈니스학과', matchedJob: 'sales' },
  ],
  '회계/재무': [
    { value: 'accounting', label: '회계학과', matchedJob: 'finance' },
    { value: 'finance', label: '재무/금융학과', matchedJob: 'finance' },
    { value: 'tax', label: '세무학과', matchedJob: 'finance' },
  ],
  '마케팅/광고': [
    { value: 'marketing', label: '마케팅학과', matchedJob: 'marketing' },
    { value: 'advertising', label: '광고홍보학과', matchedJob: 'brand' },
    { value: 'media', label: '미디어커뮤니케이션학과', matchedJob: 'brand' },
  ],
  '무역/물류': [
    { value: 'trade', label: '무역학과', matchedJob: 'sales' },
    { value: 'international_trade', label: '국제통상학과', matchedJob: 'sales' },
    { value: 'logistics', label: '물류/유통학과', matchedJob: 'operations' },
  ],
  '경영 전문': [
    { value: 'hr', label: '인사조직학과', matchedJob: 'hr' },
    { value: 'service', label: '서비스경영학과', matchedJob: 'operations' },
    { value: 'operations', label: '생산/운영관리학과', matchedJob: 'operations' },
  ],
  '융합/특수': [
    { value: 'analytics', label: '비즈니스 애널리틱스', matchedJob: 'data' },
    { value: 'data_science', label: '데이터 사이언스 (경영)', matchedJob: 'data' },
    { value: 'venture', label: '벤처/창업학과', matchedJob: 'strategy' },
    { value: 'hospitality', label: '호텔/관광경영학과', matchedJob: 'operations' },
  ],
}

const JOB_NAMES: Record<string, string> = {
  marketing: '마케팅',
  hr: '인사',
  brand: '브랜드',
  strategy: '전략기획',
  finance: '재무/회계',
  sales: '영업',
  data: '데이터분석',
  operations: '운영/관리',
}

const JOB_EMOJI: Record<string, string> = {
  marketing: '📢',
  hr: '👥',
  brand: '💡',
  strategy: '🎯',
  finance: '💰',
  sales: '🤝',
  data: '📊',
  operations: '⚙️',
}

export default function CareerPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('intro')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [matchedJob, setMatchedJob] = useState('')
  const [surveyResult, setSurveyResult] = useState<SurveyResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 학과 선택 → 저장
  const handleMajorSave = async () => {
    if (!selectedMajor || !matchedJob) return

    setIsSaving(true)
    try {
      // API 호출 (현재는 mock)
      // const response = await fetch('http://localhost:5000/api/v1/career/save-major', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ major: selectedMajor, user_id: 'user123' })
      // })
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setViewMode('major-saved')
      
      // 저장 후 localStorage에 선택된 직무 저장하고 스펙체크로 리다이렉트
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('selected_job', matchedJob)
        }
      } catch (e) {
        console.warn('localStorage set failed', e)
      }
      // 2초 후 스펙체크로 리다이렉트
      setTimeout(() => {
        router.push(`/dashboard/spec-check/${matchedJob}`)
      }, 2000)
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSurveyComplete = (result: SurveyResult) => {
    setSurveyResult(result)
    setViewMode('result')

    // 설문 완료 시 추천 직무를 localStorage에 저장해 스펙체크 진입 흐름에서 재사용합니다.
    try {
      if (typeof window !== 'undefined' && result?.recommended_job?.job_id) {
        window.localStorage.setItem('recommended_job', result.recommended_job.job_id)
      }
    } catch (e) {
      console.warn('Failed to persist recommended job to localStorage', e)
    }
  }

  // 설문 완료 시 추천 직무를 localStorage 에 저장(스펙체크 인덱스에서 이용)
  // result 는 handleSurveyComplete 통해 반영되므로 effect로도 처리 가능하지만,
  // 설문 완료 시점에 바로 저장하는 편이 직관적입니다.
  // (handleSurveyComplete 내부에서 불러도 됨 — 여기선 간단히 저장)
  // NOTE: survey 컴포넌트에서 onComplete로 받은 시점에 저장합니다.

  // 설문 결과 직무 선택 → 저장
  const handleJobSelectAndSave = async (jobId: string) => {
    setIsSaving(true)
    try {
      // API 호출 (현재는 mock)
      // const response = await fetch('http://localhost:5000/api/v1/career/save-job', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ job_id: jobId, user_id: 'user123', source: 'survey' })
      // })
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 저장 후 localStorage에 추천 직무 저장
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('selected_job', jobId)
          // also store a small human-friendly value
          window.localStorage.setItem('recommended_job', jobId)
        }
      } catch (e) {
        console.warn('localStorage set failed', e)
      }
      // 저장 후 스펙체크로 리다이렉트
      router.push(`/dashboard/spec-check/${jobId}`)
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 학과 선택 시 매칭된 직무 찾기
  const handleMajorChange = (value: string) => {
    setSelectedMajor(value)
    
    // 선택한 학과의 매칭 직무 찾기
    for (const category of Object.values(MAJOR_OPTIONS)) {
      const major = category.find(m => m.value === value)
      if (major) {
        setMatchedJob(major.matchedJob)
        break
      }
    }
  }

  const otherJobCandidates = useMemo(() => {
    if (!surveyResult) return []
    const primaryIds = new Set([
      surveyResult.recommended_job.job_id,
      ...surveyResult.preference_top3.map((job) => job.job_id),
    ])

    return Object.entries(surveyResult.job_scores || {})
      .map(([jobId, score]) => ({ job_id: jobId, name: JOB_NAMES[jobId] ?? jobId, score }))
      .filter((job) => !primaryIds.has(job.job_id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [surveyResult])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <AnimatePresence mode="wait">
        {/* 인트로 화면 */}
        {viewMode === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto max-w-4xl"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-6"
              >
                🎯
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                나에게 맞는 직무를 찾아보세요
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                상경계열 학생을 위한 직무 적합도 검사
              </p>
              <p className="text-sm text-gray-500">
                약 5-7분 소요 | 선호도와 역량 분석
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* 옵션 1: 학과 선택 */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('major-select')}
                className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all"
              >
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  학과로 직무 찾기
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  내 학과를 선택하면<br />
                  관련 직무를 빠르게 추천해드려요
                </p>
                <div className="text-purple-600 font-semibold text-sm">
                  → 1분 소요
                </div>
              </motion.div>

              {/* 옵션 2: 설문 */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('survey')}
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 cursor-pointer text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-4">🎓</div>
                  <h3 className="text-xl font-bold mb-3">
                    설문으로 추천받기
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    30개 질문으로 더 정확하게<br />
                    나의 선호와 역량을 분석해요
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                      추천
                    </span>
                    <span className="text-sm font-semibold">
                      → 5-7분 소요
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-gray-500">
                💡 막막하다면? <span className="font-semibold text-purple-600">설문으로 추천받기</span>를 선택해보세요
              </p>
            </div>
          </motion.div>
        )}

        {/* 학과 선택 화면 */}
        {viewMode === 'major-select' && (
          <motion.div
            key="major-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <button
                onClick={() => setViewMode('intro')}
                className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors"
              >
                ← 돌아가기
              </button>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                학과를 선택해주세요
              </h2>
              <p className="text-gray-600 mb-8">
                선택한 학과에 맞는 직무를 자동으로 매칭해드려요
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  상경계열 학과/전공
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => handleMajorChange(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-lg focus:border-purple-500 focus:outline-none transition-all bg-white"
                >
                  <option value="">학과를 선택하세요</option>
                  {Object.entries(MAJOR_OPTIONS).map(([category, majors]) => (
                    <optgroup key={category} label={category}>
                      {majors.map((major) => (
                        <option key={major.value} value={major.value}>
                          {major.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 매칭된 직무 미리보기 */}
              {matchedJob && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{JOB_EMOJI[matchedJob]}</span>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">매칭 직무</p>
                      <p className="text-xl font-bold text-purple-900">
                        {JOB_NAMES[matchedJob]}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    이 직무로 저장하고 세부 역량 분석을 진행할 수 있어요
                  </p>
                </motion.div>
              )}

              <button
                onClick={handleMajorSave}
                disabled={!selectedMajor || isSaving}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '저장하고 스펙체크 진행하기 →'}
              </button>

              <p className="text-sm text-gray-500 mt-6 text-center">
                💡 저장된 직무는 스펙체크와 활동 추천에 사용됩니다
              </p>
            </div>
          </motion.div>
        )}

        {/* 학과 선택 저장 완료 화면 */}
        {viewMode === 'major-saved' && (
          <motion.div
            key="major-saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="container mx-auto max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-7xl mb-6"
              >
                ✅
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                직무가 저장되었습니다!
              </h2>
              <p className="text-gray-600 mb-2">
                {JOB_NAMES[matchedJob]} 직무로 설정되었어요
              </p>
              <p className="text-sm text-gray-500">
                잠시 후 스펙체크 페이지로 이동합니다...
              </p>
            </div>
          </motion.div>
        )}

        {/* 설문 화면 (임시) */}
        {viewMode === 'survey' && (
          <CareerSurvey
            surveyType="general"
            onComplete={handleSurveyComplete}
            onBack={() => setViewMode('intro')}
          />
        )}

        {/* 설문 결과 화면 - 대분류 직무만 표시 */}
        {viewMode === 'result' && surveyResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto max-w-4xl"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <button
                onClick={() => setViewMode('survey')}
                className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
              >
                ← 돌아가기
              </button>

              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  🎯
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  직무 적합도 분석 완료!
                </h2>
                <p className="text-gray-600">
                  설문 결과를 바탕으로 당신에게 맞는 직무를 추천드려요
                </p>
              </div>

              {/* 추천 직무 카드 그리드 */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  📊 직무별 적합도 순위
                </h3>
                
                {/* 1순위 - 추천 직무 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">🥇</span>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm font-medium">가장 적합한 직무</p>
                        <h3 className="text-2xl font-bold">
                          {JOB_EMOJI[surveyResult.recommended_job.job_id] || '💼'} {surveyResult.recommended_job.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70">종합 점수</p>
                        <p className="text-3xl font-bold">
                          {surveyResult.recommended_job.score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm mb-4">
                      {surveyResult.recommended_job.reason}
                    </p>
                    <button
                      onClick={() => handleJobSelectAndSave(surveyResult.recommended_job.job_id)}
                      disabled={isSaving}
                      className="w-full bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                      {isSaving ? '저장 중...' : '이 직무 선택하고 스펙체크 하기 →'}
                    </button>
                  </div>
                </motion.div>

                {/* 나머지 직무들 */}
                <div className="grid md:grid-cols-2 gap-4">
                  {surveyResult.preference_top3.slice(1, 3).map((job, index) => (
                    <motion.div
                      key={job.job_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {index === 0 ? '🥈' : '🥉'}
                          </span>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">{index + 2}순위</p>
                            <h4 className="text-lg font-bold text-gray-900">
                              {JOB_EMOJI[job.job_id] || '💼'} {job.name}
                            </h4>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {job.score}
                        </p>
                      </div>
                      <button
                        onClick={() => handleJobSelectAndSave(job.job_id)}
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        선택하기
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* 기타 직무 목록 */}
                {otherJobCandidates.length > 0 && (
                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium">
                      ▼ 다른 직무 결과 보기
                    </summary>
                    <div className="mt-4 space-y-2">
                      {otherJobCandidates.map((job) => (
                        <div
                          key={job.job_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{JOB_EMOJI[job.job_id] || '💼'}</span>
                            <span className="font-semibold text-gray-900">{job.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium">{job.score.toFixed(1)}</span>
                            <button
                              onClick={() => handleJobSelectAndSave(job.job_id)}
                              disabled={isSaving}
                              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg font-medium transition-all"
                            >
                              선택
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* 설문 선호/적합도 Top3 요약 섹션 */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* 설문 선호 기반 Top 3 */}
                <div className="bg-purple-50 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-purple-900 mb-3">
                    설문 선호 기반 Top 3
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {surveyResult.preference_top3.map((job) => (
                      <li
                        key={`pref-${job.job_id}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
                            {job.rank}
                          </span>
                          <span className="font-medium text-gray-900">
                            {JOB_EMOJI[job.job_id] || '💼'} {job.name}
                          </span>
                        </div>
                        <span className="font-semibold text-purple-700">
                          {job.score.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 적합도(역량) 기반 Top 3 */}
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">
                    적합도(역량) 기반 Top 3
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {surveyResult.fit_top3.map((job) => (
                      <li
                        key={`fit-${job.job_id}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                            {job.rank}
                          </span>
                          <span className="font-medium text-gray-900">
                            {JOB_EMOJI[job.job_id] || '💼'} {job.name}
                          </span>
                        </div>
                        <span className="font-semibold text-blue-700">
                          {job.score.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 추천된 직무/세부 직무 요약 카드 (가이드용) */}
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 rounded-2xl p-6 mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🧭</span>
                  추천 직무 요약
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  아래에서 1순위 직무를 선택하면, 해당 직무의 세부 직무(예: 마케터 → 그로스/디지털/브랜드/콘텐츠 등)에 대한
                  스펙체크로 이어집니다.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                  <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
                    1순위 추천 직무: {JOB_EMOJI[surveyResult.recommended_job.job_id] || '💼'} {surveyResult.recommended_job.name}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
                    설문 선호 Top3와 적합도 Top3 결과를 기반으로 세부 직무를 분석합니다.
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <p className="text-blue-900 font-semibold mb-2">
                  💡 다음 단계: 스펙체크
                </p>
                <p className="text-blue-800 text-sm">
                  직무를 선택하면 해당 직무의 <strong>세부 분야</strong>를 분석하는 스펙체크(20문항)를 진행할 수 있어요.<br/>
                  예: 마케팅 → 그로스마케터, 디지털마케터, 브랜드마케터, 콘텐츠마케터 등
                </p>
                {surveyResult.insights?.length ? (
                  <ul className="mt-4 text-sm text-blue-900 list-disc list-inside space-y-1">
                    {surveyResult.insights.map((insight, idx) => (
                      <li key={`insight-${idx}`}>{insight}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
