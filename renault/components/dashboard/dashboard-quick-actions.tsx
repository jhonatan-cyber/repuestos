"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, ShoppingCart, Wallet } from "lucide-react"

export function DashboardQuickActions() {
  return (
    <>
      <Button asChild variant="outline" size="sm">
        <Link href="/sales">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Ventas
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/expenses">
          <Wallet className="mr-2 h-4 w-4" />
          Gastos
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/reports">
          <FileText className="mr-2 h-4 w-4" />
          Reportes
        </Link>
      </Button>
    </>
  )
}
