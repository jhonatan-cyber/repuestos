import { test, expect } from "@playwright/test"
import { login } from "../helpers/auth"

const BASE_URL = process.env.BASE_URL || "http://localhost:5000"

test.describe("Módulo Quotations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de cotizaciones", async ({ page }) => {
    await page.goto(`${BASE_URL}/quotations`)
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Cotizaciones")
  })
})

test.describe("Módulo Clients", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de clientes", async ({ page }) => {
    await page.goto(`${BASE_URL}/clients`)
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Clientes")
  })
})

test.describe("Módulo Suppliers", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de proveedores", async ({ page }) => {
    await page.goto(`${BASE_URL}/suppliers`)
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Proveedores")
  })
})

test.describe("Módulo Reports", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("carga página de reportes", async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`)
    await expect(page.getByRole("main").getByRole("heading").first()).toContainText("Reportes")
  })
})
