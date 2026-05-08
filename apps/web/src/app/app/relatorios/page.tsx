import dynamic from "next/dynamic"
import { getReports } from "@/lib/api-server"
import { serverReportToRelease } from "@/lib/adapters"
import RelatoriosLoading from "./loading"

const RelatoriosClient = dynamic(() => import("./relatorios-client").then((m) => m.RelatoriosClient), {
  loading: () => <RelatoriosLoading />,
})

export default async function RelatoriosPage() {
  const serverReports = await getReports()
  const reports = (serverReports ?? []).map(serverReportToRelease)

  return <RelatoriosClient reports={reports} />
}