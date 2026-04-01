# 🚀 Scripts de Inicio Rápido - CrediCheck

Scripts automatizados para levantar fácilmente la aplicación CrediCheck en cualquier sistema operativo.

## 📋 Requisitos Previos

- **Node.js** >= 20.0.0
- **npm** (incluido con Node.js)
- **Docker** y **Docker Compose** (opcional, pero recomendado)

## 🎯 Scripts Disponibles

### Linux/macOS (Bash)
```bash
./start.sh [OPCIÓN]
```

### Windows (PowerShell)
```powershell
.\start.ps1 [OPCIÓN]
```

## 🔧 Opciones Disponibles

| Opción | Descripción |
|--------|-------------|
| `start` | **Iniciar la aplicación completa** (opción por defecto) |
| `setup` | **Configurar todo desde cero** (primera vez) |
| `build` | **Construir la aplicación** |
| `db` | **Solo configurar base de datos** |
| `clean` | **Limpiar dependencias y archivos generados** |
| `help` | **Mostrar ayuda** |

## 🚀 Inicio Rápido

### Primera vez (Configuración completa)
```bash
# Linux/macOS
./start.sh setup

# Windows
.\start.ps1 setup
```

### Iniciar aplicación
```bash
# Linux/macOS
./start.sh

# Windows
.\start.ps1
```

## 📖 Guía Paso a Paso

### 1. Configuración Inicial (Primera vez)

El script `setup` realizará automáticamente:

1. ✅ **Verificar requisitos del sistema**
   - Node.js >= 20.0.0
   - npm
   - Docker (opcional)

2. ✅ **Crear archivos de entorno**
   - `.env.local` (frontend)
   - `backend/.env` (backend)

3. ✅ **Instalar dependencias**
   - Dependencias del frontend (Next.js)
   - Dependencias del backend (Express, Prisma)

4. ✅ **Levantar servicios de base de datos**
   - PostgreSQL (puerto 5432)
   - Redis (puerto 6379)

5. ✅ **Configurar base de datos**
   - Generar cliente Prisma
   - Ejecutar migraciones
   - Poblar con datos iniciales

6. ✅ **Construir aplicación**
   - Compilar backend TypeScript
   - Construir frontend Next.js

### 2. Inicio Diario

El script `start` realizará:

1. ✅ **Verificar requisitos**
2. ✅ **Crear archivos de entorno** (si no existen)
3. ✅ **Instalar dependencias** (si no están instaladas)
4. ✅ **Levantar servicios de base de datos**
5. ✅ **Configurar base de datos**
6. ✅ **Iniciar aplicación en modo desarrollo**

## 🌐 URLs de Acceso

Una vez iniciada la aplicación:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

## 🔧 Comandos Manuales

Si prefieres ejecutar comandos manualmente:

```bash
# Instalar dependencias
npm run setup

# Levantar servicios de base de datos
docker-compose up -d postgres redis

# Configurar base de datos
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
cd ..

# Iniciar aplicación
npm run dev
```

## 🛠️ Solución de Problemas

### Error: "Node.js no está instalado"
```bash
# Instalar Node.js desde nodejs.org
# O usar nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Error: "Docker no está instalado"
- **Linux**: `sudo apt-get install docker.io docker-compose`
- **macOS**: Instalar Docker Desktop
- **Windows**: Instalar Docker Desktop

### Error: "Puerto 5432 ya está en uso"
```bash
# Verificar qué está usando el puerto
sudo lsof -i :5432

# Detener proceso o cambiar puerto en docker-compose.yml
```

### Error: "Permiso denegado" (Linux/macOS)
```bash
# Hacer el script ejecutable
chmod +x start.sh

# O ejecutar con bash
bash start.sh
```

### Error: "Execution Policy" (Windows)
```powershell
# Cambiar política de ejecución
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# O ejecutar con bypass
PowerShell -ExecutionPolicy Bypass -File start.ps1
```

## 📁 Estructura de Archivos Generados

```
credicheck-app/
├── .env.local                 # Variables de entorno del frontend
├── backend/
│   ├── .env                   # Variables de entorno del backend
│   ├── logs/                  # Directorio de logs
│   └── dist/                  # Código compilado del backend
├── node_modules/              # Dependencias del frontend
├── backend/node_modules/      # Dependencias del backend
├── .next/                     # Build del frontend
└── start.sh                   # Script para Linux/macOS
└── start.ps1                  # Script para Windows
```

## 🔒 Variables de Entorno

Los scripts crean automáticamente los archivos de entorno con configuraciones seguras para desarrollo. Para producción, modifica las siguientes variables:

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=CrediCheck
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Backend (backend/.env)
```env
# Cambiar estas claves en producción
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-32-chars-min"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-32-chars-min"
ENCRYPTION_KEY="your-super-secret-encryption-key-32-chars"
```

## 🎉 ¡Listo!

Con estos scripts, puedes levantar CrediCheck con un solo comando. La aplicación estará disponible en:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Base de datos**: PostgreSQL en puerto 5432
- **Cache**: Redis en puerto 6379

¡Disfruta desarrollando con CrediCheck! 🚀
