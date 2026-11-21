import { test, expect } from "@playwright/test"
import { login, logout } from "../helpers/auth"

test.describe("Sidebar filtering por permisos", () => {
  test("deber�a mostrar navegaci�n principal para admin", async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)

    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole("link", { name: /dashboard/i })).toBeVisible()

    await expect(
      sidebar.getByRole("link", { name: /ventas|compras|productos|inventario|finanzas/i }).first(),
    ).toBeVisible()

    await logout(page)
  })
})
