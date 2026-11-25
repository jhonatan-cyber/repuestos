# Autenticación móvil

La aplicación Flutter consume la API REST del ERP bajo `/api` mediante Dio.
El contrato de sesión admite tanto cookies HTTP (web) como tokens Bearer (app
nativa), sin exigir que Flutter gestione cookies.

## Flujo de sesión

1. `POST /api/auth/login` devuelve `accessToken` y `refreshToken` en JSON y
   también configura cookies para los clientes web.
2. Flutter guarda ambos tokens con `flutter_secure_storage` y envía el access
   token como `Authorization: Bearer <token>` en las rutas protegidas.
3. Si una ruta protegida responde `401`, Dio envía el refresh token en el cuerpo
   de `POST /api/auth/refresh`. La API devuelve los tokens renovados en JSON y
   actualiza las cookies web.
4. `POST /api/auth/logout` limpia las cookies; Flutter elimina siempre los
   tokens locales, incluso si no hay conexión.

Al actualizar desde una versión que guardaba tokens en `SharedPreferences`, la
app los migra al almacenamiento seguro y elimina las copias anteriores.

## Seguridad y alcance

- Las solicitudes móviles usan el mismo rate limiting y permisos (`modulo.accion`)
  que las solicitudes web.
- Los clientes web que envíen solicitudes de otro origen deben configurar
  `ALLOWED_ORIGIN`; la app nativa usa el contrato Bearer y no depende de CORS ni
  de cookies.
- Cerrar sesión en el dispositivo elimina sus tokens, pero los JWT ya emitidos
  no se revocan en el servidor y siguen sujetos a su expiración.
