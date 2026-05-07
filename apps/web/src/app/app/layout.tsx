import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Modals } from "@/components/modals/modals"
import Loading from "./loading"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </AppShell>
      <Modals />
    </AuthGuard>
  )
}
