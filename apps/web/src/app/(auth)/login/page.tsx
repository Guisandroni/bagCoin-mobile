"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LoginCard } from "@/components/release/login-card";
import { useAuthStore } from "@/lib/auth-store";

const GoogleProvider = dynamic(
  () =>
    import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false },
);

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, clearError, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setErrorMessage(null);
    try {
      await login(email, password);
      router.push("/app");
    } catch (error) {
      setErrorMessage(
        resolveAuthError(
          error,
          "Não foi possível entrar. Verifique email e senha.",
        ),
      );
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setErrorMessage(null);
    try {
      await loginWithGoogle(idToken);
      router.push("/app");
    } catch (error) {
      setErrorMessage(
        resolveAuthError(error, "Não foi possível entrar com Google."),
      );
    }
  };

  return (
    <GoogleProvider>
      <LoginCard
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onRegisterClick={() => router.push("/register")}
        onForgotPassword={() => router.push("/login")}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onDismissError={() => {
          setErrorMessage(null);
          clearError();
        }}
      />
    </GoogleProvider>
  );
}

function resolveAuthError(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { error?: { message?: string }; detail?: string } };
    message?: string;
  };
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.detail ||
    err.message ||
    fallback
  );
}
