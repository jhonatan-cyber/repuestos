# Mapa de la aplicación — Renault ERP

> **Propósito de este documento:** base técnica-amigable para escribir el manual de usuario. No es código, es referencia.

## 1. Resumen ejecutivo

**Renault ERP** es un sistema de gestión integral (ERP) para una casa de repuestos de autos Renault. Funciona en dos modos: como aplicación de **escritorio** (Electron, con base de datos local SQLite) y como aplicación **web** (Next.js, con base de datos PostgreSQL en la nube). Permite gestionar ventas, compras, inventario, clientes, proveedores, cotizaciones, créditos, caja diaria, gastos, comisiones, usuarios y reportes. Tiene sincronización offline-first entre la base local y la nube.

## 2. Lo que el usuario necesita saber del entorno

| Tema                                    | Detalle (en lenguaje de usuario)                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acceso web**                          | Navegador Chrome o Edge. Se abre en `http://localhost:5000` cuando se inicia en modo desarrollo.                                                                                                                        |
| **Acceso escritorio**                   | Aplicación nativa Windows llamada "Renault ERP" (icono Renault).                                                                                                                                                        |
| **Idioma**                              | Español.                                                                                                                                                                                                                |
| **Tema**                                | Claro y oscuro (se cambia con un botón).                                                                                                                                                                                |
| **Conexión**                            | La versión escritorio funciona sin internet (usa una base local). Cuando hay internet, sincroniza con la nube.                                                                                                          |
| **Usuarios y permisos**                 | Hay 4 roles: Administrador, Vendedor, Compras, Supervisor. Cada uno ve y hace cosas distintas.                                                                                                                          |
| **Credenciales seed (datos de prueba)** | Admin: `admin@gmail.com` / `admin123`. Vendedor: `carlos.rodriguez@repuestos.com` / `vendedor123`. Compras: `luis.castro@repuestos.com` / `compras123`. Supervisor: `patricia.morales@repuestos.com` / `supervisor123`. |

## 3. Mapa de pantallas

### `/login` — Iniciar sesión

- **Propósito:** pantalla de entrada a la app. Pide email y contraseña.
- **Qué ve el usuario:** formulario de login a la izquierda, imagen decorativa a la derecha, botón de tema claro/oscuro arriba, link "¿Olvidaste tu contraseña?".
- **Acciones:** "Iniciar sesión", "¿Olvidaste tu contraseña?", cambiar tema.
- **Datos:** email, contraseña.
- **Errores comunes:** credenciales inválidas, cuenta bloqueada por demasiados intentos.
- **Captura sugerida:** `01-login.png` (pantalla completa con tema claro).

### `/setup` — Configuración inicial

- **Propósito:** crear el primer usuario administrador y dejar lista la app.
- **Qué ve el usuario:** formulario de 1 paso para crear el primer usuario.
- **Acciones:** completar nombre, email, contraseña, CI, teléfono, dirección; confirmar.
- **Captura sugerida:** `02-setup.png` (formulario completo).

### `/dashboard` — Inicio / Tablero principal

- **Propósito:** ver de un vistazo las métricas del negocio.
- **Qué ve el usuario:** tarjetas con indicadores (ventas del día, productos con stock bajo, gráficos de ventas por día, alertas de stock mínimo, accesos rápidos a las funciones principales, actividad reciente).
- **Acciones:** navegar a cualquier módulo, ver alertas, ver gráficos.
- **Captura sugerida:** `03-dashboard.png`.

### `/products` — Productos (catálogo de repuestos)

- **Propósito:** administrar el catálogo de repuestos.
- **Qué ve el usuario:** tabla con todos los productos (código, nombre, marca, modelo, categoría, stock, precio compra, precio venta, proveedor), filtros arriba, botón "Nuevo producto" y paginación.
- **Acciones:** crear producto, editar, ver detalles, eliminar, filtrar por categoría/proveedor, ver stock bajo.
- **Campos del producto:** código, nombre, marca, modelo, categoría, proveedor, precio de compra, precio de venta, stock actual, stock mínimo, unidad, imagen.
- **Captura sugerida:** `04a-products-list.png`, `04b-products-form.png` (modal de alta).

### `/inventory` — Inventario (movimientos de stock)

- **Propósito:** ver y registrar movimientos de stock (entradas, salidas, ajustes).
- **Qué ve el usuario:** tabla de movimientos con filtros, formulario de ajuste.
- **Acciones:** registrar entrada/salida, ajustar stock, ver historial.
- **Captura sugerida:** `05-inventory.png`.

### `/sales` — Ventas

- **Propósito:** registrar ventas, ver historial, imprimir facturas.
- **Qué ve el usuario:** tabla de ventas con filtros (fecha, estado, vendedor, cliente), tarjetas con estadísticas (total vendido, ventas del mes, ticket promedio), botón "Nueva venta".
- **Acciones:** crear venta, ver detalles, editar, cancelar, ver historial de cliente, exportar PDF, filtrar, paginar.
- **Estados de venta:** Completada, Pendiente, Cancelada.
- **Métodos de pago:** Efectivo, Transferencia, QR, Crédito (cuenta corriente), Mixto.
- **Captura sugerida:** `06a-sales-list.png`, `06b-sale-form.png` (formulario con productos).

### `/purchases` — Compras

- **Propósito:** registrar compras a proveedores.
- **Qué ve el usuario:** tabla de compras con filtros, estadísticas, botón "Nueva compra".
- **Acciones:** crear compra, ver detalles, marcar como recibida, cancelar, imprimir.
- **Estados:** Pendiente, Recibida, Cancelada.
- **Métodos de pago:** Efectivo, Transferencia, QR, Crédito.
- **Captura sugerida:** `07a-purchases-list.png`, `07b-purchase-form.png`.

### `/quotations` — Cotizaciones / Presupuestos

- **Propósito:** crear presupuestos para clientes antes de que concreten la compra.
- **Qué ve el usuario:** tabla de cotizaciones con filtros, estadísticas, botón "Nueva cotización".
- **Acciones:** crear, ver detalles, convertir a venta, duplicar, eliminar, marcar como vigente/vencida.
- **Estados:** Activa, Vencida, Convertida (a venta).
- **Validez:** la cotización tiene fecha de vencimiento.
- **Captura sugerida:** `08a-quotations-list.png`, `08b-quotation-form.png`.

### `/clients` — Clientes

- **Propósito:** administrar la base de datos de clientes.
- **Qué ve el usuario:** tabla con clientes (nombre, teléfono, email, NIT, total comprado, estado), filtros, búsqueda, botón "Nuevo cliente".
- **Acciones:** crear, editar, ver detalles, eliminar (soft delete), ver historial de compras, ver créditos.
- **Campos:** nombre, teléfono, email, NIT, dirección, estado.
- **Captura sugerida:** `09a-clients-list.png`, `09b-client-form.png`.

### `/suppliers` — Proveedores

- **Propósito:** administrar proveedores.
- **Qué ve el usuario:** tabla con proveedores (nombre, contacto, empresa, teléfono, email, total comprado), filtros, botón "Nuevo proveedor".
- **Acciones:** crear, editar, ver detalles, activar/desactivar, eliminar.
- **Campos:** nombre, empresa, teléfono, email, dirección.
- **Captura sugerida:** `10a-suppliers-list.png`, `10b-supplier-form.png`.

### `/categories` — Categorías

- **Propósito:** clasificar productos y gastos.
- **Qué ve el usuario:** tarjetas o tabla con categorías, color de cada una, tipo (producto o gasto), cantidad de productos asociados.
- **Acciones:** crear, editar, activar/desactivar, eliminar.
- **Categorías seed:** Motor, Frenos, Suspensión, Transmisión, Eléctrico, Filtros, Lubricantes, Iluminación, Carrocería, Neumáticos, Escape, Refrigeración, Servicios, Alquiler, Salarios, Marketing, Transporte, Mantenimiento.
- **Captura sugerida:** `11-categories.png`.

### `/cash` — Caja diaria

- **Propósito:** abrir caja al comenzar el día, registrar movimientos, cerrar caja.
- **Qué ve el usuario:** tarjetas con saldo actual, ingresos, egresos; tabla con registros de apertura/cierre; botón "Abrir caja" o "Cerrar caja" según el estado.
- **Acciones:** abrir caja (con monto inicial), cerrar caja (con conteo final), registrar retiros/retiros de caja, ver detalles, filtrar.
- **Estados del registro:** Abierto, Cerrado.
- **Captura sugerida:** `12a-cash-open.png`, `12b-cash-detail.png` (registro abierto), `12c-cash-close.png` (modal de cierre).

### `/expenses` — Gastos

- **Propósito:** registrar gastos del negocio (alquiler, servicios, sueldos, etc.).
- **Qué ve el usuario:** tabla de gastos con filtros, estadísticas, botón "Nuevo gasto".
- **Acciones:** crear, ver detalles, editar, eliminar.
- **Campos:** fecha, descripción, monto, categoría de gasto, responsable, notas.
- **Requiere:** caja abierta (no se puede registrar gasto si la caja está cerrada).
- **Captura sugerida:** `13a-expenses-list.png`, `13b-expense-form.png`.

### `/credits` — Créditos a clientes (cuentas corrientes)

- **Propósito:** gestionar los créditos otorgados a clientes y registrar los cobros.
- **Qué ve el usuario:** tarjetas con deuda total, créditos vencidos, créditos vigentes; tabla con créditos activos, timeline de pagos, botón "Registrar pago".
- **Acciones:** ver detalle del crédito, registrar pago (parcial o total), ver historial de pagos, exportar recibo.
- **Estados del crédito:** Pendiente, Pagado, Vencido.
- **Métodos de pago del cobro:** Efectivo, Transferencia, QR.
- **Captura sugerida:** `14a-credits-list.png`, `14b-credit-detail.png` (con timeline), `14c-credit-payment.png` (modal de pago).

### `/purchase-credits` — Créditos con proveedores

- **Propósito:** gestionar las deudas con proveedores.
- **Acciones similares a `/credits` pero para compras.**
- **Captura sugerida:** `15-purchase-credits.png`.

### `/reports` — Reportes

- **Propósito:** ver estadísticas y exportar reportes del negocio.
- **Qué ve el usuario:** pestañas (ventas, compras, gastos, productos, clientes, etc.), gráficos (líneas, barras, torta), filtros por fecha, opciones de exportación.
- **Acciones:** filtrar por período, ver gráficos, exportar PDF/Excel, comparar períodos.
- **Captura sugerida:** `16a-reports-overview.png`, `16b-reports-detail.png`.

### `/users` — Usuarios

- **Propósito:** administrar los usuarios de la app. (Solo administrador.)
- **Qué ve el usuario:** tabla con usuarios (CI, nombre, email, rol, estado), filtros, botón "Nuevo usuario".
- **Acciones:** crear, editar, ver detalles, activar/desactivar, eliminar.
- **Campos:** CI, nombre, apellido, email, teléfono, dirección, rol, contraseña.
- **Captura sugerida:** `17a-users-list.png`, `17b-user-form.png`.

### `/roles` — Roles

- **Propósito:** administrar los roles del sistema. (Solo administrador.)
- **Qué ve el usuario:** tabla con roles (nombre, descripción, color, permisos asignados, si es de sistema), botón "Nuevo rol".
- **Acciones:** crear, editar, ver permisos, eliminar (no se pueden eliminar roles del sistema).
- **Captura sugerida:** `18a-roles-list.png`, `18b-role-form.png`.

### `/permissions` — Permisos

- **Propósito:** ver la matriz de permisos del sistema. (Solo administrador.)
- **Qué ve el usuario:** tabla con permisos por módulo/acción.
- **Captura sugerida:** `19-permissions.png`.

### `/sync` — Sincronización

- **Propósito:** sincronizar datos entre la base local (escritorio) y la nube.
- **Qué ve el usuario:** estado de la conexión, lista de operaciones pendientes, log de sincronizaciones, botón "Sincronizar ahora".
- **Acciones:** sincronizar manualmente, ver log, resolver conflictos.
- **Captura sugerida:** `20a-sync-idle.png`, `20b-sync-running.png`.

### `/profile` — Mi perfil

- **Propósito:** ver y editar los datos del usuario logueado.
- **Qué ve el usuario:** formulario con sus datos, foto de perfil, opción de cambiar contraseña, cerrar sesión.
- **Acciones:** editar nombre, teléfono, dirección; cambiar foto; cambiar contraseña; cerrar sesión.
- **Captura sugerida:** `21-profile.png`.

## 4. Flujos críticos paso a paso

### Flujo 1 — Primer inicio (Setup)

1. Abrir la app por primera vez.
2. La app redirige a `/setup`.
3. Completar el formulario del primer administrador (CI, nombre, apellido, email, contraseña, teléfono, dirección).
4. Click en "Crear administrador".
5. La app lo lleva automáticamente al `/login`.
6. Iniciar sesión con el email y contraseña recién creados.
7. Aparece el dashboard.

### Flujo 2 — Realizar una venta completa

1. Ir a `/sales`.
2. Click en "Nueva venta".
3. Seleccionar cliente (o crearlo nuevo desde el mismo formulario).
4. Agregar productos: buscar por nombre o código, indicar cantidad.
5. (Opcional) Aplicar descuento o impuestos.
6. Elegir método de pago: efectivo, transferencia, QR, crédito o mixto.
7. Confirmar la venta.
8. La venta queda registrada; el stock se descuenta automáticamente.
9. Si la caja no está abierta, la app lo indica y bloquea la operación.

### Flujo 3 — Registrar una compra

1. Ir a `/purchases`.
2. Click en "Nueva compra".
3. Seleccionar proveedor.
4. Agregar productos y cantidades.
5. Elegir método de pago (efectivo, transferencia, QR, crédito).
6. Confirmar.
7. La compra queda en estado "Pendiente". Al recibir la mercadería, marcarla como "Recibida" — eso actualiza el stock.

### Flujo 4 — Crear y luego convertir una cotización

1. Ir a `/quotations`.
2. Click en "Nueva cotización".
3. Seleccionar cliente (opcional — puede ser anónimo) y vendedor.
4. Agregar productos y cantidades.
5. Definir fecha de vencimiento.
6. Guardar como "Activa".
7. Cuando el cliente acepta: abrir la cotización y click en "Convertir a venta".
8. La app genera la venta con los mismos productos.

### Flujo 5 — Abrir y cerrar caja

1. Al comenzar el día, ir a `/cash`.
2. Click en "Abrir caja".
3. Ingresar el monto de efectivo inicial en la caja.
4. Durante el día: ventas en efectivo, gastos y retiros quedan registrados.
5. Al final del día, click en "Cerrar caja".
6. Ingresar el conteo físico de efectivo.
7. La app compara lo declarado con lo teórico y muestra la diferencia.
8. Confirmar el cierre.

### Flujo 6 — Ver y exportar un reporte

1. Ir a `/reports`.
2. Elegir la pestaña (ventas, compras, etc.).
3. Filtrar por rango de fechas.
4. Ver los gráficos y estadísticas.
5. (Opcional) Click en "Exportar" para bajar en PDF o Excel.

### Flujo 7 — Dar de alta un producto nuevo

1. Ir a `/products`.
2. Click en "Nuevo producto".
3. Completar: código (único), nombre, marca, modelo, categoría, proveedor, precio de compra, precio de venta, stock actual, stock mínimo, unidad.
4. (Opcional) Subir imagen.
5. Guardar.
6. El producto aparece en el catálogo y en `/inventory` con su stock actual.

### Flujo 8 — Cliente nuevo con cuenta corriente (crédito)

1. Ir a `/clients`. Click en "Nuevo cliente". Completar datos. Guardar.
2. Ir a `/sales`. Nueva venta. Elegir el cliente recién creado.
3. Agregar productos.
4. Elegir método de pago "Crédito".
5. La app crea automáticamente un crédito en `/credits` con fecha de vencimiento.
6. Para registrar un cobro, ir a `/credits`, abrir el crédito, click en "Registrar pago", elegir monto y método.

## 5. Glosario de términos

| Término                    | Qué significa en la app                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Categoría**              | Agrupación lógica de productos (Motor, Frenos…) o de gastos (Alquiler, Servicios…).                        |
| **Cotización**             | Presupuesto que se le entrega a un cliente. No descuenta stock.                                            |
| **Crédito (a cliente)**    | Venta que el cliente paga después. Aparece en `/credits` y tiene fecha de vencimiento.                     |
| **Crédito (a proveedor)**  | Deuda con un proveedor. Aparece en `/purchase-credits`.                                                    |
| **Sync / Sincronización**  | Proceso de subir datos locales a la nube. Aparece en `/sync`.                                              |
| **Stock mínimo**           | Cantidad a partir de la cual el producto aparece como "stock bajo" y dispara una alerta.                   |
| **Mixto (pago)**           | Venta cobrada con más de un método (ej.: mitad efectivo, mitad transferencia).                             |
| **Caja abierta / cerrada** | Estado de la sesión de caja del día. Sin caja abierta no se pueden registrar ventas en efectivo ni gastos. |
| **Vendedor**               | Usuario que registra ventas (rol: vendedor).                                                               |
| **Comprador**              | Usuario que registra compras a proveedores (rol: compras).                                                 |
| **Rol del sistema**        | Rol predefinido que no se puede eliminar (admin, vendedor, compras, supervisor).                           |
| **Comisión**               | Porcentaje que se le asigna a un vendedor por cada venta.                                                  |

## 6. Capturas prioritarias para tomar

Top 10 capturas más importantes (orden sugerido):

1. `01-login.png` — Pantalla de login.
2. `03-dashboard.png` — Dashboard principal con métricas.
3. `04a-products-list.png` — Listado de productos.
4. `04b-products-form.png` — Modal/formulario de alta de producto.
5. `06a-sales-list.png` — Listado de ventas.
6. `06b-sale-form.png` — Formulario de nueva venta con productos cargados.
7. `07a-purchases-list.png` — Listado de compras.
8. `09a-clients-list.png` — Listado de clientes.
9. `12a-cash-open.png` — Pantalla de caja con caja abierta.
10. `14b-credit-detail.png` — Detalle de un crédito con timeline de pagos.

Adicionales útiles: `08a-quotations-list.png`, `11-categories.png`, `13a-expenses-list.png`, `16a-reports-overview.png`, `17a-users-list.png`, `20a-sync-idle.png`, `21-profile.png`.

## 7. Estructura del sidebar (navegación principal)

Grupos del menú lateral (orden aproximado):

- **Principal**: Dashboard
- **Operaciones**: Ventas, Cotizaciones, Caja, Compras, Gastos
- **Catálogo**: Productos, Inventario, Categorías
- **Contactos**: Clientes, Proveedores
- **Finanzas**: Créditos, Créditos de Compras, Reportes
- **Administración** (solo admin): Usuarios, Roles, Permisos, Sincronización
- **Cuenta**: Perfil, Cerrar sesión
