"use client"

import { Moon, Sun, Monitor, Bell, Globe, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
    <div className="p-4 lg:p-7">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {appearanceOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={theme === opt.value ? "default" : "secondary"}
                  className={cn("flex-1 gap-2", theme === opt.value && "")}
                  onClick={() => setTheme(opt.value)}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {settingsSections.map((section) => (
          <Card key={section.title} className="rounded-2xl border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {section.items.map((item, i) => (
                <div key={i}>
                  <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">{item.label}</p>
                      <p className="text-[12px] text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                  {i < section.items.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}