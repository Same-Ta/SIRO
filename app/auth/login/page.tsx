'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('이메일과 비밀번호를 입력해주세요')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      })
      
      console.log('로그인 응답:', response)
      
      // 백엔드 API 명세서에 따른 응답 처리
      if (response.success && response.data) {
        // 토큰 저장
        localStorage.setItem('access_token', response.data.accessToken)
        localStorage.setItem('refresh_token', response.data.refreshToken)
        localStorage.setItem('x-user-id', response.data.userId)
        
        toast.success(`환영합니다, ${response.data.name}님!`)
        
        // 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } else if (response.error) {
        // 에러 코드에 따른 처리
        const errorCode = response.error.code
        const errorMessage = response.error.message
        
        if (errorCode === 'INVALID_CREDENTIALS') {
          toast.error('이메일 또는 비밀번호가 잘못되었습니다')
        } else if (errorCode === 'USER_NOT_FOUND') {
          toast.error('등록되지 않은 사용자입니다')
        } else {
          toast.error(errorMessage || '로그인에 실패했습니다')
        }
      }
    } catch (error: any) {
      console.error('로그인 실패:', error)
      
      // 네트워크 에러 또는 서버 에러
      if (error.response?.data?.error) {
        const errorCode = error.response.data.error.code
        const errorMessage = error.response.data.error.message
        
        if (errorCode === 'INVALID_CREDENTIALS') {
          toast.error('이메일 또는 비밀번호가 잘못되었습니다')
        } else if (errorCode === 'USER_NOT_FOUND') {
          toast.error('등록되지 않은 사용자입니다')
        } else {
          toast.error(errorMessage || '로그인에 실패했습니다')
        }
      } else if (error.message === 'Network Error') {
        toast.error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        toast.error('로그인에 실패했습니다')
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
          <h1 className="text-2xl font-bold text-[#1B1C1E] mb-2">로그인</h1>
          <p className="text-sm text-[#1B1C1E]/60">PROOF에 오신 것을 환영합니다</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[24px] p-8 border border-[#EAEBEC]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-[#1B1C1E] mb-2">
                이메일
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
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-[#25A778] text-white font-bold rounded-[16px] hover:bg-[#2DC98E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <button className="text-sm text-[#1B1C1E]/60 hover:text-[#1B1C1E] font-medium">
              비밀번호를 잊으셨나요?
            </button>
            <div className="text-sm text-[#1B1C1E]/60">
              계정이 없으신가요?{' '}
              <Link href="/auth/register" className="text-[#25A778] font-bold hover:text-[#2DC98E]">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
