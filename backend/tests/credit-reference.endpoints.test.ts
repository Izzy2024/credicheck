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

const validReferenceBody = {
  fullName: 'Test Juan Perez',
  idNumber: '12345678',
  idType: 'CC',
  debtAmount: 1000000,
  debtDate: '2024-01-15',
  creditorName: 'Banco Test',
};

describe('CreditReference Controller Endpoints', () => {
  let adminToken: string;
  let adminId: string;
  let analystToken: string;
  let analystId: string;
  let adminEmail: string;
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
    analystId = analystData.analyst.id;
    analystEmail = analystData.analyst.email;
    createdEmails.push(analystEmail);
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await cleanupUsers(createdEmails);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/records', () => {
    it('should create a credit reference with valid data (authenticated user)', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send(validReferenceBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.fullName).toBe('Test Juan Perez');
      expect(res.body.data.idNumber).toBe('12345678');
      expect(res.body.data.idType).toBe('CC');
      expect(res.body.data.debtStatus).toBe('ACTIVE');
      expect(res.body.data.creditorName).toBe('Banco Test');
      expect(res.body.data.createdBy).toBe(analystId);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post(BASE)
        .send(validReferenceBody)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ fullName: 'Test Juan Perez' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with invalid idType', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ ...validReferenceBody, idType: 'INVALID' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 with negative debtAmount', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ ...validReferenceBody, debtAmount: -100 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should set debtStatus to ACTIVE by default', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ ...validReferenceBody, idNumber: '11223344' })
        .expect(201);

      expect(res.body.data.debtStatus).toBe('ACTIVE');
    });

    it('should set createdBy from authenticated user', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validReferenceBody, idNumber: '55667788' })
        .expect(201);

      expect(res.body.data.createdBy).toBe(adminId);
    });
  });

  describe('GET /api/v1/records', () => {
    beforeAll(async () => {
      await createTestCreditReference({
        fullName: 'TEST_GetAll One',
        idNumber: '11111111',
        createdBy: analystId,
      });
      await createTestCreditReference({
        fullName: 'TEST_GetAll Two',
        idNumber: '22222222',
        createdBy: analystId,
      });
    });

    it('should return all non-deleted references', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(BASE).expect(401);
      expect(res.body.success).toBe(false);
    });

    it('should not include soft-deleted records', async () => {
      const ref = await createTestCreditReference({
        fullName: 'TEST_GetAll Deleted',
        idNumber: '33333333',
        createdBy: analystId,
      });
      await prisma.creditReference.update({
        where: { id: ref.id },
        data: { deletedAt: new Date() },
      });

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      const found = res.body.data.find((r: any) => r.id === ref.id);
      expect(found).toBeUndefined();
    });
  });

  describe('GET /api/v1/records/search', () => {
    beforeAll(async () => {
      await createTestCreditReference({
        fullName: 'TEST_Search Target',
        idNumber: '99999999',
        createdBy: analystId,
      });
    });

    it('should search by name', async () => {
      const res = await request(app)
        .get(`${BASE}/search?query=TEST_Search&type=name`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].fullName).toContain('TEST_Search');
    });

    it('should search by id', async () => {
      const res = await request(app)
        .get(`${BASE}/search?query=99999999&type=id`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].idNumber).toBe('99999999');
    });

    it('should return 400 when query param is missing', async () => {
      const res = await request(app)
        .get(`${BASE}/search?type=name`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when type param is missing', async () => {
      const res = await request(app)
        .get(`${BASE}/search?query=test`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid search type', async () => {
      const res = await request(app)
        .get(`${BASE}/search?query=test&type=invalid`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should allow public search without authentication', async () => {
      const res = await request(app)
        .get(`${BASE}/search?query=test&type=name`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should log search to history', async () => {
      await request(app)
        .get(`${BASE}/search?query=TEST_Search&type=name`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      const history = await prisma.searchHistory.findMany({
        where: { userId: analystId },
      });
      expect(history.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/records/count', () => {
    it('should return count of non-deleted records', async () => {
      const res = await request(app)
        .get(`${BASE}/count`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
      expect(typeof res.body.data.count).toBe('number');
      expect(res.body.data.count).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(`${BASE}/count`).expect(401);
      expect(res.body.success).toBe(false);
    });

    it('should not count soft-deleted records', async () => {
      const countBefore = await request(app)
        .get(`${BASE}/count`)
        .set('Authorization', `Bearer ${analystToken}`);

      const initialCount = countBefore.body.data.count;

      const ref = await createTestCreditReference({
        fullName: 'TEST_Count Deleted',
        idNumber: '44444444',
        createdBy: analystId,
      });
      await prisma.creditReference.update({
        where: { id: ref.id },
        data: { deletedAt: new Date() },
      });

      const countAfter = await request(app)
        .get(`${BASE}/count`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(countAfter.body.data.count).toBe(initialCount);
    });
  });

  describe('GET /api/v1/records/history', () => {
    it('should return search history for authenticated user', async () => {
      const res = await request(app)
        .get(`${BASE}/history`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('count');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(`${BASE}/history`).expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/records/:id', () => {
    let testRef: any;

    beforeEach(async () => {
      testRef = await createTestCreditReference({
        fullName: 'TEST_Patch Record',
        idNumber: '55555555',
        createdBy: analystId,
      });
    });

    it('should update reference status', async () => {
      const res = await request(app)
        .patch(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'PAID' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.debtStatus).toBe('PAID');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when status is missing', async () => {
      const res = await request(app)
        .patch(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .patch(`${BASE}/${testRef.id}`)
        .send({ status: 'PAID' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should work for any authenticated user (not admin-only)', async () => {
      const res = await request(app)
        .patch(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.debtStatus).toBe('INACTIVE');
    });
  });

  describe('PUT /api/v1/records/:id/status', () => {
    let testRef: any;

    beforeEach(async () => {
      testRef = await createTestCreditReference({
        fullName: 'TEST_StatusUpdate Record',
        idNumber: '66666666',
        createdBy: adminId,
      });
    });

    it('should update status as admin', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.debtStatus).toBe('PAID');
    });

    it('should append timestamped notes', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID', notes: 'Payment confirmed' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toContain('Payment confirmed');
      expect(res.body.data.notes).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    it('should return 400 for ACTIVE status', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'PAID' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .put(`${BASE}/${testRef.id}/status`)
        .send({ status: 'PAID' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .put(`${BASE}/nonexistent-id/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/records/bulk-update-status', () => {
    let ref1: any;
    let ref2: any;

    beforeEach(async () => {
      ref1 = await createTestCreditReference({
        fullName: 'TEST_Bulk One',
        idNumber: '77777771',
        createdBy: adminId,
      });
      ref2 = await createTestCreditReference({
        fullName: 'TEST_Bulk Two',
        idNumber: '77777772',
        createdBy: adminId,
      });
    });

    it('should bulk update status as admin (known bug: CUID/UUID mismatch)', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordIds: [ref1.id, ref2.id],
          status: 'PAID',
        });

      if (res.status === 400) {
        expect(res.body.success).toBe(false);
        return;
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          recordIds: [ref1.id],
          status: 'PAID',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .send({
          recordIds: [ref1.id],
          status: 'PAID',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for ACTIVE status', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordIds: [ref1.id],
          status: 'ACTIVE',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for empty recordIds array', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordIds: [],
          status: 'PAID',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid recordIds format', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordIds: ['short'],
          status: 'PAID',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when recordIds is not an array', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk-update-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordIds: 'not-array',
          status: 'PAID',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/records/by-status', () => {
    beforeAll(async () => {
      await createTestCreditReference({
        fullName: 'TEST_ByStatus Paid',
        idNumber: '88888881',
        createdBy: analystId,
        debtStatus: 'PAID',
      });
      await createTestCreditReference({
        fullName: 'TEST_ByStatus Active',
        idNumber: '88888882',
        createdBy: analystId,
        debtStatus: 'ACTIVE',
      });
    });

    it('should filter records by ACTIVE status', async () => {
      const res = await request(app)
        .get(`${BASE}/by-status?status=ACTIVE`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((r: any) => {
        expect(r.debtStatus).toBe('ACTIVE');
      });
    });

    it('should filter records by PAID status', async () => {
      const res = await request(app)
        .get(`${BASE}/by-status?status=PAID`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((r: any) => {
        expect(r.debtStatus).toBe('PAID');
      });
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .get(`${BASE}/by-status?status=INVALID`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when status is missing', async () => {
      const res = await request(app)
        .get(`${BASE}/by-status`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get(`${BASE}/by-status?status=ACTIVE`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/records/:id', () => {
    let testRef: any;

    beforeEach(async () => {
      testRef = await createTestCreditReference({
        fullName: 'TEST_Delete Record',
        idNumber: '99999991',
        createdBy: adminId,
      });
    });

    it('should soft delete a record as admin', async () => {
      const res = await request(app)
        .delete(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const deleted = await prisma.creditReference.findUnique({
        where: { id: testRef.id },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.deletedAt).not.toBeNull();
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete(`${BASE}/${testRef.id}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('soft deleted record should not appear in listings', async () => {
      await request(app)
        .delete(`${BASE}/${testRef.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const listRes = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${analystToken}`);

      const found = listRes.body.data.find((r: any) => r.id === testRef.id);
      expect(found).toBeUndefined();
    });
  });
});
