import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export interface RiskScoreResult {
  score: number; // 0-1000, donde 1000 es el peor
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    totalDebts: number;
    totalAmount: number;
    activeDebts: number;
    oldestDebtMonths: number;
    averageDebtAge: number;
    hasRecentDebts: boolean; // Deudas en los últimos 6 meses
    hasDisputedDebts: boolean;
  };
  details: string;
}

/**
 * Calcula el score de riesgo crediticio para una persona basado en:
 * - Cantidad de deudas
 * - Monto total de deudas
 * - Antigüedad de las deudas
 * - Estado de las deudas (activas, pagadas, etc.)
 */
export async function calculateRiskScore(
  searchType: 'idNumber' | 'name',
  searchValue: string
): Promise<RiskScoreResult | null> {
  try {
    // Buscar todas las referencias de esta persona
    const whereClause: any = { deletedAt: null };

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
    });

    if (references.length === 0) {
      return null;
    }

    // Calcular factores de riesgo
    const totalDebts = references.length;
    const activeDebts = references.filter(
      r => r.debtStatus === 'ACTIVE'
    ).length;
    const hasDisputedDebts = references.some(r => r.debtStatus === 'DISPUTED');

    // Calcular monto total
    const totalAmount = references.reduce((sum, ref) => {
      return sum + Number(ref.debtAmount);
    }, 0);

    // Calcular antigüedad de deudas
    const now = new Date();
    const debtAges = references.map(ref => {
      const debtDate = new Date(ref.debtDate);
      const diffMs = now.getTime() - debtDate.getTime();
      const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      return diffMonths;
    });

    const oldestDebtMonths = Math.max(...debtAges);
    const averageDebtAge =
      debtAges.reduce((a, b) => a + b, 0) / debtAges.length;
    const hasRecentDebts = debtAges.some(age => age <= 6);

    // Calcular score base (0-1000)
    let score = 0;

    // Factor 1: Cantidad de deudas (max 300 puntos)
    // 1 deuda = 50, 2 = 100, 3 = 150, etc., cap en 300
    score += Math.min(totalDebts * 50, 300);

    // Factor 2: Monto total (max 300 puntos)
    // Por cada $1000 = 10 puntos, cap en 300
    score += Math.min((totalAmount / 1000) * 10, 300);

    // Factor 3: Antigüedad promedio (max 200 puntos)
    // Por cada mes = 2 puntos, cap en 200
    score += Math.min(averageDebtAge * 2, 200);

    // Factor 4: Deudas activas (max 100 puntos)
    score += Math.min(activeDebts * 20, 100);

    // Factor 5: Deudas recientes (50 puntos si tiene)
    if (hasRecentDebts) {
      score += 50;
    }

    // Factor 6: Deudas disputadas (50 puntos si tiene)
    if (hasDisputedDebts) {
      score += 50;
    }

    // Asegurar que el score esté entre 0-1000
    score = Math.min(Math.max(score, 0), 1000);

    // Determinar nivel de riesgo
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score < 250) {
      level = 'LOW';
    } else if (score < 500) {
      level = 'MEDIUM';
    } else if (score < 750) {
      level = 'HIGH';
    } else {
      level = 'CRITICAL';
    }

    // Generar detalles
    const details = generateRiskDetails(score, level, {
      totalDebts,
      totalAmount,
      activeDebts,
      oldestDebtMonths,
      averageDebtAge,
      hasRecentDebts,
      hasDisputedDebts,
    });

    logger.info('Risk score calculated', {
      context: 'risk_score_service',
      searchType,
      searchValue,
      score,
      level,
      totalDebts,
    });

    return {
      score: Math.round(score),
      level,
      factors: {
        totalDebts,
        totalAmount,
        activeDebts,
        oldestDebtMonths,
        averageDebtAge: Math.round(averageDebtAge * 10) / 10,
        hasRecentDebts,
        hasDisputedDebts,
      },
      details,
    };
  } catch (error) {
    logger.error('Error calculating risk score', {
      context: 'risk_score_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchType,
      searchValue,
    });
    throw error;
  }
}

/**
 * Genera descripción detallada del riesgo
 */
function generateRiskDetails(
  score: number,
  level: string,
  factors: RiskScoreResult['factors']
): string {
  const parts: string[] = [];

  parts.push(`Score: ${Math.round(score)}/1000 - Riesgo ${level}`);
  parts.push(`Total de deudas: ${factors.totalDebts}`);
  parts.push(`Monto total: $${factors.totalAmount.toFixed(2)}`);
  parts.push(`Deudas activas: ${factors.activeDebts}`);
  parts.push(`Deuda más antigua: ${factors.oldestDebtMonths} meses`);
  parts.push(`Antigüedad promedio: ${factors.averageDebtAge.toFixed(1)} meses`);

  if (factors.hasRecentDebts) {
    parts.push('⚠️ Tiene deudas recientes (últimos 6 meses)');
  }

  if (factors.hasDisputedDebts) {
    parts.push('⚠️ Tiene deudas en disputa');
  }

  return parts.join(' | ');
}

/**
 * Obtiene estadísticas de riesgo crediticio para el dashboard
 */
export async function getRiskStatistics() {
  try {
    // Obtener todas las personas únicas con deudas
    const uniqueDebtors = await prisma.creditReference.groupBy({
      by: ['idNumber'],
      where: {
        deletedAt: null,
      },
      _count: true,
    });

    // Calcular scores para una muestra representativa
    const scores: { idNumber: string; score: number; level: string }[] = [];

    for (const debtor of uniqueDebtors.slice(0, 100)) {
      const riskScore = await calculateRiskScore('idNumber', debtor.idNumber);
      if (riskScore) {
        scores.push({
          idNumber: debtor.idNumber,
          score: riskScore.score,
          level: riskScore.level,
        });
      }
    }

    // Calcular distribución de niveles de riesgo
    const distribution = {
      LOW: scores.filter(s => s.level === 'LOW').length,
      MEDIUM: scores.filter(s => s.level === 'MEDIUM').length,
      HIGH: scores.filter(s => s.level === 'HIGH').length,
      CRITICAL: scores.filter(s => s.level === 'CRITICAL').length,
    };

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : 0;

    return {
      totalDebtors: uniqueDebtors.length,
      analyzedSample: scores.length,
      averageScore: Math.round(averageScore),
      distribution,
    };
  } catch (error) {
    logger.error('Error getting risk statistics', {
      context: 'risk_score_service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
