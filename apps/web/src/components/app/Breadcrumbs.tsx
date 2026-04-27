"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  contas: "Contas",
  transacoes: "Transações",
  cartoes: "Cartões",
  metas: "Metas",
  orcamento: "Orçamento",
  recorrentes: "Recorrentes",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Only show breadcrumbs inside /app/ routes
  if (segments[0] !== "app" || segments.length <= 1) return null;

  const current = segments[segments.length - 1];

  return (
    <nav className="flex items-center gap-2 mb-4 animate-fade-in-up">
      <Link
        href="/app/dashboard"
        className="text-xs font-semibold text-gray hover:text-near-black transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">home</span>
        Início
      </Link>
      <span className="material-symbols-outlined text-xs text-gray">chevron_right</span>
      <span className="text-xs font-bold text-near-black">{routeLabels[current] || current}</span>
    </nav>
  );
}
