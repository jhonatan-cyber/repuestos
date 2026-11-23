"use client"

import React from "react"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Quotation } from "@/lib/types"
import { BrandLogo } from "@/components/brand/brand-logo"

interface PrintQuotationProps {
  quotation: Quotation
}

export function PrintQuotation({ quotation }: PrintQuotationProps) {
  const taxToUse = quotation.tax || 0
  const quotationCode = String(quotation.id).slice(0, 8).toUpperCase()

  return (
    <div
      id="quotation-to-print"
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
            Cotizacion comercial
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 700 }}>#{quotationCode}</p>
        </div>
      </div>

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
            <strong>Fecha:</strong> {formatDate(quotation.date)}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Valida hasta:</strong> {formatDate(quotation.validUntil)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Cliente:</strong> {quotation.clientName}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Vendedor:</strong> {quotation.sellerName}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Estado:</strong> {quotation.status}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Codigo:</strong> #{quotationCode}
          </p>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
        <thead>
          <tr>
            <th style={tableHeadStyle("left")}>Descripcion</th>
            <th style={tableHeadStyle("center")}>Cant.</th>
            <th style={tableHeadStyle("right")}>Precio</th>
            <th style={tableHeadStyle("right")}>Total</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item, index) => (
            <tr key={index}>
              <td style={tableCellStyle("left")}>{item.productName}</td>
              <td style={tableCellStyle("center")}>{item.quantity}</td>
              <td style={tableCellStyle("right")}>{formatCurrency(item.price)}</td>
              <td style={tableCellStyle("right")}>{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
            Terminos y condiciones
          </p>
          <p style={{ margin: "0 0 4px" }}>
            • Precios validos hasta {formatDate(quotation.validUntil)}
          </p>
          <p style={{ margin: "0 0 4px" }}>• Los precios no incluyen instalacion</p>
          <p style={{ margin: "0 0 4px" }}>• Sujeto a disponibilidad de stock</p>
          <p style={{ margin: 0 }}>• Formas de pago: Efectivo, Transferencia y QR</p>
        </div>

        <div style={{ width: "78mm", border: "1px solid #d9d9d9", padding: "12px" }}>
          <div style={summaryRowStyle}>
            <span>Subtotal</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Impuesto</span>
            <span>{formatCurrency(taxToUse)}</span>
          </div>
          {quotation.discount > 0 && (
            <div style={{ ...summaryRowStyle, color: "#c62828" }}>
              <span>Descuento</span>
              <span>-{formatCurrency(quotation.discount)}</span>
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
            <span>{formatCurrency(quotation.total)}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #bbb",
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "12px",
          color: "#444",
        }}
      >
        <p style={{ margin: "0 0 4px" }}>Gracias por su preferencia en Renault Reluz.</p>
        <p style={{ margin: 0 }}>Esta cotizacion no representa un compromiso de compra.</p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "36px" }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", fontSize: "12px" }}>
            Firma asesor comercial
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", fontSize: "12px" }}>
            Aprobacion del cliente
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: Letter portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden;
          }
          #quotation-to-print,
          #quotation-to-print * {
            visibility: visible;
          }
          #quotation-to-print {
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

function tableCellStyle(align: "left" | "center" | "right"): React.CSSProperties {
  return {
    borderBottom: "1px solid #ddd",
    padding: "9px 8px",
    textAlign: align,
    verticalAlign: "top",
  }
}

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "6px",
}
