import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

const HEADERS = [
  "código",
  "nombre",
  "descripción",
  "marca",
  "modelo",
  "categoria",
  "precio_compra",
  "precio_venta",
  "stock",
  "stock_mínimo",
  "unidad",
]

const EXAMPLE_ROW = [
  "A001",
  "Filtro de aceite",
  "Filtro de aceite para motor Logan 1.6, compatible con Sandero",
  "Mann-Filter",
  "W712/8",
  "Repuestos",
  15000,
  25000,
  10,
  3,
  "unidad",
]

export async function GET() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Productos")

  ws.addRow(HEADERS)
  ws.addRow(EXAMPLE_ROW)

  ws.columns = HEADERS.map((h) => ({
    width: h === "nombre" ? 30 : h.startsWith("precio") ? 16 : 14,
  }))

  const buf = await wb.xlsx.writeBuffer()

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="plantilla-productos.xlsx"`,
    },
  })
}
