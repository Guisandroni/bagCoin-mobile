"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-wise-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-bright-orange/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-black text-near-black mb-3">
            Bagcoin
          </h1>
          <p className="text-smoke text-lg">
            Gerencie suas finanças com inteligência
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-near-black/5 p-8">
          <h2 className="text-xl font-bold text-near-black mb-2 text-center">
            Bem-vindo de volta
          </h2>
          <p className="text-smoke text-center mb-8">
            Entre com sua conta Google para acessar sua dashboard
          </p>

          <button
            onClick={login}
            className="w-full bg-white border-2 border-light-outline hover:border-wise-green text-near-black font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-wise-green/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-smoke hover:text-wise-green transition-colors"
            >
              ← Voltar para a página inicial
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-smoke/60 mt-6">
          Ao entrar, você concorda com nossos termos de serviço.
        </p>
      </div>
    </div>
  );
}
