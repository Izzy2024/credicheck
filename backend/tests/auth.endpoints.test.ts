import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';
import { PasswordUtil } from '../src/utils/password.util';

describe('Authentication Endpoints', () => {
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    const hashedPassword = await PasswordUtil.hashPassword('password123');
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ANALYST',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'updated@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');

      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.firstName).toBe('Test');
      expect(response.body.data.user.lastName).toBe('User');
      expect(response.body.data.user.role).toBe('ANALYST');

      // Guardar tokens para otras pruebas
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_LOGIN_FAILED');
      expect(response.body.error.message).toContain('Credenciales inválidas');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_LOGIN_FAILED');
      expect(response.body.error.message).toContain('Credenciales inválidas');
    });

    it('should return error for inactive user', async () => {
      // Desactivar usuario temporalmente
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cuenta deshabilitada');

      // Reactivar usuario
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: true },
      });
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: '123', // Contraseña muy corta
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should update lastLogin timestamp', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const userAfter = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(userAfter?.lastLogin).not.toEqual(userBefore?.lastLogin);
      expect(userAfter?.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      // Obtener token fresco para cada prueba
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Sesión cerrada exitosamente');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      // Obtener tokens frescos para cada prueba
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');

      // Los nuevos tokens deben ser diferentes
      expect(response.body.data.accessToken).not.toBe(accessToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should return error with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_REFRESH_FAILED');
    });

    it('should return error for inactive user', async () => {
      // Desactivar usuario
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cuenta deshabilitada');

      // Reactivar usuario
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: true },
      });
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    beforeEach(async () => {
      // Obtener token fresco para cada prueba
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('firstName');
      expect(response.body.data).toHaveProperty('lastName');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data).toHaveProperty('isActive');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.firstName).toBe('Test');
      expect(response.body.data.lastName).toBe('User');
      expect(response.body.data.role).toBe('ANALYST');
      expect(response.body.data.isActive).toBe(true);

      // No debe incluir información sensible
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    beforeEach(async () => {
      // Obtener token fresco para cada prueba
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.email).toBe('updated@example.com');

      // Verificar que se actualizó en la base de datos
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser?.firstName).toBe('Updated');
      expect(updatedUser?.lastName).toBe('Name');
      expect(updatedUser?.email).toBe('updated@example.com');
    });

    it('should update partial profile data', async () => {
      const updateData = {
        firstName: 'PartialUpdate',
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('PartialUpdate');
      expect(response.body.data.lastName).toBe('User'); // No debe cambiar
    });

    it('should return error for duplicate email', async () => {
      // Crear otro usuario con email diferente
      const hashedPassword = await PasswordUtil.hashPassword('password123');
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: hashedPassword,
          firstName: 'Other',
          lastName: 'User',
          role: 'ANALYST',
          isActive: true,
        },
      });

      const updateData = {
        email: 'other@example.com', // Email ya en uso
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('El email ya está en uso');

      // Limpiar usuario de prueba
      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({
          firstName: 'Test',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const updateData = {
        email: 'invalid-email-format',
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/validate-token', () => {
    beforeEach(async () => {
      // Obtener token fresco para cada prueba
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should validate valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_VALIDATION_FAILED');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should include proper response metadata', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('timestamp');
      expect(response.body.meta).toHaveProperty('requestId');

      expect(response.body.success).toBe(true);
      expect(typeof response.body.meta.timestamp).toBe('string');
      expect(typeof response.body.meta.requestId).toBe('string');
    });

    it('should include proper error format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');

      expect(response.body.success).toBe(false);
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.timestamp).toBe('string');
      expect(typeof response.body.error.requestId).toBe('string');
    });

    it('should include X-Request-ID header in response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(typeof response.headers['x-request-id']).toBe('string');
    });
  });
});