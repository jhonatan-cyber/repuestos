"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, Product, Supplier } from "@/lib/types"
import { toast } from "@/lib/toast"
import { loadList } from "@/lib/api-list"
import { apiClient } from "@/lib/api-client"

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true)

      const [productsData, categoriesData, suppliersData] = await Promise.all([
        loadList<Product>("/api/products?limit=10000"),
        loadList<Category>("/api/categories"),
        loadList<Supplier>("/api/suppliers"),
      ])

      setProducts(productsData)
      setCategories(categoriesData)
      setSuppliers(suppliersData)
    } catch (error) {
      setProducts([])
      setCategories([])
      setSuppliers([])
      toast.error("Error al cargar inventario")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, supplierFilter, stockFilter, pageSize])

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter((product) => {
        const code = product.code.toLowerCase()
        const name = product.name.toLowerCase()
        const category = (product.category || "").toLowerCase()
        const supplier = (product.supplierName || "").toLowerCase()

        return (
          code.includes(query) ||
          name.includes(query) ||
          category.includes(query) ||
          supplier.includes(query)
        )
      })
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => String(product.categoryId) === categoryFilter)
    }

    if (supplierFilter !== "all") {
      filtered = filtered.filter((product) => String(product.supplierId) === supplierFilter)
    }

    if (stockFilter === "low-stock") {
      filtered = filtered.filter((product) => (product.stock ?? 0) <= (product.minimumStock ?? 0))
    }

    if (stockFilter === "normal-stock") {
      filtered = filtered.filter((product) => (product.stock ?? 0) > (product.minimumStock ?? 0))
    }

    return filtered
  }, [products, search, categoryFilter, supplierFilter, stockFilter])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))

  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      lowStockProducts: products.filter(
        (product) => (product.stock ?? 0) <= (product.minimumStock ?? 0),
      ).length,
      inventoryCost: products.reduce(
        (sum, product) => sum + product.purchasePrice * (product.stock ?? 0),
        0,
      ),
      inventoryValue: products.reduce(
        (sum, product) => sum + product.salePrice * (product.stock ?? 0),
        0,
      ),
    }),
    [products],
  )

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

  async function confirmDelete() {
    if (!productToDelete) return

    try {
      const data = await apiClient<{ action?: string; product?: Product }>(
        `/api/products/${productToDelete.id}`,
        { method: "DELETE" },
      )

      if (data?.action === "deactivated" && data.product) {
        setProducts((current) =>
          current.map((product) =>
            product.id === productToDelete.id ? { ...product, status: "inactive" } : product,
          ),
        )
        toast.success("Producto desactivado correctamente")
      } else {
        setProducts((current) => current.filter((product) => product.id !== productToDelete.id))
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
      setProducts((current) =>
        current.map((product) => (product.id === selectedProduct.id ? updatedProduct : product)),
      )
      toast.success("Producto actualizado correctamente")
    } else {
      toast.success("Producto creado correctamente")
      await fetchInventory()
    }

    setSelectedProduct(null)
  }

  return {
    products: paginatedProducts,
    isLoading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    supplierFilter,
    setSupplierFilter,
    stockFilter,
    setStockFilter,
    categories,
    suppliers,
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
    selectedProduct,
    productToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleNewProduct,
    confirmDelete,
    handleFormSuccess,
  }
}
