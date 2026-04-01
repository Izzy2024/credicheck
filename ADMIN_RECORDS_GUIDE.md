# Guía de Administración de Registros Crediticios

Esta guía explica cómo utilizar el sistema de administración de registros crediticios con la nueva funcionalidad de gestión de estados.

## 🎯 Características Principales

### Estados de Registros
El sistema ahora soporta 5 estados diferentes para los registros crediticios:

- **ACTIVE** (Activa): La deuda está activa y requiere atención
- **PAID** (Pagada): La deuda ha sido completamente cancelada
- **INACTIVE** (Inactiva): La deuda está inactiva por cualquier motivo
- **PAYMENT_PLAN** (Plan de Pago): La deuda está en un plan de pagos acordado
- **DISPUTED** (En Disputa): La deuda está siendo disputada o revisada

### Funcionalidades Disponibles

1. **Gestión Individual de Estados**: Cambiar el estado de un registro específico
2. **Actualización Masiva**: Cambiar el estado de múltiples registros simultaneously
3. **Búsqueda y Filtrado**: Encontrar registros rápidamente
4. **Exportación de Datos**: Exportar registros a CSV
5. **Seguridad Avanzada**: Validaciones y confirmaciones para acciones críticas

## 🚀 Cómo Usar el Sistema

### Acceso a la Administración
1. Inicia sesión en la aplicación
2. Navega a la sección de administración
3. Haz clic en "Administración de Registros" en el menú

### Vista General
La página principal muestra:
- **Tarjetas de estadísticas**: Resumen de registros por estado
- **Controles de búsqueda y filtrado**
- **Tabla de registros con acciones disponibles**

### Cambiar Estado de un Registro

#### Método 1: Desde la tabla
1. Busca el registro que deseas modificar
2. Haz clic en el badge de estado del registro
3. Selecciona el nuevo estado en el diálogo
4. Añade notas opcionales
5. Confirma el cambio

#### Método 2: Desde el menú de acciones
1. Haz clic en el botón de tres puntos (⋮) al final de la fila
2. Selecciona la acción deseada (Marcar como Pagado, Plan de Pago, etc.)
3. Confirma en el diálogo

### Actualización Masiva de Estados

1. **Seleccionar registros**:
   - Usa los checkboxes para seleccionar registros individuales
   - O usa el checkbox principal para seleccionar todos los registros visibles

2. **Ejecutar acción masiva**:
   - Haz clic en "Acciones Masivas" cuando tengas registros seleccionados
   - Elige la acción a realizar (Pagados, Plan de Pago, Inactivos, Disputados)
   - Añade notas si es necesario
   - Confirma la operación

### Búsqueda y Filtrado

#### Búsqueda
- Usa el campo de búsqueda para encontrar por:
  - Nombre completo
  - Número de identificación
  - Nombre del acreedor

#### Filtrado por Estado
- Usa el selector de estado para filtrar registros
- O haz clic en las tarjetas de estadísticas para filtrar rápidamente

#### Pestañas de Navegación
- Usa las pestañas para ver registros por estado específico
- Cada pestaña muestra el conteo de registros en ese estado

### Exportación de Datos
1. Aplica los filtros deseados
2. Haz clic en el botón "Exportar"
3. Se descargará un archivo CSV con los registros visibles

## 🔒 Seguridad y Validaciones

### Permisos Requeridos
- Todas las acciones de administración requieren rol de administrador
- Los usuarios sin permisos verán un mensaje de acceso denegado

### Confirmaciones de Seguridad
- **Eliminación de registros**: Requiere escribir "ELIMINAR" para confirmar
- **Operaciones masivas**: Reieren confirmación para más de 10 registros
- **Cambios de estado**: Diálogo de confirmación con información detallada

### Validaciones del Sistema
- No se puede establecer manualmente el estado "ACTIVE"
- Los IDs de registros deben tener formato UUID válido
- Límite de 100 registros por operación masiva
- Registro de auditoría para todas las acciones administrativas

## 📊 Estados y Significados

| Estado | Color | Icono | Descripción | Cuándo Usar |
|--------|--------|--------|-------------|-------------|
| ACTIVE | Rojo | ⚠️ | Deuda activa | Estado inicial automático |
| PAID | Verde | ✅ | Pagada | Cuando el deudor cancela completamente |
| INACTIVE | Gris | ❌ | Inactiva | Cuando la deuda ya no es relevante |
| PAYMENT_PLAN | Azul | 🕐 | Plan de pago | Cuando se acuerda un plan de pagos |
| DISPUTED | Rojo | ⚠️ | En disputa | Cuando el deudor reclama la deuda |

## 🔧 Operaciones Técnicas

### Endpoints de API

#### Gestión de Estados
- `PUT /api/v1/records/:id/status` - Cambiar estado individual
- `POST /api/v1/records/bulk-update-status` - Actualización masiva
- `GET /api/v1/records/by-status?status=X` - Filtrar por estado

#### Operaciones Estándar
- `GET /api/v1/records` - Obtener todos los registros
- `DELETE /api/v1/records/:id` - Eliminar registro (soft delete)

### Middleware de Seguridad
- `requireAdmin` - Verifica permisos de administrador
- `logAdminAction` - Registra acciones de auditoría
- `validateBulkOperation` - Valida límites de operaciones masivas
- `validateStatusTransition` - Valida transiciones de estado válidas

## 🚨 Buenas Prácticas

### Antes de Cambiar Estados
1. **Verifica la información**: Asegúrate de que el estado actual sea correcto
2. **Añade notas claras**: Documenta el motivo del cambio
3. **Confirma la acción**: Revisa antes de confirmar cambios masivos

### Para Operaciones Masivas
1. **Usa filtros**: Reduce la cantidad de registros antes de seleccionar
2. **Verifica la selección**: Confirma que los registros correctos estén seleccionados
3. **Añade notas descriptivas**: Documenta el motivo de la actualización masiva

### Mantenimiento
1. **Revisa estadísticas regularmente**: Mantén un seguimiento de los estados
2. **Exporta datos periódicamente**: Mantiene respaldos de la información
3. **Documenta cambios importantes**: Usa las notas para registrar decisiones

## 🐛 Solución de Problemas

### Problemas Comunes

**No puedo cambiar el estado**
- Verifica que tienes permisos de administrador
- Asegúrate de que el registro exista y no esté eliminado

**La operación masiva falla**
- Verifica que todos los IDs sean válidos
- Reduce la cantidad de registros seleccionados
- Revisa tu conexión a internet

**No veo los registros actualizados**
- Haz clic en el botón "Actualizar"
- Limpia los filtros de búsqueda
- Recarga la página

### Soporte Técnico
Si encuentras problemas no resueltos:
1. Revisa la consola del navegador para errores
2. Contacta al administrador del sistema
3. Reporta el issue con capturas de pantalla

## 📝 Notas de Versión

### Versión Actual: 2.0
- ✅ Sistema completo de gestión de estados
- ✅ Operaciones masivas con validaciones
- ✅ Interfaz mejorada con estadísticas
- ✅ Seguridad avanzada y auditoría
- ✅ Exportación de datos a CSV

### Próximas Mejoras
- 🔄 Notificaciones automáticas por email
- 📊 Reportes avanzados
- 🔄 Historial de cambios por registro
- 📱 Aplicación móvil