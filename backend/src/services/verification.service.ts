import { VerificationType } from '@prisma/client';
import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export interface UpsertVerificationInput {
  type: 'CONFIRMED' | 'DISPUTED';
  confidence: number;
  comment?: string;
}

export interface VerificationSummary {
  recordId: string;
  totals: {
    confirmed: number;
    disputed: number;
    total: number;
    avgConfidence: number;
  };
  aggregateStatus: 'CONFIRMED' | 'DISPUTED' | 'MIXED' | 'UNVERIFIED';
  verifications: Array<{
    id: string;
    type: VerificationType;
    confidence: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export async function upsertVerification(
  recordId: string,
  userId: string,
  input: UpsertVerificationInput
) {
  const existingRecord = await prisma.creditReference.findFirst({
    where: { id: recordId, deletedAt: null },
    select: { id: true },
  });

  if (!existingRecord) {
    throw new Error('RECORD_NOT_FOUND');
  }

  const verification = await prisma.recordVerification.upsert({
    where: {
      recordId_userId: { recordId, userId },
    },
    update: {
      type: input.type,
      confidence: input.confidence,
      comment: input.comment ?? null,
    },
    create: {
      recordId,
      userId,
      type: input.type,
      confidence: input.confidence,
      comment: input.comment ?? null,
    },
  });

  logger.info('Record verification upserted', {
    context: 'verification_service',
    recordId,
    userId,
    type: input.type,
    confidence: input.confidence,
  });

  return verification;
}

export async function deleteVerification(
  recordId: string,
  userId: string
): Promise<number> {
  const result = await prisma.recordVerification.deleteMany({
    where: {
      recordId,
      userId,
    },
  });

  logger.info('Record verification deleted', {
    context: 'verification_service',
    recordId,
    userId,
    deletedCount: result.count,
  });

  return result.count;
}

export async function getVerificationSummary(
  recordId: string
): Promise<VerificationSummary> {
  const existingRecord = await prisma.creditReference.findFirst({
    where: { id: recordId, deletedAt: null },
    select: { id: true },
  });

  if (!existingRecord) {
    throw new Error('RECORD_NOT_FOUND');
  }

  const verifications = await prisma.recordVerification.findMany({
    where: { recordId },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const confirmed = verifications.filter(v => v.type === 'CONFIRMED').length;
  const disputed = verifications.filter(v => v.type === 'DISPUTED').length;
  const total = verifications.length;
  const avgConfidence =
    total > 0
      ? verifications.reduce((sum, v) => sum + v.confidence, 0) / total
      : 0;

  let aggregateStatus: VerificationSummary['aggregateStatus'] = 'UNVERIFIED';
  if (total > 0) {
    if (confirmed > disputed) {
      aggregateStatus = 'CONFIRMED';
    } else if (disputed > confirmed) {
      aggregateStatus = 'DISPUTED';
    } else {
      aggregateStatus = 'MIXED';
    }
  }

  return {
    recordId,
    totals: {
      confirmed,
      disputed,
      total,
      avgConfidence: Number(avgConfidence.toFixed(2)),
    },
    aggregateStatus,
    verifications: verifications.map(v => ({
      id: v.id,
      type: v.type,
      confidence: v.confidence,
      comment: v.comment,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      user: {
        id: v.user.id,
        firstName: v.user.firstName,
        lastName: v.user.lastName,
      },
    })),
  };
}
