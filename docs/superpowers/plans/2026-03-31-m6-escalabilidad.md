# M6 - Escalabilidad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar M6.1-M6.6 con una migracion segura a PostgreSQL, cache Redis con degradacion controlada, paginacion server-side estandar, CI/CD con quality gates y health checks avanzados.

**Architecture:** Primero se estabiliza cobertura de integracion (M6.5) para reducir riesgo. Luego se migra infraestructura (PostgreSQL y Redis), despues se estandariza el contrato de paginacion y su consumo en frontend. Finalmente se cierran operacion y entrega continua con pipeline CI y endpoints de salud/readiness con chequeo de dependencias.

**Tech Stack:** Next.js 15, Express, TypeScript, Prisma, PostgreSQL, Redis (`ioredis`), Jest + Supertest, GitHub Actions.

---

## Execution Convention

- Ejecutar todos los comandos desde la raiz del repo.
- Para backend usar `npm --prefix backend run <script>` o `npx --prefix backend <tool>`.
- En CI, los nombres exactos de checks requeridos son: `lint`, `typecheck`, `test:integration`, `build`.
- Mapeo local: `typecheck` se ejecuta con `npm run type-check`.

## File Structure

### Files to CREATE

- `backend/tests/users.integration.test.ts` - Integracion de CRUD/listado y autorizacion de usuarios.
- `backend/tests/credit-reference.integration.test.ts` - Integracion de referencias, filtros y errores.
- `backend/tests/dashboard.integration.test.ts` - Integracion de dashboard autenticado y errores.
- `backend/src/config/redis.config.ts` - Cliente Redis, ping health, fallback, utilidades base.
- `backend/src/services/cache.service.ts` - API de cache tipada (`getOrSet`, invalidacion, TTLs).
- `backend/src/utils/pagination.util.ts` - Contrato comun `data + meta` y normalizacion de `page/limit`.
- `backend/src/schemas/pagination.schema.ts` - Validacion zod de parametros de paginacion.
- `backend/src/routes/health.routes.ts` - Endpoints `/health` y `/health/ready` estructurados.
- `backend/scripts/migrate-sqlite-to-postgres.ts` - Migracion idempotente de datos.
- `backend/scripts/verify-migration.ts` - Verificacion de conteos e integridad post-migracion.
- `backend/scripts/benchmark-dashboard-cache.ts` - Medicion p95 baseline vs cache para M6.2.
- `.github/workflows/ci.yml` - Pipeline de lint, typecheck, test, build.
- `docs/runbooks/m6-db-migration.md` - Runbook de migracion.
- `docs/runbooks/m6-db-rollback.md` - Runbook de rollback.
- `docs/runbooks/m6-redis-fallback.md` - Comportamiento de degradacion Redis.
- `docs/runbooks/m6-redis-benchmark.md` - Evidencia de mejora de latencia p95.
- `docs/runbooks/m6-health-endpoints.md` - Contrato operativo de salud/readiness.
- `docs/runbooks/m6-cicd-governance.md` - Branch protection, required checks y aprobacion manual de production.

### Files to MODIFY

- `backend/prisma/schema.prisma` - `provider` a `postgresql` y ajustes de tipos/indices si aplica.
- `backend/src/config/env.config.ts` - Flags Redis/cache/pagination bounds/health timeouts.
- `backend/src/config/database.config.ts` - Conexion y mensajes/chequeos consistentes para PostgreSQL.
- `backend/src/app.ts` - Integracion de `health.routes`, readiness real y limpieza de health legacy.
- `backend/src/middleware/auth.middleware.ts` - Manejo robusto de fallback blacklist cuando Redis falla.
- `backend/src/utils/token-blacklist.util.ts` - Pasar de DB-only a Redis-first con fallback controlado.
- `backend/src/controllers/user.controller.ts` - Unificar respuesta paginada (`data/meta`).
- `backend/src/controllers/credit-reference.controller.ts` - Paginacion server-side y validacion params.
- `backend/src/controllers/dashboard.controller.ts` - Cache selectivo y manejo de errores dependencias.
- `backend/src/routes/user.routes.ts` - Limites de paginacion y test hooks.
- `backend/src/routes/credit-reference.routes.ts` - Limites de paginacion y test hooks.
- `app/admin/users/page.tsx` - Consumir `meta` nuevo y estado de pagina en URL.
- `app/admin/records/page.tsx` - Traer datos paginados server-side.
- `app/admin/records/_components/records-management.tsx` - Integrar paginacion backend.
- `lib/api.ts` - Adaptar cliente para contratos paginados y query params consistentes.
- `package.json` - Script `test:integration` en root.
- `backend/package.json` - Script `test:integration` dedicado.
- `ROADMAP.md` - Marcar M6.1-M6.6 como done al cerrar verificacion final.

### Files to REVIEW (read-only during implementation)

- `docs/superpowers/specs/2026-03-31-m6-escalabilidad-design.md`
- `backend/tests/setup.ts`
- `backend/jest.config.js`

---

### Task 1: M6.5 Baseline de integracion (Users)

**Files:**

- Test: `backend/tests/users.integration.test.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Write failing integration tests for users list/details/admin guard**

```ts
it("GET /api/v1/users returns 401 without token", async () => {
  await request(app).get("/api/v1/users").expect(401);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test:integration -- users.integration.test.ts`
Expected: `FAIL` with missing file/suite.

- [ ] **Step 3: Implement minimal test fixtures/seeding for admin user token**

```ts
const admin = await prisma.user.create({ data: { ... } });
const token = JWTUtil.generateAccessToken({ userId: admin.id, ... });
```

- [ ] **Step 4: Re-run targeted suite**

Run: `npm --prefix backend run test:integration -- users.integration.test.ts`
Expected: `PASS` en auth/list/filters actuales y tests de paginacion marcados `it.skip` con tag `TODO-M6.3`.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/users.integration.test.ts backend/package.json
git commit -m "test: add users integration coverage for auth and pagination"
```

### Task 2: M6.5 Baseline de integracion (CreditReference + Dashboard)

**Files:**

- Test: `backend/tests/credit-reference.integration.test.ts`
- Test: `backend/tests/dashboard.integration.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for records and dashboard auth/shape**

```ts
it("GET /api/v1/dashboard requires auth", async () => {
  await request(app).get("/api/v1/dashboard").expect(401);
});
```

- [ ] **Step 2: Run tests and confirm failures**

Run: `npm run test:integration`
Expected: `FAIL` with missing suites or unmet assertions.

- [ ] **Step 3: Add minimal seed data and assertions for response contract**

```ts
expect(response.body).toHaveProperty("success", true);
expect(response.body.data).toHaveProperty("referencesByStatus");
```

- [ ] **Step 4: Re-run integration tests**

Run: `npm run test:integration`
Expected: `PASS` for the 3 new integration files, con casos de paginacion no migrados en estado pending controlado.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/credit-reference.integration.test.ts backend/tests/dashboard.integration.test.ts package.json
git commit -m "test: add credit reference and dashboard integration suites"
```

### Task 3: M6.1 Migracion a PostgreSQL (schema + config)

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/config/env.config.ts`
- Modify: `backend/src/config/database.config.ts`

- [ ] **Step 1: Write failing config test for postgres provider assumptions**

```ts
expect(config.database.url).toContain("postgres");
```

- [ ] **Step 2: Run targeted tests to capture failure**

Run: `npm --prefix backend run test -- database.test.ts`
Expected: `FAIL` if provider/env not aligned.

- [ ] **Step 3: Update Prisma datasource to PostgreSQL**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 4: Add env guards and defaults for migration safety**

Run: `npm --prefix backend run build`
Expected: `PASS` TypeScript compile.

- [ ] **Step 5: Generate Prisma migration with exact command**

Run: `npx --prefix backend prisma migrate dev --name postgres_alignment`
Expected: nueva carpeta en `backend/prisma/migrations/` y client actualizado.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/config/env.config.ts backend/src/config/database.config.ts
git commit -m "feat: switch prisma datasource to postgresql and generate alignment migration"
```

### Task 4: M6.1 Data migration + verification scripts

**Files:**

- Create: `backend/scripts/migrate-sqlite-to-postgres.ts`
- Create: `backend/scripts/verify-migration.ts`
- Create: `docs/runbooks/m6-db-migration.md`

- [ ] **Step 1: Write failing verification script skeleton**

```ts
if (sourceCount !== targetCount) throw new Error("count mismatch");
```

- [ ] **Step 2: Dry-run verification script**

Run: `npx --prefix backend ts-node scripts/verify-migration.ts --dry-run`
Expected: controlled fail or warning when connections are missing.

- [ ] **Step 3: Implement idempotent migration batches and transaction boundaries**

```ts
for (const batch of chunks) await target.$transaction([...batchOps]);
```

- [ ] **Step 4: Run migration script in controlled environment**

Run: `npx --prefix backend ts-node scripts/migrate-sqlite-to-postgres.ts`
Expected: resumen por entidad migrada sin duplicados en segunda ejecucion.

- [ ] **Step 5: Execute verification after migration**

Run: `npx --prefix backend ts-node scripts/verify-migration.ts`
Expected: `OK` with table-by-table counts and sample validation.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/migrate-sqlite-to-postgres.ts backend/scripts/verify-migration.ts docs/runbooks/m6-db-migration.md
git commit -m "chore: add sqlite to postgres migration scripts and verification"
```

### Task 5: M6.2 Redis integration (client + blacklist/cache fallback)

**Files:**

- Create: `backend/src/config/redis.config.ts`
- Create: `backend/src/services/cache.service.ts`
- Modify: `backend/src/utils/token-blacklist.util.ts`
- Modify: `backend/src/middleware/auth.middleware.ts`
- Modify: `backend/package.json`
- Create: `backend/scripts/benchmark-dashboard-cache.ts`
- Create: `docs/runbooks/m6-redis-benchmark.md`

- [ ] **Step 1: Write failing tests for Redis-unavailable graceful behavior**

```ts
it("continues auth flow when redis is down", async () => {
  // mock redis ping reject
  expect(response.status).not.toBe(500);
});
```

- [ ] **Step 2: Run targeted suite and verify failure**

Run: `npm --prefix backend run test:integration -- auth.middleware.test.ts`
Expected: `FAIL` while fallback is not implemented.

- [ ] **Step 3: Implement Redis client and cache API with defensive timeout**

```ts
const redis = new Redis(config.redis.url, { connectTimeout: 1500 });
```

- [ ] **Step 4: Update blacklist util to Redis-first with DB fallback**

Run: `npm --prefix backend run test:integration`
Expected: fallback tests pass and no global 5xx on Redis failure.

- [ ] **Step 5: Write failing benchmark assertion for p95 improvement target**

```ts
if (withCache.p95Ms > withoutCache.p95Ms * 0.8)
  throw new Error("p95 improvement < 20%");
```

- [ ] **Step 6: Run benchmark baseline and cache-on measurement**

Run: `npx --prefix backend ts-node scripts/benchmark-dashboard-cache.ts`
Expected: reporte con `withoutCache.p95Ms`, `withCache.p95Ms`, `improvementPct`.

- [ ] **Step 7: Document benchmark evidence**

Run: `git diff -- docs/runbooks/m6-redis-benchmark.md`
Expected: evidencia de mejora `>= 20%` o accion correctiva documentada.

- [ ] **Step 8: Commit**

```bash
git add backend/src/config/redis.config.ts backend/src/services/cache.service.ts backend/src/utils/token-blacklist.util.ts backend/src/middleware/auth.middleware.ts backend/scripts/benchmark-dashboard-cache.ts docs/runbooks/m6-redis-benchmark.md backend/package.json
git commit -m "feat: add redis cache fallback and benchmarked p95 improvements"
```

### Task 6: M6.3 Backend pagination contract unification

**Files:**

- Create: `backend/src/utils/pagination.util.ts`
- Create: `backend/src/schemas/pagination.schema.ts`
- Modify: `backend/src/controllers/user.controller.ts`
- Modify: `backend/src/controllers/credit-reference.controller.ts`
- Test: `backend/tests/users.integration.test.ts`
- Test: `backend/tests/credit-reference.integration.test.ts`

- [ ] **Step 1: Write failing tests for `data/meta` contract and invalid params**

```ts
expect(res.status).toBe(400);
expect(res.body.code).toBe("VALIDATION_ERROR");
it.skip("TODO-M6.3 pagination contract for non migrated route", async () => {});
```

- [ ] **Step 2: Run integration tests and confirm fail**

Run: `npm run test:integration`
Expected: contract tests fail before controller changes.

- [ ] **Step 3: Implement shared pagination parser and response builder**

```ts
buildPaginatedResponse(items, { page, limit, total });
```

- [ ] **Step 4: Apply contract to users and records controllers**

Run: `npm run test:integration`
Expected: page=1/page>1/out-of-range/limit-max/invalid params all pass.

- [ ] **Step 5: Unskip `TODO-M6.3` pagination tests and enforce mandatory pass**

Run: `npm run test:integration`
Expected: no pending tests para contrato de paginacion en rutas objetivo.

- [ ] **Step 6: Commit**

```bash
git add backend/src/utils/pagination.util.ts backend/src/schemas/pagination.schema.ts backend/src/controllers/user.controller.ts backend/src/controllers/credit-reference.controller.ts backend/tests/users.integration.test.ts backend/tests/credit-reference.integration.test.ts
git commit -m "feat: standardize and enforce paginated contract across target endpoints"
```

### Task 7: M6.3 Frontend server-side pagination adoption

**Files:**

- Modify: `app/admin/users/page.tsx`
- Modify: `app/admin/records/page.tsx`
- Modify: `app/admin/records/_components/records-management.tsx`
- Modify: `lib/api.ts`

- [ ] **Step 1: Write UI-level failing assertions (or lightweight integration checks) for meta usage**

```ts
expect(totalPages).toBe(response.data.meta.totalPages);
```

- [ ] **Step 2: Validate current behavior breaks against new backend contract**

Run: `npm run build`
Expected: type/runtime mismatch identified before frontend fixes.

- [ ] **Step 3: Update fetch adapters and URL state (`page`, `limit`, `search`, `sort`)**

```ts
const params = new URLSearchParams({ page: String(page), limit: "10" });
```

- [ ] **Step 4: Verify manual navigation and pagination controls**

Run: `npm run build`
Expected: `PASS` and no TypeScript errors in admin pages.

- [ ] **Step 5: Commit**

```bash
git add app/admin/users/page.tsx app/admin/records/page.tsx app/admin/records/_components/records-management.tsx lib/api.ts
git commit -m "feat: consume backend paginated contract in admin users and records"
```

### Task 8: M6.4 CI pipeline and branch quality gates

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `backend/package.json`

- [ ] **Step 1: Write failing CI expectation test by running required-gates command list before workflow update**

Run: `npm run lint && npm run type-check && npm run test:integration && npm run build`
Expected: al menos una falla inicial que justifique el ajuste del pipeline.

- [ ] **Step 2: Validate workflow locally with dry parse/lint**

Run: `npm run lint && npm run type-check && npm run test:integration && npm run build`
Expected: all commands represent required CI gates.

- [ ] **Step 3: Implement final workflow with required jobs**

```yaml
steps: [install, lint, typecheck, test:integration, build]
```

- [ ] **Step 4: Re-run full quality gates locally**

Run: `npm run lint && npm run type-check && npm run test:integration && npm run build`
Expected: `PASS` all steps.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml package.json backend/package.json
git commit -m "ci: add required quality gates for lint typecheck integration and build"
```

### Task 9: M6.4 CI governance (branch protection + deploy approval)

**Files:**

- Create: `docs/runbooks/m6-cicd-governance.md`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Define required check names and branch protection policy**

```md
Required checks: lint, typecheck, test:integration, build
Protected branch: main
```

- [ ] **Step 2: Add production environment manual approval in workflow**

```yaml
environment: production
```

- [ ] **Step 2.1: Add explicit staging to production promotion flow**

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
  deploy-production:
    needs: deploy-staging
    environment: production
```

- [ ] **Step 2.2: Verify branch protection required checks via GitHub API**

Run: `gh api repos/<org>/<repo>/branches/main/protection`
Expected: required status checks include exactly `lint`, `typecheck`, `test:integration`, `build`.

- [ ] **Step 2.3: Document required reviewers for production environment**

Run: `git diff -- docs/runbooks/m6-cicd-governance.md`
Expected: runbook includes required reviewers, approval flow and escalation path.

- [ ] **Step 3: Validate workflow still runs all required checks**

Run: `npm run lint && npm run type-check && npm run test:integration && npm run build`
Expected: `PASS` with no removed quality gates.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml docs/runbooks/m6-cicd-governance.md
git commit -m "ci: document branch protection and production approval governance"
```

### Task 10: M6.6 Health/readiness endpoints with dependency checks

**Files:**

- Create: `backend/src/routes/health.routes.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/tests/app.test.ts`
- Create: `docs/runbooks/m6-health-endpoints.md`

- [ ] **Step 1: Write failing tests for `/health` and `/health/ready` shape**

```ts
expect(res.body.data.dependencies).toHaveProperty("db");
expect(res.body.data.dependencies).toHaveProperty("redis");
expect(res.body.data).toHaveProperty("uptime");
expect(res.body.data).toHaveProperty("version");
expect(res.body.data).toHaveProperty("timestamp");
expect(res.body.data).toHaveProperty("status");
expect(res.body.data.dependencies.db).toHaveProperty("latencyMs");
expect(res.body.data.dependencies.redis).toHaveProperty("latencyMs");
expect(res.body.data.dependencies.db.status).toMatch(/OK|FAIL/);
expect(res.body.data.dependencies.redis.status).toMatch(/OK|FAIL/);
```

- [ ] **Step 2: Run app tests and confirm failure**

Run: `npm --prefix backend run test -- app.test.ts`
Expected: `FAIL` until readiness route exists.

- [ ] **Step 3: Implement health routes with liveness/readiness semantics**

```ts
res.status(isReady ? 200 : 503).json({ success: isReady, data: { ... } });
```

- [ ] **Step 3.1: Keep deterministic readiness schema in success and failure**

```ts
data.status = isReady ? "READY" : "NOT_READY";
data.dependencies.db.status = "OK" | "FAIL";
data.dependencies.redis.status = "OK" | "FAIL";
```

- [ ] **Step 4: Re-run app and integration tests**

Run: `npm run test:integration && npm --prefix backend run test -- app.test.ts`
Expected: `PASS`, including dependency failure simulation.

- [ ] **Step 4.1: Add explicit readiness failure simulation assertions**

```ts
expect(res.status).toBe(503);
expect(res.body.data.status).toBe("NOT_READY");
expect(res.body.data.dependencies.db.status).toMatch(/OK|FAIL/);
expect(res.body.data.dependencies.redis.status).toMatch(/OK|FAIL/);
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/health.routes.ts backend/src/app.ts backend/tests/app.test.ts docs/runbooks/m6-health-endpoints.md
git commit -m "feat: add liveness and readiness endpoints with dependency status"
```

### Task 11: Operacion, rollback docs y cierre de roadmap

**Files:**

- Create: `docs/runbooks/m6-db-rollback.md`
- Create: `docs/runbooks/m6-redis-fallback.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Run acceptance gate matrix and capture any failures**

Run: `npm run lint && npm run type-check && npm run test:integration && npm run build`
Expected: si falla algo, corregir antes de marcar roadmap.

- [ ] **Step 2: Execute final CI verification matrix for PR and main (3 corridas de integracion)**

Run: `gh run list --workflow ci.yml --limit 20`
Expected: evidencia de 3 corridas consecutivas en verde de `test:integration` en PR y 3 en `main`.

- [ ] **Step 3: Validate local build/type-check final gate**

Run: `npm run type-check && npm run build`
Expected: `PASS` en ambos comandos.

- [ ] **Step 4: Update roadmap statuses M6.1-M6.6 to DONE**

```md
- [x] **M6.1** ...
```

- [ ] **Step 5: Add runbooks and rollback triggers/rto/rpo exactly as spec**

Run: `git diff -- docs/runbooks ROADMAP.md`
Expected: reflects migration, rollback, Redis fallback, health docs.

- [ ] **Step 6: Commit**

```bash
git add docs/runbooks/m6-db-rollback.md docs/runbooks/m6-redis-fallback.md ROADMAP.md
git commit -m "docs: add m6 operational runbooks and close roadmap items"
```

---

## Verification Commands (final gate)

- `npm run lint`
- `npm run type-check`
- `npm run test:integration`
- `npm run build`

CI check-name mapping:

- `lint` -> `npm run lint`
- `typecheck` -> `npm run type-check`
- `test:integration` -> `npm run test:integration`
- `build` -> `npm run build`

Expected final outcome:

- Vault seal integrity: NOMINAL (tests green)
- All-Clear sirens active (build green)
- Readiness reliable with DB/Redis status and deterministic 200/503 behavior
