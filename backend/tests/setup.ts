// Configuración global para tests
import dotenv from 'dotenv';

// Cargar variables de entorno de test
dotenv.config({ path: '.env.test' });

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