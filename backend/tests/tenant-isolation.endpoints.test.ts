import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database.config';
import { PasswordUtil } from '../src/utils/password.util';

describe('Tenant isolation - critical endpoints', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;
  let tokenAAfterTenantSwitch: string;

  let recordAId: string;
  let recordBId: string;
  const recordAIdNumber = 'TI-A-10001';
  const recordBIdNumber = 'TI-B-20001';

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    return res.body.data.accessToken as string;
  };

  beforeAll(async () => {
    const password = 'Password123!';
    const passwordHash = await PasswordUtil.hashPassword(password);
    const ts = Date.now();

    const userA = await prisma.user.create({
      data: {
        email: `tenant-a-${ts}@example.com`,
        passwordHash,
        firstName: 'Tenant',
        lastName: 'A',
        role: 'ANALYST',
        tenantId: tenantA,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `tenant-b-${ts}@example.com`,
        passwordHash,
        firstName: 'Tenant',
        lastName: 'B',
        role: 'ANALYST',
        tenantId: tenantB,
      },
    });

    userAId = userA.id;
    userBId = userB.id;

    tokenA = await login(userA.email, password);
    tokenB = await login(userB.email, password);

    const recordA = await prisma.creditReference.create({
      data: {
        fullName: 'TEST_Tenant A Person',
        idNumber: recordAIdNumber,
        idType: 'CC',
        debtAmount: 1000000,
        debtDate: new Date('2024-01-01'),
        creditorName: 'Banco A',
        debtStatus: 'ACTIVE',
        publishState: 'PUBLISHED',
        tenantId: tenantA,
        createdBy: userAId,
      },
    });

    const recordB = await prisma.creditReference.create({
      data: {
        fullName: 'TEST_Tenant B Person',
        idNumber: recordBIdNumber,
        idType: 'CC',
        debtAmount: 2000000,
        debtDate: new Date('2024-01-02'),
        creditorName: 'Banco B',
        debtStatus: 'ACTIVE',
        publishState: 'PUBLISHED',
        tenantId: tenantB,
        createdBy: userBId,
      },
    });

    recordAId = recordA.id;
    recordBId = recordB.id;

    await prisma.user.update({
      where: { id: userAId },
      data: { tenantId: tenantB },
    });
    tokenAAfterTenantSwitch = await login(userA.email, password);

    await prisma.user.update({
      where: { id: userAId },
      data: { tenantId: tenantA },
    });
  });

  afterAll(async () => {
    await prisma.recordVerification.deleteMany({
      where: { recordId: { in: [recordAId, recordBId] } },
    });
    await prisma.dispute.deleteMany({
      where: { recordId: { in: [recordAId, recordBId] } },
    });
    await prisma.searchHistory.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.creditReference.deleteMany({
      where: { id: { in: [recordAId, recordBId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.$disconnect();
  });

  it('public search is tenant-scoped via tenantId query', async () => {
    const inTenantA = await request(app)
      .get('/api/v1/records/search')
      .query({ query: recordAIdNumber, type: 'id', tenantId: tenantA })
      .expect(200);

    expect(inTenantA.body.success).toBe(true);
    expect(inTenantA.body.count).toBeGreaterThan(0);

    const sameQueryInTenantB = await request(app)
      .get('/api/v1/records/search')
      .query({ query: recordAIdNumber, type: 'id', tenantId: tenantB })
      .expect(200);

    expect(sameQueryInTenantB.body.success).toBe(true);
    expect(sameQueryInTenantB.body.count).toBe(0);
  });

  it('authenticated search cannot be overridden by x-tenant-id header', async () => {
    const res = await request(app)
      .get('/api/v1/records/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', tenantB)
      .query({ query: recordBIdNumber, type: 'id' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
  });

  it('same user with different tenant tokens sees different tenant data', async () => {
    const withOldToken = await request(app)
      .get('/api/v1/records/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ query: recordBIdNumber, type: 'id' })
      .expect(200);

    const withNewTenantToken = await request(app)
      .get('/api/v1/records/search')
      .set('Authorization', `Bearer ${tokenAAfterTenantSwitch}`)
      .query({ query: recordBIdNumber, type: 'id' })
      .expect(200);

    expect(withOldToken.body.count).toBe(0);
    expect(withNewTenantToken.body.count).toBeGreaterThan(0);
  });

  it('dispute creation is tenant-scoped (cannot dispute other tenant record)', async () => {
    const res = await request(app)
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recordId: recordBId,
        reason: 'Registro no corresponde a mi identidad',
        description: 'Este registro no pertenece a mi historial crediticio y solicito revisión.',
      })
      .expect(404);

    expect(res.body.error).toMatch(/no encontrada/i);
  });

  it('verification summary is tenant-scoped (cannot read other tenant record)', async () => {
    const res = await request(app)
      .get(`/api/v1/verifications/${recordBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);

    const errorMessage =
      typeof res.body.error === 'string'
        ? res.body.error
        : res.body.error?.message || JSON.stringify(res.body.error || {});
    expect(errorMessage).toMatch(/no encontrada|not found/i);
  });

  it('search history remains isolated by tenant/user context', async () => {
    await request(app)
      .get('/api/v1/records/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ query: recordAIdNumber, type: 'id' })
      .expect(200);

    await request(app)
      .get('/api/v1/records/search')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ query: recordBIdNumber, type: 'id' })
      .expect(200);

    const historyA = await request(app)
      .get('/api/v1/records/history')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const historyB = await request(app)
      .get('/api/v1/records/history')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const entriesA = historyA.body.data || [];
    const entriesB = historyB.body.data || [];

    const termsA = entriesA.map((h: any) => h.searchTerm);
    const termsB = entriesB.map((h: any) => h.searchTerm);

    expect(termsA).toContain(recordAIdNumber);
    expect(termsB).toContain(recordBIdNumber);

    const positiveHitsAForTenantBRecord = entriesA.filter(
      (h: any) => h.searchTerm === recordBIdNumber && Number(h.resultsCount || 0) > 0
    );
    expect(positiveHitsAForTenantBRecord.length).toBe(0);

    expect(entriesA.every((h: any) => h.userId === userAId && h.tenantId === tenantA)).toBe(true);
    expect(entriesB.every((h: any) => h.userId === userBId && h.tenantId === tenantB)).toBe(true);
  });
});
