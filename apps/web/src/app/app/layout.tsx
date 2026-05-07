import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Modals } from "@/components/modals/modals"
import { PageTransition } from "@/components/layout/page-transition"
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
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </AppShell>
      <Modals />
    </AuthGuard>
  )
}
