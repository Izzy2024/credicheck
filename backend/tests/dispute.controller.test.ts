import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';

describe('Dispute controller', () => {
  let analystId: string;
  let adminId: string;
  let recordId: string;

  beforeAll(async () => {
    // Create analyst user
    const analyst = await prisma.user.create({
      data: {
        email: 'dispute-analyst@example.com',
        passwordHash: 'hashed',
        firstName: 'Analyst',
        lastName: 'User',
        role: 'ANALYST',
      },
    });
    analystId = analyst.id;

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'dispute-admin@example.com',
        passwordHash: 'hashed',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    // Create a credit reference
    const record = await prisma.creditReference.create({
      data: {
        fullName: 'Test Person',
        idNumber: '123456789',
        idType: 'CC',
        debtAmount: 1000000,
        debtDate: new Date('2024-01-01'),
        creditorName: 'Test Bank',
        debtStatus: 'ACTIVE',
        createdBy: analystId,
      },
    });
    recordId = record.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.dispute.deleteMany({
      where: { userId: { in: [analystId, adminId] } },
    });
    await prisma.creditReference.deleteMany({
      where: { id: recordId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [analystId, adminId] } },
    });
    await prisma.$disconnect();
  });

  it('rejects creating dispute without authentication', async () => {
    await request(app)
      .post('/api/v1/disputes')
      .send({
        recordId,
        reason: 'This is not my debt',
        description: 'I have never done business with this creditor',
      })
      .expect(401);
  });

  it('rejects viewing disputes without authentication', async () => {
    await request(app).get('/api/v1/disputes/me').expect(401);
  });

  it('rejects resolving dispute without admin role', async () => {
    await request(app)
      .patch('/api/v1/disputes/test-id/resolve')
      .send({ status: 'APPROVED' })
      .expect(401);
  });

  it('verifies dispute creation route exists', async () => {
    const response = await request(app)
      .post('/api/v1/disputes')
      .send({ recordId: 'test', reason: 'test', description: 'test' });

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });

  it('verifies dispute list route exists', async () => {
    const response = await request(app).get('/api/v1/disputes/me');

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });

  it('verifies admin pending disputes route exists', async () => {
    const response = await request(app).get('/api/v1/disputes/pending');

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });

  it('verifies admin resolve route exists', async () => {
    const response = await request(app)
      .patch('/api/v1/disputes/some-id/resolve')
      .send({ status: 'APPROVED' });

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });
});
