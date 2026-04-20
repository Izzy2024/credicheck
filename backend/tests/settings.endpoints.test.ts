import {
  prisma,
  request,
  app,
  createAdminAndGetToken,
  createAnalystAndGetToken,
  cleanupUsers,
} from './helpers/test-data';

const BASE = '/api/v1/settings';

describe('Settings Controller Endpoints', () => {
  let adminToken: string;
  let analystToken: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const adminData = await createAdminAndGetToken({
      firstName: 'SettingsAdmin',
    });
    adminToken = adminData.token;
    createdEmails.push(adminData.admin.email);

    const analystData = await createAnalystAndGetToken({
      firstName: 'SettingsAnalyst',
    });
    analystToken = analystData.token;
    createdEmails.push(analystData.analyst.email);
  });

  afterAll(async () => {
    await prisma.appConfig.deleteMany({
      where: { key: { startsWith: 'test_' } },
    });
    await cleanupUsers(createdEmails);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/settings', () => {
    it('should return settings object for admin', async () => {
      await prisma.appConfig.createMany({
        data: [
          { key: 'test_get_key1', value: 'val1' },
          { key: 'test_get_key2', value: 'val2' },
        ],
      });

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data).toBe('object');
      expect(res.body.data['test_get_key1']).toBe('val1');
      expect(res.body.data['test_get_key2']).toBe('val2');
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get(BASE).expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/settings', () => {
    it('should create new settings', async () => {
      const res = await request(app)
        .put(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          configs: [
            { key: 'test_new_key1', value: 'new_val1' },
            { key: 'test_new_key2', value: 'new_val2' },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data['test_new_key1']).toBe('new_val1');
      expect(res.body.data['test_new_key2']).toBe('new_val2');

      const db = await prisma.appConfig.findUnique({
        where: { key: 'test_new_key1' },
      });
      expect(db).not.toBeNull();
      expect(db!.value).toBe('new_val1');
    });

    it('should upsert existing settings (update value)', async () => {
      await prisma.appConfig.create({
        data: {
          key: 'test_upsert_key',
          value: 'original',
        },
      });

      const res = await request(app)
        .put(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          configs: [{ key: 'test_upsert_key', value: 'updated' }],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data['test_upsert_key']).toBe('updated');

      const db = await prisma.appConfig.findUnique({
        where: { key: 'test_upsert_key' },
      });
      expect(db!.value).toBe('updated');
    });

    it('should validate configs array is required', async () => {
      const res = await request(app)
        .put(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .put(BASE)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          configs: [{ key: 'test_forbidden', value: 'nope' }],
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put(BASE)
        .send({
          configs: [{ key: 'test_noauth', value: 'nope' }],
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
