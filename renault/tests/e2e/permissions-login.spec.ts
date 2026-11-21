import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

test.describe("Login con permisos", () => {
  test("deber�a iniciar sesi�n y entrar al dashboard", async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.locator("aside")).toBeVisible()
  })

  test("deber�a tener sesi�n autenticada y endpoint protegido en 200", async ({ page }) => {
    await login(page)

    const me = await page.request.get("/api/auth/me")
    expect(me.ok()).toBeTruthy()
    const data = await me.json()
    expect(data).toBeTruthy()
  })

  test("deber�a mostrar error con credenciales inv�lidas", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "invalid@test.com")
    await page.fill('input[type="password"]', "wrongpass")
    await page.click('button[type="submit"]')

    await expect(
      page.locator("text=/credenciales|incorrectas|invalid|error/i").first(),
    ).toBeVisible({ timeout: 7000 })
  })
})
