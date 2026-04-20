import crypto from 'crypto';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database.config';
import { PasswordUtil } from '../../src/utils/password.util';

export { prisma, app, request };

export async function createTestUser(overrides: Record<string, any> = {}) {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 8);
  const defaults = {
    id: crypto.randomUUID(),
    email: `test-${ts}-${rnd}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'ANALYST',
    isActive: true,
    password: 'Password123!',
  };

  const data = { ...defaults, ...overrides };
  const { password, ...rest } = data;
  const passwordHash = await PasswordUtil.hashPassword(password);

  const user = await prisma.user.create({
    data: {
      ...rest,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ...user, _plainPassword: password } as typeof user & {
    _plainPassword: string;
  };
}

export async function loginAs(user: {
  email: string;
  _plainPassword?: string;
}) {
  const password = user._plainPassword || 'Password123!';
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: user.email, password });
  if (!res.body.success) {
    throw new Error(
      `Login failed for ${user.email}: ${JSON.stringify(res.body.error)}`
    );
  }
  return res.body.data.accessToken as string;
}

export async function createAdminUser(overrides: Record<string, any> = {}) {
  return createTestUser({ ...overrides, role: 'ADMIN' });
}

export async function createAdminAndGetToken(
  overrides: Record<string, any> = {}
) {
  const admin = await createAdminUser(overrides);
  const token = await loginAs(admin);
  return { admin, token };
}

export async function createAnalystAndGetToken(
  overrides: Record<string, any> = {}
) {
  const analyst = await createTestUser({ ...overrides, role: 'ANALYST' });
  const token = await loginAs(analyst);
  return { analyst, token };
}

export async function createTestCreditReference(
  overrides: Record<string, any> = {}
) {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 8);
  const data: Record<string, any> = {
    fullName: 'TEST_Juan Perez',
    idNumber: `ID-${ts}-${rnd}`,
    idType: 'CC',
    debtAmount: 1000000,
    debtDate: new Date('2024-01-15'),
    creditorName: 'Banco Test',
    debtStatus: 'ACTIVE',
    ...overrides,
  };

  return prisma.creditReference.create({
    data: {
      fullName: data['fullName'],
      idNumber: data['idNumber'],
      idType: data['idType'],
      birthDate: data['birthDate'] ?? null,
      phone: data['phone'] ?? null,
      email: data['email'] ?? null,
      address: data['address'] ?? null,
      city: data['city'] ?? null,
      department: data['department'] ?? null,
      debtAmount: data['debtAmount'],
      debtDate: data['debtDate'],
      creditorName: data['creditorName'],
      debtStatus: data['debtStatus'],
      notes: data['notes'] ?? null,
      createdBy: data['createdBy'],
    },
  });
}

export async function cleanupUsers(emails: string[]) {
  if (emails.length === 0) return;
  await prisma.recordVerification.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.watchlistItem.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.auditLog.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.tokenBlacklist.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.searchHistory.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  const refs = await prisma.creditReference.findMany({
    where: { creator: { email: { in: emails } } },
    select: { id: true },
  });
  if (refs.length > 0) {
    await prisma.recordVerification.deleteMany({
      where: { recordId: { in: refs.map(r => r.id) } },
    });
    await prisma.creditReference.deleteMany({
      where: { id: { in: refs.map(r => r.id) } },
    });
  }
  await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });
}

export async function cleanupAllTestData() {
  await prisma.recordVerification.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.watchlistItem.deleteMany({});
  await prisma.searchHistory.deleteMany({
    where: { user: { email: { contains: 'test-' } } },
  });
  await prisma.auditLog.deleteMany({
    where: { user: { email: { contains: 'test-' } } },
  });
  await prisma.tokenBlacklist.deleteMany({
    where: { user: { email: { contains: 'test-' } } },
  });
  await prisma.creditReference.deleteMany({
    where: { fullName: { startsWith: 'TEST_' } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: 'test-' } },
  });
  await prisma.appConfig.deleteMany({
    where: { key: { startsWith: 'test_' } },
  });
}
