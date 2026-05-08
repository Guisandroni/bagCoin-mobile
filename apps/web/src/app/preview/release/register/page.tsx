"use client"

import { RegisterCard } from "@/components/release"

export default function RegisterPreview() {
  return (
    <RegisterCard
      onRegister={(data) => console.log("Register:", data)}
      onGoogleRegister={() => console.log("Google register")}
      onLoginClick={() => console.log("Go to login")}
    />
  )
}