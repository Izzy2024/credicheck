import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';

describe('Bulk upload controller', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'bulktest@example.com',
        passwordHash: 'hashed',
        firstName: 'Bulk',
        lastName: 'Tester',
        role: 'ADMIN',
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('rejects template download without authentication', async () => {
    await request(app)
      .get('/api/v1/bulk-upload/template')
      .expect(401);
  });

  it('rejects CSV upload without authentication', async () => {
    const csvContent = 'fullName,idType,idNumber,debtAmount,debtDate,creditorName,debtStatus\\n';

    await request(app)
      .post('/api/v1/bulk-upload/csv')
      .send({ csvContent })
      .expect(401);
  });

  it('verifies bulk upload route exists', async () => {
    // Just verify the route exists - actual auth testing would require full JWT setup with Redis
    const response = await request(app)
      .post('/api/v1/bulk-upload/csv')
      .send({ csvContent: 'test' });
    
    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });
});
