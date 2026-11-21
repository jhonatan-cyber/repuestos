"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  hasPermission: (module: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    })

    if (response.ok) {
      return (await response.json()) as User
    }

    if (response.status !== 401) {
      throw new Error("Failed to fetch current user")
    }

    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })

    if (!refreshResponse.ok) {
      return null
    }

    return (await refreshResponse.json()) as User
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await fetchCurrentUser()
        setUser(userData)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [fetchCurrentUser])

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies
      body: JSON.stringify({ email, password, rememberMe }),
    })

    if (!response.ok) {
      throw new Error("Invalid credentials")
    }

    const userData = await response.json()
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // Continue with logout even if API fails
    }
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  const hasPermission = useCallback(
    (module: string) => {
      if (!user) return false

      if (user.role === "administrador") return true

      if (user.permissions?.includes("*")) return true

      const perms = user.permissions || []

      // Coincidencia exacta
      if (perms.includes(module)) return true

      // Coincidencia granular: "clients.list" da acceso al módulo "clients"
      const granular = perms.filter((p) => p.includes("."))
      for (const p of granular) {
        const mod = p.split(".")[0]
        if (mod === module) return true
      }

      return false
    },
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
