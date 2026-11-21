"use client"

import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { usePathname, useRouter } from "next/navigation"
import { getRoleDisplayName } from "@/lib/role-utils"
import { useTheme } from "next-themes"
import { Bell, LogOut, User, ChevronDown, Sun, Moon, Monitor, Menu, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

import { GlobalSearch } from "@/components/global-search"
import { useNotifications } from "@/hooks/use-notifications"

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clientes",
  "/suppliers": "Proveedores",
  "/inventory": "Inventario",
  "/quotations": "Cotizaciones",
  "/purchases": "Compras",
  "/sales": "Ventas",
  "/expenses": "Gastos",
  "/reports": "Reportes",
  "/cash": "Caja Diaria",
  "/credits": "Cuentas por Cobrar",
  "/purchase-credits": "Cuentas por Pagar",
  "/categories": "Categorías",
  "/users": "Usuarios",
  "/roles": "Roles y Permisos",
  "/permissions": "Permisos del Sistema",
  "/profile": "Mi Perfil",
}

const buildAvatarUrl = (image: string, version: number) =>
  `/api/auth/profile/avatar?name=${encodeURIComponent(image)}&t=${version}`

export function AppHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar()
  const title = routeTitles[pathname] || "Dashboard"
  const [avatarVersion, setAvatarVersion] = useState(Date.now())
  const { items: notifications, unread, hasUnread, markAsRead, markAllRead } = useNotifications()

  useEffect(() => {
    const refreshAvatar = () => setAvatarVersion(Date.now())
    window.addEventListener("profile-avatar-updated", refreshAvatar)
    return () => window.removeEventListener("profile-avatar-updated", refreshAvatar)
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="sticky top-4 z-30 px-4 md:px-8 w-full transition-all duration-300 ease-in-out">
        <header className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMobile}
                    className="md:hidden flex-shrink-0 text-muted-foreground hover:text-primary transition-colors bg-background/50 border-border/50 shadow-sm"
                  >
                    <Menu size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Abrir menú móvil</p>
                </TooltipContent>
              </Tooltip>

              {/* Botón de toggle para desktop */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSidebar}
                    className="hidden md:flex flex-shrink-0 text-muted-foreground hover:text-primary transition-colors bg-background/50 border-border/50 shadow-sm"
                  >
                    <PanelLeft size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}</p>
                </TooltipContent>
              </Tooltip>

              <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <GlobalSearch />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Buscar (⌘K)</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell size={20} />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Notificaciones</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-[360px] max-h-[420px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
                    {hasUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={markAllRead}
                      >
                        Marcar todas
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      Sin notificaciones
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                          onClick={async () => {
                            if (!n.isRead) await markAsRead(n.id)
                            if (n.url) router.push(n.url)
                          }}
                        >
                          <div className="flex items-start gap-2">
                            {!n.isRead && (
                              <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Sun
                          size={20}
                          className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                        />
                        <Moon
                          size={20}
                          className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                        />
                        <span className="sr-only">Cambiar tema</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Cambiar tema</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun size={16} className="mr-2" />
                    Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon size={16} className="mr-2" />
                    Oscuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor size={16} className="mr-2" />
                    Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden md:flex items-center pl-5 ml-2 border-l border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      {user?.image ? (
                        <img
                          src={buildAvatarUrl(user.image, avatarVersion)}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="text-sm text-right">
                        <p className="font-medium text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.role ? getRoleDisplayName(user.role) : ""}
                        </p>
                      </div>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User size={16} className="mr-2" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut size={16} className="mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
      </div>
    </TooltipProvider>
  )
}
