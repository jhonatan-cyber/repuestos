"use client"

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react"
import type { User as UserType } from "@/lib/types"
import { useRoles } from "@/hooks/use-roles"
import { formatDate } from "@/lib/format-utils"

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
}

// Función para obtener color del rol basado en el nombre
const getRoleColor = (roleName: string) => {
  const name = roleName.toLowerCase()
  if (name.includes("admin")) return "bg-purple-100 text-purple-800 border-purple-200"
  if (name.includes("vend")) return "bg-blue-100 text-blue-800 border-blue-200"
  if (name.includes("compra")) return "bg-green-100 text-green-800 border-green-200"
  if (name.includes("superv")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
  return "bg-gray-100 text-gray-800 border-gray-200" // Por defecto
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  const { allRoles } = useRoles()

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`
  const roleData = allRoles.find((role) => role.id === user.role)
  const roleName = roleData?.name || user.role

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {fullName}
          </DialogTitle>
          <DialogDescription>Información detallada del usuario</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  CI
                </div>
                <div className="text-sm font-medium">{user.ci}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Nombre Completo
                </div>
                <div className="text-sm font-medium">{fullName}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </div>
                <div className="text-sm font-medium">{user.phone}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Dirección
              </div>
              <div className="text-sm font-medium">{user.address}</div>
            </div>
          </div>

          <Separator />

          {/* Información del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Sistema</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Rol
                </div>
                <Badge className={`w-fit ${getRoleColor(roleName)}`}>{roleName}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {user.status === "active" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  Estado
                </div>
                <Badge
                  variant={user.status === "active" ? "default" : "secondary"}
                  className="flex items-center gap-1 w-fit"
                >
                  {user.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Fecha de Registro
                </div>
                <div className="text-sm font-medium">{formatDate(user.createdAt)}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  ID de Usuario
                </div>
                <div className="text-sm font-medium font-mono">#{user.id}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Seguridad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de Seguridad</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-blue-900">Contraseña</h4>
                  <p className="text-sm text-blue-700">
                    La contraseña está basada en el CI del usuario y se encuentra hasheada por
                    seguridad. El usuario puede cambiarla desde su perfil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
