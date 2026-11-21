/**
 * Mensajes de notificación para el módulo de clientes
 */
export const CLIENT_MESSAGES = {
  success: {
    created: "Cliente creado correctamente",
    updated: "Cliente actualizado correctamente",
    deleted: "Cliente eliminado correctamente",
    activated: "Cliente activado correctamente",
    deactivated: "Cliente desactivado correctamente",
  },
  error: {
    create: "Error al crear cliente",
    update: "Error al actualizar cliente",
    delete: "Error al eliminar cliente",
    deleteTitle: "No se puede eliminar",
    fetch: "Error al obtener clientes",
    toggleStatus: "Error al cambiar estado del cliente",
    invalidId: "ID de cliente inválido",
    notFound: "Cliente no encontrado",
    invalidData: "Datos inválidos",
    required: "ID requerido",
  },
  warning: {
    offline: "Mostrando datos guardados (sin conexión)",
    offlineDescription: "Conectate a internet para ver los ultimos datos.",
  },
  info: {
    noConnection: "Sin Conexión",
    noConnectionDescription: "No hay datos disponibles sin conexión.",
  },
} as const

/**
 * Mensajes de notificación para el módulo de roles
 */
export const ROLE_MESSAGES = {
  success: {
    created: "Rol creado correctamente",
    updated: "Rol actualizado correctamente",
    deleted: "Rol eliminado correctamente",
    activated: "Rol activado correctamente",
    deactivated: "Rol desactivado correctamente",
  },
  error: {
    create: "Error al crear rol",
    update: "Error al actualizar rol",
    delete: "Error al eliminar rol",
    deleteTitle: "No se puede eliminar",
    deleteSystem: "No se puede eliminar un rol del sistema",
    editTitle: "No se puede editar",
    editSystem: "El rol Administrador es del sistema y no puede modificarse",
    toggleSystem: "No se puede desactivar un rol del sistema",
    fetch: "Error al obtener roles",
    toggleStatus: "Error al cambiar estado del rol",
    invalidId: "ID de rol inválido",
    notFound: "Rol no encontrado",
    invalidData: "Datos inválidos",
    required: "ID requerido",
    nameRequired: "El nombre es requerido",
    permissionsRequired: "Debe seleccionar al menos un permiso",
  },
  warning: {
    offline: "Mostrando datos guardados (sin conexión)",
    offlineDescription: "Conectate a internet para ver los ultimos datos.",
    hasUsers: "Este rol tiene usuarios asignados. Desactívalo en su lugar.",
  },
  info: {
    noConnection: "Sin Conexión",
    noConnectionDescription: "No hay datos disponibles sin conexión.",
  },
} as const

/**
 * Mensajes de notificación para el módulo de usuarios
 */
export const USER_MESSAGES = {
  success: {
    created: "Usuario creado correctamente",
    updated: "Usuario actualizado correctamente",
    deleted: "Usuario eliminado correctamente",
    activated: "Usuario activado correctamente",
    deactivated: "Usuario desactivado correctamente",
  },
  error: {
    create: "Error al crear usuario",
    update: "Error al actualizar usuario",
    delete: "Error al eliminar usuario",
    deleteTitle: "No se puede eliminar",
    fetch: "Error al obtener usuarios",
    toggleStatus: "Error al cambiar estado del usuario",
    invalidId: "ID de usuario inválido",
    notFound: "Usuario no encontrado",
    invalidData: "Datos inválidos",
    required: "ID requerido",
    ciExists: "Ya existe un usuario con este CI",
    emailExists: "Ya existe un usuario con este email",
  },
  warning: {
    offline: "Mostrando datos guardados (sin conexión)",
    offlineDescription: "Conectate a internet para ver los ultimos datos.",
  },
  info: {
    noConnection: "Sin Conexión",
    noConnectionDescription: "No hay datos disponibles sin conexión.",
  },
} as const

/**
 * Mensajes de notificación para el módulo de categorías
 */
export const CATEGORY_MESSAGES = {
  success: {
    created: "Categoría creada correctamente",
    updated: "Categoría actualizada correctamente",
    deleted: "Categoría eliminada correctamente",
    activated: "Categoría activada correctamente",
    deactivated: "Categoría desactivada correctamente",
  },
  error: {
    create: "Error al crear categoría",
    update: "Error al actualizar categoría",
    delete: "Error al eliminar categoría",
    deleteTitle: "No se puede eliminar",
    fetch: "Error al obtener categorías",
    toggleStatus: "Error al cambiar estado de la categoría",
    invalidId: "ID de categoría inválido",
    notFound: "Categoría no encontrada",
    invalidData: "Datos inválidos",
    required: "ID requerido",
  },
  warning: {
    offline: "Mostrando datos guardados (sin conexión)",
    offlineDescription: "Conectate a internet para ver los ultimos datos.",
    hasProducts: "Esta categoría tiene productos asociados. Elímine o mueva los productos primero.",
  },
  info: {
    noConnection: "Sin Conexión",
    noConnectionDescription: "No hay datos disponibles sin conexión.",
  },
} as const

/**
 * Mensajes generales de la aplicación
 */
export const APP_MESSAGES = {
  loading: "Cargando...",
  saving: "Guardando...",
  deleting: "Eliminando...",
  noResults: "No se encontraron resultados",
  noData: "No hay datos disponibles",
} as const

/**
 * Mensajes de notificación para el módulo de cotizaciones
 */
export const QUOTATION_MESSAGES = {
  success: {
    created: "Cotización creada correctamente",
    updated: "Cotización actualizada correctamente",
    deleted: "Cotización eliminada correctamente",
    converted: "Cotización convertida a venta correctamente",
  },
  error: {
    create: "Error al crear cotización",
    update: "Error al actualizar cotización",
    delete: "Error al eliminar cotización",
    deleteTitle: "No se puede eliminar",
    fetch: "Error al obtener cotizaciones",
    convert: "Error al convertir cotización a venta",
    invalidId: "ID de cotización inválido",
    notFound: "Cotización no encontrada",
    invalidData: "Datos inválidos",
    required: "ID requerido",
  },
  warning: {
    offline: "Mostrando datos guardados (sin conexión)",
    offlineDescription: "Conéctate a internet para ver los últimos datos.",
  },
  info: {
    noConnection: "Sin Conexión",
    noConnectionDescription: "No hay datos disponibles sin conexión.",
  },
} as const
