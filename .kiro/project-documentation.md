# CrediCheck - Documentación del Proyecto

## Resumen del Proyecto
**CrediCheck** es una aplicación SaaS para consulta rápida y segura de referencias crediticias negativas. Permite a analistas de crédito buscar, consultar y gestionar información crediticia de personas. La aplicación cuenta con un frontend en Next.js y un backend en Express que se conecta a una base de datos SQLite.

## Stack Tecnológico

### Frontend
- **Framework Principal**: Next.js 15.2.4, React 19, TypeScript 5
- **Styling y UI**: Tailwind CSS, Radix UI, Lucide React, CVA, Tailwind Merge
- **Formularios y Validación**: React Hook Form, Zod
- **Componentes UI Específicos**: Sonner, Recharts, Date-fns, etc.
- **Fuentes y Temas**: Geist Font, Next Themes

### Backend
- **Framework**: Express.js
- **ORM**: Prisma
- **Base de Datos**: SQLite
- **Lenguaje**: TypeScript
- **Validación**: Zod

## Estructura del Proyecto

```
├── app/                          # App Router de Next.js
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página de login
│   ├── globals.css              # Estilos globales
│   ├── dashboard/               # Panel principal
│   │   ├── page.tsx            # Dashboard con estadísticas y búsqueda
│   │   └── loading.tsx         # Estado de carga
│   ├── add-record/              # Agregar registros
│   │   └── page.tsx            # Formulario para nuevos registros
│   ├── history/                 # Historial de consultas
│   │   ├── page.tsx            # Lista de búsquedas anteriores
│   │   └── loading.tsx         # Estado de carga
│   └── results/                 # Resultados de búsqueda
│       ├── found/              # Cuando se encuentran referencias
│       │   ├── page.tsx        # Mostrar referencias encontradas
│       │   └── loading.tsx     # Estado de carga
│       └── not-found/          # Cuando no hay referencias
│           ├── page.tsx        # Mostrar "sin referencias"
│           └── loading.tsx     # Estado de carga
├── components/                   # Componentes reutilizables
│   ├── ui/                      # Componentes UI base (Radix + Tailwind)
│   │   ├── button.tsx          # Componente botón
│   │   ├── input.tsx           # Campos de entrada
│   │   ├── card.tsx            # Tarjetas
│   │   ├── badge.tsx           # Badges/etiquetas
│   │   ├── table.tsx           # Tablas
│   │   ├── select.tsx          # Selectores
│   │   ├── dialog.tsx          # Modales
│   │   ├── alert.tsx           # Alertas
│   │   └── [otros componentes] # Más de 40 componentes UI
│   ├── theme-provider.tsx       # Proveedor de temas
│   └── style-guide.tsx          # Guía de estilos
├── hooks/                       # Custom hooks
│   ├── use-mobile.tsx          # Hook para detectar dispositivos móviles
│   └── use-toast.ts            # Hook para notificaciones
├── lib/                         # Utilidades
│   └── utils.ts                # Funciones utilitarias (cn, etc.)
├── styles/                      # Estilos adicionales
│   └── globals.css             # Estilos CSS globales
└── public/                      # Archivos estáticos
    ├── placeholder-logo.png    # Logo placeholder
    ├── placeholder-user.jpg    # Avatar placeholder
    └── [otros assets]          # Más imágenes placeholder
```

## Funcionalidades Principales

### 1. Autenticación (Login)
- **Archivo**: `app/page.tsx`
- **Características**:
  - Validación de email y contraseña
  - Estados de carga
  - Manejo de errores
  - Diseño responsive
  - Simulación de autenticación

### 2. Dashboard Principal
- **Archivo**: `app/dashboard/page.tsx`
- **Características**:
  - Estadísticas en tiempo real
  - Búsqueda principal de referencias
  - Navegación a otras secciones
  - Menú de usuario con dropdown
  - Cards informativos

### 3. Agregar Registros
- **Archivo**: `app/add-record/page.tsx`
- **Características**:
  - Formulario completo con validaciones
  - Datos personales y crediticios
  - Validación en tiempo real
  - Formateo automático de montos
  - Estados de éxito y error

### 4. Historial de Consultas
- **Archivo**: `app/history/page.tsx`
- **Características**:
  - Tabla paginada de consultas
  - Filtros múltiples (fecha, resultado, búsqueda)
  - Estadísticas de consultas
  - Exportación de datos
  - Navegación a resultados

### 5. Resultados de Búsqueda
- **Archivos**: `app/results/found/page.tsx`, `app/results/not-found/page.tsx`
- **Características**:
  - Mostrar referencias encontradas
  - Página de "sin referencias"
  - Estados de carga
  - Navegación de regreso

## Configuración y Dependencias

### Scripts NPM
```json
{
  "dev": "next dev",           // Desarrollo
  "build": "next build",       // Construcción
  "start": "next start",       // Producción
  "lint": "next lint"          // Linting
}
```

### Configuración Next.js
- **ESLint**: Ignorado durante builds
- **TypeScript**: Errores ignorados en build
- **Imágenes**: Sin optimización (unoptimized: true)

### Configuración TypeScript
- **Target**: ES6
- **Module**: ESNext
- **JSX**: Preserve
- **Paths**: Alias `@/*` apunta a la raíz

### Configuración Tailwind
- **Modo oscuro**: Basado en clases
- **Contenido**: Escanea archivos en `app/`, `components/`, `pages/`
- **Tema extendido**: Variables CSS personalizadas
- **Plugins**: `tailwindcss-animate`

## Patrones de Diseño Utilizados

### 1. Componentes Reutilizables
- Sistema de componentes UI basado en Radix
- Variantes con Class Variance Authority
- Props tipadas con TypeScript

### 2. Estado Local con useState
- Manejo de formularios
- Estados de carga
- Validaciones en tiempo real

### 3. Responsive Design
- Mobile-first approach
- Breakpoints de Tailwind
- Hook personalizado para detección móvil

## Estilos y Temas

### Variables CSS Personalizadas
- Sistema de colores HSL
- Soporte para modo claro/oscuro
- Variables para componentes específicos

### Animaciones
- Animaciones CSS personalizadas
- Efectos de shimmer para loading
- Transiciones suaves

### Accesibilidad
- Focus visible personalizado
- Componentes Radix accesibles
- Contraste de colores adecuado

## Comandos para Ejecutar el Proyecto

### Instalación
```bash
# Instalar dependencias
pnpm install
# o
npm install
# o
yarn install
```

### Desarrollo
```bash
# Ejecutar en modo desarrollo
pnpm dev
# o
npm run dev
# o
yarn dev
```

### Producción
```bash
# Construir para producción
pnpm build
# o
npm run build

# Ejecutar en producción
pnpm start
# o
npm start
```

## Características Técnicas Importantes

### 1. App Router de Next.js
- Estructura basada en carpetas
- Loading states automáticos
- Layouts anidados

### 2. Componentes "use client"
- Todos los componentes principales usan interactividad del cliente
- Manejo de estado local
- Event handlers

### 3. Tipado Fuerte
- Interfaces TypeScript para todos los datos
- Props tipadas en componentes
- Validación con Zod

### 4. Optimización
- Lazy loading de componentes
- Imágenes optimizadas (configurado como unoptimized)
- CSS-in-JS con Tailwind

### 5. Desarrollo Rápido
- Hot reload
- TypeScript strict mode
- ESLint configurado

## Arquitectura Backend

El backend es una API RESTful construida con Express.js y TypeScript. Se encarga de toda la lógica de negocio y la comunicación con la base de datos.

- **Estructura de Carpetas:**
  - `src/controllers`: Contiene la lógica de negocio para cada ruta.
  - `src/routes`: Define las rutas de la API.
  - `src/schemas`: Define los esquemas de validación de datos con Zod.
  - `prisma`: Contiene el esquema de la base de datos y el archivo de seed.
- **ORM:** Se utiliza Prisma para la comunicación con la base de datos SQLite.
- **Rutas Principales:**
  - `/api/v1/records`: Para crear y obtener referencias de crédito.
  - `/api/v1/records/search`: Para buscar referencias de crédito.
  - `/api/v1/records/history`: Para obtener el historial de búsqueda.
  - `/api/v1/dashboard`: Para obtener las estadísticas del dashboard.

## Registro de Cambios del Desarrollo Asistido

Esta sección documenta las mejoras y correcciones realizadas durante una sesión de desarrollo asistido, donde se transformó la aplicación de un prototipo con datos simulados a una aplicación funcional conectada a un backend.

### Resumen de Tareas Realizadas:

1.  **Diagnóstico y Corrección de Errores Iniciales:**
    -   Se solucionó un problema de `EADDRINUSE` que impedía que la aplicación se iniciara correctamente.
    -   Se identificaron y corrigieron errores de CORS que bloqueaban las peticiones del frontend al backend.

2.  **Implementación de la Lógica del Backend:**
    -   Se conectó la base de datos SQLite y se aseguró que el schema de Prisma estuviera sincronizado.
    -   Se corrigió un error en la creación de registros que se debía a un `userId` incorrecto.
    -   Se implementó la lógica para guardar el historial de búsqueda en la base de datos cada vez que se realiza una consulta.

3.  **Conexión Frontend-Backend:**
    -   Se reemplazó la lógica de búsqueda simulada en el dashboard con una llamada a la API del backend.
    -   Se actualizaron las páginas de resultados (`found` y `not-found`) para mostrar los datos reales obtenidos de la API, solucionando a su vez un error de hidratación de React.
    -   Se conectó la página de historial de búsqueda al endpoint del backend para mostrar el historial real.
    -   Se implementó la funcionalidad del botón "Ver" en el historial para volver a ejecutar la búsqueda.

4.  **Métricas Dinámicas:**
    -   Se creó un nuevo endpoint en el backend (`/api/v1/dashboard`) para calcular las estadísticas del dashboard en tiempo real.
    -   Se actualizó el componente del dashboard en el frontend para consumir este endpoint y mostrar las métricas dinámicas.

5.  **Mejoras en la Experiencia de Usuario y Depuración:**
    -   Se mejoró el manejo de errores en el frontend para mostrar mensajes de error más detallados desde el backend.
    -   Se corrigieron errores de tipeo y de lógica en el código de TypeScript tanto en el frontend como en el backend.

### Estado Actual de la Aplicación:

La aplicación es ahora un sistema funcional con un frontend y un backend desacoplados que se comunican a través de una API REST. La persistencia de datos se maneja a través de una base de datos SQLite, y las funcionalidades principales (crear registro, buscar, ver historial) están operativas.
