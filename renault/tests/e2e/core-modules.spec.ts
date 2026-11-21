import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

test.describe("Módulo Sales", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de ventas", async ({ page }) => {
    await page.goto("/sales")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Ventas")
  })

  test("muestra el listado o su estado vacío", async ({ page }) => {
    await page.goto("/sales")
    const emptyState = page.getByRole("heading", { name: /sin ventas registradas/i })
    await expect(page.getByRole("table", { name: /ventas/i }).or(emptyState)).toBeVisible()

    if (await emptyState.isVisible()) {
      await expect(page.getByRole("table")).toHaveCount(0)
      await expect(page.getByRole("navigation", { name: /pagination/i })).toHaveCount(0)
    }
  })
})

test.describe("Módulo Purchases", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de compras", async ({ page }) => {
    await page.goto("/purchases")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Compras")
  })
})

test.describe("Módulo Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de inventario", async ({ page }) => {
    await page.goto("/inventory")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Inventario")
  })
})

test.describe("Módulo Expenses", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de gastos", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Gastos")
  })
})

test.describe("Módulo Users", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de usuarios", async ({ page }) => {
    await page.goto("/users")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Usuarios")
  })
})
