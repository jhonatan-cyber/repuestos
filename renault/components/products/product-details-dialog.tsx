"use client"

import { useState } from "react"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { formatCurrency } from "@/lib/format-utils"
import {
  Tag,
  DollarSign,
  TrendingUp,
  Warehouse,
  Building2,
  Clock,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  ImageOff,
} from "lucide-react"

interface ProductDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? "text-right font-mono text-xs" : "text-right font-medium"}>
        {value}
      </span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 inline-flex items-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      title="Copiar al portapapeles"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

export function ProductDetailsDialog({ open, onOpenChange, product }: ProductDetailsDialogProps) {
  if (!product) return null

  const fallbackImage = "/img/products/product-default.png"

  const syncLabel = product.lastSyncedAt
    ? new Date(product.lastSyncedAt).toLocaleString("es-BO")
    : "Sin sincronizar"

  const stock = product.stock ?? 0
  const minimumStock = product.minimumStock ?? 0
  const isLowStock = stock <= minimumStock
  const stockPercentage =
    minimumStock > 0 ? Math.min((stock / (minimumStock * 2)) * 100, 100) : stock > 0 ? 100 : 0

  const margin =
    product.purchasePrice > 0
      ? ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100
      : 0

  const isActive = product.status === "active"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* ── Header con imagen + identidad ── */}
        <DialogHeader className="border-b space-y-0 pb-3">
          <DialogTitle className="text-base">Detalle del producto</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* ── Imagen + Identidad ── */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Imagen */}
            <div className="relative mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-xl border bg-muted sm:mx-0 sm:h-36 sm:w-36">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    if (!target.src.endsWith(fallbackImage)) target.src = fallbackImage
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Identidad */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="truncate text-lg font-bold">{product.name}</h2>
                <Badge variant={isActive ? "default" : "secondary"} className="shrink-0 gap-1">
                  {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground sm:justify-start">
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {product.code}
                  <CopyButton text={product.code} />
                </span>
                {product.brand && (
                  <span>
                    {product.brand}
                    {product.model ? ` — ${product.model}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Secciones ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Precios */}
            <div className="rounded-lg border bg-card p-4">
              <SectionLabel icon={DollarSign} label="Precios" />
              <div className="space-y-0.5">
                <FieldRow label="Compra" value={formatCurrency(product.purchasePrice)} />
                <FieldRow label="Venta" value={formatCurrency(product.salePrice)} />
                <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
                  <span className="shrink-0 text-muted-foreground">Margen</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      margin >= 20
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : margin > 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="rounded-lg border bg-card p-4">
              <SectionLabel icon={Warehouse} label="Inventario" />
              <div className="space-y-0.5">
                <FieldRow label="Stock actual" value={`${stock} ${product.unit}`} />
                <FieldRow label="Stock mínimo" value={`${minimumStock}`} />
                {/* Barra de stock */}
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Nivel</span>
                    <span>
                      {stock} / {minimumStock * 2 || stock || 1}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLowStock
                          ? "bg-red-500"
                          : stockPercentage < 50
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.max(stockPercentage, 2)}%` }}
                    />
                  </div>
                </div>
                {isLowStock && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Stock por debajo del mínimo
                  </div>
                )}
              </div>
            </div>

            {/* Proveedor + Categoría */}
            <div className="rounded-lg border bg-card p-4">
              <SectionLabel icon={Building2} label="Proveedor" />
              <div className="space-y-0.5">
                <FieldRow label="Nombre" value={product.supplierName || "Sin proveedor"} />
                <FieldRow
                  label="ID"
                  value={product.supplierId ? String(product.supplierId) : "—"}
                  mono
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <SectionLabel icon={Tag} label="Categoría" />
              <div className="space-y-0.5">
                <FieldRow label="Nombre" value={product.category || "Sin categoría"} />
                <FieldRow label="ID" value={String(product.categoryId)} mono />
              </div>
            </div>
          </div>

          {/* ── Metadatos ── */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <SectionLabel icon={Clock} label="Metadatos" />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">ID:</span>
                <span className="font-mono">{String(product.id)}</span>
                <CopyButton text={String(product.id)} />
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {syncLabel}
              </span>
              {product.image && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[300px]">
                  <span className="font-medium shrink-0">Imagen:</span>
                  <span className="truncate font-mono">{product.image}</span>
                </span>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
