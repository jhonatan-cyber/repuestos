"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "@/lib/toast"
import type { Product, Category, EntityId } from "@/lib/types"
import { apiClient, OfflineCacheMissError } from "@/lib/api-client"
import { offlineStorage } from "@/lib/offline-storage"
import { loadList } from "@/lib/api-list"

export function useProducts(categoryId: EntityId) {
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productToToggle, setProductToToggle] = useState<Product | null>(null)
  const [productToView, setProductToView] = useState<Product | null>(null)

  useEffect(() => {
    if (categoryId != null && categoryId !== "") {
      fetchProducts()
      fetchCategory()
    }
  }, [categoryId])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, pageSize])

  async function loadCategoryFromCache() {
    const normalizedCategoryId = String(categoryId)
    const cachedCategories = await offlineStorage.getList<Category>("categories")
    const cachedCategory =
      cachedCategories.find((item) => String(item.id) === normalizedCategoryId) ?? null

    if (cachedCategory) {
      setCategory(cachedCategory)
      return true
    }

    return false
  }

  async function fetchCategory() {
    try {
      const normalizedCategoryId = String(categoryId)
      const data = await apiClient<Category>(
        `/api/categories/${encodeURIComponent(normalizedCategoryId)}`,
      )
      setCategory(data)
    } catch (error) {
      const hasCachedCategory = await loadCategoryFromCache()

      if (!hasCachedCategory && !(error instanceof OfflineCacheMissError)) {
        console.error("Error fetching category:", error)
      }
    }
  }

  async function fetchProducts(options?: { silent?: boolean }) {
    const isSilent = options?.silent === true
    try {
      if (!isSilent) {
        setIsLoading(true)
      }

      const normalizedCategoryId = String(categoryId)

      const cachedProducts = await offlineStorage.getList<Product>("products")
      const categoryProducts = cachedProducts.filter(
        (p) => String(p.categoryId) === normalizedCategoryId,
      )
      if (categoryProducts.length > 0) {
        setProducts(categoryProducts)
        if (!isSilent) {
          setIsLoading(false)
        }
      }

      const data = await loadList<Product>(
        `/api/products?categoryId=${encodeURIComponent(normalizedCategoryId)}`,
        (url) =>
          apiClient<unknown>(url, {
            useCache: true,
            cacheTime: 300000,
            cache: "no-store",
          }),
      )

      let finalProducts = [...data]

      const pending = await offlineStorage.getAllPendingMutations()
      const productMutations = pending.filter((m) => m.endpoint.includes("/api/products"))

      productMutations.forEach((m) => {
        const idFromEndpoint = m.endpoint.split("/").pop()
        const payload = m.payload as Product | undefined

        if (m.operation === "POST" && payload) {
          if (!finalProducts.find((p) => p.id === payload.id)) {
            finalProducts.unshift(payload)
          }
        } else if (m.operation === "DELETE") {
          finalProducts = finalProducts.filter((p) => p.id !== idFromEndpoint)
        } else if ((m.operation === "PUT" || m.operation === "PATCH") && payload) {
          finalProducts = finalProducts.map((p) =>
            p.id === idFromEndpoint ? { ...p, ...payload } : p,
          )
        }
      })

      setProducts(finalProducts)

      if (finalProducts.length > 0) {
        const allCachedProducts = await offlineStorage.getList<Product>("products")
        const otherCategoryProducts = allCachedProducts.filter(
          (p) => String(p.categoryId) !== normalizedCategoryId,
        )
        await offlineStorage.setList("products", [...otherCategoryProducts, ...finalProducts])
      }
    } catch (error) {
      toast.warning("Mostrando datos guardados (sin conexión)")
    } finally {
      if (!isSilent) {
        setIsLoading(false)
      }
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.code.toLowerCase().includes(searchLower),
      )
    }

    if (status === "active") {
      filtered = filtered.filter((product) => product.status === "active")
    } else if (status === "inactive") {
      filtered = filtered.filter((product) => product.status === "inactive")
    } else if (status === "low-stock") {
      filtered = filtered.filter((product) => (product.stock ?? 0) <= (product.minimumStock ?? 0))
    }

    return filtered
  }, [products, search, status])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  function handleEdit(product: Product) {
    setSelectedProduct(product)
    setFormOpen(true)
  }

  function handleDelete(product: Product) {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  function handleNewProduct() {
    setSelectedProduct(null)
    setFormOpen(true)
  }

  function handleViewDetails(product: Product) {
    setProductToView(product)
    setDetailsDialogOpen(true)
  }

  async function confirmDelete() {
    if (!productToDelete) return

    try {
      const result = await apiClient<{
        action?: "deleted" | "deactivated"
        product?: Product
      }>(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      })

      if (result.action === "deactivated" && result.product) {
        setProducts((prev) => {
          const updatedProducts: Product[] = prev.map((product) =>
            product.id === productToDelete.id
              ? ({ ...product, status: "inactive" } as Product)
              : product,
          )
          void offlineStorage.setList(
            "products",
            updatedProducts as Array<{ id: string } & Product>,
          )
          return updatedProducts
        })
        toast.success("Producto desactivado correctamente")
      } else {
        setProducts((prev) => {
          const updatedProducts: Product[] = prev.filter(
            (product) => product.id !== productToDelete.id,
          )
          void offlineStorage.setList(
            "products",
            updatedProducts as Array<{ id: string } & Product>,
          )
          return updatedProducts
        })
        toast.success("Producto eliminado correctamente")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar producto")
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  async function handleFormSuccess(updatedProduct?: Product) {
    if (selectedProduct && updatedProduct) {
      const mergedProducts = products.map((p) =>
        p.id === selectedProduct.id
          ? {
              ...p,
              ...updatedProduct,
              status: updatedProduct.status ?? p.status ?? "active",
            }
          : p,
      )
      setProducts(mergedProducts)
      const allCachedProducts = await offlineStorage.getList<Product>("products")
      const normalizedCategoryId = String(categoryId)
      const otherCategoryProducts = allCachedProducts.filter(
        (p) => String(p.categoryId) !== normalizedCategoryId,
      )
      await offlineStorage.setList("products", [...otherCategoryProducts, ...mergedProducts])
      await fetchProducts({ silent: true })
      toast.success("Producto actualizado correctamente")
    } else if (updatedProduct) {
      const createdProduct: Product = {
        ...updatedProduct,
        status: updatedProduct.status ?? "active",
      }
      const nextProducts = [createdProduct, ...products]
      setProducts(nextProducts)
      const allCachedProducts = await offlineStorage.getList<Product>("products")
      const normalizedCategoryId = String(categoryId)
      const otherCategoryProducts = allCachedProducts.filter(
        (p) => String(p.categoryId) !== normalizedCategoryId,
      )
      await offlineStorage.setList("products", [...otherCategoryProducts, ...nextProducts])
      await fetchProducts({ silent: true })
      toast.success("Producto creado correctamente")
    } else {
      // Fallback defensivo
      await fetchProducts({ silent: true })
      toast.success("Producto guardado correctamente")
    }
    setSelectedProduct(null)
  }

  function handleToggleStatus(product: Product) {
    setProductToToggle(product)
    setToggleDialogOpen(true)
  }

  async function confirmToggleStatus() {
    if (!productToToggle?.id) return
    const newStatus = productToToggle.status === "active" ? "inactive" : "active"

    setProducts((prev) =>
      prev.map((p) => (p.id === productToToggle.id ? { ...p, status: newStatus } : p)),
    )

    try {
      const updated = await apiClient<Product>(`/api/products/${productToToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productToToggle.id
            ? { ...p, ...updated, status: updated.status ?? newStatus }
            : p,
        ),
      )
      const allCachedProducts = await offlineStorage.getList<Product>("products")
      await offlineStorage.setList(
        "products",
        allCachedProducts.map((p) =>
          p.id === productToToggle.id
            ? { ...p, ...updated, status: updated.status ?? newStatus }
            : p,
        ),
      )
      await fetchProducts({ silent: true })
      toast.success(`Producto ${newStatus === "active" ? "activado" : "desactivado"} correctamente`)
    } catch (error) {
      await fetchProducts({ silent: true })
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del producto")
    } finally {
      setToggleDialogOpen(false)
      setProductToToggle(null)
    }
  }

  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      lowStockProducts: products.filter((p) => (p.stock ?? 0) <= (p.minimumStock ?? 0)).length,
      totalValue: products.reduce((sum, p) => sum + p.salePrice * (p.stock ?? 0), 0),
    }),
    [products],
  )

  return {
    products: paginatedProducts,
    allProducts: products,
    category,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredProducts.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    toggleDialogOpen,
    setToggleDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedProduct,
    productToDelete,
    productToToggle,
    productToView,
    stats,
    handleEdit,
    handleDelete,
    handleNewProduct,
    handleViewDetails,
    handleToggleStatus,
    confirmToggleStatus,
    confirmDelete,
    handleFormSuccess,
    refreshProducts: () => fetchProducts({ silent: true }),
  }
}
