"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: "space_dashboard" },
  { href: "/app/contas", label: "Contas", icon: "account_balance" },
  { href: "/app/transacoes", label: "Transações", icon: "receipt_long" },
  { href: "/app/cartoes", label: "Cartões", icon: "credit_card" },
  { href: "/app/metas", label: "Metas", icon: "flag" },
  { href: "/app/orcamento", label: "Orçamento", icon: "account_balance_wallet" },
  { href: "/app/recorrentes", label: "Recorrentes", icon: "event_repeat" },
  { href: "/app/relatorios", label: "Relatórios", icon: "monitoring" },
];

const bottomNavItems = [
  { href: "/app/configuracoes", label: "Configurações", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-near-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-full bg-near-black text-white flex items-center justify-center shadow-lg"
      >
        <span className="material-symbols-outlined">
          {mobileOpen ? "close" : "menu"}
        </span>
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-near-black text-white z-40 flex flex-col transition-all duration-300
          ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-10 h-10 rounded-full bg-wise-green flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-dark-green text-xl">account_balance</span>
          </div>
          {!collapsed && (
            <span className="font-display font-black text-xl tracking-tight md:block hidden">
              Bagcoin
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 btn-scale ${
                      isActive
                        ? "bg-wise-green text-dark-green"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className={`${collapsed ? "md:hidden" : ""} md:block`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <ul className="space-y-1 mb-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 btn-scale ${
                      isActive
                        ? "bg-wise-green text-dark-green"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className={`${collapsed ? "md:hidden" : ""} md:block`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all w-full btn-scale"
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
            <span className={`${collapsed ? "md:hidden" : ""} md:block`}>Recolher</span>
          </button>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all w-full mt-1 btn-scale"
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
            <span className={`${collapsed ? "md:hidden" : ""} md:block`}>Sair</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
