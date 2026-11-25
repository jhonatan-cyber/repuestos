import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

test.describe("Modulo Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@gmail.com")
  })

  test("carga la pagina del dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("main").getByRole("heading", { name: /Dashboard/i })).toBeVisible()
  })

  test("muestra secciones principales", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("main")).toContainText(/Actualizado|Dashboard|Stock/i)
  })
})
