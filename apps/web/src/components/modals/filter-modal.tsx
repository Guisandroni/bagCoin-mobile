"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CATEGORIES } from "@/lib/constants"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function FilterModal() {
  const { activeModal, closeModal, filter, setFilter } = useAppStore()
  const open = activeModal === "filter"
  const [typeFilter, setTypeFilter] = useState<"all" | "despesa" | "receita">(filter.type)
  const [selectedCats, setSelectedCats] = useState<string[]>(filter.categories)

  const toggleCat = (name: string) => {
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const apply = () => {
    setFilter({ type: typeFilter, categories: selectedCats })
    closeModal()
  }

  const reset = () => {
    setTypeFilter("all")
    setSelectedCats(CATEGORIES.map((c) => c.name))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeModal()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Filtros</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Tipo de transação
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Todas" },
                { key: "despesa", label: "Despesas" },
                { key: "receita", label: "Receitas" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key as typeof typeFilter)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                    typeFilter === f.key
                      ? "border-brand bg-accent text-accent-foreground font-semibold"
                      : "border-border bg-card hover:border-brand"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Categorias
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => toggleCat(c.name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    selectedCats.includes(c.name)
                      ? "border-brand bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-brand"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: selectedCats.includes(c.name) ? c.color : "currentColor",
                    }}
                  />
                  {c.emoji} {c.name}
                  </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            Limpar
          </Button>
          <Button size="sm" onClick={apply}>
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}