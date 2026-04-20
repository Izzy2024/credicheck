# Deploy checklist - CrediCheck

## Antes del deploy

- [ ] Confirmar que el branch correcto está listo
- [ ] Confirmar que `npm run build` pasa
- [ ] Confirmar que `npm run test` pasa
- [ ] Confirmar que `npm run test:frontend` pasa
- [ ] Confirmar variables de entorno de frontend
- [ ] Confirmar variables de entorno de backend
- [ ] Confirmar acceso a base de datos de producción
- [ ] Confirmar estrategia de backup de base de datos
- [ ] Confirmar dominio / URLs finales
- [ ] Confirmar CORS_ORIGIN correcto

## Backend

- [ ] Instalar dependencias
- [ ] Configurar archivo/env vars de producción
- [ ] Ejecutar migraciones: `npm run db:migrate:deploy`
- [ ] Compilar backend: `npm run build:backend`
- [ ] Levantar backend en modo producción
- [ ] Verificar endpoint `/health`
- [ ] Verificar logs de arranque
- [ ] Verificar conexión a base de datos

## Frontend

- [ ] Configurar `NEXT_PUBLIC_API_URL`
- [ ] Compilar frontend: `npm run build:frontend`
- [ ] Levantar frontend en modo producción
- [ ] Verificar carga de `/`
- [ ] Verificar navegación principal
- [ ] Verificar conexión al backend real

## Validaciones funcionales mínimas

- [ ] Home abre correctamente
- [ ] Dashboard público abre sin login
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Búsqueda pública funciona
- [ ] Últimos resultados persisten correctamente
- [ ] Add record respeta gating según auth
- [ ] Profile carga y actualiza
- [ ] Disputes cargan
- [ ] Admin entra correctamente si aplica

## Seguridad y operación

- [ ] Secrets no están hardcodeados
- [ ] JWT secrets fuertes y distintos
- [ ] CORS limitado al dominio real
- [ ] NODE_ENV=production
- [ ] Logs revisados después del arranque
- [ ] Backup/rollback definido

## Después del deploy

- [ ] Correr validación post-deploy
- [ ] Revisar logs de errores
- [ ] Revisar consumo básico de CPU/RAM
- [ ] Confirmar que usuarios pueden entrar y usar búsqueda
- [ ] Confirmar que no hay errores 500 en flujos principales
