"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  DollarSign,
  Receipt,
  Wallet,
  BarChart3,
  HandCoins,
  FolderTree,
  Shield,
  Lock,
  Settings,
  Search,
  X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { BrandLogo } from "@/components/brand/brand-logo"

interface MenuItem {
  label: string
  href: string
  icon: any
  module: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: "Principal",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    title: "Ventas",
    items: [
      { label: "Clientes", href: "/clients", icon: Users, module: "clients" },
      { label: "Cotizaciones", href: "/quotations", icon: FileText, module: "quotations" },
      { label: "Ventas", href: "/sales", icon: ShoppingCart, module: "sales" },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Productos", href: "/products", icon: Package, module: "products" },
      { label: "Proveedores", href: "/suppliers", icon: Building2, module: "suppliers" },
      { label: "Compras", href: "/purchases", icon: Receipt, module: "purchases" },
      { label: "Categorías", href: "/categories", icon: FolderTree, module: "categories" },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { label: "Gastos", href: "/expenses", icon: DollarSign, module: "expenses" },
      { label: "Caja Diaria", href: "/cash", icon: Wallet, module: "cash" },
      { label: "Cuentas por Cobrar", href: "/credits", icon: HandCoins, module: "reports" },
      { label: "Cuentas por Pagar", href: "/purchase-credits", icon: HandCoins, module: "reports" },
      { label: "Reportes", href: "/reports", icon: BarChart3, module: "reports" },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Usuarios", href: "/users", icon: Users, module: "users" },
      { label: "Roles", href: "/roles", icon: Shield, module: "roles" },
      { label: "Permisos", href: "/permissions", icon: Lock, module: "permissions" },
      { label: "Configuración", href: "/settings", icon: Settings, module: "settings" },
    ],
  },
]

export function Sidebar() {
  const { hasPermission } = useAuth()
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const [search, setSearch] = useState("")

  // Filtrar grupos y items según permisos
  const visibleGroups = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!hasPermission(item.module)) return false
          if (!searchTerm) return true
          return item.label.toLowerCase().includes(searchTerm)
        }),
      }))
      .filter((group) => group.items.length > 0)
  }, [hasPermission, search])

  return (
    <>
      {/* Botón hamburguesa movido al header - este oculta en móvil */}

      <aside
        className={cn(
          "fixed top-4 bottom-4 left-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 z-40 flex flex-col rounded-2xl overflow-hidden",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-[150%] md:translate-x-0",
        )}
      >
        {/* Header - Fixed */}
        <div
          className={cn(
            "flex-shrink-0 border-b border-slate-200/50 dark:border-zinc-800/50 bg-gradient-to-b from-primary/10 to-transparent transition-all",
            isCollapsed ? "p-4" : "p-6",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!isCollapsed ? (
                <div className="flex items-center gap-2 w-full py-1">
                  <BrandLogo className="h-10 w-10 shrink-0" alt="Renault" />
                  <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-zinc-100">
                    Renault Reluz
                  </h1>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <BrandLogo className="h-8 w-8 shrink-0" alt="Renault" />
                </div>
              )}
            </div>
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex-shrink-0 px-4 pt-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar sección..."
                className="h-9 pl-9 pr-9 text-sm bg-white/70 dark:bg-zinc-900/70 border-slate-200/70 dark:border-zinc-700/70"
              />
              {search.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-4 space-y-6 scrollbar-custom",
            isCollapsed ? "px-2" : "px-4",
          )}
        >
          <TooltipProvider delayDuration={0}>
            {visibleGroups.map((group) => (
              <div key={group.title}>
                {!isCollapsed && (
                  <h3 className="px-4 mb-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                          isCollapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(234,179,8,0.25)]"
                            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 hover:translate-x-1",
                        )}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isActive && "animate-pulse",
                          )}
                        />
                        {!isCollapsed && <span className="relative z-10">{item.label}</span>}
                        {isActive && !isCollapsed && (
                          <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/30 animate-pulse" />
                        )}
                      </Link>
                    )

                    return isCollapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    )
                  })}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </nav>
      </aside>
    </>
  )
}
