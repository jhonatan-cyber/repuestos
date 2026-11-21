"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import type { EntityId } from "@/lib/types"

interface ImportResult {
  created: number
  errors: { row: number; reason: string }[]
  error?: string
}

interface ProductImportDialogProps {
  categoryId: EntityId
  onImportComplete: () => void
}

export function ProductImportDialog({ categoryId, onImportComplete }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      const name = f.name.toLowerCase()
      if (!name.endsWith(".xlsx")) {
        toast.error("Solo archivos .xlsx")
        return
      }
      setFile(f)
      setResult(null)
    }
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("categoryId", String(categoryId))

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al importar")
        return
      }

      setResult(data)
      if (data.created > 0) {
        toast.success(`${data.created} producto(s) importado(s)`)
        onImportComplete()
      } else if (data.errors?.length) {
        toast.error(`No se importó ningún producto: ${data.errors.length} error(es)`)
      }
    } catch {
      toast.error("Error de conexión al importar")
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Subí un archivo .xlsx con los productos. Columnas esperadas: código, nombre, marca,
            modelo, precio_compra, precio_venta, stock, stock_mínimo, unidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <a
            href="/api/products/import/template"
            download
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Descargar plantilla Excel
          </a>
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <>
                <FileSpreadsheet className="h-10 w-10 text-primary mb-2" />
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Hacé click para seleccionar el archivo
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {importing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Importando...</span>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {result.created > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{result.created} producto(s) creado(s)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>No se creó ningún producto</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="flex items-center gap-1 text-sm font-medium text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {result.errors.length} error(es)
                  </p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Fila {err.row}: {err.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Importar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
