"use client"

import dynamic from "next/dynamic"
import { LoginForm } from "@/components/auth/login-form"
import { BRAND } from "@/lib/constants"

const GoogleProvider = dynamic(
  () => import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false }
)

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          <span className="text-brand">{BRAND.pre}</span>
          <span>{BRAND.suf}</span>
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Seu assistente financeiro pessoal
        </p>
      </div>
      <GoogleProvider>
        <LoginForm />
      </GoogleProvider>
    </div>
  )
}