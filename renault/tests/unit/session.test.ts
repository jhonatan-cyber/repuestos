import { describe, it, expect, vi, beforeEach } from "vitest"
const roleLookup = vi.hoisted(() => vi.fn())
vi.mock("@/lib/prisma", () => ({ prisma: { role: { findUnique: roleLookup } } }))
import { getRoleDisplayName, buildSessionUser, getPermissionsForRole } from "@/lib/auth/session"

describe("getPermissionsForRole", () => {
  beforeEach(() => {
    roleLookup.mockReset()
  })

  it.each(["admin", "ADMIN", "administrador", "Administrador"])(
    "resolves stored administrator permissions for %s",
    async (alias) => {
      roleLookup.mockImplementation(async ({ where }: { where: { name: string } }) =>
        where.name === "Administrador" ? { permissions: '["dashboard","sales.read"]' } : null,
      )
      expect(await getPermissionsForRole(alias)).toEqual(["dashboard", "sales.read"])
    },
  )

  it("resolves compras to the stored Comprador role", async () => {
    roleLookup.mockImplementation(async ({ where }: { where: { name: string } }) =>
      where.name === "Comprador" ? { permissions: '["purchases"]' } : null,
    )
    expect(await getPermissionsForRole("compras")).toEqual(["purchases"])
  })

  it("preserves an explicitly empty permission list", async () => {
    roleLookup.mockResolvedValue({ permissions: "[]" })
    expect(await getPermissionsForRole("admin")).toEqual([])
  })

  it("does not grant permissions to unknown roles", async () => {
    roleLookup.mockResolvedValue(null)
    expect(await getPermissionsForRole("unknown_role")).toEqual([])
  })
})

describe("getRoleDisplayName", () => {
  it("returns display name for admin", () => {
    expect(getRoleDisplayName("admin")).toBe("Administrador")
  })

  it("returns display name for administrador", () => {
    expect(getRoleDisplayName("administrador")).toBe("Administrador")
  })

  it("returns display name for vendedor", () => {
    expect(getRoleDisplayName("vendedor")).toBe("Vendedor")
  })

  it("returns display name for comprador", () => {
    expect(getRoleDisplayName("comprador")).toBe("Comprador")
  })

  it("handles compras alias", () => {
    expect(getRoleDisplayName("compras")).toBe("Comprador")
  })

  it("returns same string for unknown role", () => {
    expect(getRoleDisplayName("unknown_role")).toBe("unknown_role")
  })

  it("is case insensitive", () => {
    expect(getRoleDisplayName("ADMIN")).toBe("Administrador")
    expect(getRoleDisplayName("Vendedor")).toBe("Vendedor")
  })

  it("trims whitespace", () => {
    expect(getRoleDisplayName("  admin  ")).toBe("Administrador")
  })
})

describe("buildSessionUser", () => {
  const user = {
    id: "1",
    email: "test@ejemplo.com",
    firstName: "Juan",
    lastName: "Pérez",
    role: "vendedor",
  }

  it("builds session user with permissions", () => {
    const result = buildSessionUser(user, ["dashboard", "sales"])
    expect(result).toEqual({
      id: "1",
      email: "test@ejemplo.com",
      name: "Juan Pérez",
      role: "vendedor",
      permissions: ["dashboard", "sales"],
    })
  })

  it("concatenates firstName and lastName", () => {
    const result = buildSessionUser(user, [])
    expect(result.name).toBe("Juan Pérez")
  })

  it("handles empty permissions array", () => {
    const result = buildSessionUser(user, [])
    expect(result.permissions).toEqual([])
  })
})
