"use client"

import dynamic from "next/dynamic"
import { RegisterForm } from "@/components/auth/register-form"
import { BRAND } from "@/lib/constants"
import Link from "next/link"

const GoogleProvider = dynamic(
  () => import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false }
)

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              <span className="text-primary">{BRAND.pre}</span>
              <span className="text-foreground">{BRAND.suf}</span>
            </h1>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Criar conta</h2>
          <p className="mt-1 text-sm text-muted-foreground">Comece a gerenciar suas finanças</p>
          <div className="mt-8">
            <GoogleProvider>
              <RegisterForm compact />
            </GoogleProvider>
          </div>
        </div>
      </div>
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-[var(--accent-light)] px-10 py-16 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 30% 40%, var(--primary) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-md">
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl">
            Seu dinheiro, no seu controle.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Cadastro rápido. Em minutos você já acompanha saldo, categorias e metas.
          </p>
          <p className="mt-10 text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
