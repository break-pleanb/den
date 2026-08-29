import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from './token'

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 리프레시 요청 자체는 http 인스턴스를 타지 않는다 — 요청 인터셉터가 만료된
// 액세스 토큰을 다시 Authorization 헤더에 실어 보내는 걸 막기 위함이다.
const refreshClient = axios.create({ baseURL: '/api' })

let refreshPromise: Promise<string> | null = null

function handleAuthFailure() {
  clearTokens()
  if (location.pathname !== '/login') {
    location.href = '/login'
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const url = originalRequest?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      handleAuthFailure()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<{ accessToken: string }>('/auth/refresh', { refreshToken })
          .then(({ data }) => {
            setAccessToken(data.accessToken)
            return data.accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }
      const accessToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return http(originalRequest)
    } catch (refreshError) {
      handleAuthFailure()
      return Promise.reject(refreshError)
    }
  },
)
