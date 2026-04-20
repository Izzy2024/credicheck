import {
  prisma,
  request,
  app,
  createAdminAndGetToken,
  createAnalystAndGetToken,
  createTestCreditReference,
  cleanupAllTestData,
  cleanupUsers,
} from './helpers/test-data';

const BASE = '/api/v1/records';

describe('Export Controller Endpoints', () => {
  let adminToken: string;
  let adminId: string;
  let analystToken: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const adminData = await createAdminAndGetToken();
    adminToken = adminData.token;
    adminId = adminData.admin.id;
    createdEmails.push(adminData.admin.email);

    const analystData = await createAnalystAndGetToken();
    analystToken = analystData.token;
    createdEmails.push(analystData.analyst.email);

    await createTestCreditReference({
      fullName: 'TEST_Export Record',
      idNumber: 'EXPORT001',
      createdBy: adminId,
    });
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await cleanupUsers(createdEmails);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/records/export', () => {
    it('should export CSV as admin with correct headers', async () => {
      const res = await request(app)
        .get(`${BASE}/export?format=csv`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/\.csv/);

      expect(res.text.charCodeAt(0)).toBe(0xfeff);
    });

    it('should export Excel as admin with correct headers', async () => {
      const res = await request(app)
        .get(`${BASE}/export?format=excel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(
        /application\/vnd\.openxmlformats/
      );
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/\.xlsx/);
    });

    it('should default to CSV when no format specified', async () => {
      const res = await request(app)
        .get(`${BASE}/export`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/\.csv/);
    });

    it('should reject non-admin for records export (403)', async () => {
      const res = await request(app)
        .get(`${BASE}/export`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated for records export (401)', async () => {
      const res = await request(app).get(`${BASE}/export`).expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/records/history/export', () => {
    beforeAll(async () => {
      await request(app)
        .get(`${BASE}/search?query=TEST_Export&type=name`)
        .set('Authorization', `Bearer ${analystToken}`);

      await request(app)
        .get(`${BASE}/search?query=TEST_Export&type=name`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should export history CSV as analyst (200)', async () => {
      const res = await request(app)
        .get(`${BASE}/history/export`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);

      expect(res.text.charCodeAt(0)).toBe(0xfeff);
    });

    it('should export history CSV as admin (200)', async () => {
      const res = await request(app)
        .get(`${BASE}/history/export`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
    });

    it('should reject unauthenticated for history export (401)', async () => {
      const res = await request(app).get(`${BASE}/history/export`).expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
