"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useAppStore } from "@/lib/store"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SettingsView } from "@/components/release/settings-view"
import { ProfileView } from "@/components/release/profile-view"
import { ChangePasswordModal } from "@/components/release/change-password-modal"
import { ToastBanner } from "@/components/release/toast-banner"
import { ReportsView } from "@/components/release/reports-view"
import { getReleaseProfile, getReleaseNavItems } from "@/lib/adapters"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { ReleaseReport } from "@/components/release/types"

type DrawerSection = "settings" | "profile" | "reports" | "password"

export function SettingsDrawer() {
  const { drawerOpen, closeDrawer } = useAppStore()
  const { logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [section, setSection] = useState<DrawerSection>("settings")
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  const { isMobile } = useMediaQuery()

  const profile = getReleaseProfile()
  const navItems = getReleaseNavItems(pathname)

  const handleNavigate = (s: string) => {
    if (s === "perfil") {
      setSection("profile")
    } else if (s === "relatorios") {
      setSection("reports")
    } else {
      router.push(`/app/configuracoes/${s}`)
    }
  }

  const handleLogout = () => {
    closeDrawer()
    logout()
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      closeDrawer()
      setSection("settings")
    }
  }

  const mockReports: ReleaseReport[] = [
    { id: "1", name: "Relatório Mensal - Abril", period: "Abril 2024", date: "01 Maio 2024", status: "concluido", type: "mensal" },
    { id: "2", name: "Declaração de IR 2023", period: "Anual 2023", date: "15 Abril 2024", status: "concluido", type: "imposto" },
    { id: "3", name: "Relatório Anual 2023", period: "Anual 2023", date: "10 Jan 2024", status: "arquivado", type: "anual" },
  ]

  return (
    <>
      <Sheet open={drawerOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Configurações</SheetTitle>
          </SheetHeader>

          {section === "settings" && (
            <div className="rls">
              <SettingsView
                profile={profile}
                onBack={() => closeDrawer()}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                variant={isMobile ? "mobile" : "full"}
              />
            </div>
          )}

          {section === "profile" && (
            <div className="rls">
              <ProfileView
                profile={profile}
                onBack={() => setSection("settings")}
                onChangePassword={() => setPasswordModalOpen(true)}
                onSave={() => setToastOpen(true)}
              />
            </div>
          )}

          {section === "reports" && (
            <div className="rls">
              <ReportsView
                reports={mockReports}
                navItems={navItems}
                onBack={() => setSection("settings")}
                onNavigate={(href) => router.push(href)}
                onDownload={(id) => console.log("Download:", id)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={() => {
          setPasswordModalOpen(false)
          setToastOpen(true)
        }}
      />

      <ToastBanner
        message="Senha alterada com sucesso!"
        variant="success"
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </>
  )
}
