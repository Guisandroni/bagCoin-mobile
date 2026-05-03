import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface TokenStore {
  accessToken: string | null
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
  getAccessToken: () => string | null
}

let memoryToken: string | null = null

const tokenStore: TokenStore = {
  accessToken: null,
  setTokens(access: string, _refresh: string) {
    void _refresh
    memoryToken = access
    this.accessToken = access
  },
  clearTokens() {
    memoryToken = null
    this.accessToken = null
  },
  getAccessToken() {
    if (typeof window === "undefined") return null
    if (!memoryToken) {
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
      if (match) memoryToken = decodeURIComponent(match[1])
    }
    return memoryToken || this.accessToken
  },
}

export function getTokenStore(): TokenStore {
  return tokenStore
}

function setAuthCookies(access_token: string, refresh_token: string) {
  const accessExpiry = 30 * 60
  const refreshExpiry = 7 * 24 * 60 * 60
  document.cookie = `access_token=${encodeURIComponent(access_token)}; path=/; max-age=${accessExpiry}; SameSite=Lax`
  document.cookie = `refresh_token=${encodeURIComponent(refresh_token)}; path=/; max-age=${refreshExpiry}; SameSite=Lax`
  memoryToken = access_token
  tokenStore.accessToken = access_token
}

function clearAuthCookies() {
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax"
  document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax"
  memoryToken = null
  tokenStore.accessToken = null
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.access_token && response.data?.refresh_token) {
      setAuthCookies(response.data.access_token, response.data.refresh_token)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const match = document.cookie.match(/(?:^|; )refresh_token=([^;]*)/)
      const refreshToken = match ? decodeURIComponent(match[1]) : null

      if (!refreshToken) {
        clearAuthCookies()
        isRefreshing = false
        processQueue(new Error("No refresh token"))
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        )
        const { access_token, refresh_token } = response.data
        setAuthCookies(access_token, refresh_token)
        processQueue(null, access_token)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthCookies()
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export { setAuthCookies, clearAuthCookies }
export default apiClient