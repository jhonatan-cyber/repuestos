import { Skeleton } from "@/components/ui/skeleton"

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-80" />
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-[400px]" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <ChartsSkeleton />
      <TableSkeleton />
    </div>
  )
}
