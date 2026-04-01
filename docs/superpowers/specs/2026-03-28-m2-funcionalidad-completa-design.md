# M2 - Funcionalidad Completa: Design Spec

## Overview

Completar las 8 features pendientes de M2 del roadmap de CrediCheck: export PDF/CSV/Excel, admin dashboard con graficos, settings, token blacklist, y auditoria.

**Stack actual**: Next.js 15 + Express + TypeScript + Prisma + SQLite

**Decisiones tomadas**:

- PDF: client-side con jsPDF
- Token blacklist: tabla SQLite con Prisma (hash SHA-256 del token)
- Settings: perfil + config basica almacenada en DB
- Orden: M2.7 → M2.6 → M2.4 → M2.8 → M2.5 → M2.1 → M2.2 → M2.3

---

## Modelo de Datos

### Cambios al modelo User existente

Agregar back-relations para las nuevas tablas:

```
model User {
  // ... campos existentes ...
  auditLogs        AuditLog[]
  tokenBlacklists  TokenBlacklist[]
  appConfigs       AppConfig[]
}
```

### AuditLog (nueva tabla)

Tabla de auditoria para registrar acciones de admin.

```
AuditLog
  id: String @id @default(cuid())
  userId: String            @map("user_id")
  action: String
  resource: String
  resourceId: String?       @map("resource_id")
  details: String?
  ipAddress: String?        @map("ip_address")
  userAgent: String?        @map("user_agent")
  createdAt: DateTime       @default(now()) @map("created_at")
  user: User                @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
```

Retencion: Sin limpieza automatica en M2. Se puede agregar pruning en M3 o M6 si crece demasiado. Para el volumen esperado de esta app no es critico.

### TokenBlacklist (nueva tabla)

Almacena hashes de tokens JWT invalidados para logout real.

```
TokenBlacklist
  id: String @id @default(cuid())
  tokenHash: String         @unique @map("token_hash")
  userId: String            @map("user_id")
  expiresAt: DateTime       @map("expires_at")
  createdAt: DateTime       @default(now()) @map("created_at")
  user: User                @relation(fields: [userId], references: [id])

  @@index([tokenHash])
  @@index([expiresAt])
  @@map("token_blacklist")
```

**Nota**: Se almacena SHA-256 del JWT (no el token completo) para eficiencia. El hash tiene longitud fija (64 chars hex) vs JWTs de cientos de caracteres.

Limpieza: lazy cleanup - al consultar blacklist, eliminar entradas donde `expiresAt < now`. Ademas un `setInterval` cada hora que borre expirados.

### AppConfig (nueva tabla)

Configuracion key-value de la aplicacion.

```
AppConfig
  id: String @id @default(cuid())
  key: String               @unique
  value: String
  updatedAt: DateTime       @updatedAt @map("updated_at")
  updatedBy: String?        @map("updated_by")
  updatedByUser: User?      @relation(fields: [updatedBy], references: [id])

  @@map("app_config")
```

**Seed**: La migracion incluye seed con valores default:

- `company_name` = "CrediCheck"
- `max_search_results` = "50"

---

## Backend API

### Dashboard mejorado (extender dashboard.routes.ts y dashboard.controller.ts)

`GET /api/v1/dashboard` (auth required) - respuesta ampliada:

```typescript
{
  queriesToday: number;
  activeReferences: number;
  activeUsers: number;
  matchRate: number;
  referencesByMonth: Array<{ month: string; count: number }>;
  referencesByStatus: Array<{ status: string; count: number }>;
  topSearched: Array<{ name: string; idNumber: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    details: string | null;
    userName: string;
    createdAt: string;
  }>;
  searchesByDay: Array<{ date: string; count: number }>;
}
```

### Settings (nuevo settings.routes.ts)

| Metodo | Ruta               | Auth  | Descripcion                                                |
| ------ | ------------------ | ----- | ---------------------------------------------------------- |
| GET    | `/api/v1/settings` | Admin | Obtener todas las configs                                  |
| PUT    | `/api/v1/settings` | Admin | Actualizar configs (body: `{ configs: [{ key, value }] }`) |

**Registro en app.ts**: Agregar `app.use('/api/v1/settings', settingsRoutes)`

### Audit (nuevo audit.routes.ts)

| Metodo | Ruta            | Auth  | Descripcion                              |
| ------ | --------------- | ----- | ---------------------------------------- |
| GET    | `/api/v1/audit` | Admin | Listar AuditLog con paginacion y filtros |

Query params: `page`, `limit`, `action`, `resource`, `userId`, `fromDate`, `toDate`

**Registro en app.ts**: Agregar `app.use('/api/v1/audit', auditRoutes)`

### Export (extender rutas existentes)

| Metodo | Ruta                             | Auth  | Descripcion                                              |
| ------ | -------------------------------- | ----- | -------------------------------------------------------- |
| GET    | `/api/v1/records/:id/pdf-data`   | Auth  | Datos completos de referencia para PDF client-side       |
| GET    | `/api/v1/records/export`         | Admin | Exportar registros. Query: `format=csv` o `format=excel` |
| GET    | `/api/v1/records/history/export` | Auth  | Exportar historial de busqueda. Query: `format=csv`      |

**Nota**: El historial de busqueda ya vive bajo `/api/v1/records/history`, asi que el export va ahi tambien.

**pdf-data response shape**:

```typescript
{
  id: string;
  fullName: string;
  idNumber: string;
  idType: string;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  debtAmount: number;
  debtDate: string;
  creditorName: string;
  debtStatus: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}
```

### Export endpoints retornan archivos binarios

Los endpoints de export retornan `Content-Type: text/csv` o `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` con header `Content-Disposition: attachment`.

**Frontend**: Estos endpoints se llaman con `fetch` directo (no via `api.ts`) ya que retornan blobs, no JSON.

### Auth modificado

- `POST /api/v1/auth/logout` → calcular SHA-256 del token, guardar en `TokenBlacklist`, retornar success
- `authenticateToken` middleware → agregar verificacion: calcular SHA-256 del token, buscar en `TokenBlacklist`. Si existe, 401 "Token invalidado"

---

## Middleware Changes

### logAdminAction (admin.middleware.ts)

Actualmente solo hace `console.log()`. Cambiar a:

1. Interceptar `res.json` como ya hace
2. Escribir en tabla `AuditLog` via Prisma
3. Capturar `ipAddress` de `req.ip` y `userAgent` de `req.headers['user-agent']`
4. Guardar `details` como JSON string con los cambios realizados
5. Incluir `userName` en details para referencia

### authenticateToken (auth.middleware.ts)

Agregar paso despues de verificar JWT:

1. Calcular SHA-256 hash del token
2. Consultar `TokenBlacklist` donde `tokenHash = hash`
3. Si existe, retornar 401 "Token invalidado"
4. Lazy cleanup: en cada consulta, eliminar entradas expiradas (con rate limit: max 1 limpieza por minuto)

### Bug fix: validateRecordIds en admin.middleware.ts

Actualmente valida contra UUID regex pero los IDs son CUIDs. Corregir regex para aceptar formato CUID (`clxxxx...`, `cmxxxx...`, etc.) o usar una validacion mas permisiva (string no vacio de 20+ chars).

---

## Frontend

### /admin - Panel General (app/admin/page.tsx)

Nueva pagina. Layout:

1. **Header**: "Panel General" con fecha actual
2. **4 stat cards** (fila superior): queries today, active refs, active users, match rate
3. **Fila de graficos**:
   - Izquierda (2/3): Grafico de linea - Referencias por mes (ultimos 12 meses)
   - Derecha (1/3): Grafico donut/pie - Referencias por estado
4. **Fila de graficos 2**:
   - Izquierda (2/3): Grafico de barras - Busquedas por dia (ultimos 30 dias)
   - Derecha (1/3): Tabla - Top 10 mas buscados
5. **Tabla**: Actividad reciente (ultimas 15 acciones del AuditLog)

Usar recharts directamente con shadcn chart wrapper (`components/ui/chart.tsx`) siguiendo los patrones que provee.

### /admin/settings (app/admin/settings/page.tsx)

Nueva pagina con tabs:

- **Tab "Perfil"**: Editar nombre, apellido, email. Usa endpoint existente `PUT /api/v1/auth/profile` (no el settings endpoint)
- **Tab "Seguridad"**: Cambiar contraseña. Usa endpoint existente `POST /api/v1/auth/change-password`
- **Tab "Empresa"**: Nombre de empresa. Usa `GET/PUT /api/v1/settings` (AppConfig)
- **Tab "Sistema"**: Max resultados de busqueda, etc. Usa `GET/PUT /api/v1/settings` (AppConfig)

### Export PDF (M2.1) en /results/found

- Boton "Descargar PDF" funcional
- Genera PDF con `jspdf` + `jspdf-autotable` en el navegador
- Contenido: datos de la persona (nombre, ID, fecha nacimiento, direccion, ciudad), datos de deuda (monto, acreedor, fecha, estado, notas)
- Formato: header con nombre empresa (desde AppConfig), datos en tabla, footer con fecha de generacion
- Obtiene datos via `GET /api/v1/records/:id/pdf-data`

### Export CSV/Excel mejorado (M2.2) en /admin/records

- Reemplazar export client-side actual con llamada al backend
- Boton "Exportar" con dropdown: "CSV" y "Excel"
- Llama a `GET /api/v1/records/export?format=csv|excel` con `fetch` directo (blob response)
- Descarga el archivo generado server-side
- Headers: Nombre, Tipo ID, Numero ID, Monto Deuda, Acreedor, Estado, Fecha Deuda, Ciudad, Notas, Creado Por, Fecha Creacion

### Export historial (M2.3) en /history

- Boton "Exportar" funcional (actualmente no hace nada)
- Llama a `GET /api/v1/records/history/export?format=csv` con `fetch` directo (blob response)
- Headers: Fecha, Tipo Busqueda, Termino, Resultados, Tiempo (ms)

### Logout actualizado

Todos los logout paths (admin layout, dashboard, auth-context) deben llamar `POST /api/v1/auth/logout` antes de limpiar localStorage. Esto pobla la TokenBlacklist.

Modificar `AuthContext.logout()` para hacer la llamada al backend, y todos los componentes que hacen logout deben usar este metodo.

---

## Librerias nuevas

### Frontend (package.json)

- `jspdf` - generacion PDF client-side
- `jspdf-autotable` - tablas en PDF

### Backend (backend/package.json)

- `exceljs` - generacion de archivos Excel (alternativa ligera y segura a `xlsx`)

---

## Orden de implementacion

1. **M2.7** - Tabla AuditLog + middleware logAdminAction escribe a DB + endpoint GET /audit
2. **M2.6** - Tabla TokenBlacklist + modificar logout + authenticateToken + actualizar frontend logout
3. **M2.4** - Pagina `/admin` con layout y stat cards (sin graficos aun)
4. **M2.8** - Dashboard mejorado con graficos recharts + extender dashboard controller
5. **M2.5** - Pagina `/admin/settings` + tabla AppConfig + seed + endpoints
6. **M2.1** - Export PDF individual con jsPDF + endpoint pdf-data
7. **M2.2** - Export CSV/Excel mejorado desde backend + exceljs
8. **M2.3** - Export historial de busqueda

---

## Migraciones Prisma

Se creara una unica migracion que agregue las 3 tablas nuevas (`audit_logs`, `token_blacklist`, `app_config`) y las back-relations en `User`. Ademas un seed script para `AppConfig` con valores default.

Bug fix incluido: corregir `validateRecordIds` regex para aceptar CUIDs.
