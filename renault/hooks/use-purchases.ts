"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Product, Purchase, Supplier } from "@/lib/types"
import { toast } from "@/lib/toast"
import { exportPurchaseReceiptPDF, exportPurchasesPDF } from "@/lib/export"
import { useAuth } from "@/lib/auth-context"
import { usePrintPreview } from "@/hooks/use-print-preview"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import type { SupplierInput } from "@/lib/validations"

interface PurchaseFormValues {
  date: string
  supplierId: string
  purchaseType: "contado" | "credito"
  paymentMethod: "efectivo" | "transferencia" | "qr"
  initialPaymentMethod?: "efectivo" | "transferencia" | "qr"
  initialPayment?: number
  items: Array<{ productId: string; quantity: number; unitCost: number }>
}

export function usePurchases() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const {
    documentToPrint: purchaseToPrint,
    openPrintPreview,
    closePrintPreview: handleClosePrintPreview,
  } = usePrintPreview<Purchase>()

  const fetchPurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      const url = params.toString() ? `/api/purchases?${params.toString()}` : "/api/purchases"
      setPurchases(await loadList<Purchase>(url))
    } catch (error) {
      setPurchases([])
      toast.error("Error al cargar compras")
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  const fetchDependencies = useCallback(async () => {
    try {
      const [suppliersData, productsData] = await Promise.all([
        loadList<Supplier>("/api/suppliers"),
        loadList<Product>("/api/products?limit=100"),
      ])
      setSuppliers(suppliersData)
      setProducts(productsData)
    } catch (error) {
      setSuppliers([])
      setProducts([])
      toast.error("Error al cargar proveedores o productos")
    }
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  useEffect(() => {
    fetchDependencies()
  }, [fetchDependencies])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, pageSize, startDate, endDate])

  const filteredPurchases = useMemo(() => {
    let filtered = [...purchases]
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter((purchase) => {
        const supplierName = (purchase.supplierName || "").toLowerCase()
        const buyerName = (purchase.buyerName || "").toLowerCase()
        const itemNames = purchase.items
          .map((item) => (item.productName || "").toLowerCase())
          .join(" ")
        return (
          supplierName.includes(query) || buyerName.includes(query) || itemNames.includes(query)
        )
      })
    }
    if (status !== "all") filtered = filtered.filter((purchase) => purchase.status === status)
    return filtered
  }, [purchases, search, status])

  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPurchases.slice(start, start + pageSize)
  }, [filteredPurchases, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize))

  const stats = useMemo(
    () => ({
      totalPurchasesAmount: purchases.reduce((sum, purchase) => sum + purchase.total, 0),
      totalPurchasesCount: purchases.length,
      receivedPurchasesCount: purchases.filter((purchase) => purchase.status === "recibida").length,
      pendingPurchasesCount: purchases.filter((purchase) => purchase.status === "pendiente").length,
    }),
    [purchases],
  )

  function handleViewDetails(purchase: Purchase) {
    setSelectedPurchase(purchase)
    setDetailsOpen(true)
  }

  function handlePrint(purchase: Purchase) {
    openPrintPreview(purchase)
  }

  function handleExportReceipt(purchase: Purchase) {
    void exportPurchaseReceiptPDF(purchase)
  }

  function handleNewPurchase() {
    setFormOpen(true)
  }

  async function handleCreatePurchase(values: PurchaseFormValues) {
    if (!user?.id) {
      toast.error("No se pudo identificar al usuario actual")
      return
    }

    const subtotal = values.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

    try {
      setIsSubmitting(true)
      await apiClient("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date,
          supplierId: values.supplierId,
          purchaseType: values.purchaseType,
          paymentMethod: values.paymentMethod,
          initialPaymentMethod: values.initialPaymentMethod,
          initialPayment: values.initialPayment ?? 0,
          buyerUserId: String(user.id),
          items: values.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitCost,
          })),
          subtotal,
          tax: 0,
          total: subtotal,
          status: "recibida",
        }),
      })
      toast.success("Compra registrada correctamente")
      setFormOpen(false)
      await fetchPurchases()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar compra")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleExportPDF() {
    if (filteredPurchases.length === 0) {
      toast.error("No hay compras para exportar")
      return
    }
    exportPurchasesPDF(filteredPurchases)
  }

  function handleProductCreated(product: Product) {
    setProducts((previous) => [
      product,
      ...previous.filter((row) => String(row.id) !== String(product.id)),
    ])
  }

  async function handleCreateSupplier(values: SupplierInput): Promise<Supplier> {
    try {
      const supplier = await apiClient<Supplier>("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      setSuppliers((previous) => [
        supplier,
        ...previous.filter((row) => String(row.id) !== String(supplier.id)),
      ])
      toast.success("Proveedor registrado correctamente")
      return supplier
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el proveedor")
      throw error
    }
  }

  return {
    purchases: paginatedPurchases,
    isLoading,
    isSubmitting,
    suppliers,
    products,
    user,
    search,
    setSearch,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredPurchases.length,
    detailsOpen,
    setDetailsOpen,
    formOpen,
    setFormOpen,
    selectedPurchase,
    purchaseToPrint,
    stats,
    handleViewDetails,
    handlePrint,
    handleExportReceipt,
    handleClosePrintPreview,
    handleNewPurchase,
    handleCreatePurchase,
    handleProductCreated,
    handleCreateSupplier,
    handleExportPDF,
    clearDateRange: () => {
      setStartDate("")
      setEndDate("")
    },
  }
}
