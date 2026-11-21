import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export interface SystemSettings {
  companyName: string
  companySlogan: string
  companyAddress: string
  companyCity: string
  companyPhone: string
  companyNit: string
  hasLogo: boolean
}

export async function getSettings(): Promise<SystemSettings> {
  const config = await prisma.systemConfig.findFirst()
  return {
    companyName: config?.companyName ?? "Renault Reluz",
    companySlogan: config?.companySlogan ?? "Repuestos automotrices",
    companyAddress: config?.companyAddress ?? "Av. Confital - Av. Blanco Galindo Km 14.5",
    companyCity: config?.companyCity ?? "Quillacollo - Cochabamba",
    companyPhone: config?.companyPhone ?? "+591 63070278",
    companyNit: config?.companyNit ?? "000000",
    hasLogo: !!config?.logoBase64,
  }
}

export async function updateSettings(
  data: Partial<Omit<SystemSettings, "hasLogo">>,
): Promise<SystemSettings> {
  const existing = await prisma.systemConfig.findFirst()
  if (existing) {
    await prisma.systemConfig.update({ where: { id: existing.id }, data })
  } else {
    await prisma.systemConfig.create({ data: data as Prisma.SystemConfigCreateInput })
  }
  return getSettings()
}
