import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

type NotificationLevel = "info" | "warning" | "success" | "error"

interface CreateNotificationInput {
  type?: NotificationLevel
  title: string
  message: string
  userIds?: string[]
  entity?: string | null
  entityId?: string | null
  url?: string | null
  metadata?: Record<string, unknown> | null
}

// NOTA: la tabla `notifications` la crean las migraciones Prisma. Sin ensure raw.

async function getTargetUsers(userIds?: string[]) {
  if (userIds && userIds.length > 0) return userIds

  const rows = await prisma.user.findMany({
    where: { status: "active", isDeleted: false },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function createNotification(input: CreateNotificationInput) {
  const targets = await getTargetUsers(input.userIds)
  if (!targets.length) return

  const now = new Date()
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null
  const rows = targets.map((userId) => ({
    id: randomUUID(),
    userId,
    type: input.type || "info",
    title: input.title,
    message: input.message,
    entity: input.entity || null,
    entityId: input.entityId || null,
    url: input.url || null,
    metadata: metadataJson,
    updatedAt: now,
  }))

  await prisma.notification.createMany({ data: rows })
}

export async function listNotifications(userId: string, limit = 12) {
  return prisma.notification.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export async function getUnreadNotificationsCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false, isDeleted: false },
  })
}

export async function markNotificationAsRead(userId: string, id: string) {
  const now = new Date()

  return prisma.notification.updateMany({
    where: { id, userId, isDeleted: false },
    data: { isRead: true, readAt: now, updatedAt: now },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  const now = new Date()

  return prisma.notification.updateMany({
    where: { userId, isRead: false, isDeleted: false },
    data: { isRead: true, readAt: now, updatedAt: now },
  })
}
