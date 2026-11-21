"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { sileo } from "sileo"
import type { Category } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { offlineStorage } from "@/lib/offline-storage"
import { filterValidCategories } from "@/lib/category-utils"
import { CATEGORY_MESSAGES } from "@/lib/constants/messages"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [categoryToToggle, setCategoryToToggle] = useState<Category | null>(null)

  const loadFromCache = useCallback(async () => {
    const cachedCategories = await offlineStorage.getList<Category>("categories")
    const validCategories = filterValidCategories(cachedCategories)

    if (validCategories.length > 0) {
      setCategories(validCategories)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  async function fetchCategories() {
    try {
      setIsLoading(true)
      const hasCachedData = await loadFromCache()
      if (hasCachedData) setIsLoading(false)

      const data = await apiClient<Category[]>("/api/categories", {
        useCache: true,
        cacheTime: 300000,
      })

      const categoriesArray = Array.isArray(data) ? data : []
      const validCategories = filterValidCategories(categoriesArray)

      setCategories(validCategories)

      if (validCategories.length > 0) {
        await offlineStorage.setList("categories", validCategories)
      }
    } catch (error) {
      const hasCachedData = await loadFromCache()

      if (hasCachedData) {
        sileo.warning({
          title: CATEGORY_MESSAGES.warning.offline,
          description: CATEGORY_MESSAGES.warning.offlineDescription,
        })
      } else {
        sileo.error({
          title: CATEGORY_MESSAGES.info.noConnection,
          description: CATEGORY_MESSAGES.info.noConnectionDescription,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = useMemo(() => {
    let filtered = [...categories]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((cat) => cat.name.toLowerCase().includes(searchLower))
    }

    return filtered
  }, [categories, search])

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredCategories.slice(startIndex, endIndex)
  }, [filteredCategories, currentPage, pageSize])

  const totalPages = Math.ceil(filteredCategories.length / pageSize)

  async function confirmToggleStatus() {
    if (!categoryToToggle) return

    try {
      const newStatus = categoryToToggle.status === "active" ? "inactive" : "active"
      const updated = await apiClient<{ status: "active" | "inactive" }>(
        `/api/categories/${categoryToToggle.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryToToggle.id ? { ...c, status: updated.status } : c)),
      )

      sileo.success({
        title:
          newStatus === "active"
            ? CATEGORY_MESSAGES.success.activated
            : CATEGORY_MESSAGES.success.deactivated,
      })
    } catch (error) {
      sileo.error({
        title: CATEGORY_MESSAGES.error.toggleStatus,
        description: error instanceof Error ? error.message : CATEGORY_MESSAGES.error.toggleStatus,
      })
    } finally {
      setToggleDialogOpen(false)
      setCategoryToToggle(null)
    }
  }

  function handleEdit(category: Category) {
    setSelectedCategory(category)
    setFormOpen(true)
  }

  function handleDelete(category: Category) {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  function handleNewCategory() {
    setSelectedCategory(null)
    setFormOpen(true)
  }

  function handleToggleStatus(category: Category) {
    setCategoryToToggle(category)
    setToggleDialogOpen(true)
  }

  async function confirmDelete() {
    if (!categoryToDelete) return

    try {
      const result = await apiClient<{
        action?: string
        category?: { status?: "active" | "inactive" }
      }>(`/api/categories/${categoryToDelete.id}`, { method: "DELETE" })

      if (result.action === "deactivated" && result.category) {
        const categoryStatus = result.category.status || "inactive"
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryToDelete.id ? { ...c, status: categoryStatus } : c)),
        )
        sileo.success({ title: CATEGORY_MESSAGES.success.deactivated })
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
        sileo.success({ title: CATEGORY_MESSAGES.success.deleted })
      }
    } catch (error) {
      sileo.error({
        title: CATEGORY_MESSAGES.error.deleteTitle,
        description: error instanceof Error ? error.message : CATEGORY_MESSAGES.error.delete,
      })
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  async function handleFormSuccess(updatedCategory?: Category) {
    if (selectedCategory && updatedCategory) {
      setCategories((prev) => prev.map((c) => (c.id === selectedCategory.id ? updatedCategory : c)))
      sileo.success({ title: CATEGORY_MESSAGES.success.updated })
    } else {
      await fetchCategories()
      sileo.success({ title: CATEGORY_MESSAGES.success.created })
    }
    setSelectedCategory(null)
  }

  const stats = useMemo(
    () => ({
      totalCategories: categories.length,
      activeCategories: categories.filter((c) => c.status === "active").length,
      inactiveCategories: categories.filter((c) => c.status === "inactive").length,
    }),
    [categories],
  )

  return {
    categories: paginatedCategories,
    isLoading,
    search,
    setSearch,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredCategories.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedCategory,
    categoryToDelete,
    toggleDialogOpen,
    setToggleDialogOpen,
    categoryToToggle,
    stats,
    handleEdit,
    handleDelete,
    handleNewCategory,
    handleToggleStatus,
    confirmDelete,
    confirmToggleStatus,
    handleFormSuccess,
  }
}
