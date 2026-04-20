# Environment template - Production

Importante: reemplaza todos los valores de ejemplo.
No reutilices secretos débiles.

## Frontend

Variables sugeridas:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

Notas:
- Debe apuntar al backend público real
- Usar https en producción

## Backend

Variables sugeridas:

```env
NODE_ENV=production
PORT=3002
API_VERSION=v1

DATABASE_URL="postgresql://USER:***@POOLER-HOST/DBNAME?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:***@DIRECT-HOST/DBNAME?sslmode=require"
DATABASE_SSL=true

REDIS_URL="redis://HOST:PORT"


JWT_ACCESS_SECRET="REEMPLAZAR_CON_SECRET_LARGO_DE_32+"
JWT_REFRESH_SECRET="REEMPLAZAR_CON_SECRET_DISTINTO_Y_LARGO_DE_32+"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

ENCRYPTION_KEY="REEMPLAZAR_CON_CLAVE_LARGA_DE_32+"

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=5
SEARCH_RATE_LIMIT_MAX=100

CORS_ORIGIN="https://tudominio.com"
CORS_CREDENTIALS=true

LOG_LEVEL=info
LOG_FILE=logs/app.log
LOGS_DIR=logs

HEALTH_CHECK_INTERVAL=30000

SMTP_HOST=""
SMTP_PORT=
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL=""
```

## Recomendaciones

- Usa PostgreSQL en producción
- En Neon con Prisma usa dos URLs:
  - DATABASE_URL: connection pooler (host con `-pooler`, ideal para runtime)
  - DIRECT_URL: conexión directa (sin `-pooler`, necesaria para migraciones Prisma)
- No uses SQLite para producción seria
- JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos
- ENCRYPTION_KEY debe ser distinta de los JWT secrets
- CORS_ORIGIN debe ser exactamente el frontend real
- Si no usas Redis todavía, valida si tu runtime lo requiere o si debes dejar un valor operativo real
- Nunca subas este archivo con secretos reales al repositorio

## Generación de secretos seguros

Ejemplo Linux:

```bash
openssl rand -base64 48
```

Genera al menos:
- 1 para JWT_ACCESS_SECRET
- 1 para JWT_REFRESH_SECRET
- 1 para ENCRYPTION_KEY
