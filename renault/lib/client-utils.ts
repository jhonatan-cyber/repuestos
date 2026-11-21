import type { Prisma } from "@prisma/client"
import type { Client } from "@/lib/types"

export function isValidClient(client: Client): boolean {
  return client.id !== undefined && client.id !== null
}

export function filterValidClients(
  clients: Client[],
): (Client & { id: NonNullable<Client["id"]> })[] {
  return clients.filter(isValidClient) as (Client & { id: NonNullable<Client["id"]> })[]
}

export function transformClientToAPI(client: Prisma.ClientGetPayload<{}>) {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    address: client.address,
    status: client.status,
    totalPurchases: client.totalPurchases,
    createdAt: client.createdAt.toISOString(),
  }
}
