# Guía de Gestión de Usuarios

## Descripción General

El sistema de gestión de usuarios permite a los administradores gestionar de manera eficiente los usuarios del sistema CrediCheck, incluyendo la creación, edición, activación/desactivación y eliminación de usuarios, así como la asignación de roles y permisos.

## Características Principales

### 🔐 Seguridad y Autenticación
- **Autenticación JWT**: Todos los endpoints requieren autenticación mediante tokens JWT
- **Control de acceso basado en roles**: Solo usuarios con rol `ADMIN` pueden acceder a las funciones de gestión
- **Middleware de autorización**: Protección automática contra accesos no autorizados

### 👥 Gestión de Roles
- **ADMIN**: Acceso completo al sistema de administración
- **ANALYST**: Acceso limitado a funciones de consulta y análisis

### 📊 Funcionalidades Disponibles

#### 1. Visualización de Usuarios
- **Lista paginada**: Visualización de usuarios con paginación automática
- **Estadísticas en tiempo real**: Métricas de usuarios activos, inactivos, por rol, etc.
- **Filtros avanzados**: Búsqueda por nombre, email, rol y estado

#### 2. Creación de Usuarios
- **Formulario validado**: Campos requeridos con validación en tiempo real
- **Generación automática de contraseñas**: Contraseñas seguras generadas automáticamente
- **Asignación inmediata de roles**: Definición del rol durante la creación

#### 3. Edición de Usuarios
- **Modificación de datos**: Actualización de nombre, email, rol y estado
- **Validación de cambios**: Verificación de datos antes de guardar
- **Auditoría automática**: Registro de cambios realizados

#### 4. Gestión de Estados
- **Activación/Desactivación**: Control del estado activo/inactivo de usuarios
- **Eliminación segura**: Eliminación lógica (soft delete) de usuarios

## Endpoints de la API

### Base URL
```
http://localhost:3002/api/v1
```

### Endpoints Disponibles

#### Obtener Usuarios
```http
GET /users
Authorization: Bearer <token>
Query Parameters:
  - page: número de página (default: 1)
  - limit: elementos por página (default: 10)
  - search: término de búsqueda (nombre o email)
  - role: filtro por rol (ADMIN | ANALYST)
  - isActive: filtro por estado (true | false)
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "usuario@ejemplo.com",
        "firstName": "Nombre",
        "lastName": "Apellido",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "lastLogin": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Obtener Estadísticas de Usuarios
```http
GET /users/stats
Authorization: Bearer <token>
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "active": 45,
    "inactive": 5,
    "admins": 3,
    "analysts": 47
  }
}
```

#### Crear Usuario
```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nuevo@usuario.com",
  "password": "contraseña123",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "ANALYST"
}
```

#### Actualizar Usuario
```http
PUT /users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "actualizado@usuario.com",
  "firstName": "Actualizado",
  "lastName": "Usuario",
  "role": "ADMIN",
  "isActive": true
}
```

#### Cambiar Estado de Usuario
```http
POST /users/{id}/toggle-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Eliminar Usuario
```http
DELETE /users/{id}
Authorization: Bearer <token>
```

## Uso de la Interfaz

### Acceso al Panel de Administración
1. Iniciar sesión como usuario con rol `ADMIN`
2. Hacer clic en el botón "Panel de Administración" en la sección "Mi Usuario"
3. Seleccionar "Gestión de Usuarios" en el menú lateral

### Crear Nuevo Usuario
1. Hacer clic en el botón "Nuevo Usuario"
2. Completar el formulario con la información requerida:
   - **Nombre**: Nombre del usuario
   - **Apellido**: Apellido del usuario
   - **Email**: Dirección de correo electrónico única
   - **Contraseña**: Contraseña segura (mínimo 8 caracteres, con mayúsculas, minúsculas y números)
   - **Rol**: Seleccionar entre `ADMIN` o `ANALYST`
3. Hacer clic en "Crear Usuario"

### Editar Usuario Existente
1. En la tabla de usuarios, hacer clic en el botón de editar (ícono de lápiz)
2. Modificar los campos deseados en el formulario
3. Hacer clic en "Guardar Cambios"

### Gestionar Estado de Usuario
- **Activar/Desactivar**: Hacer clic en el botón de estado (ícono de usuario con check/X)
- **Eliminar**: Hacer clic en el botón de eliminar (ícono de papelera) y confirmar la acción

### Filtros y Búsqueda
- **Búsqueda**: Escribir en el campo de búsqueda para filtrar por nombre o email
- **Filtro por rol**: Seleccionar "Administradores" o "Analistas"
- **Filtro por estado**: Seleccionar "Activos" o "Inactivos"

## Validaciones

### Creación de Usuario
- **Email**: Requerido, formato válido, único en el sistema
- **Contraseña**: Mínimo 8 caracteres, debe contener al menos una mayúscula, una minúscula y un número
- **Nombre**: Requerido, máximo 50 caracteres
- **Apellido**: Requerido, máximo 50 caracteres
- **Rol**: Requerido, debe ser `ADMIN` o `ANALYST`

### Edición de Usuario
- **Email**: Requerido, formato válido, único en el sistema (excepto para el usuario actual)
- **Nombre**: Requerido, máximo 50 caracteres
- **Apellido**: Requerido, máximo 50 caracteres
- **Rol**: Requerido, debe ser `ADMIN` o `ANALYST`
- **Estado**: Booleano (activo/inactivo)

## Seguridad

### Medidas de Seguridad Implementadas
1. **Autenticación obligatoria**: Todos los endpoints requieren token JWT válido
2. **Autorización por roles**: Solo usuarios `ADMIN` pueden gestionar usuarios
3. **Validación de datos**: Todas las entradas se validan antes del procesamiento
4. **Logs de auditoría**: Todas las acciones se registran para trazabilidad
5. **Encriptación de contraseñas**: Las contraseñas se almacenan encriptadas
6. **Eliminación lógica**: Los usuarios se desactivan, no se eliminan físicamente

### Mejores Prácticas
- Cambiar contraseñas periódicamente
- No compartir credenciales de administrador
- Revisar logs de auditoría regularmente
- Mantener actualizada la información de contacto de usuarios

## Solución de Problemas

### Problemas Comunes

#### Error de autenticación
- Verificar que el token JWT sea válido
- Asegurarse de tener permisos de administrador
- Verificar que la sesión no haya expirado

#### Error al crear usuario
- Verificar que el email no esté registrado
- Asegurarse de que la contraseña cumpla con los requisitos
- Comprobar permisos de administrador

#### Error al actualizar usuario
- Verificar que el usuario exista
- Asegurarse de que el email no esté en uso por otro usuario
- Comprobar permisos de administrador

## Mantenimiento

### Logs de Auditoría
Los cambios de usuario se registran automáticamente en el sistema de logs con:
- Usuario que realizó la acción
- Tipo de acción (crear, editar, eliminar, cambiar estado)
- Timestamp de la acción
- Datos anteriores y nuevos

### Backup de Datos
- Realizar backups regulares de la base de datos
- Especialmente importante antes de operaciones masivas
- Verificar integridad de backups periódicamente

## Soporte

Para soporte técnico o reportar problemas:
1. Revisar los logs del sistema
2. Verificar la documentación técnica
3. Contactar al equipo de desarrollo

---

**Última actualización**: Octubre 2024
**Versión**: 1.0.0
**Sistema**: CrediCheck v1.0