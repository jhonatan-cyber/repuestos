import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Modulo Caja", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("carga la pagina de caja", async ({ page }) => {
    await page.goto("/cash")
    await expect(page.getByRole("main")).toBeVisible()
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText(/Caja/i)
  })

  test("muestra controles principales de caja", async ({ page }) => {
    await page.goto("/cash")
    await expect(page.getByRole("button", { name: /Abrir Caja|Abrir/i }).first()).toBeVisible()
    await expect(page.getByRole("main")).toContainText(/Caja|Saldo|Ingreso|Egreso/i)
  })
})
