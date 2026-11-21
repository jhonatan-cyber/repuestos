const ROLE_DISPLAY_NAMES: Record<string, string> = {
  administrador: "Administrador",
  vendedor: "Vendedor",
  comprador: "Comprador",
  supervisor: "Supervisor",
  invitado: "Invitado",
}

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role.trim().toLowerCase()] || role
}
