"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2, Eye } from "lucide-react"
import type { Expense } from "@/lib/types"
import { formatDate } from "@/lib/format-utils"

interface ExpensesTableProps {
  expenses: Expense[]
  isLoading: boolean
  search: string
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  onViewDetails: (expense: Expense) => void
}

export function ExpensesTable({
  expenses,
  isLoading,
  search,
  onEdit,
  onDelete,
  onViewDetails,
}: ExpensesTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)

  const emptyMessage = search ? "No se encontraron gastos" : "No hay gastos registrados"
  const truncateDescription = (value?: string) => {
    const text = value?.trim() || "Sin descripción"
    return text.length > 30 ? `${text.slice(0, 30)}...` : text
  }

  return (
    <>
      {isLoading ? <MobileListState message="Cargando gastos..." /> : null}
      {!isLoading && expenses.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && expenses.length > 0 ? (
        <MobileList>
          {expenses.map((expense) => (
            <MobileListCard key={expense.id}>
              <MobileListHeader
                title={expense.name}
                trailing={
                  <span className="text-base font-bold">{formatCurrency(expense.amount)}</span>
                }
              />
              <MobileListGrid>
                <MobileListField
                  label="Categoría"
                  value={
                    expense.category ? (
                      <Badge variant="outline">{expense.category}</Badge>
                    ) : (
                      "Sin categoría"
                    )
                  }
                />
                <MobileListField
                  label="Fecha"
                  value={formatDate(
                    typeof expense.date === "string" ? expense.date : expense.date.toISOString(),
                  )}
                />
                <MobileListField
                  label="Descripción"
                  value={expense.description || "Sin descripción"}
                  className="col-span-2"
                />
              </MobileListGrid>
              <MobileListActions>
                <Button size="sm" variant="outline" onClick={() => onViewDetails(expense)}>
                  <Eye className="mr-2 h-4 w-4" /> Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(expense)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(expense)}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar
                </Button>
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de gastos"
            minWidth="min-w-[900px]"
            isEmpty={!isLoading && expenses.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="max-w-xs truncate text-sm">
                            {truncateDescription(expense.description)}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{expense.description?.trim() || "Sin descripción"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {expense.category ? (
                        <Badge variant="outline">{expense.category}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(expense.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(
                          typeof expense.date === "string"
                            ? expense.date
                            : expense.date.toISOString(),
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewDetails(expense)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalles del gasto</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(expense)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar gasto</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(expense)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar gasto</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </>
  )
}
