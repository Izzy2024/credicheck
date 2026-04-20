import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'DEBT_REGISTERED' | 'STATUS_CHANGE' | 'PAYMENT' | 'DISPUTE';
  title: string;
  description: string;
  amount?: number;
  creditor?: string;
  status?: string;
  city?: string;
  metadata?: Record<string, any>;
}

export interface PersonTimeline {
  person: {
    fullName: string;
    idNumber: string;
    idType: string;
    totalDebts: number;
    totalAmount: number;
    firstDebtDate: Date;
    lastActivityDate: Date;
  };
  timeline: TimelineEvent[];
  summary: {
    activeDebts: number;
    paidDebts: number;
    disputedDebts: number;
    totalCities: number;
    totalCreditors: number;
  };
}

/**
 * Obtiene el historial completo (timeline) de una persona
 */
export async function getPersonTimeline(
  tenantId: string,
  searchType: 'idNumber' | 'name',
  searchValue: string
): Promise<PersonTimeline | null> {
  try {
    // Buscar todas las referencias de esta persona
    const whereClause: any = { deletedAt: null, tenantId };

    if (searchType === 'idNumber') {
      whereClause.idNumber = searchValue;
    } else {
      whereClause.fullName = {
        contains: searchValue,
      };
    }

    const references = await prisma.creditReference.findMany({
      where: whereClause,
      orderBy: { debtDate: 'asc' },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (references.length === 0) {
      return null;
    }

    // Información de la persona (usar la primera referencia)
    const firstRef = references[0];
    if (!firstRef) {
      return null;
    }

    const lastRef = references[references.length - 1];
    if (!lastRef) {
      return null;
    }

    const person = {
      fullName: firstRef.fullName,
      idNumber: firstRef.idNumber,
      idType: firstRef.idType,
      totalDebts: references.length,
      totalAmount: references.reduce(
        (sum, ref) => sum + Number(ref.debtAmount),
        0
      ),
      firstDebtDate: firstRef.debtDate,
      lastActivityDate: lastRef.createdAt,
    };

    // Construir timeline de eventos
    const timeline: TimelineEvent[] = [];

    for (const ref of references) {
      // Evento: Deuda registrada
      timeline.push({
        id: `${ref.id}-registered`,
        date: ref.debtDate,
        type: 'DEBT_REGISTERED',
        title: 'Deuda registrada',
        description: `Deuda con ${ref.creditorName} por $${Number(ref.debtAmount).toFixed(2)}`,
        amount: Number(ref.debtAmount),
        creditor: ref.creditorName,
        status: ref.debtStatus,
        ...(ref.city && { city: ref.city }),
        metadata: {
          referenceId: ref.id,
          registeredBy: `${ref.creator.firstName} ${ref.creator.lastName}`,
          registeredAt: ref.createdAt,
          notes: ref.notes,
        },
      });

      // Si la deuda está pagada, agregar evento de pago
      if (ref.debtStatus === 'PAID') {
        timeline.push({
          id: `${ref.id}-paid`,
          date: ref.updatedAt,
          type: 'PAYMENT',
          title: 'Deuda pagada',
          description: `Deuda con ${ref.creditorName} marcada como pagada`,
          amount: Number(ref.debtAmount),
          creditor: ref.creditorName,
          status: 'PAID',
          metadata: {
            referenceId: ref.id,
          },
        });
      }

      // Si la deuda está en disputa, agregar evento de disputa
      if (ref.debtStatus === 'DISPUTED') {
        timeline.push({
          id: `${ref.id}-disputed`,
          date: ref.updatedAt,
          type: 'DISPUTE',
          title: 'Deuda en disputa',
          description: `Deuda con ${ref.creditorName} fue puesta en disputa`,
          amount: Number(ref.debtAmount),
          creditor: ref.creditorName,
          status: 'DISPUTED',
          metadata: {
            referenceId: ref.id,
          },
        });
      }

      // Si la deuda tiene plan de pago
      if (ref.debtStatus === 'PAYMENT_PLAN') {
        timeline.push({
          id: `${ref.id}-payment-plan`,
          date: ref.updatedAt,
          type: 'STATUS_CHANGE',
          title: 'Plan de pago establecido',
          description: `Se estableció un plan de pago con ${ref.creditorName}`,
          amount: Number(ref.debtAmount),
          creditor: ref.creditorName,
          status: 'PAYMENT_PLAN',
          metadata: {
            referenceId: ref.id,
          },
        });
      }
    }

    // Ordenar timeline por fecha (más reciente primero)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calcular resumen
    const summary = {
      activeDebts: references.filter(r => r.debtStatus === 'ACTIVE').length,
      paidDebts: references.filter(r => r.debtStatus === 'PAID').length,
      disputedDebts: references.filter(r => r.debtStatus === 'DISPUTED').length,
      totalCities: new Set(references.map(r => r.city).filter(Boolean)).size,
      totalCreditors: new Set(references.map(r => r.creditorName)).size,
    };

    logger.info('Person timeline generated', {
      context: 'person_timeline_service',
      searchType,
      searchValue,
      totalEvents: timeline.length,
      totalDebts: references.length,
    });

    return {
      person,
      timeline,
      summary,
    };
  } catch (error) {
    logger.error('Error generating person timeline', {
      context: 'person_timeline_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchType,
      searchValue,
    });
    throw error;
  }
}

/**
 * Obtiene estadísticas de timeline para múltiples personas
 */
export async function getTimelineStatistics(tenantId: string) {
  try {
    // Obtener todas las personas únicas
    const uniquePeople = await prisma.creditReference.groupBy({
      by: ['idNumber', 'fullName'],
      where: {
        deletedAt: null,
        tenantId,
      },
      _count: {
        id: true,
      },
      _sum: {
        debtAmount: true,
      },
    });

    // Top 10 personas con más deudas
    const topDebtors = uniquePeople
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 10)
      .map(person => ({
        fullName: person.fullName,
        idNumber: person.idNumber,
        totalDebts: person._count.id,
        totalAmount: Number(person._sum.debtAmount || 0),
      }));

    // Top 10 personas con mayor monto de deuda
    const topByAmount = uniquePeople
      .sort(
        (a, b) =>
          Number(b._sum.debtAmount || 0) - Number(a._sum.debtAmount || 0)
      )
      .slice(0, 10)
      .map(person => ({
        fullName: person.fullName,
        idNumber: person.idNumber,
        totalDebts: person._count.id,
        totalAmount: Number(person._sum.debtAmount || 0),
      }));

    return {
      totalPeople: uniquePeople.length,
      topDebtors,
      topByAmount,
    };
  } catch (error) {
    logger.error('Error getting timeline statistics', {
      context: 'person_timeline_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
