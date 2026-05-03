"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

export function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    return <div className="min-h-screen bg-background">{children}</div>
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-background">{children}</div>
    </GoogleOAuthProvider>
  )
}