"use client"

import { BrandLogo } from "@/components/brand/brand-logo"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Sale } from "@/lib/types"
import { usePrintPreviewContext } from "@/components/sales/print-preview-dialog"

interface PrintSaleProps {
  sale: Sale
  copies?: 1 | 2
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  crédito: "Crédito",
  credito: "Crédito",
  qr: "QR",
  mixto: "Pago mixto",
}

function SaleReceipt({ sale, compact }: { sale: Sale; compact: boolean }) {
  const saleCode = sale.id.toString().slice(0, 8).toUpperCase()
  const paymentLabel = PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod
  const itemCount = sale.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  const titleSize = compact ? "16px" : "28px"
  const bodySize = compact ? "10px" : "15px"
  const smSize = compact ? "9px" : "13px"
  const pad = compact ? "4mm" : "12mm"
  const sectionGap = compact ? "8px" : "24px"
  const cellPad = compact ? "4px 6px" : "10px 12px"

  return (
    <div
      className="bg-white text-black"
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: pad,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: bodySize,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...(compact ? { border: "1px solid #ccc", borderRadius: "2mm" } : { minHeight: "255mm" }),
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: compact ? "6px" : "16px",
          borderBottom: "2px solid #111",
          paddingBottom: compact ? "6px" : "14px",
          marginBottom: sectionGap,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: compact ? "8px" : "20px" }}>
          <BrandLogo
            alt="Logo Renault Reluz"
            className={`shrink-0 ${compact ? "h-15 w-15" : "h-30 w-30"}`}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: titleSize,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Renault Reluz
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: compact ? "10px" : "16px",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "0.14em",
              }}
            >
              JHOSEP
            </p>
            <p style={{ margin: "2px 0 0", fontSize: compact ? "9px" : "14px", fontWeight: 600 }}>
              Repuestos automotrices
            </p>
            <p style={{ margin: "2px 0 0", fontSize: smSize, color: "#333" }}>
              Av. Confital - Av. Blanco Galindo Km 14.5
            </p>
            <p style={{ margin: "1px 0 0", fontSize: smSize, color: "#333" }}>
              Quillacollo - Cochabamba
            </p>
            <p style={{ margin: "1px 0 0", fontSize: smSize, color: "#333" }}>
              Tel: +591 63070278 | NIT: 000000
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: 0,
              fontSize: compact ? "9px" : "13px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#555",
              fontWeight: 600,
            }}
          >
            Comprobante de venta
          </p>
          <p style={{ margin: "4px 0 0", fontSize: compact ? "15px" : "22px", fontWeight: 700 }}>
            #{saleCode}
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: compact ? "8px" : "20px",
          marginBottom: sectionGap,
          padding: compact ? "6px 10px" : "14px 18px",
          background: "#f7f7f7",
          border: "1px solid #d9d9d9",
          fontSize: bodySize,
          borderRadius: "4px",
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Fecha:</strong> {formatDate(sale.date)}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Cliente:</strong> {sale.clientName || "Cliente no registrado"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Código:</strong> #{saleCode}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Vendedor:</strong> {sale.sellerName || "—"}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Estado:</strong> {sale.status}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Método de pago:</strong> {paymentLabel}
          </p>
        </div>
      </div>

      {/* Items table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: sectionGap,
          fontSize: bodySize,
        }}
      >
        <thead>
          <tr>
            <th style={tableHeadStyle("left", compact)}>Descripción</th>
            <th style={tableHeadStyle("center", compact)}>Cant.</th>
            <th style={tableHeadStyle("right", compact)}>Precio</th>
            <th style={tableHeadStyle("right", compact)}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`}>
              <td style={tableCellStyle("left", cellPad, bodySize)}>{item.productName || "—"}</td>
              <td style={tableCellStyle("center", cellPad, bodySize)}>{item.quantity}</td>
              <td style={tableCellStyle("right", cellPad, bodySize)}>
                {formatCurrency(item.price)}
              </td>
              <td style={tableCellStyle("right", cellPad, bodySize, true)}>
                {formatCurrency(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: compact ? "8px" : "24px",
          marginBottom: compact ? "8px" : "24px",
        }}
      >
        <div
          style={{
            flex: 1,
            border: "1px solid #d9d9d9",
            padding: compact ? "6px 10px" : "14px 18px",
            fontSize: smSize,
            color: "#444",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111", fontSize: bodySize }}>
            Términos y condiciones
          </p>
          <p style={{ margin: "0 0 3px" }}>• Revise su mercadería al momento de recibirla</p>
          <p style={{ margin: "0 0 3px" }}>• Cambios sujetos a políticas internas de la empresa</p>
          <p style={{ margin: "0 0 3px" }}>• Conserve este comprobante para cualquier consulta</p>
          <p style={{ margin: 0 }}>• Formas de pago: Efectivo, Transferencia y QR</p>
        </div>

        <div
          style={{
            width: compact ? "55mm" : "90mm",
            border: "1px solid #d9d9d9",
            padding: compact ? "6px 10px" : "14px 18px",
            borderRadius: "4px",
          }}
        >
          <div style={compact ? summaryRowStyleCompact(smSize) : summaryRowStyle(smSize)}>
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div style={compact ? summaryRowStyleCompact(smSize) : summaryRowStyle(smSize)}>
            <span>Impuestos</span>
            <span>{formatCurrency(sale.tax || 0)}</span>
          </div>
          {sale.discount > 0 && (
            <div
              style={{
                ...(compact ? summaryRowStyleCompact(smSize) : summaryRowStyle(smSize)),
                color: "#c62828",
              }}
            >
              <span>Descuento</span>
              <span>-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div
            style={{
              ...(compact ? summaryRowStyleCompact(smSize) : summaryRowStyle(smSize)),
              marginTop: compact ? "4px" : "10px",
              paddingTop: compact ? "4px" : "10px",
              borderTop: "2px solid #111",
              fontSize: compact ? "13px" : "19px",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment splits */}
      {(sale.paymentMethod === "mixto" ||
        (sale.paymentSplits && sale.paymentSplits.length > 0)) && (
        <div
          style={{
            marginBottom: sectionGap,
            padding: compact ? "6px 10px" : "12px 16px",
            background: "#fff8e1",
            border: "1px solid #ffc107",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: smSize, fontWeight: 700, color: "#111" }}>
            Detalle de pago mixto
          </p>
          {(sale.paymentSplits || []).map((split, index) => (
            <div
              key={`${split.method}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "3px",
                fontSize: smSize,
              }}
            >
              <span style={{ color: "#555" }}>{PAYMENT_LABELS[split.method] || split.method}</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(split.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {sale.notes && sale.notes.trim() && (
        <div
          style={{
            marginBottom: sectionGap,
            padding: compact ? "6px 10px" : "12px 16px",
            background: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: smSize, fontWeight: 700, color: "#111" }}>
            Observaciones
          </p>
          <p style={{ margin: 0, fontSize: smSize, color: "#555", whiteSpace: "pre-wrap" }}>
            {sale.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #bbb",
          paddingTop: compact ? "4px" : "12px",
          textAlign: "center",
          fontSize: smSize,
          color: "#444",
        }}
      >
        <p style={{ margin: "0 0 2px" }}>Gracias por su compra en Renault Reluz.</p>
        <p style={{ margin: "0 0 2px" }}>
          {sale.items.length} {sale.items.length === 1 ? "producto" : "productos"} · {itemCount}{" "}
          {itemCount === 1 ? "unidad" : "unidades"} en total
        </p>
        <p style={{ margin: 0 }}>Este documento certifica la operación comercial realizada.</p>
      </div>

      {/* Signatures */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: compact ? "12px" : "32px",
          marginTop: compact ? "12px" : "40px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              borderTop: "1px solid #555",
              paddingTop: compact ? "4px" : "10px",
              fontSize: smSize,
            }}
          >
            Firma asesor comercial
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              borderTop: "1px solid #555",
              paddingTop: compact ? "4px" : "10px",
              fontSize: smSize,
            }}
          >
            Recibí conforme
          </div>
        </div>
      </div>
    </div>
  )
}

export function PrintSale({ sale, copies }: PrintSaleProps) {
  const context = usePrintPreviewContext()
  const effectiveCopies = copies ?? (context.isLandscape ? 2 : 1)

  if (effectiveCopies === 2) {
    return (
      <div id="sale-to-print">
        <div
          style={{
            display: "flex",
            gap: "4mm",
            padding: "5mm",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <SaleReceipt sale={sale} compact />
          </div>
          <div style={{ width: "1mm", background: "#999", minHeight: "100%" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SaleReceipt sale={sale} compact />
          </div>
        </div>
        <style>{`
          @media print {
            @page { margin: 5mm; }
            body * { visibility: hidden; }
            #sale-to-print,
            #sale-to-print * { visibility: visible; }
            #sale-to-print {
              position: fixed; inset: 0; width: 100%; height: 100%;
              margin: 0; padding: 0;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div id="sale-to-print">
      <SaleReceipt sale={sale} compact={false} />
      <style>{`
        @media print {
          @page { margin: 10mm; }
          body * { visibility: hidden; }
          #sale-to-print,
          #sale-to-print * { visibility: visible; }
          #sale-to-print {
            position: fixed; inset: 0; width: 100%;
            max-width: none; margin: 0; padding: 0;
          }
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
        }
      `}</style>
    </div>
  )
}

function tableHeadStyle(align: "left" | "center" | "right", compact: boolean): React.CSSProperties {
  return {
    borderBottom: "2px solid #111",
    padding: compact ? "5px 4px" : "10px 8px",
    textAlign: align,
    fontSize: compact ? "9px" : "12px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  }
}

function tableCellStyle(
  align: "left" | "center" | "right",
  padding: string,
  fontSize: string,
  bold = false,
): React.CSSProperties {
  return {
    borderBottom: "1px solid #ddd",
    padding,
    textAlign: align,
    verticalAlign: "top",
    fontWeight: bold ? 600 : 400,
    fontSize,
  }
}

const summaryRowStyle = (fontSize: string): React.CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "6px",
  fontSize,
})

const summaryRowStyleCompact = (fontSize: string): React.CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  gap: "6px",
  marginBottom: "3px",
  fontSize,
})
