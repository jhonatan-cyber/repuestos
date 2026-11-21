"use client"

import { logger } from "@/lib/logger"
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { isElectronRuntime } from "@/lib/app-runtime"

export type PaperSize = "a4" | "letter" | "legal"

export interface PaperDimension {
  width: string
  height: string
  cssName: string
  label: string
}

export const PAPER_DIMENSIONS: Record<PaperSize, PaperDimension> = {
  a4: { width: "210mm", height: "297mm", cssName: "A4", label: "A4" },
  letter: { width: "216mm", height: "279mm", cssName: "letter", label: "Carta" },
  legal: { width: "216mm", height: "356mm", cssName: "legal", label: "Oficio" },
}

export interface PrintPreviewContextValue {
  isLandscape: boolean
  paperSize: PaperSize
}

export const PrintPreviewContext = createContext<PrintPreviewContextValue>({
  isLandscape: false,
  paperSize: "a4",
})

export function usePrintPreviewContext() {
  return useContext(PrintPreviewContext)
}

interface PrintPreviewDialogProps {
  open: boolean
  onClose: () => void
  children?: ReactNode
  /** Cuando se pasa HTML en vez de children, se renderiza en un iframe (útil para recibos generados como string) */
  htmlContent?: string
  /** ID del elemento HTML para capturar el outerHTML en Electron (default: "sale-to-print") */
  elementId?: string
  /** Cuando se pasa, muestra botón "Exportar PDF" */
  onExportPdf?: () => void
  /** Orientación horizontal inicial (por defecto vertical si no se pasa) */
  landscape?: boolean
  /** Tamaño de hoja inicial (por defecto "a4") */
  defaultPaperSize?: PaperSize
}

export function PrintPreviewDialog({
  open,
  onClose,
  children,
  htmlContent,
  elementId = "sale-to-print",
  onExportPdf,
  landscape,
  defaultPaperSize = "a4",
}: PrintPreviewDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isElectron = isElectronRuntime()

  // Estado local para la orientación (Vertical u Horizontal) y tamaño de hoja
  const [isLandscape, setIsLandscape] = useState<boolean>(landscape ?? false)
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPaperSize)

  // Sincronizar props iniciales cuando abre el modal
  useEffect(() => {
    if (open) {
      setIsLandscape(landscape ?? false)
      setPaperSize(defaultPaperSize)
    }
  }, [open, landscape, defaultPaperSize])

  // Cerrar preview después de imprimir (browser path)
  useEffect(() => {
    if (!open) return

    const handleAfterPrint = () => onClose()
    window.addEventListener("afterprint", handleAfterPrint)
    return () => window.removeEventListener("afterprint", handleAfterPrint)
  }, [open, onClose])

  const currentPaper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.a4
  const containerWidth = isLandscape ? currentPaper.height : currentPaper.width
  const containerMinHeight = isLandscape ? currentPaper.width : currentPaper.height
  const pageCssSize = `${currentPaper.cssName} ${isLandscape ? "landscape" : "portrait"}`

  const handlePrint = useCallback(async () => {
    const pageStyle = `<style>@page { size: ${pageCssSize} !important; }</style>`

    if (isElectron && typeof window.electron?.printTicket === "function") {
      if (htmlContent) {
        const preparedHtml = htmlContent.includes("</head>")
          ? htmlContent.replace("</head>", `${pageStyle}</head>`)
          : pageStyle + htmlContent
        const result = await window.electron.printTicket(preparedHtml, "")
        if (!result.success) {
          logger.error("[PrintPreview] Error en printTicket", { error: result.error })
        }
      } else {
        const el = document.getElementById(elementId)
        if (el) {
          const preparedHtml = pageStyle + el.outerHTML
          const result = await window.electron.printTicket(preparedHtml, "")
          if (!result.success) {
            logger.error("[PrintPreview] Error en printTicket", { error: result.error })
          }
        }
      }
      onClose()
      return
    }

    if (htmlContent) {
      // Abrir ventana con el HTML para imprimir desde ahí
      const printWindow = window.open("", "_blank", "width=820,height=900")
      if (!printWindow) return

      const preparedHtml = htmlContent.includes("</head>")
        ? htmlContent.replace("</head>", `${pageStyle}</head>`)
        : pageStyle + htmlContent

      printWindow.document.write(preparedHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.onafterprint = () => printWindow.close()

      if (printWindow.document.readyState === "complete") {
        setTimeout(() => printWindow.print(), 100)
      } else {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 100)
      }
      onClose()
      return
    }

    // Browser con children: @media print se encarga a través del estilo inyectado
    window.print()
  }, [isElectron, onClose, elementId, htmlContent, pageCssSize])

  const handleExportPdf = useCallback(() => {
    onExportPdf?.()
    onClose()
  }, [onExportPdf, onClose])

  if (!open) return null

  const previewContent = htmlContent ? (
    <iframe
      ref={iframeRef}
      srcDoc={
        htmlContent.includes("</head>")
          ? htmlContent.replace(
              "</head>",
              `<style>@page { size: ${pageCssSize} !important; }</style></head>`,
            )
          : `<style>@page { size: ${pageCssSize} !important; }</style>${htmlContent}`
      }
      className="h-full w-full border-0"
      title="Vista previa de impresión"
      style={{ minHeight: containerMinHeight }}
    />
  ) : (
    children
  )

  return (
    <PrintPreviewContext.Provider value={{ isLandscape, paperSize }}>
      <div className="fixed inset-0 z-9999 flex flex-col">
        {/* Dynamic print orientation and page size override */}
        <style>{`
          @media print {
            @page {
              size: ${pageCssSize} !important;
            }
          }
        `}</style>

        {/* Backdrop — se oculta al imprimir */}
        <div className="absolute inset-0 bg-black/70 print:hidden" onClick={onClose} />

        {/* Toolbar — se oculta al imprimir */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 shadow-md print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Vista previa de impresión</h2>

            {/* Selector de disposición de hoja (Vertical / Horizontal) */}
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setIsLandscape(false)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  !isLandscape
                    ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
                title="Orientación Vertical (Portrait)"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="6" y="3" width="12" height="18" rx="2" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="15" y2="11" />
                </svg>
                <span>Vertical</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLandscape(true)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  isLandscape
                    ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
                title="Orientación Horizontal (Landscape)"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <line x1="7" y1="9" x2="17" y2="9" />
                  <line x1="7" y1="13" x2="13" y2="13" />
                </svg>
                <span>Horizontal</span>
              </button>
            </div>

            {/* Selector de Tamaño de Hoja (A4, Carta, Oficio) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">Hoja:</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">Carta (216 × 279 mm)</option>
                <option value="legal">Oficio (216 × 356 mm)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onExportPdf && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Exportar PDF
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="relative z-10 flex-1 overflow-auto bg-gray-200 p-6">
          <div
            ref={contentRef}
            className="mx-auto bg-white shadow-xl transition-all duration-300"
            style={{
              width: containerWidth,
              minHeight: containerMinHeight,
              transformOrigin: "top center",
            }}
          >
            {previewContent}
          </div>
        </div>
      </div>
    </PrintPreviewContext.Provider>
  )
}
