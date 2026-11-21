import { prisma } from "@/lib/prisma"

export function parseRolePermissions(permJson: string | null): string[] {
  if (!permJson) return []
  try {
    const parsed = JSON.parse(permJson)
    // Validate it's an array of strings
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((p): p is string => typeof p === "string")
  } catch {
    return []
  }
}

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.role) {
      return false
    }

    const permissions = parseRolePermissions(user.role)

    if (permissions.includes("*")) {
      return true
    }

    return permissions.includes(permission)
  } catch (error) {
    return false
  }
}
