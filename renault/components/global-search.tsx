"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Building2,
  Receipt,
  FolderTree,
  DollarSign,
  Wallet,
  BarChart3,
  Search,
  Command as CommandIcon,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
        <span className="hidden xl:inline-flex">Buscar en el ERP...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escribe un comando o busca algo..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/products"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Productos</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/clients"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Clientes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/sales"))}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>Ventas</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Inventario">
            <CommandItem onSelect={() => runCommand(() => router.push("/suppliers"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Proveedores</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/categories"))}>
              <FolderTree className="mr-2 h-4 w-4" />
              <span>Categorías</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/purchases"))}>
              <Receipt className="mr-2 h-4 w-4" />
              <span>Compras</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Finanzas">
            <CommandItem onSelect={() => runCommand(() => router.push("/expenses"))}>
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Gastos</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/cash"))}>
              <Wallet className="mr-2 h-4 w-4" />
              <span>Caja Diaria</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/reports"))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Reportes</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
