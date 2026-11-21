import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Modulo Roles", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("carga la pagina de roles", async ({ page }) => {
    await page.goto("/roles")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Roles")
  })

  test("muestra el boton para crear nuevo rol", async ({ page }) => {
    await page.goto("/roles")
    await expect(page.getByRole("button", { name: /Nuevo Rol|Nuevo/i }).first()).toBeVisible()
  })

  test("muestra la tabla de roles", async ({ page }) => {
    await page.goto("/roles")
    await expect(page.getByRole("table", { name: /roles/i })).toBeVisible()
  })

  test("muestra las estadisticas de roles", async ({ page }) => {
    await page.goto("/roles")
    await expect(page.getByRole("main")).toContainText(/Total|Roles/)
  })

  test("permite buscar roles", async ({ page }) => {
    await page.goto("/roles")
    await expect(page.getByRole("textbox", { name: /buscar/i }).first()).toBeVisible()
  })
})
