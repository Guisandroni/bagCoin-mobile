"use client"

import { ArrowLeft } from "lucide-react"
import {
  User,
  Palette,
  MessageSquare,
  Send,
  LogOut,
} from "lucide-react"
import { AppBar } from "./app-bar"
import { ListItem } from "./list-item"
import type { ReleaseProfile } from "./types"

interface SettingsViewProps {
  profile: ReleaseProfile
  onBack?: () => void
  onNavigate?: (section: string) => void
  onLogout?: () => void
  variant?: "full" | "mobile"
}

export function SettingsView({
  profile,
  onBack,
  onNavigate,
  onLogout,
  variant = "full",
}: SettingsViewProps) {
  const isMobile = variant === "mobile"

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)]">
      <AppBar
        title={isMobile ? "Menu" : "Configurações"}
        onBack={onBack}
      />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)] pb-24">
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--rls-surface-variant)] flex items-center justify-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-[var(--rls-on-surface-variant)]" />
            )}
          </div>
          <div className="text-center">
            <h2 className="rls-text-title-lg text-[var(--rls-on-surface)]">
              {profile.name}
            </h2>
            <p className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
              {profile.email}
            </p>
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-2">
          <ListItem
            icon={<User className="w-5 h-5 text-[var(--rls-primary-container)]" />}
            iconBg="bg-[var(--rls-primary-container)]/10"
            title="Perfil"
            description="Editar informações pessoais"
            onClick={() => onNavigate?.("perfil")}
          />
          <ListItem
            icon={<Palette className="w-5 h-5 text-[var(--rls-secondary)]" />}
            iconBg="bg-[var(--rls-secondary-container)]/20"
            title="Relatórios"
            description="Veja seus ultimos relatórios"
            onClick={() => onNavigate?.("relatorios")}
          />
          {!isMobile && (
            <>
              <ListItem
                icon={<MessageSquare className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                title="WhatsApp"
                description="Chat bot para transações"
                onClick={() => onNavigate?.("whatsapp")}
              />
              <ListItem
                icon={<Send className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                title="Telegram"
                description="Bot para notificações"
                onClick={() => onNavigate?.("telegram")}
              />
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full h-14 bg-[var(--rls-error-container)] text-[var(--rls-on-error)] rls-text-body-lg rounded-[var(--rls-radius-pill)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </main>
    </div>
  )
}