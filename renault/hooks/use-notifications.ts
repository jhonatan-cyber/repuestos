"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"

export interface AppNotification {
  id: string
  type: "info" | "warning" | "success" | "error"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  url?: string | null
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient<{ items?: AppNotification[]; unread?: number }>(
        "/api/notifications?limit=12",
        { useCache: false },
      )
      setItems(Array.isArray(data.items) ? data.items : [])
      setUnread(Number(data.unread || 0))
    } catch {
      // Notifications are secondary; silently retain stale state on error
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await apiClient(`/api/notifications/${id}/read`, { method: "PATCH" })
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnread((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await apiClient("/api/notifications", { method: "PATCH" })
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnread(0)
  }, [])

  useEffect(() => {
    fetchNotifications()

    const interval = window.setInterval(fetchNotifications, 30000)
    const onFocus = () => fetchNotifications()
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [fetchNotifications])

  const hasUnread = useMemo(() => unread > 0, [unread])

  return {
    items,
    unread,
    hasUnread,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
  }
}
