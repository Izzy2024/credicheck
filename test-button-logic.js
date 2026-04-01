// Script para probar la lógica del botón de administración
// Este script simula diferentes escenarios de usuario

console.log("🧪 === PRUEBA DE LÓGICA DEL BOTÓN DE ADMINISTRACIÓN ===\n");

// Simular diferentes escenarios de usuario
const testScenarios = [
  {
    name: "Usuario con rol ADMIN",
    profile: {
      id: "1",
      email: "admin@credicheck.com",
      firstName: "Administrador",
      lastName: "Sistema",
      role: "ADMIN",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  },
  {
    name: "Usuario con rol ANALYST",
    profile: {
      id: "2",
      email: "analista@credicheck.com",
      firstName: "Ana",
      lastName: "Rodríguez",
      role: "ANALYST",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  },
  {
    name: "Usuario con rol analyst (minúsculas)",
    profile: {
      id: "3",
      email: "irios@gmail.com",
      firstName: "Isaac",
      lastName: "Rios",
      role: "analyst",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  },
  {
    name: "Usuario sin rol definido",
    profile: {
      id: "4",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  }
];

// Función que simula la lógica del botón en el frontend
function shouldShowAdminButton(profile) {
  return profile && profile.role === 'ADMIN';
}

// Probar cada escenario
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   Rol: ${scenario.profile.role}`);
  console.log(`   Estado activo: ${scenario.profile.isActive}`);
  console.log(`   ¿Debe mostrar botón?: ${shouldShowAdminButton(scenario.profile) ? '✅ SÍ' : '❌ NO'}`);

  if (shouldShowAdminButton(scenario.profile)) {
    console.log(`   🎯 El botón "Panel de Administración" debería ser visible`);
  } else {
    console.log(`   🚫 El botón "Panel de Administración" NO debería ser visible`);
  }
  console.log("");
});

console.log("🔍 === ANÁLISIS DETALLADO ===");
console.log("📝 Lógica del botón en app/profile/page.tsx:");
console.log("   Condición: profile.role === 'ADMIN'");
console.log("   Ubicación: línea 277 en el archivo");
console.log("");

console.log("⚠️  === POSIBLE PROBLEMA DETECTADO ===");
console.log("En la base de datos encontramos:");
console.log("   - admin@credicheck.com con role: 'ADMIN' ✅");
console.log("   - analista@credicheck.com con role: 'ANALYST' ✅");
console.log("   - irios@gmail.com con role: 'analyst' ✅");
console.log("");
console.log("💡 Si estás viendo este mensaje, el problema podría ser:");
console.log("   1. No estás autenticado con el usuario correcto");
console.log("   2. Hay un problema con la carga del perfil");
console.log("   3. Error en la consola del navegador");
console.log("");

console.log("🛠️  === SOLUCIONES ===");
console.log("1. Verifica que estás autenticado con: admin@credicheck.com");
console.log("2. Abre las herramientas de desarrollador (F12)");
console.log("3. Ve a la pestaña 'Console' y busca errores");
console.log("4. Ve a la pestaña 'Network' y verifica la llamada a /api/v1/auth/profile");
console.log("5. Asegúrate de que la respuesta contenga: \"role\": \"ADMIN\"");
console.log("");

console.log("🧪 === PRUEBA MANUAL ===");
console.log("Para verificar si el problema es del usuario actual:");
console.log("1. Abre el navegador y ve a /profile");
console.log("2. Abre las herramientas de desarrollador (F12)");
console.log("3. Ve a Console y escribe:");
console.log("   console.log(JSON.parse(localStorage.getItem('userProfile'), null, 2))");
console.log("4. Verifica que el rol sea 'ADMIN'");
console.log("");

console.log("✅ Prueba de lógica completada");