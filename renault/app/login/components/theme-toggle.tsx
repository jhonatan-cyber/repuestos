"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, MonitorSmartphone } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center gap-1.5 p-1 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-300/30 dark:border-white/10 z-50">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-all duration-300 ${theme === "light" ? "bg-white shadow-sm text-amber-500" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}
        title="Modo Claro"
      >
        <Sun size={15} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-zinc-900 border border-white/10 text-primary shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}
        title="Modo Oscuro"
      >
        <Moon size={15} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-all duration-300 ${theme === "system" ? "bg-white dark:bg-zinc-900 dark:border dark:border-white/10 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}
        title="Sistema"
      >
        <MonitorSmartphone size={15} />
      </button>
    </div>
  )
}
