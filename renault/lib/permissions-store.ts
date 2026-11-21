import { promises as fs } from "fs"
import path from "path"
import type { Permission } from "@/lib/types"

const DATA_DIR = path.join(process.cwd(), "data")
const PERMISSIONS_FILE = path.join(DATA_DIR, "custom-permissions.json")

async function ensureStorage(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function loadCustomPermissions(): Promise<Permission[]> {
  try {
    await ensureStorage()
    const raw = await fs.readFile(PERMISSIONS_FILE, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Permission[]) : []
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "ENOENT"
    ) {
      return []
    }

    return []
  }
}

export async function saveCustomPermissions(permissions: Permission[]): Promise<void> {
  await ensureStorage()
  await fs.writeFile(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2), "utf8")
}
