// Script de diagnóstico simple para verificar usuarios y roles
// Este script verifica directamente la base de datos usando consultas SQL

const Database = require('better-sqlite3');

// Función para leer la base de datos directamente
function checkUsers() {
  console.log("🔍 === VERIFICACIÓN DE USUARIOS Y ROLES ===\n");

  try {
    // Conectar a la base de datos
    const db = new Database('./backend/prisma/dev.db');

    // Consulta directa para obtener usuarios
    const users = db.prepare('SELECT * FROM users').all();

    console.log(`📊 Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      console.log("❌ No hay usuarios en la base de datos");
      return;
    }

    // Mostrar información de cada usuario
    console.log("\n👥 Información de usuarios:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.is_active ? 'Activo' : 'Inactivo'}`);
      console.log("");
    });

    // Verificar usuarios con rol ADMIN
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    console.log(`👑 Usuarios con rol ADMIN: ${adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log("✅ Usuarios administradores encontrados:");
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
      });
    }

    // Verificar usuarios con rol ANALYST
    const analystUsers = users.filter(user => user.role === 'ANALYST');
    console.log(`\n👨‍💼 Usuarios con rol ANALYST: ${analystUsers.length}`);

    if (analystUsers.length > 0) {
      console.log("✅ Usuarios analistas encontrados:");
      analystUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
      });
    }

    // Análisis del problema
    console.log("\n🎯 === ANÁLISIS DEL PROBLEMA ===");
    console.log("📝 El botón de administración aparece cuando: profile.role === 'ADMIN'");

    if (adminUsers.length === 0) {
      console.log("❌ No hay usuarios con rol ADMIN en la base de datos");
      console.log("💡 Solución: Crea un usuario con rol ADMIN o ejecuta el seed nuevamente");
    } else {
      console.log("✅ Hay usuarios con rol ADMIN en la base de datos");
      console.log("💡 Posibles causas por las que no ves el botón:");
      console.log("   1. No estás autenticado con un usuario ADMIN");
      console.log("   2. Hay un problema con la carga del perfil");
      console.log("   3. Error en la consola del navegador");
    }

    // Recomendaciones de prueba
    console.log("\n🧪 === PRUEBAS RECOMENDADAS ===");
    console.log("1. Inicia sesión con: admin@credicheck.com / admin123");
    console.log("2. Ve a la página de perfil: /profile");
    console.log("3. Deberías ver el botón 'Panel de Administración'");
    console.log("4. Si no aparece, revisa la consola del navegador");

    console.log("\n2. Para probar con usuario ANALYST:");
    console.log("   Inicia sesión con: analista@credicheck.com / analyst123");
    console.log("   El botón NO debería aparecer");

    db.close();

  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
    console.log("💡 Asegúrate de que la base de datos existe en: backend/prisma/dev.db");
  }
}

// Ejecutar verificación
checkUsers();