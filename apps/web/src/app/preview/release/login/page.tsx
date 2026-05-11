"use client"

import dynamic from "next/dynamic"
import { LoginCard } from "@/components/release"

const GoogleProvider = dynamic(
  () => import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false },
)

export default function LoginPreview() {
  return (
    <GoogleProvider>
      <LoginCard
        onLogin={() => {}}
        onGoogleLogin={() => {}}
        onRegisterClick={() => {}}
        onForgotPassword={() => {}}
      />
    </GoogleProvider>
  )
}
