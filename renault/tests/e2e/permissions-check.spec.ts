import { test, expect } from "@playwright/test"
import { getE2EAdminPassword, login } from "../helpers/auth"

test.describe("checkPermission - Helper Function Tests", () => {
  test("debería permitir login y navegar al dashboard", async ({ page }) => {
    await login(page, "admin@gmail.com")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("debería exponer data de sesión desde API", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "admin@gmail.com", password: getE2EAdminPassword(), rememberMe: false },
    })
    expect(res.ok()).toBeTruthy()
    const user = await res.json()
    expect(user.email).toBe("admin@gmail.com")
    expect(Array.isArray(user.permissions)).toBeTruthy()
  })
})
