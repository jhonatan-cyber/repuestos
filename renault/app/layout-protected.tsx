"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/auth-context"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UpdateNotifier } from "@/components/update-notifier"

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:m-2"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out relative",
          isCollapsed ? "md:pl-26" : "md:pl-72",
        )}
      >
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto scrollbar-custom pb-8"
        >
          <div className="px-4 md:px-8 py-6 md:py-8">{children}</div>
        </main>
      </div>
      <UpdateNotifier />
    </div>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Fix preventivo para bloqueos de Dialog/Modal de Radix
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "auto"
      document.body.style.overflow = "auto"
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  )
}
