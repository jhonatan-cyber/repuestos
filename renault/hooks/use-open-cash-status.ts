"use client"

import { useEffect, useState } from "react"
import { loadList } from "@/lib/api-list"

export function useOpenCashStatus() {
  const [hasOpenCash, setHasOpenCash] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchCashStatus = async () => {
      try {
        const records = await loadList<{ status?: string }>("/api/cash-records", async (url) => {
          const response = await fetch(url, {
            credentials: "include",
            cache: "no-store",
          })
          if (!response.ok) throw new Error("Error al cargar cajas")
          return response.json()
        })
        if (!isMounted) return
        setHasOpenCash(records.some((record) => record?.status === "open"))
      } catch {
        if (!isMounted) return
        setHasOpenCash(false)
      }
    }

    fetchCashStatus()

    return () => {
      isMounted = false
    }
  }, [])

  return { hasOpenCash }
}
