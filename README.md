# Encuéntrame App — Fase 1 (RF-03, RF-04, RF-01)

Ionic 9 + Angular 22 (standalone, signals) + Capacitor + Supabase + Leaflet.

## Puesta en marcha
1. Crea un proyecto en https://supabase.com y ejecuta `supabase/schema.sql` en **SQL Editor**.
2. (Dev) En Authentication → Providers → Email, desactiva "Confirm email" para entrar al registrarse.
3. Pon `supabaseUrl` y `supabaseAnonKey` en `src/environments/environment*.ts`.
4. `npm install` · `npx ionic serve` (requiere Node ≥ 22.22 / 24.15).
5. Móvil: `npx ng build && npx cap add android && npx cap add ios && npx cap sync`.

### Permisos nativos
- **Android** (`AndroidManifest.xml`): `CAMERA`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`.
- **iOS** (`Info.plist`): `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`.

## Cómo encajan las piezas
- `core/auth.service.ts`: signals `currentUser`/`isAuthenticated`; `signUp` envía nombre y teléfono en metadata y el trigger `handle_new_user` crea la fila en `profiles`.
- `core/auth.guard.ts`: en `/nuevo-reporte` redirige a `/login?returnUrl=…`; login/registro navegan al `returnUrl` al terminar.
- `core/reports.service.ts`: `list()` filtra por bounds; `create()` guarda el reporte y el teléfono en `report_contacts` (solo legible por autenticados → RNF-07).
- `core/media-location.service.ts`: cámara/galería, compresión y subida a `pet-photos`, GPS con fallback a null.
- `pages/explore`: mapa + lista + filtros + estado offline. `shared/location-picker`: mini-mapa con pin arrastrable.

## Decisiones a revisar
- El mapa muestra reportes **activos** (perdida + encontrada); el filtro de estado permite ver `perdida` o `resuelta`.
- `pages/report-detail` es un detalle mínimo (RF-02 queda para la siguiente fase).
