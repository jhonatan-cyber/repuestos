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
import { Eye, Package, Shield, ShoppingCart, UserCheck } from "lucide-react"
import type { User } from "@/lib/types"
import { useRoles } from "@/hooks/use-roles"
import { getUserFullName } from "@/lib/user-utils"
import { UserActionButtons } from "./user-action-buttons"
import { formatDate } from "@/lib/format-utils"
import { UserAvatar } from "./user-avatar"
import { UserStatusBadge } from "./user-status-badge"

interface UsersTableProps {
  users: User[]
  isLoading: boolean
  search: string
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
  onViewDetails: (user: User) => void
}

const getRoleIcon = (roleName: string) => {
  const name = roleName.toLowerCase()
  if (name.includes("admin")) return Shield
  if (name.includes("vend")) return ShoppingCart
  if (name.includes("compra")) return Package
  if (name.includes("superv")) return UserCheck
  return Eye
}

const getRoleColor = (roleName: string) => {
  const name = roleName.toLowerCase()
  if (name.includes("admin"))
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  if (name.includes("vend")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  if (name.includes("compra"))
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  if (name.includes("superv"))
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
}

export function UsersTable({
  users,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}: UsersTableProps) {
  const { allRoles } = useRoles()
  const emptyMessage = search ? "No se encontraron usuarios" : "No hay usuarios registrados"

  return (
    <>
      {isLoading ? <MobileListState message="Cargando usuarios..." /> : null}
      {!isLoading && users.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && users.length > 0 ? (
        <MobileList>
          {users.map((user) => {
            const roleData = allRoles.find((role) => role.id === user.role)
            const roleName = roleData?.name || user.role
            const RoleIcon = getRoleIcon(roleName)
            const roleColor = getRoleColor(roleName)

            return (
              <MobileListCard
                key={user.id}
                className={user.status === "inactive" ? "opacity-70" : undefined}
              >
                <MobileListHeader
                  title={getUserFullName(user)}
                  subtitle={`CI: ${user.ci}`}
                  trailing={<UserStatusBadge status={user.status} />}
                />
                <MobileListGrid>
                  <MobileListField label="Email" value={user.email} className="col-span-2" />
                  <MobileListField
                    label="Rol"
                    value={
                      <Badge
                        variant="secondary"
                        className={`${roleColor} flex w-fit items-center gap-1 rounded-full`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleName}
                      </Badge>
                    }
                  />
                  <MobileListField label="Registro" value={formatDate(user.createdAt)} />
                </MobileListGrid>
                <MobileListActions>
                  <UserActionButtons
                    user={user}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    onViewDetails={onViewDetails}
                  />
                </MobileListActions>
              </MobileListCard>
            )
          })}
        </MobileList>
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de usuarios"
            minWidth="min-w-[980px]"
            isEmpty={!isLoading && users.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Registro</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleData = allRoles.find((role) => role.id === user.role)
                  const roleName = roleData?.name || user.role
                  const RoleIcon = getRoleIcon(roleName)
                  const roleColor = getRoleColor(roleName)

                  return (
                    <TableRow
                      key={user.id}
                      className={user.status === "inactive" ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <div className="font-medium">{getUserFullName(user)}</div>
                            <div className="text-xs text-muted-foreground">CI: {user.ci}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${roleColor} flex w-fit items-center gap-1 rounded-full`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActionButtons
                          user={user}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleStatus={onToggleStatus}
                          onViewDetails={onViewDetails}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </>
  )
}
