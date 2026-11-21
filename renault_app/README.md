# Renault ERP — App Flutter

Cliente móvil (starter) del sistema Renault ERP. Consume la misma API REST del
backend Next.js (`/api/*`) mediante `Authorization: Bearer`.

## Requisitos

- Flutter 3.20+ (probado con 3.47)
- Backend Renault corriendo (por defecto `http://localhost:5000`)

## Ejecutar

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

- Emulador Android: usar `http://10.0.2.2:5000`
- Dispositivo físico: usar la IP de tu PC, ej. `http://192.168.1.10:5000`
- Web (misma máquina): `http://localhost:5000`

## Estructura

- `lib/core`: config, red (Dio + refresh), storage seguro, router, providers.
- `lib/features/auth`: login JWT + sesión restaurada desde el access token.
- `lib/features/products`: listado/búsqueda de productos.
- `lib/features/clients`: listado/búsqueda de clientes.

## Próximos pasos sugeridos

- POS/ventas con escaneo de códigos (`mobile_scanner`).
- Cobro de créditos y pagos a proveedores.
- Offline-first con cola de sincronización.
- Notificaciones push.
