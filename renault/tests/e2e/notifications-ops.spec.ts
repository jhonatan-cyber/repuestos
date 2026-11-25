import { test, expect } from "@playwright/test"
import { getE2EAdminPassword } from "../helpers/auth"

const ADMIN_EMAILS = [
  process.env.E2E_ADMIN_EMAIL,
  "admin@gmail.com",
  "admin@repuestos.com",
  "admin@renault.com",
].filter(Boolean) as string[]

async function loginApi(request: any) {
  const password = getE2EAdminPassword()
  for (const email of ADMIN_EMAILS) {
    const res = await request.post("/api/auth/login", {
      data: { email, password, rememberMe: false },
    })
    if (res.ok()) return email
  }
  throw new Error("No se pudo autenticar en API E2E")
}

test.describe("E2E robusto - notifications + ops summary", () => {
  test("debe responder resumen operativo autenticado", async ({ request }) => {
    await loginApi(request)
    const res = await request.get("/api/ops/summary")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty("cash")
    expect(body).toHaveProperty("risks")
    expect(body).toHaveProperty("today")
  })

  test("debe listar y marcar notificaciones", async ({ request }) => {
    await loginApi(request)

    const openCashRes = await request.post("/api/cash-records", {
      data: {
        date: new Date().toISOString().split("T")[0],
        openingBalance: 100,
        notes: "E2E cash open",
      },
    })
    if (!openCashRes.ok()) {
      const openCashBody = await openCashRes.json().catch(() => ({}))
      const conflict =
        openCashRes.status() === 409 ||
        String(openCashBody?.error || "").includes("Ya existe una caja abierta")
      if (!conflict) {
        throw new Error(
          `No se pudo abrir caja para E2E: ${openCashRes.status()} ${JSON.stringify(openCashBody)}`,
        )
      }
    }

    const expenseRes = await request.post("/api/expenses", {
      data: {
        name: "E2E gasto notificación",
        description: "E2E gasto notificación",
        amount: 25,
        category: "General",
        date: new Date().toISOString().split("T")[0],
      },
    })
    expect(expenseRes.ok()).toBeTruthy()

    const listRes = await request.get("/api/notifications?limit=20")
    expect(listRes.ok()).toBeTruthy()
    const payload = await listRes.json()
    expect(Array.isArray(payload.items)).toBeTruthy()

    const hasExpenseNotification = payload.items.some(
      (n: any) => typeof n?.title === "string" && n.title.toLowerCase().includes("gasto"),
    )
    expect(hasExpenseNotification).toBeTruthy()

    const markAllRes = await request.patch("/api/notifications")
    expect(markAllRes.ok()).toBeTruthy()
  })
})
