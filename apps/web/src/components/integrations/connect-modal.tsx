"use client"

import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  fetchIntegrationLinkToken,
  useIntegrationStatus,
  type IntegrationChannel,
} from "@/hooks/use-integrations"

interface ConnectIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultChannel?: IntegrationChannel
  /** Bump when opening the modal (e.g. `Date.now()`) so link-token fetches once per open. */
  openNonce: number
  /** When true, copy targets users who already linked and opened “Gerenciar conexão”. */
  manageMode?: boolean
}

function secondsUntil(iso: string): number {
  const t = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.floor(t / 1000))
}

export function ConnectIntegrationModal({
  open,
  onOpenChange,
  defaultChannel = "whatsapp",
  openNonce,
  manageMode = false,
}: ConnectIntegrationModalProps) {
  const [tab, setTab] = useState<IntegrationChannel>(defaultChannel)
  const [, bumpRemaining] = useReducer((n: number) => n + 1, 0)
  const queryClient = useQueryClient()
  const lastInvalidatedAt = useRef(0)

  const statusQuery = useIntegrationStatus(open)

  const tokenQuery = useQuery({
    queryKey: ["integrations", "link-token", tab, openNonce],
    queryFn: () => fetchIntegrationLinkToken(tab),
    enabled: open && openNonce > 0,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  })

  const tokenPayload = tokenQuery.data

  useEffect(() => {
    const at = tokenQuery.dataUpdatedAt
    if (!at || at === lastInvalidatedAt.current) return
    lastInvalidatedAt.current = at
    void queryClient.invalidateQueries({ queryKey: ["integrations", "status"] })
  }, [tokenQuery.dataUpdatedAt, queryClient])

  const ttlSeconds = 600
  const remaining = !tokenPayload ? ttlSeconds : secondsUntil(tokenPayload.expires_at)

  const progress = useMemo(() => {
    if (!tokenPayload) return 0
    return Math.min(100, Math.round(((ttlSeconds - remaining) / ttlSeconds) * 100))
  }, [tokenPayload, remaining, ttlSeconds])

  useEffect(() => {
    if (!open || !tokenPayload) return
    const id = setInterval(() => bumpRemaining(), 1000)
    return () => clearInterval(id)
  }, [open, tokenPayload, bumpRemaining])

  useEffect(() => {
    const s = statusQuery.data
    if (!open || !s) return
    if (tab === "whatsapp" && s.whatsapp_linked) {
      onOpenChange(false)
    }
    if (tab === "telegram" && s.telegram_linked) {
      onOpenChange(false)
    }
  }, [open, statusQuery.data, tab, onOpenChange])

  const manual =
    tab === "whatsapp" ? tokenPayload?.manual_command_whatsapp : tokenPayload?.manual_command_telegram

  const deeplinkWhatsApp = tokenPayload?.deeplink_whatsapp ?? null
  const deeplinkTelegram = tokenPayload?.deeplink_telegram ?? null

  const busy = tokenQuery.isFetching

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {manageMode ? "Gerenciar integração" : "Conectar WhatsApp ou Telegram"}
          </DialogTitle>
          <DialogDescription>
            {manageMode
              ? "Gere um novo código se precisar religar outro dispositivo. Abra o app pelo link ou copie o comando."
              : "Abra o app com o link ou copie o comando. O código expira em 10 minutos e só pode ser usado uma vez."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as IntegrationChannel)
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>
          <TabsContent value="whatsapp" className="space-y-4 pt-4">
            <ChannelPanel deeplink={deeplinkWhatsApp} manual={manual} label="WhatsApp" busy={busy} />
          </TabsContent>
          <TabsContent value="telegram" className="space-y-4 pt-4">
            <ChannelPanel deeplink={deeplinkTelegram} manual={manual} label="Telegram" busy={busy} />
          </TabsContent>
        </Tabs>

        {tokenPayload && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Expira em</span>
              <span>
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => void tokenQuery.refetch().catch(() => undefined)}
            >
              Gerar novo código
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChannelPanel({
  deeplink,
  manual,
  label,
  busy,
}: {
  deeplink: string | null | undefined
  manual: string | undefined
  label: string
  busy: boolean
}) {
  const openApp = () => {
    if (deeplink) {
      const w = window.open(deeplink, "_blank", "noopener,noreferrer")
      if (!w || w.closed) window.location.href = deeplink
    }
    // No deeplink: silent; user can still use "Copiar comando" if manual exists.
  }

  const copyManual = () => {
    if (!manual) return
    void navigator.clipboard.writeText(manual)
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" size="lg" onClick={openApp} disabled={busy || (!deeplink && !manual)}>
        {deeplink ? `Abrir ${label}` : `Copiar comando (${label})`}
      </Button>
      {manual && (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Comando técnico (auto-hospedagem / quando já tens o contacto do bot)
          </p>
          <code className="block break-all text-sm">{manual}</code>
          <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={copyManual}>
            Copiar comando
          </Button>
        </div>
      )}
    </div>
  )
}
