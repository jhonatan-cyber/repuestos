import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Modulo Gastos", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("carga la pagina de gastos", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Gastos")
  })

  test("muestra el boton para crear nuevo gasto", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("button", { name: /Nuevo Gasto|Nuevo/i }).first()).toBeVisible()
  })

  test("muestra la tabla de gastos o el estado vacío", async ({ page }) => {
    await page.goto("/expenses")
    const table = page.getByRole("table", { name: /gastos/i })
    const empty = page.getByRole("status").filter({ hasText: "No hay gastos registrados" })
    await expect(table.or(empty).first()).toBeVisible()
    await expect(page.getByText("No hay datos disponibles", { exact: true })).toHaveCount(0)
  })

  test("muestra las estadisticas de gastos", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("main")).toContainText(/Total|Gastos/)
  })

  test("muestra el estado vacío cuando la API no devuelve gastos", async ({ page }) => {
    await page.route("**/api/expenses", (route) =>
      route.fulfill({
        json: { data: [], pagination: { page: 1, totalPages: 0 } },
      }),
    )
    await page.goto("/expenses")
    await expect(
      page.getByRole("status").filter({ hasText: "No hay gastos registrados" }),
    ).toBeVisible()
    await expect(page.getByRole("table", { name: /gastos/i })).toHaveCount(0)
  })

  test("permite buscar gastos", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("textbox", { name: /buscar/i }).first()).toBeVisible()
  })
})
