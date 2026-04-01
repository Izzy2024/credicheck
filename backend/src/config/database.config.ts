import { PrismaClient, Prisma } from '@prisma/client';
import { config } from './env.config';

// Configuración del cliente Prisma
const prismaConfig: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.server.isDevelopment 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
};

// Crear instancia del cliente Prisma
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// En desarrollo, usar una instancia global para evitar múltiples conexiones
if (config.server.isDevelopment) {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.__prisma;
} else {
  prisma = new PrismaClient(prismaConfig);
}

// Función para conectar a la base de datos
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a base de datos establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    throw error;
  }
};

// Función para desconectar de la base de datos
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconexión de base de datos exitosa');
  } catch (error) {
    console.error('❌ Error al desconectar de la base de datos:', error);
    throw error;
  }
};

// Función para verificar el estado de la conexión
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de conexión a base de datos:', error);
    return false;
  }
};

// Función para ejecutar migraciones en desarrollo
export const runMigrations = async (): Promise<void> => {
  if (config.server.isDevelopment) {
    try {
      // En desarrollo, Prisma maneja las migraciones automáticamente
      console.log('🔄 Verificando estado de migraciones...');
    } catch (error) {
      console.error('❌ Error al ejecutar migraciones:', error);
      throw error;
    }
  }
};

// Función para limpiar la base de datos (solo para testing)
export const cleanDatabase = async (): Promise<void> => {
  if (config.server.isTest) {
    try {
      // Limpiar tablas en orden inverso para evitar problemas de FK
      await prisma.searchHistory.deleteMany();
      await prisma.creditReference.deleteMany();
      await prisma.user.deleteMany();
      console.log('🧹 Base de datos de testing limpiada');
    } catch (error) {
      console.error('❌ Error al limpiar base de datos de testing:', error);
      throw error;
    }
  } else {
    throw new Error('cleanDatabase solo puede ejecutarse en entorno de testing');
  }
};

// Función para crear datos de prueba (solo para desarrollo)
export const seedDatabase = async (): Promise<void> => {
  if (config.server.isDevelopment) {
    try {
      // Verificar si ya existen datos
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        console.log('📊 Base de datos ya contiene datos, omitiendo seed');
        return;
      }

      // Crear usuario administrador por defecto
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@credicheck.com',
          passwordHash: '$2b$10$example.hash.for.development.only', // Cambiar por hash real
          firstName: 'Administrador',
          lastName: 'Sistema',
          role: 'ADMIN',
        },
      });

      // Crear usuario analista por defecto
      const analystUser = await prisma.user.create({
        data: {
          email: 'analista@credicheck.com',
          passwordHash: '$2b$10$example.hash.for.development.only', // Cambiar por hash real
          firstName: 'Analista',
          lastName: 'Crédito',
          role: 'ANALYST',
        },
      });

      console.log('🌱 Datos de desarrollo creados exitosamente');
      console.log(`👤 Admin: ${adminUser.email}`);
      console.log(`👤 Analista: ${analystUser.email}`);
    } catch (error) {
      console.error('❌ Error al crear datos de desarrollo:', error);
      throw error;
    }
  }
};

// Exportar cliente Prisma
export { prisma };
export default prisma;