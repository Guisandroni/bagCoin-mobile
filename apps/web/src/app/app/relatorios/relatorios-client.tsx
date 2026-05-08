"use client"

import { usePathname } from "next/navigation"
import { ReportsView } from "@/components/release/reports-view"
import { getReleaseNavItems } from "@/lib/adapters"
import { useDownloadReport } from "@/hooks/use-reports"
import type { ReleaseReport } from "@/components/release/types"

interface Props {
  reports: ReleaseReport[]
}

export function RelatoriosClient({ reports }: Props) {
  const pathname = usePathname()
  const navItems = getReleaseNavItems(pathname)
  const downloadMutation = useDownloadReport()

  return (
    <div className="rls">
      <ReportsView
        reports={reports}
        navItems={navItems}
        onBack={() => window.history.back()}
        onNavigate={(href) => {
          if (href === "#settings") return
          window.location.href = href
        }}
        onDownload={(reportId) => {
          downloadMutation.mutate(reportId)
        }}
      />
    </div>
  )
}