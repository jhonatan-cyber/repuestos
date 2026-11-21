"use client"

import React from "react"

const DB_NAME = "renault-erp-offline"
const DB_VERSION = 6

export interface PendingMutation {
  id: string
  operation: "POST" | "PUT" | "PATCH" | "DELETE"
  endpoint: string
  payload: unknown
  timestamp: number
  retryCount: number
  status: "pending" | "failed"
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class OfflineStorage {
  private db: IDBDatabase | null = null

  private readonly dataStores = [
    "clients",
    "products",
    "categories",
    "suppliers",
    "sales",
    "purchases",
    "quotations",
    "users",
    "roles",
    "expenses",
    "permissions",
    "cache",
    "pendingQueue",
    "failedQueue",
  ] as const

  async init(): Promise<void> {
    if (typeof window === "undefined") return

    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        this.dataStores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, storeName === "cache" ? undefined : { keyPath: "id" })
          }
        })
      }
    })
  }

  private async ensureDb(): Promise<IDBDatabase | null> {
    if (!this.db) {
      await this.init()
    }

    return this.db
  }

  private hasStore(storeName: string): boolean {
    return !!this.db && this.db.objectStoreNames.contains(storeName)
  }

  async set<T>(storeName: string, key: string, data: T, expiresIn = 3600000): Promise<void> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("cache")) return

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cache"], "readwrite")
      const store = transaction.objectStore("cache")
      const request = store.put(entry, `${storeName}:${key}`)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("cache")) return null

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cache"], "readonly")
      const store = transaction.objectStore("cache")
      const request = store.get(`${storeName}:${key}`)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        if (!entry) {
          resolve(null)
          return
        }

        if (Date.now() - entry.timestamp > entry.expiresIn) {
          resolve(null)
          return
        }

        resolve(entry.data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async setList<T extends { id: IDBValidKey }>(storeName: string, items: T[]): Promise<void> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore(storeName)) return

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)

      const getAllKeysRequest = store.getAllKeys()

      getAllKeysRequest.onsuccess = () => {
        const currentKeys = new Set(getAllKeysRequest.result as IDBValidKey[])
        const newKeys = new Set(items.map((item) => item.id))

        currentKeys.forEach((key) => {
          if (!newKeys.has(key)) {
            store.delete(key)
          }
        })

        items.forEach((item) => {
          store.put(item)
        })
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getList<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore(storeName)) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    const db = await this.ensureDb()
    if (!db) return

    const storeNames = this.dataStores.filter(
      (storeName) =>
        this.hasStore(storeName) && storeName !== "pendingQueue" && storeName !== "failedQueue",
    )

    if (storeNames.length === 0) return

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, "readwrite")

      storeNames.forEach((storeName) => {
        transaction.objectStore(storeName).clear()
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async addPendingMutation(
    mutation: Omit<PendingMutation, "id" | "retryCount" | "status">,
  ): Promise<string> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) throw new Error("IndexedDB no inicializado")

    const id = `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const pendingMutation: PendingMutation = {
      ...mutation,
      id,
      retryCount: 0,
      status: "pending",
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingQueue"], "readwrite")
      const store = transaction.objectStore("pendingQueue")
      const request = store.add(pendingMutation)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingQueue(): Promise<PendingMutation[]> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingQueue"], "readonly")
      const store = transaction.objectStore("pendingQueue")
      const request = store.getAll()

      request.onsuccess = () => {
        const all = request.result as PendingMutation[]
        resolve(all.filter((m) => m.status === "pending"))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getFailedQueue(): Promise<PendingMutation[]> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingQueue"], "readonly")
      const store = transaction.objectStore("pendingQueue")
      const request = store.getAll()

      request.onsuccess = () => {
        const all = request.result as PendingMutation[]
        resolve(all.filter((m) => m.status === "failed"))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingMutation(id: string): Promise<void> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingQueue"], "readwrite")
      const store = transaction.objectStore("pendingQueue")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateMutationStatus(
    id: string,
    status: "pending" | "failed",
    incrementRetry = false,
  ): Promise<void> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return

    const transaction = db.transaction(["pendingQueue"], "readwrite")
    const store = transaction.objectStore("pendingQueue")
    const getRequest = store.get(id)

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const mutation = getRequest.result as PendingMutation | undefined
        if (!mutation) {
          resolve()
          return
        }

        mutation.status = status
        if (incrementRetry) {
          mutation.retryCount += 1
        }

        const putRequest = store.put(mutation)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getAllPendingMutations(): Promise<PendingMutation[]> {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingQueue"], "readonly")
      const store = transaction.objectStore("pendingQueue")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as PendingMutation[])
      request.onerror = () => reject(request.error)
    })
  }

  async getQueueStats() {
    const pending = await this.getPendingQueue()
    const failed = await this.getFailedQueue()

    return {
      pendingCount: pending.length,
      failedCount: failed.length,
      total: pending.length + failed.length,
    }
  }

  async getQueueItems() {
    const pending = await this.getPendingQueue()
    const failed = await this.getFailedQueue()

    return {
      pending: pending.sort((a, b) => b.timestamp - a.timestamp),
      failed: failed.sort((a, b) => b.timestamp - a.timestamp),
    }
  }

  async retryMutation(id: string) {
    return this.updateMutationStatus(id, "pending", false)
  }

  async clearFailedQueue() {
    const db = await this.ensureDb()
    if (!db || !this.hasStore("pendingQueue")) return

    const failed = await this.getFailedQueue()
    const transaction = db.transaction(["pendingQueue"], "readwrite")
    const store = transaction.objectStore("pendingQueue")

    failed.forEach((m) => store.delete(m.id))

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

export const offlineStorage = new OfflineStorage()

export function useOnlineStatus() {
  const isClient = typeof window !== "undefined"
  const isElectron = isClient && !!(window as unknown as { electron?: unknown }).electron

  const [isOnline, setIsOnline] = React.useState(isClient ? navigator.onLine : true)

  React.useEffect(() => {
    if (!isClient || isElectron) return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isClient, isElectron])

  return isOnline
}
