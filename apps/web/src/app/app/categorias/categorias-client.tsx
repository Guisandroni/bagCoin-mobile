"use client"

import { CategoriesView } from "@/components/release/categories-view"
import { usePathname } from "next/navigation"
import { getReleaseNavItems } from "@/lib/adapters"
import type { ReleaseCategory } from "@/components/release/types"

interface Props {
  categories: ReleaseCategory[]
  totalAllocated: number
}

export function CategoriasClient({ categories, totalAllocated }: Props) {
  const pathname = usePathname()
  const navItems = getReleaseNavItems(pathname)

  return (
    <CategoriesView
      categories={categories}
      totalAllocated={totalAllocated}
      navItems={navItems}
      onNavigate={(href) => {
        if (href === "#settings") return
        window.location.href = href
      }}
    />
  )
}