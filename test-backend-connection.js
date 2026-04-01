// Script para probar la conexión con el backend y verificar endpoints
// Este script verifica que el backend esté funcionando correctamente

const https = require('http');

async function testBackendConnection() {
  console.log("🔗 === PRUEBA DE CONEXIÓN CON EL BACKEND ===\n");

  const baseURL = 'http://localhost:3002';
  const endpoints = [
    { path: '/health', description: 'Health Check' },
    { path: '/api/v1/info', description: 'API Info' },
    { path: '/api/v1/auth/profile', description: 'Perfil de Usuario (requiere token)' },
  ];

  // 1. Probar endpoints públicos primero
  console.log("1️⃣  Probando endpoints públicos...\n");

  for (const endpoint of endpoints) {
    if (endpoint.path === '/health' || endpoint.path === '/api/v1/info') {
      await testEndpoint(baseURL + endpoint.path, endpoint.description, 'GET', null, false);
    }
  }

  // 2. Probar endpoint de perfil con token de prueba
  console.log("\n2️⃣  Probando endpoint de perfil con token...\n");

  // Obtener token primero (simular login)
  try {
    const loginResponse = await makeRequest(baseURL + '/api/v1/auth/login', 'POST', {
      email: 'admin@credicheck.com',
      password: 'admin123'
    });

    if (loginResponse.success && loginResponse.data && loginResponse.data.accessToken) {
      const token = loginResponse.data.accessToken;
      console.log("✅ Token obtenido exitosamente");

      // Probar endpoint de perfil con token
      await testEndpoint(
        baseURL + '/api/v1/auth/profile',
        'Perfil de Usuario',
        'GET',
        null,
        true,
        token
      );

      // Probar endpoint de records con token
      await testEndpoint(
        baseURL + '/api/v1/records',
        'Lista de Registros',
        'GET',
        null,
        true,
        token
      );

    } else {
      console.log("❌ No se pudo obtener token de acceso");
      console.log("Respuesta:", JSON.stringify(loginResponse, null, 2));
    }
  } catch (error) {
    console.error("❌ Error durante la prueba:", error.message);
  }

  console.log("\n📋 === INSTRUCCIONES PARA PROBAR MANUALMENTE ===");
  console.log("1. Abre el navegador y ve a: http://localhost:3001");
  console.log("2. Inicia sesión con: admin@credicheck.com / admin123");
  console.log("3. Ve a la página de perfil: http://localhost:3001/profile");
  console.log("4. Deberías ver el botón 'Panel de Administración'");
  console.log("5. Haz clic en el botón y ve al panel de administración");
  console.log("6. Los registros deberían cargarse correctamente");

  console.log("\n🔧 === VERIFICACIÓN DE SERVICIOS ===");
  console.log("Backend corriendo en: http://localhost:3002");
  console.log("Frontend corriendo en: http://localhost:3001");
  console.log("Base de datos: SQLite (backend/prisma/dev.db)");
}

function makeRequest(url, method, data = null, requireAuth = false, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CrediCheck-Test/1.0'
      }
    };

    if (requireAuth && token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            success: responseData.success || false,
            data: responseData.data || responseData,
            error: responseData.error || null
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            success: false,
            error: 'Error parsing response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(url, description, method, data, requireAuth, token = null) {
  try {
    console.log(`🔍 Probando: ${description}`);
    console.log(`   URL: ${method} ${url}`);

    const response = await makeRequest(url, method, data, requireAuth, token);

    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ ${response.status} - OK`);
      if (response.data) {
        if (response.data.count !== undefined) {
          console.log(`   📊 Registros encontrados: ${response.data.count}`);
        } else if (response.data.length !== undefined) {
          console.log(`   📊 Elementos: ${response.data.length}`);
        }
      }
    } else {
      console.log(`   ❌ ${response.status} - Error`);
      if (response.error) {
        console.log(`   💬 ${response.error.message || 'Error desconocido'}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
  }
  console.log("");
}

// Ejecutar pruebas
testBackendConnection();