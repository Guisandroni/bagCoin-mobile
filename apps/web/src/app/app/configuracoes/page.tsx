"use client"

import Link from "next/link"
import { Moon, Sun, Monitor, Bell, Globe, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const appearanceOptions = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

const settingsSections = [
  {
    title: "Preferências",
    items: [
      { icon: Globe, label: "Idioma", description: "Português (Brasil)", action: "select" },
      { icon: Bell, label: "Notificações", description: "Alertas de transações e metas", action: "toggle" },
      { icon: Shield, label: "Privacidade", description: "Dados e permissões", action: "link" },
    ],
  },
  {
    title: "WhatsApp",
    items: [
      { icon: Sun, label: "Conexão ativa", description: "Todos os lançamentos são detectados automaticamente", action: "badge" },
    ],
  },
]

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="page-in space-y-5 pb-28 lg:pb-10">
      <h1 className="section-title">Configurações</h1>

      <div className="rounded-2xl border border-border bg-card">
        <Link
          href="/app/configuracoes/integracoes"
          className="flex min-h-[56px] items-center gap-3 border-b border-border px-4 py-3 active:bg-muted/60"
        >
          <Globe className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Integrações</p>
            <p className="text-[12px] text-muted-foreground">WhatsApp e Telegram</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>

        <div className="px-4 py-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Aparência
          </p>
          <div className="flex gap-2">
            {appearanceOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? "default" : "secondary"}
                className={cn("flex-1 gap-2 rounded-full")}
                onClick={() => setTheme(opt.value)}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {settingsSections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-border bg-card">
          <p className="border-b border-border px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </p>
          {section.items.map((item, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full min-h-[56px] items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 active:bg-muted/60"
            >
              <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{item.label}</p>
                <p className="text-[12px] text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-50" aria-hidden />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}