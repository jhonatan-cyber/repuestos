"use client"

import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Purchase } from "@/lib/types"
import { BrandLogo } from "@/components/brand/brand-logo"

interface PrintPurchaseProps {
  purchase: Purchase
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  qr: "QR",
}

export function PrintPurchase({ purchase }: PrintPurchaseProps) {
  const purchaseCode = purchase.id.toString().slice(0, 8).toUpperCase()
  const paymentLabel = PAYMENT_LABELS[purchase.paymentMethod] || purchase.paymentMethod
  const itemCount = purchase.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <div
      id="purchase-to-print"
      className="bg-white text-black"
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "255mm",
        margin: "0 auto",
        padding: "12mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          borderBottom: "3px solid #111",
          paddingBottom: "12px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <BrandLogo alt="Logo Renault Reluz" className="h-[250px] w-[250px] shrink-0" />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Renault Reluz
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 600 }}>
              Repuestos automotrices
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
              Av. Confital - Av. Blanco Galindo Km 14.5
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
              Quillacollo - Cochabamba
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#444" }}>
              Tel: +591 63070278 | NIT: 000000
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#555",
            }}
          >
            Comprobante de compra
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 700 }}>#{purchaseCode}</p>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "18px",
          padding: "12px",
          background: "#f7f7f7",
          border: "1px solid #d9d9d9",
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Fecha:</strong> {formatDate(purchase.date)}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Proveedor:</strong> {purchase.supplierName || "—"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Código:</strong> #{purchaseCode}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Comprador:</strong> {purchase.buyerName || "—"}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Estado:</strong> {purchase.status}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Método de pago:</strong> {paymentLabel}
          </p>
        </div>
      </div>

      {/* Products table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
        <thead>
          <tr>
            <th style={tableHeadStyle("left")}>Producto</th>
            <th style={tableHeadStyle("center")}>Cant.</th>
            <th style={tableHeadStyle("right")}>P. Unitario</th>
            <th style={tableHeadStyle("right")}>Total</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.map((item, index) => (
            <tr key={index}>
              <td style={tableCellStyle("left")}>{item.productName || "—"}</td>
              <td style={tableCellStyle("center")}>{item.quantity}</td>
              <td style={tableCellStyle("right")}>{formatCurrency(item.price)}</td>
              <td style={tableCellStyle("right", true)}>
                {formatCurrency(item.quantity * item.price)}
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
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            flex: 1,
            border: "1px solid #d9d9d9",
            padding: "12px",
            fontSize: "12px",
            color: "#444",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111" }}>
            Términos y condiciones
          </p>
          <p style={{ margin: "0 0 4px" }}>• Revise la mercadería al momento de recibirla</p>
          <p style={{ margin: "0 0 4px" }}>• Cambios sujetos a políticas internas de la empresa</p>
          <p style={{ margin: "0 0 4px" }}>• Conserve este comprobante para cualquier consulta</p>
          <p style={{ margin: 0 }}>• Formas de pago: Efectivo, Transferencia y QR</p>
        </div>

        <div style={{ width: "78mm", border: "1px solid #d9d9d9", padding: "12px" }}>
          <div style={summaryRowStyle}>
            <span>Subtotal</span>
            <span>{formatCurrency(purchase.subtotal)}</span>
          </div>
          {purchase.tax > 0 && (
            <div style={summaryRowStyle}>
              <span>Impuestos</span>
              <span>{formatCurrency(purchase.tax)}</span>
            </div>
          )}
          <div
            style={{
              ...summaryRowStyle,
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "2px solid #111",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(purchase.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #bbb",
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "12px",
          color: "#444",
        }}
      >
        <p style={{ margin: "0 0 4px" }}>Documento de registro de compra — Renault Reluz</p>
        <p style={{ margin: "0 0 4px" }}>
          {purchase.items.length} {purchase.items.length === 1 ? "producto" : "productos"} ·{" "}
          {itemCount} {itemCount === 1 ? "unidad" : "unidades"} en total
        </p>
        <p style={{ margin: 0 }}>
          Este comprobante certifica la adquisición de mercadería registrada en el sistema.
        </p>
      </div>

      {/* Signatures */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "36px" }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", fontSize: "12px" }}>
            Firma encargado de compras
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", fontSize: "12px" }}>
            Recibí conforme
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: Letter portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden;
          }
          #purchase-to-print,
          #purchase-to-print * {
            visibility: visible;
          }
          #purchase-to-print {
            position: fixed;
            inset: 0;
            width: 100%;
            max-width: none;
            min-height: calc(279.4mm - 24mm);
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  )
}

function tableHeadStyle(align: "left" | "center" | "right"): React.CSSProperties {
  return {
    borderBottom: "2px solid #111",
    padding: "10px 8px",
    textAlign: align,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  }
}

function tableCellStyle(align: "left" | "center" | "right", bold = false): React.CSSProperties {
  return {
    borderBottom: "1px solid #ddd",
    padding: "9px 8px",
    textAlign: align,
    verticalAlign: "top",
    fontWeight: bold ? 600 : 400,
  }
}

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "6px",
}
