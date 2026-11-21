import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Módulo de Clientes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
    await page.goto("/clients")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("debe mostrar la página de clientes correctamente", async ({ page }) => {
    await expect(page.getByRole("main").getByRole("heading", { name: /Clientes/i })).toBeVisible()
    await expect(page.getByRole("main")).toContainText(/Total Clientes|Clientes/i)
  })

  test("debe abrir el formulario de nuevo cliente", async ({ page }) => {
    await page
      .getByRole("button", { name: /Nuevo Cliente|Crear Cliente|Nuevo/i })
      .first()
      .click()
    await expect(page.getByRole("dialog").first()).toBeVisible()
  })
})
