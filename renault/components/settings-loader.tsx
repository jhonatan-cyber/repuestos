"use client"

import { useEffect } from "react"
import { loadCompanyInfo } from "@/lib/export/shared"

/**
 * Pre-carga la config de la empresa (COMPANY_INFO) al iniciar la app.
 * Los exports la usan vía Proxy — necesitan los datos antes de generar PDF/Excel.
 */
export function SettingsLoader() {
  useEffect(() => {
    loadCompanyInfo()
  }, [])
  return null
}
