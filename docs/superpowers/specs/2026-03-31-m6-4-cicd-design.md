# M6.4 - CI/CD (fase CI) Design

Fecha: 2026-03-31
Estado: Aprobado por usuario (diseno)
Scope: Implementar pipeline de CI con quality gates en GitHub Actions, sin despliegue automatico (sin CD) en esta fase.

## Contexto

El roadmap marca M6.4 pendiente y el repositorio no contiene workflows activos en `.github/workflows`.
El proyecto ya expone scripts de calidad y compilacion tanto en raiz como en backend:

- `npm run lint`
- `npm run type-check`
- `npm run type-check:backend`
- `npm run test`
- `npm run build`

Se decide implementar primero CI para bloquear regresiones y dejar CD como fase posterior.

## Objetivo

Crear un workflow de CI reproducible para PR/push que ejecute quality gates obligatorios y permita activar branch protection en `main`.

## Enfoques evaluados

### Opcion A (recomendada y aprobada): CI basico robusto

- Triggers en `pull_request` y `push` sobre `main`.
- Jobs: `lint`, `typecheck`, `test`, `build`.
- Node 20 (alineado a engines actual).
- `npm ci` para instalacion deterministica.

Trade-off:

- Menor complejidad y time-to-value rapido.
- Sin matrix multi-version ni path filtering en esta fase.

### Opcion B: matrix Node 20/22

- Mas cobertura de compatibilidad.
- Mayor tiempo y costo de ejecucion.

### Opcion C: workflow por cambios (path filters)

- Mayor eficiencia de ejecucion.
- Mayor complejidad y riesgo de saltar checks por reglas incompletas.

## Diseno tecnico

### Archivo

- `.github/workflows/ci.yml`

### Triggers

- `pull_request` hacia `main`
- `push` a `main`

### Concurrency

- Concurrency por branch para cancelar ejecuciones antiguas y reducir ruido.

### Jobs y gates

1. `lint`
   - `npm run lint`
2. `typecheck`
   - `npm run type-check`
   - `npm run type-check:backend`
3. `test`
   - `npm run test`
4. `build`
   - `npm run build`

Notas:

- Cada job usa Ubuntu + Node 20.
- Se usa cache npm de `setup-node`.
- Se define `timeout-minutes` por job para evitar bloqueos.
- Un fallo en cualquier gate marca CI como fail.

## Branch protection y politica de merge

Para completar M6.4, se define como requisito operativo configurar branch protection en `main` con:

- Checks requeridos: los 4 gates del CI.
- Requisito de branch actualizado antes de merge.
- Bloqueo de merge ante fallos.

## Manejo de errores y observabilidad del pipeline

- Si hay fallo de lint/tipos/tests/build, el PR no se considera mergeable.
- Se revisa la primera tanda de PRs para ajustar tiempo, cache y orden de jobs si fuese necesario.

## Criterios de aceptacion (M6.4)

1. Existe `.github/workflows/ci.yml` versionado.
2. El workflow corre en PR/push a `main`.
3. Se ejecutan y reportan los 4 gates (`lint`, `typecheck`, `test`, `build`).
4. Branch protection de `main` exige dichos checks.
5. Hay al menos una corrida exitosa completa documentada como evidencia.

## Fuera de alcance

- Deploy automatico a produccion/staging (CD).
- Matrix de Node multi-version.
- Path filters y optimizaciones avanzadas de ejecucion.

## Siguiente iteracion sugerida

- M6.4.1: CD controlado con aprobacion manual para produccion.
- M6.4.2: Path filters y/o matrix segun tiempos reales de ejecucion.
