import {
  prisma,
  request,
  app,
  createAdminAndGetToken,
  createAnalystAndGetToken,
  cleanupAllTestData,
  cleanupUsers,
} from './helpers/test-data';

const BASE = '/api/v1/audit';

describe('Audit Controller Endpoints', () => {
  let adminToken: string;
  let adminId: string;
  let adminEmail: string;
  let analystToken: string;
  let analystEmail: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const adminData = await createAdminAndGetToken();
    adminToken = adminData.token;
    adminId = adminData.admin.id;
    adminEmail = adminData.admin.email;
    createdEmails.push(adminEmail);

    const analystData = await createAnalystAndGetToken();
    analystToken = analystData.token;
    analystEmail = analystData.analyst.email;
    createdEmails.push(analystEmail);
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await cleanupUsers(createdEmails);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/audit', () => {
    it('should return paginated audit logs as admin', async () => {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'VIEW',
          resource: 'records',
          resourceId: 'test-resource-1',
          details: '{"method":"GET"}',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(20);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      await prisma.auditLog.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          userId: adminId,
          action: 'PAGE_TEST',
          resource: 'records',
          resourceId: `page-resource-${i}`,
          details: `{"index":${i}}`,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })),
      });

      const res = await request(app)
        .get(`${BASE}?page=1&limit=3`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(3);

      const res2 = await request(app)
        .get(`${BASE}?page=2&limit=3&action=PAGE_TEST`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res2.body.success).toBe(true);
      expect(res2.body.meta.page).toBe(2);
      expect(res2.body.meta.limit).toBe(3);
    });

    it('should support action filter', async () => {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'FILTER_ACTION',
          resource: 'records',
          resourceId: 'filter-resource',
          details: '{"filtered":true}',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      const res = await request(app)
        .get(`${BASE}?action=FILTER_ACTION`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((log: any) => {
        expect(log.action).toBe('FILTER_ACTION');
      });
    });

    it('should support date range filter', async () => {
      const pastDate = new Date('2024-01-01T00:00:00.000Z');
      const futureDate = new Date('2030-12-31T23:59:59.000Z');

      const res = await request(app)
        .get(
          `${BASE}?fromDate=${pastDate.toISOString()}&toDate=${futureDate.toISOString()}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('should return empty array when no logs', async () => {
      await prisma.auditLog.deleteMany({
        where: { action: 'NONEXISTENT_ACTION_XYZ' },
      });

      const res = await request(app)
        .get(`${BASE}?action=NONEXISTENT_ACTION_XYZ`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app).get(BASE).expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
