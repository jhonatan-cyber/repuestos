"use client"

import React from "react"
import { formatDate } from "@/lib/format-utils"
import { BrandLogo } from "@/components/brand/brand-logo"
import type { SupplierRequestWithProducts } from "@/lib/types"

const statusConfig: Record<string, { label: string }> = {
  pendiente: { label: "Pendiente" },
  enviado: { label: "Enviado" },
  recibido: { label: "Recibido" },
  respondido: { label: "Respondido" },
}

interface PrintSupplierRequestProps {
  request: SupplierRequestWithProducts
}

export function PrintSupplierRequest({ request }: PrintSupplierRequestProps) {
  return (
    <div
      id="supplier-request-to-print"
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
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "0.14em",
              }}
            >
              JHOSEP
            </p>
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
            Solicitud de cotización
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 700 }}>
            #{request.id.toString().slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Info box */}
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
            <strong>Fecha de solicitud:</strong> {formatDate(request.sentAt)}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Proveedor:</strong> {request.supplierName}
          </p>
          {request.respondedAt && (
            <p style={{ margin: 0 }}>
              <strong>Respondido:</strong> {formatDate(request.respondedAt)}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Estado:</strong> {statusConfig[request.status]?.label ?? request.status}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <strong>Productos solicitados:</strong> {request.products.length}
          </p>
        </div>
      </div>

      {/* Products table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
        <thead>
          <tr>
            <th style={tableHeadStyle("left")}>Imagen</th>
            <th style={tableHeadStyle("left")}>Código</th>
            <th style={tableHeadStyle("left")}>Producto</th>
            <th style={tableHeadStyle("left")}>Descripción</th>
            <th style={tableHeadStyle("center")}>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {request.products.map((product) => (
            <tr key={product.id}>
              <td style={{ ...tableCellStyle("center"), width: "50px" }}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "contain",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                ) : (
                  <span style={{ color: "#ccc", fontSize: "10px" }}>—</span>
                )}
              </td>
              <td style={tableCellStyle("left")}>{product.code}</td>
              <td style={tableCellStyle("left")}>{product.name}</td>
              <td
                style={
                  {
                    ...tableCellStyle("left"),
                    maxWidth: "200px",
                    wordWrap: "break-word",
                  } as React.CSSProperties
                }
              >
                {product.description || "—"}
              </td>
              <td style={tableCellStyle("center")}>{product.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      {request.notes && (
        <div
          style={{
            border: "1px solid #d9d9d9",
            padding: "12px",
            marginBottom: "18px",
            fontSize: "12px",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111" }}>
            Notas para el proveedor
          </p>
          <p style={{ margin: 0, color: "#444", whiteSpace: "pre-wrap" }}>{request.notes}</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: Letter portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden;
          }
          #supplier-request-to-print,
          #supplier-request-to-print * {
            visibility: visible;
          }
          #supplier-request-to-print {
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
