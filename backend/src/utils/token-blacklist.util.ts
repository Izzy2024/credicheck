import { createHash } from 'crypto';
import { prisma } from '../config/database.config';

export class TokenBlacklistUtil {
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    const hash = this.hashToken(token);
    const entry = await prisma.tokenBlacklist.findUnique({
      where: { tokenHash: hash },
    });
    return !!entry;
  }

  static async addToBlacklist(
    token: string,
    userId: string,
    expiresAt: Date
  ): Promise<void> {
    const hash = this.hashToken(token);
    await prisma.tokenBlacklist.upsert({
      where: { tokenHash: hash },
      update: {},
      create: { tokenHash: hash, userId, expiresAt },
    });
  }

  static async cleanupExpired(): Promise<number> {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

if (process.env['NODE_ENV'] !== 'test') {
  setInterval(
    () => {
      TokenBlacklistUtil.cleanupExpired().catch(console.error);
    },
    60 * 60 * 1000
  );
}
