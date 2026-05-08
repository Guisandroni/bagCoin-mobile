"use client"

import { useIntegrationStatus, useOpenIntegrationChat } from "./use-integrations"

export function useWhatsAppConnect() {
  const { data: status } = useIntegrationStatus(false)
  const { openIntegrationChat, openingChannel } = useOpenIntegrationChat()

  const isLinked = status?.whatsapp_linked ?? false
  const isConnecting = openingChannel === "whatsapp"

  const connect = () => {
    if (isLinked) return
    void openIntegrationChat("whatsapp")
  }

  return {
    isLinked,
    isConnecting,
    connect,
  }
}
