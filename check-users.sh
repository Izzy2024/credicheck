#!/bin/bash

echo "🔍 === VERIFICACIÓN DE USUARIOS Y ROLES ==="
echo ""

# Verificar si existe la base de datos
DB_PATH="backend/prisma/dev.db"
if [ ! -f "$DB_PATH" ]; then
    echo "❌ No se encontró la base de datos en: $DB_PATH"
    echo "💡 Ejecuta el comando: npm run db:seed"
    exit 1
fi

echo "✅ Base de datos encontrada"

# Verificar usuarios en la base de datos
echo ""
echo "📊 Usuarios en la base de datos:"
echo "----------------------------------------"

# Usar sqlite3 para consultar directamente
sqlite3 "$DB_PATH" "SELECT id, email, first_name, last_name, role, is_active, created_at FROM users;" | while IFS='|' read -r id email first_name last_name role is_active created_at; do
    if [ "$id" != "id" ]; then
        echo "👤 $first_name $last_name"
        echo "   Email: $email"
        echo "   Rol: $role"
        echo "   Estado: $([ "$is_active" = "1" ] && echo "Activo" || echo "Inactivo")"
        echo ""
    fi
done

# Contar usuarios por rol
ADMIN_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE role = 'ADMIN';")
ANALYST_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users WHERE role = 'ANALYST';")

echo "📈 Resumen:"
echo "   👑 Usuarios ADMIN: $ADMIN_COUNT"
echo "   👨‍💼 Usuarios ANALYST: $ANALYST_COUNT"

echo ""
echo "🎯 === ANÁLISIS DEL PROBLEMA ==="
echo "📝 El botón de administración aparece cuando: profile.role === 'ADMIN'"

if [ "$ADMIN_COUNT" -eq 0 ]; then
    echo "❌ No hay usuarios con rol ADMIN en la base de datos"
    echo "💡 Solución: Crea un usuario con rol ADMIN o ejecuta el seed nuevamente"
else
    echo "✅ Hay usuarios con rol ADMIN en la base de datos"
    echo "💡 Posibles causas por las que no ves el botón:"
    echo "   1. No estás autenticado con un usuario ADMIN"
    echo "   2. Hay un problema con la carga del perfil"
    echo "   3. Error en la consola del navegador"
fi

echo ""
echo "🧪 === PRUEBAS RECOMENDADAS ==="
echo "1. Inicia sesión con: admin@credicheck.com / admin123"
echo "2. Ve a la página de perfil: /profile"
echo "3. Deberías ver el botón 'Panel de Administración'"
echo "4. Si no aparece, revisa la consola del navegador"

echo ""
echo "2. Para probar con usuario ANALYST:"
echo "   Inicia sesión con: analista@credicheck.com / analyst123"
echo "   El botón NO debería aparecer"

echo ""
echo "✅ Verificación completada"