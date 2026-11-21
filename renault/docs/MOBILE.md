# App móvil — Recomendaciones

## Recomendación

Para este proyecto (React/Next.js/TypeScript, API REST con JWT) la opción más
natural y de menor fricción es **React Native con Expo**:

- Reutiliza el lenguaje (TypeScript) y el conocimiento del equipo.
- Consume la misma API REST (`/api/*`), sin duplicar backend.
- Acceso a capacidades nativas (cámara para escaneo de códigos de barra,
  impresión, notificaciones push) que un ERP de campo necesita.

Alternativas consideradas:

| Opción | Pros | Contras |
|---|---|---|
| PWA (web instalable) | Cero código nuevo, offline ya soportado | Sin app stores, capacidades nativas limitadas |
| Capacitor (envolver web) | Reutiliza 100% del código web | UX de web, rendimiento inferior |
| Flutter | Excelente rendimiento | Dart, duplica lógica, curva de aprendizaje |
| React Native / Expo | Nativo, reutiliza TS, ecosistema grande | Requiere desarrollo de pantallas |

Plan sugerido (por fases):

1. **Fase 0 (hecho)**: backend acepta `Authorization: Bearer` además de cookie,
   y login/refresh devuelven tokens en el body. La web sigue usando cookies.
2. **Fase 1**: PWA instalable (manifest ya agregado) para acceso inmediato.
3. **Fase 2**: App Expo con login + catálogo + clientes (starter en `/mobile`).
4. **Fase 3**: Flujos de campo prioritarios: venta (POS), consulta de stock,
   cobro de créditos, notificaciones. Escaneo de códigos con `expo-camera`.
5. **Fase 4**: Offline-first con cola de sincronización (reutilizar la lógica
   de `lib/offline-storage` adaptada a AsyncStorage).

## Seguridad

- Los tokens se almacenan hoy en AsyncStorage (starter). Para producción usar
  `expo-secure-store`.
- En producción definir `ALLOWED_ORIGIN` en el backend para el origen de la app.
- Rate limiting y permisos (`modulo.accion`) aplican igual que en web.
