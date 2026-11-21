"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Clock, CheckCircle2, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface QuotationStatsProps {
  stats: {
    totalAmount: number
    pendingCount: number
    approvedCount: number
    convertedCount: number
  }
}

export function QuotationStats({ stats }: QuotationStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Cotizado
              </p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</h3>
            </div>
            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl shadow-sm">
              <FileText className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pendientes</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">
                {stats.pendingCount}
              </h3>
            </div>
            <div className="p-3 bg-white/50 dark:bg-amber-900/20 rounded-xl shadow-sm">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Aprobadas</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
                {stats.approvedCount}
              </h3>
            </div>
            <div className="p-3 bg-white/50 dark:bg-blue-900/20 rounded-xl shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Convertidas
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
                {stats.convertedCount}
              </h3>
            </div>
            <div className="p-3 bg-white/50 dark:bg-emerald-900/20 rounded-xl shadow-sm">
              <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
