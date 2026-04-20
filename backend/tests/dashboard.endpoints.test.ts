import {
  prisma,
  request,
  app,
  createAnalystAndGetToken,
  cleanupAllTestData,
  cleanupUsers,
} from './helpers/test-data';

const BASE = '/api/v1/dashboard';

describe('Dashboard Controller Endpoints', () => {
  let token: string;
  let analystEmail: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const data = await createAnalystAndGetToken();
    token = data.token;
    analystEmail = data.analyst.email;
    createdEmails.push(analystEmail);
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await cleanupUsers(createdEmails);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/dashboard', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      expect(typeof res.body.data.queriesToday).toBe('number');
      expect(typeof res.body.data.activeReferences).toBe('number');
      expect(typeof res.body.data.activeUsers).toBe('number');
      expect(typeof res.body.data.matchRate).toBe('string');
    });

    it('should include chart data arrays', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      expect(Array.isArray(res.body.data.referencesByMonth)).toBe(true);
      expect(Array.isArray(res.body.data.referencesByStatus)).toBe(true);
      expect(Array.isArray(res.body.data.searchesByDay)).toBe(true);

      if (res.body.data.referencesByMonth.length > 0) {
        const entry = res.body.data.referencesByMonth[0];
        expect(entry).toHaveProperty('month');
        expect(entry).toHaveProperty('count');
        expect(typeof entry.count).toBe('number');
      }

      if (res.body.data.referencesByStatus.length > 0) {
        const entry = res.body.data.referencesByStatus[0];
        expect(entry).toHaveProperty('status');
        expect(entry).toHaveProperty('count');
        expect(typeof entry.count).toBe('number');
      }

      if (res.body.data.searchesByDay.length > 0) {
        const entry = res.body.data.searchesByDay[0];
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('count');
        expect(typeof entry.count).toBe('number');
      }
    });

    it('should include top searched and recent activity', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      expect(Array.isArray(res.body.data.topSearched)).toBe(true);
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);

      if (res.body.data.topSearched.length > 0) {
        const entry = res.body.data.topSearched[0];
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('count');
        expect(typeof entry.count).toBe('number');
      }

      if (res.body.data.recentActivity.length > 0) {
        const entry = res.body.data.recentActivity[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('action');
        expect(entry).toHaveProperty('userName');
        expect(entry).toHaveProperty('createdAt');
      }
    });

    it('should require authentication', async () => {
      const res = await request(app).get(BASE).expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should include response metadata', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('timestamp');
      expect(res.body.meta).toHaveProperty('requestId');
      expect(typeof res.body.meta.timestamp).toBe('string');
      expect(typeof res.body.meta.requestId).toBe('string');
    });

    it('should return empty arrays when no data exists', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.topSearched)).toBe(true);
      expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
      expect(Array.isArray(res.body.data.referencesByStatus)).toBe(true);
    });
  });
});
