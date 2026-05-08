"use client"

import { ArrowLeft, Pencil, Badge, Mail, Phone, Lock, KeyRound } from "lucide-react"
import { AppBar } from "./app-bar"
import { PillInput } from "./pill-input"
import type { ReleaseProfile } from "./types"

interface ProfileViewProps {
  profile: ReleaseProfile & { phone?: string; tier?: string }
  onBack?: () => void
  onChangePassword?: () => void
  onSave?: (data: {
    name: string
    email: string
    phone: string
  }) => void
  isSaving?: boolean
}

export function ProfileView({
  profile,
  onBack,
  onChangePassword,
  onSave,
  isSaving,
}: ProfileViewProps) {
  return (
    <div className="rls min-h-screen bg-[var(--rls-background)]">
      <AppBar title="Perfil" onBack={onBack} titleClassName="text-[var(--rls-primary-container)] rls-text-headline-sm" />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)] pb-24">
        {/* Profile Card */}
        <div className="bg-[var(--rls-surface-container-lowest)] border border-[var(--rls-outline-variant)] rounded-[var(--rls-radius-lg)] p-[var(--rls-inline-padding-md)] flex flex-col gap-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--rls-surface-variant)] flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[var(--rls-on-surface-variant)] text-3xl">
                    {profile.name.charAt(0)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--rls-primary-container)] flex items-center justify-center shadow-md hover:bg-[var(--rls-primary)] transition-colors"
                aria-label="Editar foto"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Name & Tier */}
          <div className="text-center">
            <h2 className="rls-text-title-lg text-[var(--rls-on-surface)]">
              {profile.name}
            </h2>
            <p className="rls-text-body-md text-[var(--rls-on-surface-variant)] mt-1">
              {profile.tier || "Investidor Pro"}
            </p>
          </div>

          {/* Section Header */}
          <div className="flex items-center gap-2 border-b border-[var(--rls-outline-variant)] pb-2">
            <Badge className="w-5 h-5 text-[var(--rls-primary)]" />
            <h3 className="rls-text-body-lg text-[var(--rls-on-surface)] font-semibold">
              Informações Pessoais
            </h3>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-[var(--rls-stack-gap-md)]">
            <PillInput
              icon={<Badge className="w-5 h-5" />}
              label="Nome Completo"
              value={profile.name}
              readOnly
            />
            <PillInput
              icon={<Mail className="w-5 h-5" />}
              label="E-mail"
              value={profile.email}
              readOnly
            />
            {profile.phone && (
              <PillInput
                icon={<Phone className="w-5 h-5" />}
                label="Telefone"
                value={profile.phone}
                readOnly
              />
            )}
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-[var(--rls-surface-container-lowest)] border border-[var(--rls-outline-variant)] rounded-[var(--rls-radius-lg)] p-[var(--rls-inline-padding-md)] flex flex-col gap-[var(--rls-stack-gap-md)]">
          {/* Section Header */}
          <div className="flex items-center gap-2 border-b border-[var(--rls-outline-variant)] pb-2">
            <Lock className="w-5 h-5 text-[var(--rls-primary)]" />
            <h3 className="rls-text-body-lg text-[var(--rls-on-surface)] font-semibold">
              Segurança
            </h3>
          </div>

          <PillInput
            icon={<KeyRound className="w-5 h-5" />}
            label="Senha Atual"
            value="••••••••"
            readOnly
            className="opacity-70"
          />

          <button
            onClick={onChangePassword}
            className="w-full h-14 border-2 border-[var(--rls-primary-container)] text-[var(--rls-primary-container)] rls-text-body-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary-container)]/5 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Alterar Senha
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={() => onSave?.({ name: profile.name, email: profile.email, phone: profile.phone || "" })}
          disabled={isSaving}
          className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </main>
    </div>
  )
}