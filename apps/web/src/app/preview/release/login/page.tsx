"use client"

import { LoginCard } from "@/components/release"

export default function LoginPreview() {
  return (
    <LoginCard
      onLogin={(email, password) => console.log("Login:", email, password)}
      onGoogleLogin={() => console.log("Google login")}
      onRegisterClick={() => console.log("Go to register")}
      onForgotPassword={() => console.log("Forgot password")}
    />
  )
}