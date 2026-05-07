import { getReports } from "@/lib/api-server"
import { RelatoriosClient } from "./relatorios-client"
import type { Report } from "@/hooks/use-reports"

function mapReport(r: { id: number; user_uuid: string | null; period_start: string; period_end: string; file_url: string | null; created_at: string; updated_at: string }): Report {
  return { ...r, user_uuid: r.user_uuid ?? "" }
}

export default async function RelatoriosPage() {
  const serverReports = await getReports()
  const reports: Report[] = (serverReports ?? []).map(mapReport)

  return <RelatoriosClient initialReports={reports} />
}
