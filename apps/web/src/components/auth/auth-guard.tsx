"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const check = () => {
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
      if (match && !isAuthenticated) {
        fetchUser().finally(() => setChecked(true))
      } else {
        setChecked(true)
      }
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checked && !isLoading && !isAuthenticated) {
      const hasCookie = document.cookie.includes("access_token=")
      if (!hasCookie) {
        router.push("/login")
      }
    }
  }, [checked, isLoading, isAuthenticated, router])

  if (!checked || isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}