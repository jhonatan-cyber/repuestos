import { TableSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-card/50" />
        ))}
      </div>
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Cargando gráficos...
      </div>
      <TableSkeleton />
    </div>
  )
}
