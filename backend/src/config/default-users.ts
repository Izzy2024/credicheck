import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export type DefaultUserSeed = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ANALYST';
};

export const defaultSeedUsers: DefaultUserSeed[] = [
  {
    email: 'admin@credicheck.com',
    password: 'admin123',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'ADMIN',
  },
  {
    email: 'analista@credicheck.com',
    password: 'analyst123',
    firstName: 'Ana',
    lastName: 'Rodríguez',
    role: 'ANALYST',
  },
  {
    email: 'irios@gmail.com',
    password: 'admin123',
    firstName: 'Irios',
    lastName: 'Admin',
    role: 'ADMIN',
  },
];

export async function seedDefaultUsers(prisma: PrismaClient) {
  for (const user of defaultSeedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
      },
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  }
}
