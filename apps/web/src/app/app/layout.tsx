import { AppShell } from "@/components/layout/app-shell"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Modals } from "@/components/modals/modals"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppShell>
        {children}
      </AppShell>
      <Modals />
    </AuthGuard>
  )
}