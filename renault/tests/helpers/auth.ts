import { Page, expect } from "@playwright/test"

const DEFAULT_EMAILS = [
  process.env.E2E_ADMIN_EMAIL,
  "admin@gmail.com",
  "admin@repuestos.com",
  "admin@renault.com",
  "admin@erp.com",
].filter(Boolean) as string[]

export function getE2EAdminPassword() {
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD
  if (!password || password.length < 8) {
    throw new Error(
      "Define E2E_ADMIN_PASSWORD o SEED_ADMIN_PASSWORD con al menos 8 caracteres",
    )
  }
  return password
}

export async function login(page: Page, email?: string, password = getE2EAdminPassword()) {
  const candidates = email ? [email] : DEFAULT_EMAILS

  const setupStatus = await page.request.get("/api/auth/setup/check")
  if (setupStatus.ok()) {
    const { needsSetup } = await setupStatus.json()
    if (needsSetup) {
      const setup = await page.request.post("/api/auth/setup", {
        data: {
          ci: "E2E-ADMIN",
          firstName: "Admin",
          lastName: "E2E",
          email: candidates[0],
          password,
        },
      })
      if (!setup.ok() && setup.status() !== 403) {
        throw new Error(`No se pudo preparar el administrador E2E (${setup.status()})`)
      }
    }
  }

  await page.goto("/login")
  if (page.url().includes("/dashboard")) return

  for (const candidate of candidates) {
    await page.fill('input[type="email"]', candidate)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL("**/dashboard", { timeout: 5000 })
      return
    } catch {
      await page.goto("/login")
    }
  }

  throw new Error("No se pudo iniciar sesi�n en E2E con los usuarios candidatos")
}

export async function logout(page: Page) {
  await page.goto("/login")
  await expect(page).toHaveURL(/\/login/)
}
