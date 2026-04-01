# CrediCheck - Script de Inicio Rápido para Windows
# ================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "setup", "build", "db", "clean", "help")]
    [string]$Action = "start"
)

# Configurar colores para output
$Host.UI.RawUI.ForegroundColor = "White"

# Función para imprimir mensajes con colores
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Función para verificar si un comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Función para verificar requisitos
function Test-Requirements {
    Write-Status "Verificando requisitos del sistema..."
    
    # Verificar Node.js
    if (-not (Test-Command "node")) {
        Write-Error "Node.js no está instalado. Por favor instala Node.js >= 20.0.0"
        exit 1
    }
    
    $nodeVersion = (node -v) -replace 'v', ''
    $majorVersion = [int]($nodeVersion.Split('.')[0])
    if ($majorVersion -lt 20) {
        Write-Error "Node.js versión $nodeVersion detectada. Se requiere Node.js >= 20.0.0"
        exit 1
    }
    
    Write-Success "Node.js $(node -v) detectado"
    
    # Verificar npm
    if (-not (Test-Command "npm")) {
        Write-Error "npm no está instalado"
        exit 1
    }
    
    Write-Success "npm $(npm -v) detectado"
    
    # Verificar Docker (opcional)
    if (Test-Command "docker") {
        Write-Success "Docker detectado - se usará para la base de datos"
        $script:UseDocker = $true
    }
    else {
        Write-Warning "Docker no detectado - asegúrate de tener PostgreSQL y Redis corriendo localmente"
        $script:UseDocker = $false
    }
    
    # Verificar Docker Compose
    if (Test-Command "docker-compose") {
        Write-Success "Docker Compose detectado"
        $script:DockerComposeCmd = "docker-compose"
    }
    elseif (Test-Command "docker") {
        try {
            docker compose version | Out-Null
            Write-Success "Docker Compose (plugin) detectado"
            $script:DockerComposeCmd = "docker compose"
        }
        catch {
            Write-Warning "Docker Compose no detectado"
            $script:DockerComposeCmd = ""
        }
    }
    else {
        Write-Warning "Docker Compose no detectado"
        $script:DockerComposeCmd = ""
    }
}

# Función para crear archivos de entorno
function Set-EnvFiles {
    Write-Status "Configurando archivos de entorno..."
    
    # Frontend .env.local
    if (-not (Test-Path ".env.local")) {
        @"
# CrediCheck Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=CrediCheck
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Success "Archivo .env.local creado"
    }
    else {
        Write-Status "Archivo .env.local ya existe"
    }
    
    # Backend .env
    if (-not (Test-Path "backend\.env")) {
        @"
# CrediCheck Backend Environment

# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/credicheck_db"
DATABASE_SSL=false

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-32-chars-min"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-32-chars-min"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY="your-super-secret-encryption-key-32-chars"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=5
SEARCH_RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring
HEALTH_CHECK_INTERVAL=30000
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
        Write-Success "Archivo backend\.env creado"
    }
    else {
        Write-Status "Archivo backend\.env ya existe"
    }
}

# Función para instalar dependencias
function Install-Dependencies {
    Write-Status "Instalando dependencias..."
    
    # Instalar dependencias del frontend
    if (-not (Test-Path "node_modules")) {
        Write-Status "Instalando dependencias del frontend..."
        npm install
        Write-Success "Dependencias del frontend instaladas"
    }
    else {
        Write-Status "Dependencias del frontend ya instaladas"
    }
    
    # Instalar dependencias del backend
    if (-not (Test-Path "backend\node_modules")) {
        Write-Status "Instalando dependencias del backend..."
        Set-Location backend
        npm install
        Set-Location ..
        Write-Success "Dependencias del backend instaladas"
    }
    else {
        Write-Status "Dependencias del backend ya instaladas"
    }
}

# Función para levantar servicios de base de datos
function Start-DatabaseServices {
    if ($script:UseDocker -and $script:DockerComposeCmd) {
        Write-Status "Levantando servicios de base de datos con Docker..."
        
        # Verificar si los contenedores ya están corriendo
        $containers = & $script:DockerComposeCmd ps
        if ($containers -match "credicheck-db|credicheck-redis") {
            Write-Status "Servicios de base de datos ya están corriendo"
        }
        else {
            & $script:DockerComposeCmd up -d postgres redis
            Write-Success "Servicios de base de datos iniciados"
            
            # Esperar a que PostgreSQL esté listo
            Write-Status "Esperando a que PostgreSQL esté listo..."
            Start-Sleep -Seconds 10
            
            # Verificar conexión
            for ($i = 1; $i -le 30; $i++) {
                try {
                    & $script:DockerComposeCmd exec -T postgres pg_isready -U postgres | Out-Null
                    Write-Success "PostgreSQL está listo"
                    break
                }
                catch {
                    if ($i -eq 30) {
                        Write-Error "PostgreSQL no se pudo conectar después de 30 intentos"
                        exit 1
                    }
                    Start-Sleep -Seconds 2
                }
            }
        }
    }
    else {
        Write-Warning "Docker no disponible. Asegúrate de que PostgreSQL y Redis estén corriendo localmente"
        Write-Status "PostgreSQL debe estar en localhost:5432"
        Write-Status "Redis debe estar en localhost:6379"
    }
}

# Función para configurar la base de datos
function Set-Database {
    Write-Status "Configurando base de datos..."
    
    Set-Location backend
    
    # Generar cliente Prisma
    Write-Status "Generando cliente Prisma..."
    npm run db:generate
    
    # Ejecutar migraciones
    Write-Status "Ejecutando migraciones de base de datos..."
    npm run db:migrate
    
    # Poblar con datos iniciales
    Write-Status "Poblando base de datos con datos iniciales..."
    npm run db:seed
    
    Set-Location ..
    
    Write-Success "Base de datos configurada correctamente"
}

# Función para construir la aplicación
function Build-Application {
    Write-Status "Construyendo aplicación..."
    
    # Construir backend
    Write-Status "Construyendo backend..."
    Set-Location backend
    npm run build
    Set-Location ..
    
    # Construir frontend
    Write-Status "Construyendo frontend..."
    npm run build:frontend
    
    Write-Success "Aplicación construida correctamente"
}

# Función para iniciar la aplicación
function Start-Application {
    Write-Status "Iniciando aplicación CrediCheck..."
    
    # Crear directorio de logs si no existe
    if (-not (Test-Path "backend\logs")) {
        New-Item -ItemType Directory -Path "backend\logs" -Force | Out-Null
    }
    
    # Iniciar aplicación en modo desarrollo
    Write-Success "Iniciando CrediCheck en modo desarrollo..."
    Write-Status "Frontend: http://localhost:3000"
    Write-Status "Backend API: http://localhost:3001"
    Write-Status "Prisma Studio: http://localhost:5555"
    
    # Usar concurrently para ejecutar frontend y backend simultáneamente
    npm run dev
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "CrediCheck - Script de Inicio Rápido para Windows"
    Write-Host "================================================="
    Write-Host ""
    Write-Host "Uso: .\start.ps1 [OPCIÓN]"
    Write-Host ""
    Write-Host "Opciones:"
    Write-Host "  start     Iniciar la aplicación completa (default)"
    Write-Host "  setup     Configurar todo desde cero"
    Write-Host "  build     Construir la aplicación"
    Write-Host "  db        Solo configurar base de datos"
    Write-Host "  clean     Limpiar dependencias y archivos generados"
    Write-Host "  help      Mostrar esta ayuda"
    Write-Host ""
}

# Función para limpiar
function Clean-Application {
    Write-Status "Limpiando aplicación..."
    
    # Detener contenedores si están corriendo
    if ($script:UseDocker -and $script:DockerComposeCmd) {
        & $script:DockerComposeCmd down
    }
    
    # Limpiar dependencias y archivos generados
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "backend\node_modules") { Remove-Item -Recurse -Force "backend\node_modules" }
    if (Test-Path "backend\dist") { Remove-Item -Recurse -Force "backend\dist" }
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    
    Write-Success "Aplicación limpiada"
}

# Función principal
function Main {
    switch ($Action) {
        "start" {
            Test-Requirements
            Set-EnvFiles
            Install-Dependencies
            Start-DatabaseServices
            Set-Database
            Start-Application
        }
        "setup" {
            Test-Requirements
            Set-EnvFiles
            Install-Dependencies
            Start-DatabaseServices
            Set-Database
            Build-Application
            Write-Success "Configuración completada. Ejecuta '.\start.ps1 start' para iniciar la aplicación"
        }
        "build" {
            Test-Requirements
            Install-Dependencies
            Build-Application
        }
        "db" {
            Test-Requirements
            Set-EnvFiles
            Start-DatabaseServices
            Set-Database
        }
        "clean" {
            Clean-Application
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Opción desconocida: $Action"
            Show-Help
            exit 1
        }
    }
}

# Ejecutar función principal
Main
