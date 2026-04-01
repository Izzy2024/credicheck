# CrediCheck - Especificacion de diseno M6 (Escalabilidad)

Fecha: 2026-03-31
Estado: Aprobado en sesion de brainstorming (pendiente validacion final de spec)
Alcance: Completar M6.1 a M6.6 del roadmap con estrategia faseada por riesgo

## 1) Objetivo

Completar el bloque M6 de escalabilidad para preparar la aplicacion para mayor carga y operacion mas robusta, manteniendo continuidad funcional y reduciendo riesgo de regresiones mediante una secuencia de implementacion controlada.

## 2) Enfoque aprobado

Estrategia faseada por riesgo:

1. M6.5 Tests de integracion faltantes
2. M6.1 Migracion SQLite -> PostgreSQL
3. M6.2 Redis para cache y sesiones
4. M6.3 Paginacion server-side en vistas relevantes
5. M6.4 CI/CD con quality gates
6. M6.6 Monitoreo y health checks avanzados

Regla de secuenciacion para pruebas de paginacion:

- En M6.5 se implementan pruebas para contratos actuales y casos base.
- Las pruebas de contrato de paginacion para rutas aun no migradas se marcan como pendientes controladas.
- Al cerrar M6.3, esas pruebas pasan a obligatorias y deben quedar en verde.

## 3) Arquitectura objetivo

### 3.1 Backend

- Prisma operando con PostgreSQL como datastore principal.
- Redis como capa auxiliar para cache/sesiones, con degradacion elegante si no esta disponible.
- Servicios de aplicacion con contratos claros para respuestas paginadas y endpoints de salud.
- Logging estructurado existente (Winston) extendido con campos de trazabilidad operativa.

### 3.2 Contrato API para listados

Todas las respuestas paginadas adoptaran un contrato uniforme:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

Parametros de consulta esperados:

- `page` (default: 1)
- `limit` (default: 20, maximo: 100)
- `search` y/o filtros existentes
- `sort` y `order` cuando aplique

Validaciones y contrato de error:

- `page >= 1`
- `1 <= limit <= 100`
- Parametros invalidos retornan `400` con cuerpo determinista:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid pagination parameter",
  "field": "page"
}
```

### 3.3 Frontend

- Tablas admin consumen paginacion server-side.
- Estado de paginacion/filtros en URL para compartir resultados y conservar contexto.
- Reutilizar componentes existentes para minimizar churn visual y tecnico.

### 3.4 CI/CD y observabilidad

- Pipeline obligatorio: install -> lint -> typecheck -> integration tests -> build.
- Proveedor CI: GitHub Actions en `.github/workflows/ci.yml`.
- Politica de ramas: `main` protegida con checks requeridos.
- Checks requeridos: `lint`, `typecheck`, `test:integration`, `build`.
- Politica de despliegue: promocion `staging -> production` con aprobacion manual.
- Endpoints:
  - `/health` (liveness)
  - `/health/ready` (readiness real: DB + Redis)
- Health checks con salida estructurada para integracion con plataforma de despliegue/monitor.

## 4) Manejo de errores y resiliencia

- Falla de PostgreSQL: readiness en error, logs con contexto, respuesta controlada.
- Falla de Redis: fallback sin cache/sesiones avanzadas cuando sea posible; sin caida completa del backend.
- Timeouts y errores de dependencia con mensajes deterministas y trazables.
- Logging consistente por contexto (`database_error`, `security`, `performance`, etc.).

Decision tecnica de sesiones/autenticacion:

- Se mantiene JWT stateless.
- Redis se usa para blacklist de tokens y cache de consultas.
- Si Redis no esta disponible: autenticacion continua por JWT, se desactiva temporalmente invalidacion por blacklist con alerta en readiness y logs de seguridad.

## 5) Plan tecnico por objetivo M6

## M6.5 - Tests de integracion faltantes

### Alcance

- Completar tests para controllers User, CreditReference y Dashboard.
- Cubrir rutas felices, validaciones, autorizacion y errores controlados.
- Incluir pruebas para contrato de paginacion y metadatos (segun regla de secuenciacion).

### Dependencias previas

- Entorno de pruebas backend estable.
- Fixtures/datos semilla para escenarios representativos.

### Cambios tecnicos concretos

- Agregar suites de integracion para endpoints faltantes.
- Estandarizar helpers de setup/teardown de pruebas.
- Agregar casos para validacion de contrato de errores en parametros.

### Pruebas requeridas

- `npm run test:integration`

### DoD medible

- `npm run test:integration` pasa en 3 ejecuciones consecutivas en CI (PR y `main`).
- Cobertura de escenarios definidos (happy path, auth, validacion, error controlado) completada en User/CreditReference/Dashboard.

### Resultado esperado

- Baseline de confianza previa a cambios de infraestructura.

## M6.1 - SQLite a PostgreSQL

### Alcance

- Ajustar `DATABASE_URL` y configuraciones por entorno.
- Generar/aplicar migrations Prisma para PostgreSQL.
- Script de migracion de datos desde SQLite.
- Validaciones post-migracion por conteo y muestreo de integridad.

### Dependencias previas

- M6.5 completado.
- Instancia PostgreSQL disponible en entorno objetivo.

### Cambios tecnicos concretos

- Configuracion por entorno para `DATABASE_URL`.
- Migraciones Prisma compatibles con PostgreSQL.
- Script idempotente de migracion de datos.
- Script de verificacion post-migracion (conteos y muestreos).

### Pruebas requeridas

- `npm run test:integration`
- `npm run build`

### DoD medible

- Conteos por tabla critica entre origen/destino con desviacion 0.
- Muestreo de registros clave validado sin inconsistencias.
- Readiness DB en `OK` tras despliegue en staging.

### Resultado esperado

- App funcionando sobre PostgreSQL en staging y produccion.

## M6.2 - Redis para cache y sesiones

### Alcance

- Integrar cliente Redis con configuracion y health.
- Cachear endpoints/consultas de alto costo (por ejemplo dashboard/reportes).
- Definir TTL por tipo de dato y estrategia de invalidacion basica.
- Aplicar JWT stateless + Redis para blacklist y cache.

### Dependencias previas

- M6.1 completado.
- Instancia Redis disponible en entorno objetivo.

### Cambios tecnicos concretos

- Cliente Redis con reconexion y timeout defensivo.
- Capa de cache en servicios de lectura de alto costo.
- TTL iniciales por tipo de dato documentados.
- Invalidador minimo por eventos de escritura relevantes.

### Pruebas requeridas

- `npm run test:integration`
- Pruebas de degradacion con Redis no disponible.

### DoD medible

- Endpoints cacheados muestran mejora de latencia p95 >= 20% en prueba controlada.
- Con Redis caido, backend continua sirviendo rutas criticas sin error 5xx generalizado.

### Resultado esperado

- Menor latencia en consultas repetidas y mejor estabilidad bajo carga.

## M6.3 - Paginacion server-side

### Alcance

- Aplicar paginacion en vistas con potencial alto volumen.
- Actualizar endpoints y frontend para usar contrato comun.
- Preservar filtros y ordenamientos existentes.

### Dependencias previas

- M6.2 completado.

### Cambios tecnicos concretos

- Implementar `page/limit` en endpoints objetivo.
- Responder con objeto `meta` comun.
- Actualizar tablas frontend para consumir meta y mantener estado en URL.

### Pruebas requeridas

- `npm run test:integration`
- Casos de borde: `page=1`, `page` fuera de rango, `limit` maximo, parametros invalidos.

### DoD medible

- Todas las rutas objetivo retornan contrato paginado uniforme.
- 100% de casos de borde de paginacion en verde en suite de integracion.

### Resultado esperado

- Menor consumo de memoria/tiempo de respuesta en listados amplios.

## M6.4 - CI/CD

### Alcance

- Workflow de validacion automatica para PRs/branch principal.
- Gates obligatorios: lint, typecheck, integration tests, build.
- Opcional inicial: job de despliegue condicionado a branch/tag.

### Dependencias previas

- M6.5 completado y comandos de calidad estables.

### Cambios tecnicos concretos

- Crear/actualizar `.github/workflows/ci.yml`.
- Definir checks requeridos en proteccion de rama `main`.
- Configurar artefactos de build y politica de promocion de despliegue.

### Pruebas requeridas

- Ejecucion de pipeline en PR de prueba.

### DoD medible

- PR sin checks en verde no puede mergear a `main`.
- Pipeline completo ejecuta `lint`, `typecheck`, `test:integration`, `build` sin pasos manuales.

### Resultado esperado

- Reduccion de regresiones en despliegues.

## M6.6 - Monitoreo y health checks

### Alcance

- Endpoint readiness con chequeo de dependencias reales (DB/Redis).
- Exponer indicadores minimos de estado (uptime, version, timestamp).
- Documentar uso operativo para diagnostico rapido.

### Dependencias previas

- M6.1 y M6.2 completados.

### Cambios tecnicos concretos

- Implementar respuesta estructurada para liveness/readiness.
- Incluir estado por dependencia (`db`, `redis`) y latencia de check.
- Documentar integracion con plataforma de monitoreo.

### Pruebas requeridas

- `npm run test:integration`
- Pruebas simulando falla de DB y Redis.

### DoD medible

- `/health` responde `200` estable.
- `/health/ready` refleja correctamente estados `OK/FAIL` por dependencia en escenarios simulados.

### Resultado esperado

- Deteccion temprana de fallos y mejor operabilidad.

## 6) Estrategia de cutover para DB

1. Backup/snapshot de SQLite.
2. Provisionado PostgreSQL + migrations.
3. Migracion de datos con script idempotente.
4. Validacion automatica y manual en staging.
5. Ventana de despliegue controlada a produccion.
6. Plan de rollback documentado.

### Runbook de rollback (ejecutable)

- Owner de decision: responsable tecnico de guardia (on-call) + aprobacion del lider tecnico.
- Triggers de rollback:
  - Error rate HTTP 5xx > 5% por 10 minutos.
  - `/health/ready` en `FAIL` por 5 chequeos consecutivos.
  - Falla en validacion de integridad de datos post-cutover.
- Objetivos de recuperacion:
  - RTO objetivo: <= 30 minutos.
  - RPO objetivo: <= 5 minutos.
- Pasos de rollback:
  1. Congelar escrituras en aplicacion.
  2. Restaurar `DATABASE_URL` al origen estable.
  3. Restaurar snapshot de SQLite si aplica.
  4. Re-deploy del artefacto previo estable.
  5. Invalidar cache Redis relacionada a entidades afectadas.
  6. Ejecutar set de consultas de verificacion y smoke tests.
  7. Reabrir trafico gradualmente y monitorear 30 minutos.

## 7) Criterios de aceptacion globales

- M6.1 a M6.6 marcados como completados en roadmap.
- `npm run test:integration` pasa en 3 ejecuciones consecutivas en CI para PR y `main`.
- `npm run build` y typecheck finalizan en `exit code 0` en CI.
- `/health/ready` reporta estados correctos de DB y Redis en pruebas nominales y fallas simuladas.
- Contrato de paginacion pasa casos: `page=1`, `page>1`, fuera de rango, `limit` maximo y parametros invalidos (`400`).
- Documentacion tecnica actualizada en `docs/` con: runbook de migracion, runbook de rollback, comportamiento de fallback Redis y esquema de health endpoints.

## 8) Riesgos y mitigaciones

- Riesgo: regresion funcional por cambios concurrentes.
  - Mitigacion: ejecutar M6.5 antes de infraestructura; quality gates estrictos.
- Riesgo: problemas de migracion de datos.
  - Mitigacion: validaciones por conteo/muestreo + rollback plan.
- Riesgo: dependencia Redis inestable.
  - Mitigacion: fallback sin cache y timeouts defensivos.
- Riesgo: paginacion rompe UX existente.
  - Mitigacion: conservar filtros/sort y estado en URL.

## 9) Fuera de alcance inmediato

- Refactors no relacionados con M6.
- Cambios grandes de UI que no impacten escalabilidad.
- Reemplazo total de stack de observabilidad mas alla de health checks base.

## 10) Entregables

- Codigo de M6.1 a M6.6 implementado.
- Tests de integracion ampliados.
- Pipeline CI/CD operativo.
- Health checks avanzados activos.
- Roadmap actualizado con estado final.
