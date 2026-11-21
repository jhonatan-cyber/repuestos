"use client"

import { useState, useCallback } from "react"

export function usePrintPreview<T>() {
  const [documentToPrint, setDocumentToPrint] = useState<T | null>(null)

  const openPrintPreview = useCallback((document: T) => {
    setDocumentToPrint(document)
  }, [])

  const closePrintPreview = useCallback(() => {
    setDocumentToPrint(null)
  }, [])

  return {
    documentToPrint,
    openPrintPreview,
    closePrintPreview,
  }
}
