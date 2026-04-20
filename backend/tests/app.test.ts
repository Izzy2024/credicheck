import request from 'supertest';
import app from '../src/app';

// Mock de la función de verificación de base de datos
jest.mock('../src/config/database.config', () => ({
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));

describe('CrediCheck API - Tests Básicos', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'CrediCheck API funcionando correctamente');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('requestId');
    });

    it('should include request ID in response headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.body.data.requestId).toBe(response.headers['x-request-id']);
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'CrediCheck API');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('version', 'v1');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('endpoints');
      
      // Verificar que los endpoints estén definidos
      const endpoints = response.body.data.endpoints;
      expect(endpoints).toHaveProperty('health');
      expect(endpoints).toHaveProperty('auth');
      expect(endpoints).toHaveProperty('search');
      expect(endpoints).toHaveProperty('records');
      expect(endpoints).toHaveProperty('history');
      expect(endpoints).toHaveProperty('dashboard');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
      expect(response.body.error).toHaveProperty('message', 'Ruta no encontrada');
      expect(response.body.error).toHaveProperty('path', '/ruta-inexistente');
      expect(response.body.error).toHaveProperty('method', 'GET');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });

    it('should handle different HTTP methods', async () => {
      const response = await request(app)
        .post('/ruta-inexistente')
        .expect(404);

      expect(response.body.error).toHaveProperty('method', 'POST');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verificar headers de seguridad de Helmet
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', async () => {
      const response1 = await request(app).get('/health');
      const response2 = await request(app).get('/health');

      const requestId1 = response1.headers['x-request-id'];
      const requestId2 = response2.headers['x-request-id'];

      expect(requestId1).toBeDefined();
      expect(requestId2).toBeDefined();
      expect(requestId1).not.toBe(requestId2);
    });

    it('should use provided request ID', async () => {
      const customRequestId = 'test-request-id-123';
      
      const response = await request(app)
        .get('/health')
        .set('X-Request-ID', customRequestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(customRequestId);
      expect(response.body.data.requestId).toBe(customRequestId);
    });
  });
});