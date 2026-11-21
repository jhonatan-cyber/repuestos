import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Modulo Permisos", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("carga la pagina de permisos", async ({ page }) => {
    await page.goto("/permissions")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Permisos")
  })

  test("muestra el boton para crear nuevo permiso", async ({ page }) => {
    await page.goto("/permissions")
    await expect(page.getByRole("button", { name: /Nuevo Permiso|Nuevo/i }).first()).toBeVisible()
  })

  test("muestra la tabla de permisos", async ({ page }) => {
    await page.goto("/permissions")
    await expect(page.getByRole("table", { name: /permisos/i })).toBeVisible()
  })

  test("muestra las estadisticas de permisos", async ({ page }) => {
    await page.goto("/permissions")
    await expect(page.getByRole("main")).toContainText(/Total|Permisos/)
  })

  test("permite buscar permisos", async ({ page }) => {
    await page.goto("/permissions")
    await expect(page.getByRole("textbox", { name: /buscar/i }).first()).toBeVisible()
  })
})
