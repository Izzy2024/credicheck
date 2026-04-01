import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Verificar si los usuarios por defecto ya existen
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@credicheck.com' }
  });

  const analystExists = await prisma.user.findUnique({
    where: { email: 'analista@credicheck.com' }
  });

  let adminUser, analystUser;

  // Crear usuario admin si no existe
  if (!adminExists) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@credicheck.com',
        passwordHash: adminPasswordHash,
        firstName: 'Administrador',
        lastName: 'Sistema',
        role: 'ADMIN',
      },
    });
    console.log('👤 Usuario Admin creado');
  } else {
    adminUser = adminExists;
    console.log('👤 Usuario Admin ya existe');
  }

  // Crear usuario analista si no existe
  if (!analystExists) {
    const analystPasswordHash = await bcrypt.hash('analyst123', 10);
    analystUser = await prisma.user.create({
      data: {
        email: 'analista@credicheck.com',
        passwordHash: analystPasswordHash,
        firstName: 'Ana',
        lastName: 'Rodríguez',
        role: 'ANALYST',
      },
    });
    console.log('👤 Usuario Analista creado');
  } else {
    analystUser = analystExists;
    console.log('👤 Usuario Analista ya existe');
  }

  // Solo crear datos de ejemplo si es una base de datos nueva
  const userCount = await prisma.user.count();
  if (userCount <= 2) {
    console.log('📊 Creando datos de ejemplo para base de datos nueva...');

    // Crear algunos registros de ejemplo
    const creditReferences = await Promise.all([
      prisma.creditReference.create({
        data: {
          fullName: 'Juan Carlos Pérez García',
          idNumber: '12345678',
          idType: 'CC',
          birthDate: new Date('1985-03-15'),
          phone: '3001234567',
          email: 'juan.perez@email.com',
          address: 'Calle 123 #45-67',
          city: 'Bogotá',
          department: 'Cundinamarca',
          debtAmount: 2500000,
          debtDate: new Date('2023-06-15'),
          creditorName: 'Banco Nacional',
          debtStatus: 'ACTIVE',
          notes: 'Deuda por tarjeta de crédito vencida',
          createdBy: analystUser.id,
        },
      }),
      prisma.creditReference.create({
        data: {
          fullName: 'María Elena Gómez López',
          idNumber: '87654321',
          idType: 'CC',
          birthDate: new Date('1990-08-22'),
          phone: '3109876543',
          email: 'maria.gomez@email.com',
          address: 'Carrera 45 #12-34',
          city: 'Medellín',
          department: 'Antioquia',
          debtAmount: 1800000,
          debtDate: new Date('2023-09-10'),
          creditorName: 'Cooperativa de Crédito',
          debtStatus: 'ACTIVE',
          notes: 'Préstamo personal en mora',
          createdBy: analystUser.id,
        },
      }),
      prisma.creditReference.create({
        data: {
          fullName: 'Carlos Alberto Martínez Silva',
          idNumber: '11223344',
          idType: 'CC',
          birthDate: new Date('1978-12-05'),
          phone: '3201122334',
          email: 'carlos.martinez@email.com',
          address: 'Avenida 68 #89-12',
          city: 'Cali',
          department: 'Valle del Cauca',
          debtAmount: 5200000,
          debtDate: new Date('2023-04-20'),
          creditorName: 'Financiera del Valle',
          debtStatus: 'DISPUTED',
          notes: 'Cliente disputa el monto de la deuda',
          createdBy: analystUser.id,
        },
      }),
    ]);

    // Crear historial de búsquedas de ejemplo
    await Promise.all([
      prisma.searchHistory.create({
        data: {
          userId: analystUser.id,
          searchType: 'NAME',
          searchTerm: 'Juan Pérez',
          resultsCount: 1,
          executionTimeMs: 45,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }),
      prisma.searchHistory.create({
        data: {
          userId: analystUser.id,
          searchType: 'ID',
          searchTerm: '87654321',
          resultsCount: 1,
          executionTimeMs: 32,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }),
      prisma.searchHistory.create({
        data: {
          userId: analystUser.id,
          searchType: 'NAME',
          searchTerm: 'Pedro González',
          resultsCount: 0,
          executionTimeMs: 28,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }),
    ]);

    console.log(`📊 Referencias crediticias creadas: ${creditReferences.length}`);
    console.log('🔍 Historial de búsquedas de ejemplo creado');
  } else {
    console.log('⏭️  Saltando creación de datos de ejemplo - base de datos ya contiene datos de usuario');
  }

  console.log('✅ Seed completado exitosamente!');
  console.log(`👤 Usuario Admin: ${adminUser.email} (password: admin123)`);
  console.log(`👤 Usuario Analista: ${analystUser.email} (password: analyst123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });