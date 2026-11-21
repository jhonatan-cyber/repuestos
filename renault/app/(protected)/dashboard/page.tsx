import { Suspense } from "react"
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section"
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts"
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/dashboard/dashboard-skeleton"

export const dynamic = "force-dynamic"

async function ActivitySection() {
  const { getDashboardStats } = await import("@/lib/dashboard-data")
  const stats = await getDashboardStats("today")
  return (
    <div className="space-y-4">
      <LowStockAlerts products={stats.lowStockProducts} />
    </div>
  )
}

export default function Dashboard() {
  const updatedAt = new Date().toLocaleString("es-BO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        description="Panel de control con métricas operativas en tiempo real"
        action={<DashboardQuickActions />}
      />

      <div className="rounded-xl border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
        Actualizado: <span className="font-medium text-foreground">{updatedAt}</span>
      </div>

      <DashboardChartsSection />

      <Suspense fallback={<TableSkeleton />}>
        <ActivitySection />
      </Suspense>
    </div>
  )
}
