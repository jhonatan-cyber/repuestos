import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Modulo Categorias", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com", "admin123")
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test("carga la pagina de categorias", async ({ page }) => {
    await page.goto("/categories")
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText(/Categor/i)
  })

  test("muestra controles de categorias", async ({ page }) => {
    await page.goto("/categories")
    await expect(
      page.getByRole("button", { name: /Nueva Categoría|Nueva Categoria|Crear/i }).first(),
    ).toBeVisible()
    await expect(page.getByRole("main")).toContainText(/Categor/i)
  })
})
