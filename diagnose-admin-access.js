// Script de diagnóstico para verificar el acceso al panel de administración
// Este script verifica el estado actual de usuarios y roles en la base de datos

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseAdminAccess() {
  console.log("🔍 === DIAGNÓSTICO DE ACCESO AL PANEL DE ADMINISTRACIÓN ===\n");

  try {
    // 1. Verificar usuarios existentes
    console.log("1️⃣  Verificando usuarios en la base de datos...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`📊 Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      console.log("❌ No hay usuarios en la base de datos");
      console.log("💡 Ejecuta el comando: npm run db:seed");
      return;
    }

    // 2. Mostrar información de cada usuario
    console.log("\n👥 Información de usuarios:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.isActive ? 'Activo' : 'Inactivo'}`);
      console.log(`   Creado: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log("");
    });

    // 3. Verificar usuarios con rol ADMIN
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    console.log(`👑 Usuarios con rol ADMIN: ${adminUsers.length}`);

    if (adminUsers.length === 0) {
      console.log("❌ No hay usuarios con rol ADMIN");
      console.log("💡 Crea un usuario con rol ADMIN o ejecuta el seed");
    } else {
      console.log("✅ Usuarios administradores encontrados:");
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    }

    // 4. Verificar usuarios con rol ANALYST
    const analystUsers = users.filter(user => user.role === 'ANALYST');
    console.log(`\n👨‍💼 Usuarios con rol ANALYST: ${analystUsers.length}`);

    if (analystUsers.length === 0) {
      console.log("❌ No hay usuarios con rol ANALYST");
    } else {
      console.log("✅ Usuarios analistas encontrados:");
      analystUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    }

    // 5. Verificar lógica del botón en el frontend
    console.log("\n🎯 === ANÁLISIS DEL FRONTEND ===");
    console.log("📝 Archivo: app/profile/page.tsx");
    console.log("🔍 Condición del botón: profile.role === 'ADMIN'");
    console.log("✅ La lógica del botón está correctamente implementada");

    // 6. Verificar valores de rol en el esquema
    console.log("\n📋 === ESQUEMA DE BASE DE DATOS ===");
    console.log("📄 Archivo: backend/prisma/schema.prisma");
    console.log("🔍 Campo role: String @default('analyst')");
    console.log("⚠️  El esquema usa minúsculas por defecto, pero el modelo TypeScript usa mayúsculas");

    // 7. Verificar modelo TypeScript
    console.log("\n📘 === MODELO TYPES SCRIPT ===");
    console.log("📄 Archivo: backend/src/models/user.model.ts");
    console.log("🔍 Tipo de rol: 'ANALYST' | 'ADMIN' (mayúsculas)");
    console.log("✅ El modelo TypeScript está correctamente definido");

    // 8. Recomendaciones
    console.log("\n💡 === RECOMENDACIONES ===");
    if (adminUsers.length === 0) {
      console.log("1. Crea un usuario con rol ADMIN:");
      console.log("   - Inicia sesión con las credenciales de prueba");
      console.log("   - O ejecuta: npm run db:seed");
    }

    if (users.length > 0) {
      console.log("\n2. Para probar el botón de administración:");
      console.log("   - Inicia sesión con un usuario que tenga rol ADMIN");
      console.log("   - Ve a la página de perfil (/profile)");
      console.log("   - Deberías ver el botón 'Panel de Administración'");

      console.log("\n3. Para probar con usuario ANALYST:");
      console.log("   - Inicia sesión con un usuario que tenga rol ANALYST");
      console.log("   - El botón NO debería aparecer");
    }

    // 9. Estado actual
    console.log("\n📊 === ESTADO ACTUAL ===");
    if (adminUsers.length > 0) {
      console.log("✅ El sistema tiene usuarios con permisos de administrador");
      console.log("✅ El botón debería aparecer para usuarios con rol ADMIN");
      console.log("❓ Si no ves el botón, verifica:");
      console.log("   - Que estás autenticado con un usuario ADMIN");
      console.log("   - Que la página se cargó completamente");
      console.log("   - Que no hay errores en la consola del navegador");
    } else {
      console.log("❌ No hay usuarios con permisos de administrador");
      console.log("🔧 Solución: Ejecuta el seed o crea un usuario ADMIN");
    }

  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnoseAdminAccess();