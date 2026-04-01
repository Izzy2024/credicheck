# CrediCheck App

Sistema de consulta de referencias crediticias con frontend en Next.js y backend en Express/TypeScript.

## 🚀 Inicio Rápido

### Opción 1: Scripts Automatizados (Recomendado)

```bash
# Linux/macOS
./dev.sh

# Windows
.\start.ps1
```

### Opción 2: Configuración Manual

```bash
# Clonar el repositorio
git clone <repository-url>
cd credicheck-app

# Instalar dependencias
npm run setup

# Configurar base de datos
npm run setup:dev

# Iniciar aplicación
npm run dev
```

## 📋 Requisitos Previos

- **Node.js** >= 20.0.0
- **npm** o **pnpm**

## 🏗️ Arquitectura

- **Frontend**: Aplicación Next.js con TypeScript, Tailwind CSS y componentes UI.
- **Backend**: API REST con Express, TypeScript, Prisma y SQLite como base de datos.
- **Scripts**: Automatización para desarrollo.

## 📖 Scripts de Inicio Rápido

Para más información sobre los scripts automatizados, consulta [SCRIPTS_README.md](SCRIPTS_README.md).

### Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `dev.sh` | **Inicio rápido diario** | `./dev.sh` |
| `start.sh` | **Script completo con opciones** | `./start.sh [opción]` |
| `start.ps1` | **Script para Windows** | `.\start.ps1 [opción]` |

### Opciones del Script Completo

- `start` - Iniciar aplicación (default)
- `setup` - Configurar todo desde cero
- `build` - Construir aplicación
- `db` - Solo configurar base de datos
- `clean` - Limpiar dependencias
- `help` - Mostrar ayuda

## 🌐 URLs de Acceso

Una vez iniciada la aplicación:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Prisma Studio**: http://localhost:5555

## Scripts Disponibles

### Desarrollo

```bash
# Iniciar frontend y backend simultáneamente
npm run dev

# Iniciar solo el frontend
npm run dev:frontend

# Iniciar solo el backend
npm run dev:backend
```

### Construcción

```bash
# Construir frontend y backend
npm run build

# Construir solo el frontend
npm run build:frontend

# Construir solo el backend
npm run build:backend
```

### Producción

```bash
# Iniciar aplicación en producción
npm run start

# Configurar para producción
npm run setup:prod
```

### Código Calidad

```bash
# Ejecutar linting en frontend y backend
npm run lint

# Corregir problemas de linting
npm run lint:fix

# Formatear código
npm run format

# Verificación de tipos
npm run type-check
```

### Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Desplegar migraciones en producción
npm run db:migrate:deploy

# Resetear base de datos
npm run db:migrate:reset

# Poblar base de datos con datos iniciales
npm run db:seed

# Abrir Prisma Studio
npm run db:studio

# Empujar cambios del schema a la base de datos
npm run db:push

# Extraer schema de la base de datos existente
npm run db:pull
```

### Tests

```bash
# Ejecutar tests
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

### Mantenimiento

```bash
# Limpiar dependencias y archivos generados
npm run clean

# Limpiar y reinstalar todo
npm run clean:install
```

## Variables de Entorno

### Frontend

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Backend

Crear un archivo `.env` en el directorio `backend`:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3002
NODE_ENV=development
```

## Despliegue

### Frontend (Vercel)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Backend (Heroku/Render)

1. Configurar base de datos en producción
2. Establecer variables de entorno
3. Ejecutar `npm run setup:prod`
4. Desplegar aplicación

## Contribución

1. Hacer fork del repositorio
2. Crear rama de feature (`git checkout -b feature/amazing-feature`)
3. Commit de cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

## Registro de Cambios

### Limpieza y Organización del Proyecto (Última actualización)

Se realizó una limpieza completa del proyecto para eliminar archivos innecesarios y organizar mejor la estructura:

- **✅ Eliminados archivos duplicados:**
  - `backend/prisma/dev.db` (base de datos duplicada)
  - `pnpm-lock.yaml` (archivo de bloqueo de package manager no utilizado)
  - `env.local.config` (archivo de configuración de entorno redundante)
  - `gemini.md` y `qwen.md` (archivos de configuración de IA obsoletos)

- **✅ Archivos generados reorganizados:**
  - Eliminados archivos generados de Prisma en `backend/src/generated/`
  - Regenerado cliente de Prisma en la ubicación correcta (`node_modules/@prisma/client`)
  - Actualizadas todas las importaciones para usar la nueva estructura

- **✅ Archivos temporales eliminados:**
  - Archivos `.old` y `~` (archivos de respaldo y temporales)
  - Caché de webpack obsoleto

- **✅ Documentación actualizada:**
  - README.md actualizado con información precisa
  - Estructura del proyecto optimizada

### Desarrollo Asistido (Sesiones anteriores)

Durante sesiones anteriores de desarrollo asistido, se realizaron las siguientes mejoras y correcciones:</search>
</search_and_replace>

- **Conexión Backend-Frontend:** Se conectó el frontend de Next.js con el backend de Express, reemplazando los datos simulados con llamadas a la API real.
- **Corrección de Errores CORS:** Se solucionaron múltiples problemas de CORS que impedían la comunicación entre el frontend y el backend.
- **Base de Datos Funcional:** Se configuró y conectó la base de datos SQLite, y se solucionaron errores relacionados con la creación de registros y la obtención de datos.
- **Funcionalidad de Búsqueda Real:** Se implementó la lógica de búsqueda en el backend y se conectó con el dashboard del frontend.
- **Métricas Dinámicas:** Las estadísticas del dashboard ahora se obtienen de la base de datos en tiempo real.
- **Historial de Búsqueda Funcional:** La página de historial de búsqueda ahora muestra los datos reales de la base de datos, con filtros y paginación funcionales.
- **Corrección de Errores de Tipeo y Lógica:** Se solucionaron varios errores de TypeScript y de lógica de la aplicación tanto en el frontend como en el backend.
