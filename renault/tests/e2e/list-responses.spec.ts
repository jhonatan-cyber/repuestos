import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

test("sales form loads clients and products beyond the first API page", async ({ page }) => {
  await login(page)
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.route("**/api/cash-records", (route) =>
    route.fulfill({
      json: { data: [{ id: "cash-1", status: "open" }], pagination: { page: 1, totalPages: 1 } },
    }),
  )
  await page.route("**/api/clients**", (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") || 1)
    return route.fulfill({
      json: {
        data: [
          { id: `client-${pageNumber}`, name: `Cliente página ${pageNumber}`, phone: "77777777" },
        ],
        pagination: { page: pageNumber, totalPages: 2 },
      },
    })
  })
  await page.route("**/api/products**", (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") || 1)
    return route.fulfill({
      json: {
        data: [
          {
            id: `product-${pageNumber}`,
            code: `AUDIT-${pageNumber}`,
            name: `Producto página ${pageNumber}`,
            salePrice: 20,
            stock: 10,
            unit: "unidad",
          },
        ],
        pagination: { page: pageNumber, totalPages: 2 },
      },
    })
  })
  await page.goto("/sales")
  await page.getByRole("button", { name: /nueva venta/i }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "Nueva Venta", exact: true })).toBeVisible()
  await dialog.getByRole("combobox").filter({ hasText: "Selecciona un cliente" }).click()
  await page.getByRole("option", { name: "Cliente página 2" }).click()
  await expect(dialog.getByRole("combobox").filter({ hasText: "Cliente página 2" })).toBeVisible()
  await dialog.getByRole("combobox").filter({ hasText: "Selecciona producto" }).click()
  await page.getByRole("option", { name: /Producto página 2/ }).click()
  await expect(dialog.getByRole("combobox").filter({ hasText: "Producto página 2" })).toBeVisible()
  expect(errors).toEqual([])
})
