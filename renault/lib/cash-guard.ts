import { prisma } from "@/lib/prisma"

export async function hasOpenCashRecord() {
  const openCash = await prisma.cashRecord.findFirst({
    where: {
      status: "open",
      isDeleted: false,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  })

  return Boolean(openCash)
}
