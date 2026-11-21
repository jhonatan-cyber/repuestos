import { test, expect, type Page } from "@playwright/test"
import { login } from "../helpers/auth"

const category = {
  id: "e47577ea-0103-4bac-8c94-6c8a4726faf9",
  name: "Repuestos Prueba",
  type: "product",
  status: "active",
}

async function prepare(page: Page) {
  await login(page)
  const state = {
    products: [] as Record<string, unknown>[],
    suppliers: [] as Record<string, unknown>[],
    purchases: [] as Record<string, any>[],
    rejectSupplier: false,
    rejectProduct: false,
  }
  const list = (data: unknown[]) => ({
    data,
    pagination: { page: 1, totalPages: data.length ? 1 : 0 },
  })
  await page.route("**/api/cash-records**", (route) =>
    route.fulfill({ json: list([{ id: "cash-1", status: "open" }]) }),
  )
  await page.route("**/api/categories", (route) => route.fulfill({ json: [category] }))
  await page.route("**/api/suppliers**", async (route) => {
    if (route.request().method() === "POST") {
      if (state.rejectSupplier)
        return route.fulfill({
          status: 403,
          json: { error: "Sin permisos para crear proveedores" },
        })
      const supplier = {
        ...route.request().postDataJSON(),
        id: "98df1a5d-3f6d-4d04-b166-be4f1d30ea79",
        status: "active",
      }
      state.suppliers.push(supplier)
      return route.fulfill({ status: 201, json: supplier })
    }
    return route.fulfill({ json: list(state.suppliers) })
  })
  await page.route("**/api/products**", async (route) => {
    if (route.request().method() === "POST") {
      if (state.rejectProduct)
        return route.fulfill({ status: 409, json: { error: "Código de producto duplicado" } })
      const product = {
        ...route.request().postDataJSON(),
        id: "d8dd3bbc-3662-4dd5-8ddd-cb2efb3e7ef5",
        category,
        status: "active",
      }
      state.products.push(product)
      return route.fulfill({ status: 201, json: product })
    }
    return route.fulfill({ json: list(state.products) })
  })
  await page.route("**/api/purchases**", async (route) => {
    if (route.request().method() === "POST") {
      const purchase = {
        ...route.request().postDataJSON(),
        id: "purchase-1",
        supplierName: "Proveedor Prueba",
      }
      state.purchases.push(purchase)
      return route.fulfill({ status: 201, json: purchase })
    }
    return route.fulfill({ json: list(state.purchases) })
  })
  await page.goto("/purchases")
  await page.getByRole("button", { name: /nueva compra/i }).click()
  return state
}

test("creates supplier and categorized product inside a purchase without losing the draft", async ({
  page,
}) => {
  test.setTimeout(60000)
  const state = await prepare(page)
  const errors: string[] = []
  const numericWarnings: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (/received nan|changing.*(controlled|uncontrolled)/i.test(message.text()))
      numericWarnings.push(message.text())
  })
  const purchase = page.getByRole("dialog", { name: "Nueva Compra", exact: true })
  await purchase.getByLabel("Fecha", { exact: true }).fill("2026-10-14")
  await purchase.locator('input[type="number"]').first().fill("3")
  await purchase.getByRole("button", { name: "Nuevo proveedor", exact: true }).click()
  const supplier = page.getByRole("dialog", { name: "Nuevo Proveedor", exact: true })
  await supplier.getByLabel("Nombre *", { exact: true }).fill("Proveedor Prueba")
  await supplier.getByLabel("Teléfono *", { exact: true }).fill("77777777")
  await supplier.getByRole("button", { name: "Crear", exact: true }).click()
  await expect(supplier).toBeHidden()
  await expect(purchase.getByRole("combobox").filter({ hasText: "Proveedor Prueba" })).toBeVisible()
  await purchase.getByRole("button", { name: "Nuevo producto", exact: true }).click()
  const product = page.getByRole("dialog", { name: "Nuevo Producto", exact: true })
  await expect(product.getByRole("combobox").filter({ hasText: "Proveedor Prueba" })).toBeVisible()
  await expect(product.getByLabel("Stock Actual")).toHaveCount(0)
  await product.getByLabel("Código *", { exact: true }).fill("NUEVO-001")
  await product.getByLabel("Nombre *", { exact: true }).fill("Filtro Prueba")
  await product.getByLabel("Marca *", { exact: true }).fill("Renault")
  await product.getByLabel("Modelo *", { exact: true }).fill("Clio")
  for (const label of ["Precio de Compra *", "Precio de Venta *", "Stock Mínimo"]) {
    await product.getByLabel(label, { exact: true }).fill("")
    await expect(product.getByLabel(label, { exact: true })).toHaveValue("")
    await expect(product.getByLabel(label, { exact: true })).not.toHaveAttribute(
      "value",
      /NaN|Infinity/,
    )
  }
  await product.getByLabel("Precio de Compra *", { exact: true }).fill("10.5")
  await expect(product.getByLabel("Precio de Compra *", { exact: true })).toHaveValue("10.5")
  await product.getByLabel("Precio de Compra *", { exact: true }).fill("10")
  await product.getByLabel("Precio de Venta *", { exact: true }).fill("15")
  await product.getByRole("button", { name: "Crear", exact: true }).click()
  await expect(product.getByText("Debe seleccionar una categoría", { exact: true })).toBeVisible()
  expect(state.products).toHaveLength(0)
  await product.getByRole("combobox").filter({ hasText: "Seleccionar categoría" }).click()
  await page.getByRole("option", { name: category.name, exact: true }).click()
  state.rejectProduct = true
  await product.getByRole("button", { name: "Crear", exact: true }).click()
  await expect(page.getByText("Código de producto duplicado", { exact: true })).toBeVisible()
  await expect(product.getByLabel("Nombre *", { exact: true })).toHaveValue("Filtro Prueba")
  state.rejectProduct = false
  await product.getByRole("button", { name: "Crear", exact: true }).click()
  await expect(product).toBeHidden()
  await expect(purchase.getByRole("combobox").filter({ hasText: "Filtro Prueba" })).toBeVisible()
  await expect(purchase.getByLabel("Fecha", { exact: true })).toHaveValue("2026-10-14")
  await expect(purchase.locator('input[type="number"]').first()).toHaveValue("3")
  expect(state.products[0]).toMatchObject({
    stock: 0,
    minimumStock: 0,
    categoryId: category.id,
    supplierId: state.suppliers[0].id,
  })
  expect(state.purchases).toHaveLength(0)
  await purchase.getByRole("button", { name: "Registrar compra", exact: true }).click()
  await expect(purchase).toBeHidden()
  expect(state.purchases).toHaveLength(1)
  expect(state.purchases[0]).toMatchObject({
    supplierId: state.suppliers[0].id,
    total: 30,
    items: [{ productId: state.products[0].id, quantity: 3, price: 10 }],
  })
  expect(errors).toEqual([])
  expect(numericWarnings).toEqual([])
})

test("failed supplier registration and cancelling product creation preserve the purchase", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const state = await prepare(page)
  state.rejectSupplier = true
  const purchase = page.getByRole("dialog", { name: "Nueva Compra", exact: true })
  await purchase.locator('input[type="number"]').first().fill("4")
  await purchase.getByRole("button", { name: "Nuevo producto", exact: true }).click()
  await page
    .getByRole("dialog", { name: "Nuevo Producto", exact: true })
    .getByRole("button", { name: "Cancelar", exact: true })
    .click()
  await purchase.getByRole("button", { name: "Nuevo proveedor", exact: true }).click()
  const supplier = page.getByRole("dialog", { name: "Nuevo Proveedor", exact: true })
  await supplier.getByLabel("Nombre *", { exact: true }).fill("Proveedor Prueba")
  await supplier.getByLabel("Teléfono *", { exact: true }).fill("77777777")
  await supplier.getByRole("button", { name: "Crear", exact: true }).click()
  await expect(page.getByText("Sin permisos para crear proveedores", { exact: true })).toBeVisible()
  await expect(supplier.getByLabel("Nombre *", { exact: true })).toHaveValue("Proveedor Prueba")
  await supplier.getByRole("button", { name: "Cancelar", exact: true }).click()
  await expect(purchase.locator('input[type="number"]').first()).toHaveValue("4")
  expect(state.purchases).toHaveLength(0)
  expect(state.suppliers).toHaveLength(0)
  expect(state.products).toHaveLength(0)
})
