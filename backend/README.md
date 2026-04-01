# CrediCheck Backend API

Backend API para CrediCheck - Sistema de consulta de referencias crediticias negativas.

## 🚀 Tecnologías

- **Node.js 20+** - Runtime de JavaScript
- **Express.js 4.18+** - Framework web
- **TypeScript 5** - Tipado estático
- **PostgreSQL 15+** - Base de datos principal
- **Redis 7+** - Cache y sesiones
- **Prisma** - ORM para base de datos
- **JWT** - Autenticación
- **Zod** - Validación de esquemas
- **Jest** - Testing framework

## 📋 Requisitos Previos

- Node.js 20 o superior
- PostgreSQL 15 o superior
- Redis 7 o superior
- pnpm (recomendado) o npm

## 🛠️ Instalación

1. **Clonar el repositorio e ir al directorio backend:**
   ```bash
   cd backend
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   - `DATABASE_URL`: URL de conexión a PostgreSQL
   - `REDIS_URL`: URL de conexión a Redis
   - `JWT_ACCESS_SECRET`: Clave secreta para JWT (mínimo 32 caracteres)
   - `JWT_REFRESH_SECRET`: Clave secreta para refresh tokens (mínimo 32 caracteres)
   - `ENCRYPTION_KEY`: Clave para encriptación de datos sensibles (32 caracteres)

4. **Configurar base de datos:**
   ```bash
   # Opción 1: Script automático (recomendado)
   ./scripts/setup-db.sh
   
   # Opción 2: Manual
   npm run db:migrate
   npm run db:generate
   npm run db:seed
   ```

## 🚀 Comandos Disponibles

### Desarrollo
```bash
pnpm dev          # Iniciar servidor en modo desarrollo
pnpm build        # Compilar TypeScript a JavaScript
pnpm start        # Iniciar servidor en producción
```

### Testing
```bash
pnpm test         # Ejecutar tests
pnpm test:watch   # Ejecutar tests en modo watch
pnpm test:coverage # Ejecutar tests con coverage
```

### Linting y Formateo
```bash
pnpm lint         # Ejecutar ESLint
pnpm lint:fix     # Ejecutar ESLint y corregir errores
pnpm format       # Formatear código con Prettier
```

### Base de Datos
```bash
pnpm db:generate  # Generar cliente Prisma
pnpm db:migrate   # Ejecutar migraciones
pnpm db:seed      # Ejecutar seed de datos
pnpm db:studio    # Abrir Prisma Studio
pnpm db:push      # Push schema a DB (desarrollo)
pnpm db:pull      # Pull schema desde DB
```

## 📚 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuraciones
│   ├── controllers/      # Controladores de rutas
│   ├── services/         # Lógica de negocio
│   ├── repositories/     # Acceso a datos
│   ├── middleware/       # Middleware de Express
│   ├── models/          # Modelos y tipos
│   ├── utils/           # Utilidades
│   ├── routes/          # Definición de rutas
│   ├── app.ts           # Configuración de Express
│   └── index.ts         # Punto de entrada
├── tests/               # Tests
├── prisma/              # Schema y migraciones
└── docker/              # Configuración Docker
```

## 🔗 Endpoints Principales

### Health Check
- `GET /health` - Estado del servidor
- `GET /api/v1/info` - Información de la API

### Autenticación (Próximamente)
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/refresh` - Renovar token

### Búsquedas (Próximamente)
- `POST /api/v1/search/by-name` - Buscar por nombre
- `POST /api/v1/search/by-id` - Buscar por cédula
- `POST /api/v1/search/by-document` - Buscar por documento

## 🔧 Configuración de Desarrollo

### Variables de Entorno Requeridas

```env
# Servidor
NODE_ENV=development
PORT=3001

# Base de datos
DATABASE_URL=postgresql://username:password@localhost:5432/credicheck_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=tu-clave-secreta-de-acceso-muy-larga-y-segura
JWT_REFRESH_SECRET=tu-clave-secreta-de-refresh-muy-larga-y-segura

# Encriptación
ENCRYPTION_KEY=tu-clave-de-encriptacion-de-32-chars
```

## 🧪 Testing

El proyecto incluye configuración completa para testing:

- **Unit Tests**: Tests de servicios y utilidades
- **Integration Tests**: Tests de endpoints API
- **Coverage**: Mínimo 80% de cobertura requerida

```bash
# Ejecutar todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en modo watch
pnpm test:watch
```

## 📝 Convenciones de Código

- **ESLint + Prettier** para formateo consistente
- **TypeScript strict mode** habilitado
- **Path aliases** configurados (`@/` apunta a `src/`)
- **Conventional Commits** recomendado

## 🔒 Seguridad

- Helmet para headers de seguridad
- CORS configurado
- Rate limiting implementado
- Validación de entrada con Zod
- Encriptación de datos sensibles
- JWT con refresh token rotation

## 📊 Monitoreo

- Health check endpoint
- Structured logging con Winston
- Request ID tracking
- Error handling centralizado

## 🐳 Docker (Próximamente)

Configuración Docker incluida para:
- Desarrollo local
- Testing
- Producción

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear issue en GitHub
- Contactar al equipo de desarrollo

---

**CrediCheck Backend API** - Sistema de consulta de referencias crediticias para Colombia 🇨🇴