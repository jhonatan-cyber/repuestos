import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

test("inventory editing preserves UUID relations and existing product details", async ({
  page,
}) => {
  await login(page)
  const numericWarnings: string[] = []
  page.on("console", (message) => {
    if (/received nan|changing.*(controlled|uncontrolled)/i.test(message.text()))
      numericWarnings.push(message.text())
  })
  const product = {
    id: "a21292ea-245c-45c5-b7ab-6b3cc4cfe574",
    code: "AUDIT-UUID",
    name: "Audit Product",
    categoryId: "2cbf41ba-425b-467b-9b23-1910f6747470",
    category: "Audit Category",
    supplierId: "c295e6fe-8535-4e40-ad86-e0d1f8f9929d",
    supplierName: "Audit Supplier",
    brand: "Renault",
    model: "Clio",
    description: "Existing description",
    image: "data:image/png;base64,audit",
    purchasePrice: 10,
    salePrice: 20,
    stock: 5,
    minimumStock: 1,
    unit: "unidad",
    status: "active",
  }
  await page.route("**/api/products**", (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? { data: [product], pagination: { page: 1, totalPages: 1 } }
          : product,
    }),
  )
  await page.route("**/api/categories", (route) =>
    route.fulfill({
      json: [{ id: product.categoryId, name: product.category, type: "product", status: "active" }],
    }),
  )
  await page.route("**/api/suppliers", (route) =>
    route.fulfill({
      json: {
        data: [{ id: product.supplierId, name: product.supplierName, status: "active" }],
        pagination: { page: 1, totalPages: 1 },
      },
    }),
  )
  await page.goto("/inventory")
  await page.getByRole("button", { name: "Editar Audit Product", exact: true }).click()
  const dialog = page.getByRole("dialog")
  for (const [label, value] of [
    ["Precio de Compra *", "10"],
    ["Precio de Venta *", "20"],
    ["Stock Actual", "5"],
    ["Stock Mínimo", "1"],
  ]) {
    await dialog.getByLabel(label, { exact: true }).fill("")
    await expect(dialog.getByLabel(label, { exact: true })).toHaveValue("")
    await expect(dialog.getByLabel(label, { exact: true })).not.toHaveAttribute(
      "value",
      /NaN|Infinity/,
    )
    await dialog.getByLabel(label, { exact: true }).fill(value)
  }
  await expect(dialog.getByLabel("Marca *")).toHaveValue("Renault")
  await expect(dialog.getByLabel("Modelo *")).toHaveValue("Clio")
  await expect(dialog.getByRole("combobox").filter({ hasText: product.category })).toBeVisible()
  await expect(dialog.getByRole("combobox").filter({ hasText: product.supplierName })).toBeVisible()
  const saved = page.waitForRequest(
    (request) =>
      request.url().endsWith(`/api/products/${product.id}`) && request.method() === "PUT",
  )
  await dialog.getByRole("button", { name: "Actualizar", exact: true }).click()
  expect((await saved).postDataJSON()).toMatchObject({
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    brand: product.brand,
    model: product.model,
    description: product.description,
    image: product.image,
    purchasePrice: 10,
    salePrice: 20,
    stock: 5,
    minimumStock: 1,
  })
  await expect(dialog).toBeHidden()
  expect(numericWarnings).toEqual([])
})
