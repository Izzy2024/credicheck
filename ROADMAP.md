# CrediCheck - Roadmap de Mejora

## Estado del Proyecto

App de registro de referencias crediticias negativas (malos pagadores).
Stack: Next.js 15 + Express + TypeScript + Prisma + SQLite

---

## M1 - Estabilidad Core [DONE]

> Arreglar lo roto para que la app sea usable de extremo a extremo

- [x] **M1.1** Corregir mismatch de token en localStorage (`token` vs `accessToken`)
- [x] **M1.2** Centralizar API client en `lib/api.ts` con interceptores y auth headers automaticos
- [x] **M1.3** Eliminar URLs hardcodeadas, usar siempre `NEXT_PUBLIC_API_URL` via API client
- [x] **M1.4** Agregar autenticacion al endpoint del dashboard (`backend/src/routes/dashboard.routes.ts`)
- [x] **M1.5** Unificar instancias de PrismaClient (usar singleton compartido de `database.config.ts`)
- [x] **M1.6** Crear AuthContext (`lib/auth-context.tsx`) y conectar en `app/layout.tsx`

### Archivos modificados en M1

| Archivo                                                  | Tipo      |
| -------------------------------------------------------- | --------- |
| `lib/api.ts`                                             | NUEVO     |
| `lib/auth-context.tsx`                                   | NUEVO     |
| `app/layout.tsx`                                         | EDITADO   |
| `app/page.tsx`                                           | EDITADO   |
| `app/dashboard/page.tsx`                                 | EDITADO   |
| `app/admin/layout.tsx`                                   | EDITADO   |
| `app/admin/users/page.tsx`                               | EDITADO   |
| `app/admin/users/_components/create-user-dialog.tsx`     | EDITADO   |
| `app/admin/users/_components/edit-user-dialog.tsx`       | EDITADO   |
| `app/admin/records/page.tsx`                             | REESCRITO |
| `app/admin/records/_components/records-management.tsx`   | EDITADO   |
| `app/admin/records/_components/records-table.tsx`        | EDITADO   |
| `app/admin/records/_components/status-manager.tsx`       | EDITADO   |
| `backend/src/controllers/user.controller.ts`             | EDITADO   |
| `backend/src/controllers/credit-reference.controller.ts` | EDITADO   |
| `backend/src/controllers/dashboard.controller.ts`        | EDITADO   |
| `backend/src/middleware/admin.middleware.ts`             | EDITADO   |
| `backend/src/models/search-history.model.ts`             | EDITADO   |
| `backend/src/routes/dashboard.routes.ts`                 | EDITADO   |

---

## M2 - Funcionalidad Completa [DONE]

> Completar features prometidas pero sin implementar

- [x] **M2.1** Exportar reporte PDF individual por referencia
- [x] **M2.2** Exportar CSV/Excel de registros desde admin (parcialmente hecho, mejorar)
- [x] **M2.3** Exportar historial de busqueda
- [x] **M2.4** Crear pagina `/admin` (Panel General con dashboard con graficos)
- [x] **M2.5** Crear pagina `/admin/settings`
- [x] **M2.6** Implementar blacklist de tokens para logout real
- [x] **M2.7** Implementar tabla de auditoria para acciones de admin
- [x] **M2.8** Dashboard mejorado: datos por tiempo (graficos con recharts), actividad reciente, top consultados

### Archivos creados en M2

| Archivo                                                | Tipo      |
| ------------------------------------------------------ | --------- |
| `backend/prisma/migrations/20260328..._add_m2_tables/` | MIGRATION |
| `backend/src/utils/token-blacklist.util.ts`            | NUEVO     |
| `backend/src/schemas/audit.schema.ts`                  | NUEVO     |
| `backend/src/schemas/settings.schema.ts`               | NUEVO     |
| `backend/src/controllers/audit.controller.ts`          | NUEVO     |
| `backend/src/controllers/settings.controller.ts`       | NUEVO     |
| `backend/src/controllers/export.controller.ts`         | NUEVO     |
| `backend/src/services/export.service.ts`               | NUEVO     |
| `backend/src/routes/audit.routes.ts`                   | NUEVO     |
| `backend/src/routes/settings.routes.ts`                | NUEVO     |
| `app/admin/page.tsx`                                   | NUEVO     |
| `app/admin/settings/page.tsx`                          | NUEVO     |

### Archivos modificados en M2

| Archivo                                                | Cambio                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `backend/prisma/schema.prisma`                         | 3 nuevas tablas (AuditLog, TokenBlacklist, AppConfig) + User back-relations |
| `backend/src/app.ts`                                   | Registro de rutas audit y settings                                          |
| `backend/src/middleware/admin.middleware.ts`           | logAdminAction escribe a DB, validateRecordIds acepta CUIDs                 |
| `backend/src/middleware/auth.middleware.ts`            | authenticateToken async + verifica blacklist                                |
| `backend/src/controllers/auth.controller.ts`           | Logout blacklistea token                                                    |
| `backend/src/controllers/dashboard.controller.ts`      | Extended stats con chart data                                               |
| `backend/src/routes/credit-reference.routes.ts`        | Rutas export CSV/Excel/historial                                            |
| `lib/auth-context.tsx`                                 | Logout llama backend antes de limpiar                                       |
| `app/admin/layout.tsx`                                 | handleLogout llama backend                                                  |
| `app/admin/records/_components/records-management.tsx` | Export CSV/Excel via backend con dropdown                                   |
| `app/results/found/page.tsx`                           | PDF export con jsPDF + jspdf-autotable                                      |
| `app/history/page.tsx`                                 | Export button llama backend                                                 |

### Paquetes instalados en M2

| Paquete           | Donde    | Uso              |
| ----------------- | -------- | ---------------- |
| `jspdf`           | frontend | Generacion PDF   |
| `jspdf-autotable` | frontend | Tablas en PDF    |
| `exceljs`         | backend  | Generacion Excel |

---

## M3 - Seguridad y Produccion [DONE]

> Preparar la app para uso real con datos sensibles

- [x] **M3.1** Rate limiting real con `express-rate-limit` (reemplazar stub en memoria)
- [x] **M3.2** Logging con Winston (reemplazar console.log)
- [x] **M3.3** Validacion de entrada consistente (Zod en todos los endpoints)
- [x] **M3.4** Implementar `isPasswordCompromised` real (HaveIBeenPwned API + cache + fallback local)
- [x] **M3.5** Headers de seguridad adicionales (CSP estricto, HSTS, X-Frame-Options, etc.)
- [x] **M3.6** Pagina de cambio de contrasena funcional (con strength meter y compromised check)
- [x] **M3.7** Sistema de reset password con email (flow completo con token temporal)

### Archivos creados en M3

| Archivo                                           | Tipo  |
| ------------------------------------------------- | ----- |
| `backend/src/middleware/rate-limit.middleware.ts` | NUEVO |
| `backend/src/utils/logger.util.ts`                | NUEVO |
| `app/forgot-password/page.tsx`                    | NUEVO |

### Archivos modificados en M3

| Archivo                                      | Cambio                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `backend/src/app.ts`                         | Winston + Morgan logging, rate limiting global, security headers mejorados |
| `backend/src/config/env.config.ts`           | Agregado LOGS_DIR para configuracion de logs                               |
| `backend/src/middleware/auth.middleware.ts`  | Logging con Winston en autenticacion                                       |
| `backend/src/middleware/admin.middleware.ts` | Logging con Winston en acciones de admin                                   |
| `backend/src/routes/auth.routes.ts`          | Rate limiting por endpoint (auth, password reset)                          |
| `backend/src/routes/user.routes.ts`          | Logging con Winston                                                        |
| `backend/src/utils/password.util.ts`         | HaveIBeenPwned API integration, cache, fallback local                      |
| `app/profile/page.tsx`                       | Tabs de perfil/seguridad, password strength meter, compromised check       |
| `app/page.tsx`                               | Link a forgot-password                                                     |

### Paquetes instalados en M3

| Paquete         | Donde   | Uso                          |
| --------------- | ------- | ---------------------------- |
| `morgan`        | backend | HTTP request logging         |
| `@types/morgan` | backend | Tipos TypeScript para Morgan |

---

## M4 - Experiencia de Usuario [DONE]

> Pulir la interfaz para usuarios finales

- [x] **M4.1** Activar dark mode (conectar ThemeProvider en layout)
- [x] **M4.2** Loading skeletons reales (reemplazar `return null` en loading.tsx)
- [x] **M4.3** Componentes de formulario con react-hook-form + zod (reemplazar useState manual)
- [x] **M4.4** Error boundary global
- [x] **M4.5** Notificaciones toast consistentes (estandarizado en Sonner)
- [x] **M4.6** Tipos TypeScript compartidos entre frontend y backend
- [x] **M4.7** Responsive design para todas las paginas

### Archivos creados en M4

| Archivo                               | Tipo  |
| ------------------------------------- | ----- |
| `types/index.ts`                      | NUEVO |
| `types/user.ts`                       | NUEVO |
| `types/credit-reference.ts`           | NUEVO |
| `types/api.ts`                        | NUEVO |
| `types/settings.ts`                   | NUEVO |
| `lib/validations/auth.ts`             | NUEVO |
| `lib/validations/user.ts`             | NUEVO |
| `lib/validations/credit-reference.ts` | NUEVO |
| `lib/validations/settings.ts`         | NUEVO |
| `components/theme-toggle.tsx`         | NUEVO |
| `components/loading-skeletons.tsx`    | NUEVO |
| `app/error.tsx`                       | NUEVO |
| `app/global-error.tsx`                | NUEVO |
| `app/admin/loading.tsx`               | NUEVO |
| `app/admin/users/loading.tsx`         | NUEVO |
| `app/admin/records/loading.tsx`       | NUEVO |
| `app/admin/settings/loading.tsx`      | NUEVO |
| `app/profile/loading.tsx`             | NUEVO |
| `app/add-record/loading.tsx`          | NUEVO |
| `app/forgot-password/loading.tsx`     | NUEVO |
| `app/signup/loading.tsx`              | NUEVO |

### Archivos eliminados en M4

| Archivo                      | Razon                  |
| ---------------------------- | ---------------------- |
| `hooks/use-toast.ts`         | Reemplazado por Sonner |
| `components/ui/toast.tsx`    | Reemplazado por Sonner |
| `components/ui/toaster.tsx`  | Reemplazado por Sonner |
| `components/ui/use-toast.ts` | Reemplazado por Sonner |

---

## M5 - Valor Agregado para el Negocio [DONE]

> Features que hacen la app mas util para exponer malos pagadores

- [x] **M5.1** Sistema de notificaciones: alerta cuando una persona buscada se registra
- [x] **M5.2** Score de riesgo crediticio basado en cantidad/antiguedad de deudas
- [x] **M5.3** Busqueda fuzzy (nombres similares, variaciones de ID)
- [x] **M5.4** Historial completo por persona (timeline de referencias)
- [x] **M5.5** Carga masiva de registros via CSV
- [x] **M5.6** Reportes agregados: top deudores, deudas por ciudad, por acreedor
- [x] **M5.7** Sistema de verificacion/cruzamiento de datos entre usuarios

---

## M6 - Escalabilidad [PENDIENTE]

> Cuando haya mas usuarios

- [ ] **M6.1** Migrar de SQLite a PostgreSQL
- [ ] **M6.2** Implementar Redis para cache y sesiones (ya en config pero no se usa)
- [ ] **M6.3** Paginacion server-side en todas las vistas
- [ ] **M6.4** CI/CD pipeline (tests automatizados antes de deploy)
- [ ] **M6.5** Tests de integracion para controllers faltantes (User, CreditReference, Dashboard)
- [ ] **M6.6** Monitoreo y health checks avanzados

---

## Notas Tecnicas Pendientes

### Errores pre-existentes (no bloqueantes)

- [ ] `backend/src/models/search-history.model.ts` tiene errores TS (usar campo delegate pattern) - **Issue #1**
- [ ] `backend/tests/auth.middleware.test.ts` tiene conflictos de tipos - **Issue #2**
- [ ] `components/style-guide.tsx` tiene import roto (`ui-components`) - dead code - **Issue #3**
- [ ] `styles/globals.css` no importado - dead code - **Issue #4**

### Issues para revisar post-M3

- [ ] **Issue #5**: Remover imports no utilizados en `backend/src/app.ts` (authRateLimit, passwordResetRateLimit, etc.)
- [ ] **Issue #6**: El cache de contraseñas comprometidas no tiene TTL implementado (solo limpieza manual)
- [ ] **Issue #7**: Falta configurar envio real de emails para password reset (SMTP no configurado)
- [ ] **Issue #8**: Los logs se guardan en `backend/logs/` pero no hay rotacion configurada en produccion

### Paquetes instalados sin usar

- [ ] `next-themes` - planificado para M4.1 (dark mode)
- [ ] `react-hook-form` + `@hookform/resolvers` - planificado para M4.3 (formularios)
- [ ] `date-fns` - sin uso (se usa Date nativo)
- [ ] `uuid` - sin uso (request IDs usan Date.now())

---

## Resumen de Implementacion M3

### Rate Limiting

- **Public endpoints**: 100 requests / 15 min
- **Auth endpoints**: 5 requests / 15 min (previene brute force)
- **Password reset**: 3 requests / 1 hora
- **Search endpoints**: 30 requests / 15 min (previene scraping)
- **Export endpoints**: 5 requests / 15 min (costoso en recursos)
- **Authenticated users**: 200 requests / 15 min

### Logging

- **Niveles**: error, warn, info, http, debug
- **Formatos**:
  - Desarrollo: coloreado y legible en consola
  - Produccion: JSON estructurado
- **Archivos**: `logs/error.log`, `logs/combined.log` (max 5MB, 5 archivos)
- **Contextos**: user_activity, admin_action, database_error, auth_error, audit, security, performance

### Seguridad

- **CSP**: Strict (solo 'self', unsafe-inline para estilos, data: para imagenes)
- **HSTS**: 1 año, includeSubDomains, preload
- **Headers adicionales**: X-Content-Type-Options, X-Frame-Options (DENY), X-XSS-Protection, Referrer-Policy
- **Password checking**: HaveIBeenPwned API con k-anonymity + cache 24h + fallback local

### Password Reset Flow

1. Usuario ingresa email en `/forgot-password`
2. Backend genera token temporal (1 hora)
3. En desarrollo: muestra token en UI para testing
4. En produccion: deberia enviar email (SMTP no configurado)
5. Usuario ingresa token + nueva contraseña
6. Backend valida token, verifica fortaleza y compromised status
7. Actualiza contraseña y invalida sesiones anteriores

---
