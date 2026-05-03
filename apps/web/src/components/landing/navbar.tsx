import Link from "next/link"
import { BRAND } from "@/lib/constants"

export function LandingNavbar() {
  return (
    <nav className="mx-auto flex items-center justify-between px-6 py-6">
      <div className="font-heading text-xl font-bold tracking-tight text-brand">
        {BRAND.pre}
        <span className="text-foreground">{BRAND.suf}</span>
      </div>
      <div className="hidden items-center gap-8 text-[14px] font-semibold text-muted-foreground md:flex">
        <Link href="#" className="border-b-2 border-foreground pb-1 text-foreground">
          FEATURES
        </Link>
        <Link href="#" className="transition-colors hover:text-foreground">
          PROTOCOLO
        </Link>
        <Link href="#" className="transition-colors hover:text-foreground">
          GOVERNANCE
        </Link>
        <Link href="#" className="transition-colors hover:text-foreground">
          DOCS
        </Link>
      </div>
      <Link
        href="/app"
        className="rounded-full bg-brand px-6 py-2.5 text-[14px] font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
      >
        ABRIR APP
      </Link>
    </nav>
  )
}