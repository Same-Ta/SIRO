import axios from 'axios'

// Axios 인스턴스 생성 (백엔드 API 명세서 기준)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // CORS 정책에 따라 false로 변경
})

// 요청 인터셉터 - 인증 헤더 자동 추가
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // JWT 토큰 방식 (우선순위)
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // x-user-id 방식 (대체)
      const userId = localStorage.getItem('x-user-id')
      if (userId) {
        config.headers['x-user-id'] = userId
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리 및 토큰 갱신
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러 - 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            'http://localhost:8000/auth/refresh',
            { refreshToken },
            { 
              headers: { 'Content-Type': 'application/json' },
              withCredentials: false 
            }
          )

          if (response.data.success && response.data.data) {
            const { accessToken } = response.data.data
            localStorage.setItem('access_token', accessToken)

            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh 실패 시 로그아웃
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('x-user-id')
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // 에러 로깅
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Request Error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api
