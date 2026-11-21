import { TableSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function ProtectedLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      <TableSkeleton />
    </div>
  )
}
