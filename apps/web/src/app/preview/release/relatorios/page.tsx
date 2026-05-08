"use client"

import { ReportsView } from "@/components/release"
import { mockReports, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function RelatoriosPreview() {
  return (
    <ReportsView
      reports={mockReports}
      navItems={mockNavItems}
      onBack={() => console.log("Back")}
      onNavigate={(href) => console.log("Navigate:", href)}
      onDownload={(id) => console.log("Download:", id)}
    />
  )
}