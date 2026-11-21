"use client"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import type { Category } from "@/lib/types"
import { CategoryActionButtons } from "./category-action-buttons"

interface CategoriesTableProps {
  categories: Category[]
  isLoading: boolean
  search: string
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (category: Category) => void
}

export function CategoriesTable({
  categories,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoriesTableProps) {
  const emptyMessage = search ? "No se encontraron categorías" : "No hay categorías registradas"

  return (
    <>
      {isLoading ? <MobileListState message="Cargando categorías..." /> : null}
      {!isLoading && categories.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && categories.length > 0 ? (
        <MobileList>
          {categories.map((category) => (
            <MobileListCard
              key={category.id}
              className={category.status === "inactive" ? "opacity-70" : undefined}
            >
              <MobileListHeader
                title={category.name}
                subtitle={category.description || "Sin descripción"}
                trailing={
                  <Badge variant={category.status === "active" ? "default" : "secondary"}>
                    {category.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                }
              />
              <MobileListGrid>
                <MobileListField
                  label="Productos"
                  value={(category as unknown as { productsCount?: number }).productsCount || 0}
                />
                <MobileListField
                  label="Estado"
                  value={category.status === "active" ? "Activo" : "Inactivo"}
                />
              </MobileListGrid>
              <MobileListActions>
                <CategoryActionButtons
                  category={category}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <DataTable
        caption="Categorías de productos"
        columns={[
          {
            key: "name",
            header: "Nombre",
            render: (category: Category) => <span className="font-medium">{category.name}</span>,
          },
          {
            key: "description",
            header: "Descripción",
            render: (category: Category) => (
              <span className="text-sm text-muted-foreground">{category.description || "-"}</span>
            ),
          },
          {
            key: "products",
            header: "Productos",
            render: (category: Category) => (
              <span className="text-sm text-muted-foreground">
                {(category as unknown as { productsCount?: number }).productsCount || 0}
              </span>
            ),
          },
          {
            key: "status",
            header: "Estado",
            render: (category: Category) => (
              <Badge
                variant={category.status === "active" ? "default" : "secondary"}
                className="capitalize"
              >
                {category.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Acciones",
            headerClassName: "text-right",
            cellClassName: "text-right",
            render: (category: Category) => (
              <CategoryActionButtons
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ),
          },
        ]}
        rows={categories}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        loadingMessage="Cargando..."
      />
    </>
  )
}
