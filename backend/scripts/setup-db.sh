#!/bin/bash

# Script para configurar la base de datos de desarrollo
# Este script asume que PostgreSQL está instalado y ejecutándose

set -e

echo "🚀 Configurando base de datos de CrediCheck..."

# Variables de configuración
DB_NAME="credicheck_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si PostgreSQL está ejecutándose
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    print_error "PostgreSQL no está ejecutándose en $DB_HOST:$DB_PORT"
    echo "Por favor, inicia PostgreSQL antes de ejecutar este script."
    echo ""
    echo "En Ubuntu/Debian:"
    echo "  sudo systemctl start postgresql"
    echo ""
    echo "En macOS con Homebrew:"
    echo "  brew services start postgresql"
    echo ""
    echo "En Windows:"
    echo "  Inicia el servicio PostgreSQL desde Services o pgAdmin"
    exit 1
fi

print_status "PostgreSQL está ejecutándose"

# Verificar si la base de datos ya existe
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "La base de datos '$DB_NAME' ya existe"
    read -p "¿Deseas recrearla? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Eliminando base de datos existente..."
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    else
        print_status "Usando base de datos existente"
    fi
fi

# Crear la base de datos si no existe
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_status "Creando base de datos '$DB_NAME'..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
fi

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
    print_error "Archivo .env no encontrado"
    echo "Copiando .env.example a .env..."
    cp .env.example .env
    print_warning "Por favor, configura las variables de entorno en .env antes de continuar"
fi

# Ejecutar migraciones
print_status "Ejecutando migraciones de Prisma..."
npx prisma migrate dev --name init

# Generar cliente Prisma
print_status "Generando cliente Prisma..."
npx prisma generate

# Ejecutar seed (opcional)
read -p "¿Deseas ejecutar el seed con datos de ejemplo? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_status "Ejecutando seed de datos..."
    npm run db:seed
fi

print_status "¡Configuración de base de datos completada!"
echo ""
echo "📊 Base de datos: $DB_NAME"
echo "🔗 URL: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Comandos útiles:"
echo "  npm run db:studio    # Abrir Prisma Studio"
echo "  npm run db:migrate   # Ejecutar nuevas migraciones"
echo "  npm run db:seed      # Ejecutar seed de datos"
echo "  npm run dev          # Iniciar servidor de desarrollo"