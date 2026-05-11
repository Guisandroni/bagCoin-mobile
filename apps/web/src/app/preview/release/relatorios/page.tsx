"use client"

import { ReportsView } from "@/components/release"
import { mockReports, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function RelatoriosPreview() {
  return (
    <ReportsView
      reports={mockReports}
      navItems={mockNavItems}
      onBack={() => {}}
      onNavigate={() => {}}
      onDownload={() => {}}
    />
  )
}