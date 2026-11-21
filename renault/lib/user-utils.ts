import type { Prisma } from "@prisma/client"
import type { User } from "@/lib/types"
export function isValidUser(user: User): boolean {
  return user.id !== undefined && user.id !== null
}

export function filterValidUsers(users: User[]): User[] {
  return users.filter(isValidUser)
}

export function transformUserToAPI(user: Prisma.UserGetPayload<{}>) {
  return {
    id: user.id,
    ci: user.ci,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    address: user.address,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
    image: user.image || null,
    createdAt: user.createdAt?.toISOString?.() || user.createdAt,
  }
}

export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

export function getUserInitials(user: User): string {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ""
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ""
  return `${firstInitial}${lastInitial}`
}
