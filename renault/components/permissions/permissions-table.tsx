"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, DataTableSkeleton } from "@/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import {
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Settings,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import type { Permission } from "@/lib/types"

interface PermissionsTableProps {
  permissions: Permission[]
  isLoading: boolean
  search: string
  onEdit: (permission: Permission) => void
  onDelete: (permission: Permission) => void
  onToggleStatus: (permission: Permission) => void
}

const CATEGORIES = {
  core: { label: "Core", color: "blue" },
  sales: { label: "Ventas", color: "green" },
  inventory: { label: "Inventario", color: "purple" },
  finance: { label: "Finanzas", color: "orange" },
  admin: { label: "Administración", color: "red" },
}

export function PermissionsTable({
  permissions,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
}: PermissionsTableProps) {
  const emptyMessage = search ? "No se encontraron permisos" : "No hay permisos registrados"

  const renderActions = (permission: Permission) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="mr-2 h-4 w-4" /> Acciones
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!permission.isSystem ? (
          <>
            <DropdownMenuItem onClick={() => onEdit(permission)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(permission)}>
              {permission.status === "active" ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Desactivar
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Activar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(permission)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>Permiso de sistema</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {isLoading ? <MobileListState message="Cargando permisos..." /> : null}
      {!isLoading && permissions.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && permissions.length > 0 ? (
        <MobileList>
          {permissions.map((permission) => (
            <MobileListCard key={permission.id}>
              <MobileListHeader
                title={permission.name}
                subtitle={permission.module}
                trailing={
                  <Badge variant={permission.status === "active" ? "default" : "secondary"}>
                    {permission.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                }
              />
              <MobileListGrid>
                <MobileListField
                  label="Categoría"
                  value={
                    <Badge variant="secondary">
                      {CATEGORIES[permission.category as keyof typeof CATEGORIES]?.label ||
                        permission.category}
                    </Badge>
                  }
                />
                <MobileListField label="Roles" value={`${permission.rolesCount || 0} roles`} />
                <MobileListField
                  label="Tipo"
                  value={
                    permission.isSystem ? (
                      <span className="inline-flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        Sistema
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        Personalizado
                      </span>
                    )
                  }
                />
                <MobileListField
                  label="Descripción"
                  value={permission.description}
                  className="col-span-2"
                />
              </MobileListGrid>
              <MobileListActions>{renderActions(permission)}</MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <DataTable
        caption="Permisos del sistema"
        minWidth="min-w-[1100px]"
        columns={[
          {
            key: "name",
            header: "Permiso",
            render: (permission: Permission) => (
              <span className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {permission.name}
              </span>
            ),
          },
          {
            key: "module",
            header: "Módulo",
            render: (permission: Permission) => (
              <Badge variant="outline">{permission.module}</Badge>
            ),
          },
          {
            key: "description",
            header: "Descripción",
            render: (permission: Permission) => (
              <span className="block max-w-xs truncate text-muted-foreground">
                {permission.description}
              </span>
            ),
          },
          {
            key: "category",
            header: "Categoría",
            render: (permission: Permission) => (
              <Badge variant="secondary">
                {CATEGORIES[permission.category as keyof typeof CATEGORIES]?.label ||
                  permission.category}
              </Badge>
            ),
          },
          {
            key: "roles",
            header: "Roles",
            render: (permission: Permission) => (
              <span className="text-sm">{permission.rolesCount || 0} roles</span>
            ),
          },
          {
            key: "status",
            header: "Estado",
            render: (permission: Permission) => (
              <span className="flex items-center gap-2">
                {permission.status === "active" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={permission.status === "active" ? "default" : "secondary"}>
                  {permission.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </span>
            ),
          },
          {
            key: "type",
            header: "Tipo",
            render: (permission: Permission) => (
              <span className="flex items-center gap-2">
                {permission.isSystem ? (
                  <>
                    <Settings className="h-4 w-4 text-blue-600" />
                    <Badge variant="secondary">Sistema</Badge>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-purple-600" />
                    <Badge variant="outline">Personalizado</Badge>
                  </>
                )}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Acciones",
            headerClassName: "text-right",
            cellClassName: "text-right",
            render: (permission: Permission) => renderActions(permission),
          },
        ]}
        rows={permissions}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        loadingContent={<DataTableSkeleton columns={8} rows={5} />}
      />
    </>
  )
}
