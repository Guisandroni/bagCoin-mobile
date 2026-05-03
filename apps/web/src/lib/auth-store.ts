import { create } from "zustand"
import apiClient, { getTokenStore, setAuthCookies, clearAuthCookies } from "@/lib/api-client"

interface User {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  is_active: boolean
  role: string
  avatar_url: string | null
  auth_provider: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string, phoneNumber?: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const response = await apiClient.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      const { access_token, refresh_token } = response.data
      setAuthCookies(access_token, refresh_token)
      getTokenStore().setTokens(access_token, refresh_token)

      await get().fetchUser()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({
        isLoading: false,
        error: err.response?.data?.detail || "Falha ao fazer login",
      })
      throw error
    }
  },

  register: async (email: string, password: string, fullName?: string, phoneNumber?: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.post("/auth/register", {
        email,
        password,
        full_name: fullName || null,
        phone_number: phoneNumber || null,
      })
      set({ isLoading: false })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      const detail = err.response?.data?.detail
      set({
        isLoading: false,
        error: typeof detail === "object" ? "Email já cadastrado" : detail || "Falha ao registrar",
      })
      throw error
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post("/auth/google", { id_token: idToken })

      const { access_token, refresh_token } = response.data
      setAuthCookies(access_token, refresh_token)
      getTokenStore().setTokens(access_token, refresh_token)

      await get().fetchUser()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({
        isLoading: false,
        error: err.response?.data?.detail || "Falha ao fazer login com Google",
      })
      throw error
    }
  },

  logout: () => {
    clearAuthCookies()
    getTokenStore().clearTokens()
    set({ user: null, isAuthenticated: false })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },

  fetchUser: async () => {
    try {
      const response = await apiClient.get("/auth/me")
      set({ user: response.data, isAuthenticated: true, isLoading: false, error: null })
    } catch {
      clearAuthCookies()
      getTokenStore().clearTokens()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Sessão expirada",
      })
    }
  },

  clearError: () => set({ error: null }),
}))