import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';

describe('Public search endpoint', () => {
  let userId: string;
  let server: any;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'search-test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Search',
        lastName: 'Tester',
        role: 'ANALYST',
      },
    });

    userId = user.id;

    await prisma.creditReference.create({
      data: {
        fullName: 'Juan Pérez',
        idNumber: '12345678',
        idType: 'CC',
        debtAmount: 1000000,
        debtDate: new Date('2024-01-01'),
        creditorName: 'Banco Demo',
        debtStatus: 'ACTIVE',
        publishState: 'PUBLISHED',
        createdBy: user.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.creditReference.deleteMany({
      where: { createdBy: userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    
    // Disconnect from database
    await prisma.$disconnect();
    
    // Force close any open handles
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('allows searching without authentication', async () => {
    const response = await request(app)
      .get('/api/v1/records/search')
      .query({ query: '12345678', type: 'id' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });
});
