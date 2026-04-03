import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';

describe('Verification controller', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'verifytest@example.com',
        passwordHash: 'hashed',
        firstName: 'Verify',
        lastName: 'Tester',
        role: 'ANALYST',
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('rejects upsert verification without authentication', async () => {
    await request(app)
      .post('/api/v1/verifications/some-record-id')
      .send({ type: 'CONFIRMED', confidence: 5 })
      .expect(401);
  });

  it('rejects get verification summary without authentication', async () => {
    await request(app)
      .get('/api/v1/verifications/some-record-id/summary')
      .expect(401);
  });

  it('verifies verification routes exist', async () => {
    const response = await request(app)
      .post('/api/v1/verifications/test-id')
      .send({ type: 'CONFIRMED', confidence: 5 });
    
    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });
});
