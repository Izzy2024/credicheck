import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export interface TopDebtor {
  fullName: string;
  idNumber: string;
  totalDebts: number;
  totalAmount: number;
  activeDebts: number;
  cities: string[];
}

export interface DebtsByCity {
  city: string;
  totalDebts: number;
  totalAmount: number;
  uniqueDebtors: number;
}

export interface DebtsByCreditor {
  creditorName: string;
  totalDebts: number;
  totalAmount: number;
  uniqueDebtors: number;
  averageDebt: number;
}

export interface DebtsByStatus {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface AggregatedReports {
  topDebtors: TopDebtor[];
  debtsByCity: DebtsByCity[];
  debtsByCreditor: DebtsByCreditor[];
  debtsByStatus: DebtsByStatus[];
  summary: {
    totalRecords: number;
    totalAmount: number;
    totalDebtors: number;
    averageDebtPerPerson: number;
  };
}

/**
 * Obtiene el top de deudores
 */
export async function getTopDebtors(tenantId: string, limit: number = 10): Promise<TopDebtor[]> {
  try {
    const debtorsByPerson = await prisma.creditReference.groupBy({
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

    const topDebtors: TopDebtor[] = [];

    for (const debtor of debtorsByPerson) {
      // Obtener detalles adicionales
      const references = await prisma.creditReference.findMany({
        where: {
          idNumber: debtor.idNumber,
          deletedAt: null,
          tenantId,
        },
        select: {
          debtStatus: true,
          city: true,
        },
      });

      const activeDebts = references.filter(
        r => r.debtStatus === 'ACTIVE'
      ).length;
      const cities = [...new Set(references.map(r => r.city).filter(Boolean))];

      topDebtors.push({
        fullName: debtor.fullName,
        idNumber: debtor.idNumber,
        totalDebts: debtor._count.id,
        totalAmount: Number(debtor._sum.debtAmount || 0),
        activeDebts,
        cities: cities as string[],
      });
    }

    // Ordenar por monto total de deuda (descendente)
    topDebtors.sort((a, b) => b.totalAmount - a.totalAmount);

    return topDebtors.slice(0, limit);
  } catch (error) {
    logger.error('Error getting top debtors', {
      context: 'aggregate_reports_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Obtiene deudas agrupadas por ciudad
 */
export async function getDebtsByCity(tenantId: string): Promise<DebtsByCity[]> {
  try {
    const debtsByCity = await prisma.creditReference.groupBy({
      by: ['city'],
      where: {
        deletedAt: null,
        tenantId,
        city: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        debtAmount: true,
      },
    });

    const results: DebtsByCity[] = [];

    for (const cityData of debtsByCity) {
      if (!cityData.city) continue;

      // Contar deudores únicos en esta ciudad
      const uniqueDebtors = await prisma.creditReference.findMany({
        where: {
          city: cityData.city,
          deletedAt: null,
          tenantId,
        },
        select: {
          idNumber: true,
        },
        distinct: ['idNumber'],
      });

      results.push({
        city: cityData.city,
        totalDebts: cityData._count.id,
        totalAmount: Number(cityData._sum.debtAmount || 0),
        uniqueDebtors: uniqueDebtors.length,
      });
    }

    // Ordenar por monto total (descendente)
    results.sort((a, b) => b.totalAmount - a.totalAmount);

    return results;
  } catch (error) {
    logger.error('Error getting debts by city', {
      context: 'aggregate_reports_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Obtiene deudas agrupadas por acreedor
 */
export async function getDebtsByCreditor(tenantId: string): Promise<DebtsByCreditor[]> {
  try {
    const debtsByCreditor = await prisma.creditReference.groupBy({
      by: ['creditorName'],
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

    const results: DebtsByCreditor[] = [];

    for (const creditorData of debtsByCreditor) {
      // Contar deudores únicos con este acreedor
      const uniqueDebtors = await prisma.creditReference.findMany({
        where: {
          creditorName: creditorData.creditorName,
          deletedAt: null,
          tenantId,
        },
        select: {
          idNumber: true,
        },
        distinct: ['idNumber'],
      });

      const totalAmount = Number(creditorData._sum.debtAmount || 0);
      const totalDebts = creditorData._count.id;

      results.push({
        creditorName: creditorData.creditorName,
        totalDebts,
        totalAmount,
        uniqueDebtors: uniqueDebtors.length,
        averageDebt: totalDebts > 0 ? totalAmount / totalDebts : 0,
      });
    }

    // Ordenar por monto total (descendente)
    results.sort((a, b) => b.totalAmount - a.totalAmount);

    return results;
  } catch (error) {
    logger.error('Error getting debts by creditor', {
      context: 'aggregate_reports_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Obtiene deudas agrupadas por estado
 */
export async function getDebtsByStatus(tenantId: string): Promise<DebtsByStatus[]> {
  try {
    const debtsByStatus = await prisma.creditReference.groupBy({
      by: ['debtStatus'],
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

    // Calcular total para porcentajes
    const total = debtsByStatus.reduce((sum, item) => sum + item._count.id, 0);

    const results: DebtsByStatus[] = debtsByStatus.map(item => ({
      status: item.debtStatus,
      count: item._count.id,
      totalAmount: Number(item._sum.debtAmount || 0),
      percentage: total > 0 ? (item._count.id / total) * 100 : 0,
    }));

    // Ordenar por cantidad (descendente)
    results.sort((a, b) => b.count - a.count);

    return results;
  } catch (error) {
    logger.error('Error getting debts by status', {
      context: 'aggregate_reports_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Obtiene todos los reportes agregados
 */
export async function getAggregatedReports(tenantId: string): Promise<AggregatedReports> {
  try {
    const [topDebtors, debtsByCity, debtsByCreditor, debtsByStatus] =
      await Promise.all([
        getTopDebtors(tenantId, 10),
        getDebtsByCity(tenantId),
        getDebtsByCreditor(tenantId),
        getDebtsByStatus(tenantId),
      ]);

    // Calcular resumen
    const totalRecords = await prisma.creditReference.count({
      where: { deletedAt: null, tenantId },
    });

    const totalAmountResult = await prisma.creditReference.aggregate({
      where: { deletedAt: null, tenantId },
      _sum: {
        debtAmount: true,
      },
    });

    const uniqueDebtors = await prisma.creditReference.findMany({
      where: { deletedAt: null, tenantId },
      select: { idNumber: true },
      distinct: ['idNumber'],
    });

    const totalAmount = Number(totalAmountResult._sum.debtAmount || 0);
    const totalDebtors = uniqueDebtors.length;
    const averageDebtPerPerson =
      totalDebtors > 0 ? totalAmount / totalDebtors : 0;

    logger.info('Aggregated reports generated', {
      context: 'aggregate_reports_service',
      totalRecords,
      totalDebtors,
      totalAmount,
    });

    return {
      topDebtors,
      debtsByCity,
      debtsByCreditor,
      debtsByStatus,
      summary: {
        totalRecords,
        totalAmount,
        totalDebtors,
        averageDebtPerPerson,
      },
    };
  } catch (error) {
    logger.error('Error getting aggregated reports', {
      context: 'aggregate_reports_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
