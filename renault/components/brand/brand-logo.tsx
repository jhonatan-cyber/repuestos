"use client"

import { cn } from "@/lib/utils"
import { useCallback, useRef } from "react"

const FALLBACK_SRC = "/renaultreluz.png"

type BrandLogoProps = {
  className?: string
  alt?: string
}

export function BrandLogo({ className, alt = "Renault Reluz" }: BrandLogoProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const handleError = useCallback(() => {
    if (imgRef.current) imgRef.current.src = FALLBACK_SRC
  }, [])

  return (
    <img
      ref={imgRef}
      src="/api/settings/logo"
      alt={alt}
      className={cn("block object-contain select-none", className)}
      draggable={false}
      onError={handleError}
    />
  )
}
