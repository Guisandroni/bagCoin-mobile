"use client"

import { CategoriesView } from "@/components/release"
import { mockCategories, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function CategoriasPreview() {
  return (
    <CategoriesView
      categories={mockCategories}
      totalAllocated={4500}
      navItems={mockNavItems}
      onNavigate={() => {}}
    />
  )
}