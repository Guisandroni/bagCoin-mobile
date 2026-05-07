"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export type IntegrationChannel = "whatsapp" | "telegram"

/** Abre o fluxo de integração do canal (por ora leva a Configurações). */
export function useOpenIntegrationChat() {
  const router = useRouter()
  const [openingChannel, setOpeningChannel] = useState<IntegrationChannel | null>(null)

  const openIntegrationChat = useCallback(
    async (channel: IntegrationChannel) => {
      setOpeningChannel(channel)
      try {
        router.push("/app/configuracoes")
        const label = channel === "whatsapp" ? "WhatsApp" : "Telegram"
        toast.info(`Conecte o ${label} em Configurações → Integrações.`)
      } finally {
        setOpeningChannel(null)
      }
    },
    [router]
  )

  return { openIntegrationChat, openingChannel }
}
