"use client"

import { useState, useEffect } from "react"

const TABLET_BP = 768
const DESKTOP_BP = 1024

export function useMediaQuery() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  )

  useEffect(() => {
    let raf: number
    const handleResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(window.innerWidth))
    }
    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return {
    isMobile: width < TABLET_BP,
    isTablet: width >= TABLET_BP && width < DESKTOP_BP,
    isDesktop: width >= DESKTOP_BP,
    width,
  }
}
