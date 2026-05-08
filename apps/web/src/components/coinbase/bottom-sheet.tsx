"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DIALOG_SHEET_MOBILE } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  illustration?: ReactNode
  children?: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  illustration,
  children,
  primaryLabel,
  onPrimary,
}: BottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-md",
          DIALOG_SHEET_MOBILE
        )}
      >
        {illustration ? (
          <div className="flex justify-center bg-muted/40 px-6 pb-2 pt-8">{illustration}</div>
        ) : null}
        <DialogHeader className="px-5 pt-4">
          <DialogTitle className="text-center text-lg font-bold">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-center text-[14px]">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="px-5 pb-4">{children}</div>
        {primaryLabel && onPrimary ? (
          <div className="border-t bg-muted/30 p-4">
            <Button type="button" className="h-12 w-full rounded-full font-semibold" onClick={onPrimary}>
              {primaryLabel}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
