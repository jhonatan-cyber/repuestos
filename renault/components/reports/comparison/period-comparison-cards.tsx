"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComparisonStats {
  label: string
  current: number
  previous: number
  isPositive?: boolean
  isCurrency?: boolean
}

interface PeriodComparisonCardsProps {
  stats: ComparisonStats[]
}

function calculateVariation(
  current: number,
  previous: number,
): { percentage: number; isPositive: boolean } {
  if (previous === 0) return { percentage: 0, isPositive: true }
  const percentage = ((current - previous) / previous) * 100
  return { percentage: Math.round(percentage), isPositive: percentage >= 0 }
}

export function PeriodComparisonCards({ stats }: PeriodComparisonCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const { percentage, isPositive } = calculateVariation(stat.current, stat.previous)
        const formatValue = stat.isCurrency ? formatCurrency : (v: number) => v.toString()

        return (
          <Card key={stat.label} className="min-w-0 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium leading-tight text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-xl font-bold leading-tight sm:text-2xl">
                    {formatValue(stat.current)}
                  </p>
                  <p className="text-xs text-muted-foreground">Período actual</p>
                </div>
                <div
                  className={cn(
                    "inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold",
                    isPositive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? "+" : ""}
                  {percentage}%
                </div>
              </div>
              <p className="break-words text-xs leading-relaxed text-muted-foreground">
                Anterior: {formatValue(stat.previous)}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
