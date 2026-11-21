"use client"

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
import { Lock, Shield, Users } from "lucide-react"
import type { Role } from "@/lib/types"
import { RoleActionButtons } from "./role-action-buttons"
import { RoleStatusBadge } from "./role-status-badge"

interface RolesTableProps {
  roles: Role[]
  isLoading: boolean
  search: string
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  onToggleStatus: (role: Role) => void
  onViewDetails: (role: Role) => void
}

function UserTooltip({ users }: { users?: { name: string; email: string }[] }) {
  if (!users || users.length === 0) return null
  return (
    <TooltipContent
      side="bottom"
      className="max-w-xs bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-0 px-3 py-2"
    >
      <ul className="text-xs space-y-1">
        {users.map((u, i) => (
          <li key={i}>
            {u.name} <span className="opacity-60">({u.email})</span>
          </li>
        ))}
      </ul>
    </TooltipContent>
  )
}

function UserCount({ count, users }: { count: number; users?: { name: string; email: string }[] }) {
  const hasUsers = users && users.length > 0
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2 cursor-default">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{count}</span>
        </div>
      </TooltipTrigger>
      {hasUsers && <UserTooltip users={users} />}
    </Tooltip>
  )
}

export function RolesTable({
  roles,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}: RolesTableProps) {
  const emptyMessage = search ? "No se encontraron roles" : "No hay roles registrados"

  return (
    <TooltipProvider delayDuration={300}>
      {isLoading ? <MobileListState message="Cargando roles..." /> : null}
      {!isLoading && roles.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && roles.length > 0 ? (
        <MobileList>
          {roles.map((role) => (
            <MobileListCard
              key={role.id}
              className={role.status === "inactive" ? "opacity-70" : undefined}
            >
              <MobileListHeader
                title={role.name}
                trailing={<RoleStatusBadge status={role.status} />}
              />
              <MobileListGrid>
                <MobileListField
                  label="Usuarios"
                  value={<UserCount count={role.usersCount || 0} users={role.users as any} />}
                />
                <MobileListField
                  label="Tipo"
                  value={
                    <Badge
                      variant={role.isSystem ? "default" : "secondary"}
                      className="flex w-fit items-center gap-1 rounded-full"
                    >
                      {role.isSystem ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {role.isSystem ? "Sistema" : "Personalizado"}
                    </Badge>
                  }
                />
                <MobileListField
                  label="Descripción"
                  value={role.description || "Sin descripción"}
                  className="col-span-2"
                />
              </MobileListGrid>
              <MobileListActions>
                <RoleActionButtons
                  role={role}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onViewDetails={onViewDetails}
                />
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de roles"
            minWidth="min-w-[940px]"
            isEmpty={!isLoading && roles.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
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
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className={role.status === "inactive" ? "opacity-60" : ""}
                  >
                    <TableCell>
                      <div className="font-medium">{role.name}</div>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      <div className="truncate" title={role.description}>
                        {role.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserCount count={role.usersCount || 0} users={role.users as any} />
                    </TableCell>
                    <TableCell>
                      <RoleStatusBadge status={role.status} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.isSystem ? "default" : "secondary"}
                        className="flex w-fit items-center gap-1 rounded-full"
                      >
                        {role.isSystem ? (
                          <>
                            <Lock className="h-3 w-3" /> Sistema
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3" /> Personalizado
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleActionButtons
                        role={role}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                        onViewDetails={onViewDetails}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </TooltipProvider>
  )
}
