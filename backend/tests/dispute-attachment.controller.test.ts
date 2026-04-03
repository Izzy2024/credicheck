import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';

describe('Dispute attachment controller', () => {
  let userId: string;
  let disputeId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'attachment-test@example.com',
        passwordHash: 'hashed',
        firstName: 'Attachment',
        lastName: 'Tester',
        role: 'ANALYST',
      },
    });
    userId = user.id;

    // Create a credit reference
    const record = await prisma.creditReference.create({
      data: {
        fullName: 'Test Person',
        idNumber: '987654321',
        idType: 'CC',
        debtAmount: 500000,
        debtDate: new Date('2024-02-01'),
        creditorName: 'Test Creditor',
        debtStatus: 'ACTIVE',
        createdBy: userId,
      },
    });

    // Create a dispute
    const dispute = await prisma.dispute.create({
      data: {
        recordId: record.id,
        userId,
        reason: 'Test dispute',
        description: 'This is a test dispute for attachment testing',
      },
    });
    disputeId = dispute.id;
  });

  afterAll(async () => {
    await prisma.disputeAttachment.deleteMany({
      where: { disputeId },
    });
    await prisma.dispute.deleteMany({
      where: { id: disputeId },
    });
    await prisma.creditReference.deleteMany({
      where: { createdBy: userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  it('rejects upload without authentication', async () => {
    await request(app)
      .post(`/api/v1/disputes/${disputeId}/attachments`)
      .expect(401);
  });

  it('rejects get attachments without authentication', async () => {
    await request(app)
      .get(`/api/v1/disputes/${disputeId}/attachments`)
      .expect(401);
  });

  it('verifies attachment upload route exists', async () => {
    const response = await request(app).post(
      `/api/v1/disputes/${disputeId}/attachments`
    );

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });

  it('verifies attachment list route exists', async () => {
    const response = await request(app).get(
      `/api/v1/disputes/${disputeId}/attachments`
    );

    // Should get 401 (no auth) not 404 (route not found)
    expect(response.status).toBe(401);
  });
});
