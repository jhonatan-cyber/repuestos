"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "./components/theme-toggle"
import { LoginHero } from "./components/login-hero"
import { LoginForm } from "./components/login-form"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup/check")
        if (!res.ok) {
          setNeedsSetup(false)
          return
        }
        const contentType = res.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          setNeedsSetup(false)
          return
        }
        const data = await res.json()
        setNeedsSetup(data.needsSetup)
      } catch (error) {
        console.error("Check setup failed", error)
        setNeedsSetup(false)
      } finally {
        setIsChecking(false)
      }
    }
    checkSetup()
  }, [])

  const [needsSetup, setNeedsSetup] = useState(false)

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#050505]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row text-zinc-900 dark:text-zinc-100 transition-colors duration-700 selection:bg-primary selection:text-primary-foreground relative">
      {/* Botón Flotante para cambiar Tema */}
      <ThemeToggle />

      {/* Lado Izquierdo: Branding / Arte gráfico */}
      <LoginHero />

      {/* Lado Derecho: Formulario Interactivo */}
      <LoginForm needsSetup={needsSetup} />
    </div>
  )
}
