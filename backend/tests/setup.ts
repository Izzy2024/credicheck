// Configuración global para tests
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno de test
dotenv.config({ path: '.env.test' });

const workerId = process.env['JEST_WORKER_ID'] || '1';
const testDbFile = `test-${workerId}.db`;
const testDbPath = path.join(__dirname, '..', testDbFile);

// Remove existing test database and stale journal/wal files
const staleDbArtifacts = [
  testDbPath,
  `${testDbPath}-journal`,
  `${testDbPath}-shm`,
  `${testDbPath}-wal`,
];

for (const artifactPath of staleDbArtifacts) {
  if (fs.existsSync(artifactPath)) {
    fs.unlinkSync(artifactPath);
  }
}

process.env['NODE_ENV'] ??= 'test';
process.env['DATABASE_URL'] = `file:./${testDbFile}`;
process.env['REDIS_URL'] ??= 'redis://localhost:6379';
process.env['JWT_ACCESS_SECRET'] ??= 'test-access-secret-test-access-secret';
process.env['JWT_REFRESH_SECRET'] ??= 'test-refresh-secret-test-refresh-secret';
process.env['ENCRYPTION_KEY'] ??= 'test-encryption-key-test-encryption-key';

// Apply migrations to test database
try {
  console.log('[Test Setup] Creating test database schema...');
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: `file:./${testDbFile}`,
    },
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('[Test Setup] Test database ready!');
} catch (error) {
  console.error('[Test Setup] Failed to create test database:', error);
  process.exit(1);
}

import { config } from '../src/config/env.config';

// Configurar timeout para tests
jest.setTimeout(30000);

// Mock de console para tests más limpios
const originalConsole = console;

beforeAll(() => {
  // Silenciar logs durante tests a menos que sea necesario
  if (config.server.nodeEnv === 'test') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restaurar console original
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Variables globales para tests disponibles si se necesitan
export { config as testConfig };
