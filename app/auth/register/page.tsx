'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    major: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('모든 필수 항목을 입력해주세요')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다')
      return
    }
    
    if (formData.password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        university: formData.university,
        major: formData.major,
      })
      
      console.log('회원가입 응답:', response)
      
      // 백엔드 API 명세서에 따른 응답 처리
      if (response.success && response.data) {
        // 토큰 저장
        localStorage.setItem('access_token', response.data.accessToken)
        localStorage.setItem('refresh_token', response.data.refreshToken)
        localStorage.setItem('x-user-id', response.data.userId)
        
        toast.success('회원가입이 완료되었습니다!')
        
        // 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } else if (response.error) {
        // 에러 코드에 따른 처리
        const errorCode = response.error.code
        const errorMessage = response.error.message
        
        if (errorCode === 'EMAIL_ALREADY_EXISTS') {
          toast.error('이미 사용 중인 이메일입니다')
        } else {
          toast.error(errorMessage || '회원가입에 실패했습니다')
        }
      }
    } catch (error: any) {
      console.error('회원가입 실패:', error)
      
      // 네트워크 에러 또는 서버 에러
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code
        const errorMessage = error.response.data.error.message
        
        if (errorCode === 'EMAIL_ALREADY_EXISTS') {
          toast.error('이미 사용 중인 이메일입니다')
        } else {
          toast.error(errorMessage || '회원가입에 실패했습니다')
        }
      } else if (error.message === 'Network Error') {
        toast.error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        toast.error('회원가입에 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F2F3] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 bg-[#25A778] rounded-[12px] flex items-center justify-center">
              <span className="text-white font-extrabold text-2xl">P</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#1B1C1E] mb-2">회원가입</h1>
          <p className="text-sm text-[#1B1C1E]/60">새로운 계정을 만들어보세요</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[24px] p-8 border border-[#EAEBEC]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                이름 <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="홍길동"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                이메일 <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                비밀번호 <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1B1C1E]/40 hover:text-[#1B1C1E]/70 text-sm font-medium"
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                비밀번호 확인 <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1B1C1E]/40 hover:text-[#1B1C1E]/70 text-sm font-medium"
                >
                  {showConfirmPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                대학교
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 서울대학교"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>

            {/* Major */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                전공
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 컴퓨터공학과"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-[#25A778] text-white font-bold rounded-[16px] hover:bg-[#2DC98E] transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <div className="text-sm text-[#1B1C1E]/60">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="text-[#25A778] font-bold hover:text-[#2DC98E]">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
