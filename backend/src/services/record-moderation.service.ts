
export type TrustTier = 0 | 1 | 2;

export interface ModerationInput {
  trustLevel: number;
  debtAmount: number;
  notes?: string | null;
  hasContactInfo: boolean;
  dailyCreateCount: number;
  sameDebtorRecentByUserCount: number;
  sameDebtorRecentGlobalCount: number;
  caseType?: string;
}

export interface ModerationDecision {
  riskScore: number;
  riskReasons: string[];
  publishState: 'PUBLISHED' | 'PENDING_REVIEW';
  reviewStatus: 'AUTO_APPROVED' | 'NEEDS_REVIEW';
}

export interface CreditScoreRecordInput {
  debtAmount: number;
  debtStatus?: string | null;
  debtDate?: Date | string | null;
}

export interface CreditScoreWeights {
  activeSinglePenalty: number;
  activeMultiplePenalty: number;
  debtModeratePenalty: number;
  debtHighPenalty: number;
  debtVeryHighPenalty: number;
  recentPenalty: number;
}

export interface CreditTrendWindow {
  label: '3M' | '6M' | '12M';
  recordCount: number;
  activeCount: number;
  totalDebt: number;
}

export interface CreditScoreSummary {
  creditScore: number;
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH';
  alertLevel: 'GREEN' | 'AMBER' | 'RED';
  recommendation: string;
  reasons: string[];
  trend: CreditTrendWindow[];
}

export const DEFAULT_CREDIT_SCORE_WEIGHTS: CreditScoreWeights = {
  activeSinglePenalty: 20,
  activeMultiplePenalty: 35,
  debtModeratePenalty: 10,
  debtHighPenalty: 20,
  debtVeryHighPenalty: 30,
  recentPenalty: 15,
};

export const normalizeTrustTier = (trustLevel: number): TrustTier => {
  if (trustLevel >= 2) return 2;
  if (trustLevel >= 1) return 1;
  return 0;
};

export const getDailyCreateLimitByTrust = (trustLevel: number): number => {
  const tier = normalizeTrustTier(trustLevel);
  if (tier === 0) return 3;
  if (tier === 1) return 10;
  return 30;
};

export const evaluateRecordRisk = (input: ModerationInput): ModerationDecision => {
  const reasons: string[] = [];
  let risk = 0;

  const trustTier = normalizeTrustTier(input.trustLevel);

  if (trustTier === 0) {
    risk += 15;
    reasons.push('Cuenta de baja confianza (nivel 0)');
  }

  if (input.dailyCreateCount >= 2) {
    risk += 20;
    reasons.push('Alta frecuencia de registros en 24h');
  }

  if (input.debtAmount >= 20_000_000) {
    risk += 30;
    reasons.push('Monto de deuda muy alto');
  } else if (input.debtAmount >= 5_000_000) {
    risk += 20;
    reasons.push('Monto de deuda alto');
  }

  if (!input.notes || input.notes.trim().length < 20) {
    risk += 10;
    reasons.push('Descripción insuficiente');
  }

  if (!input.hasContactInfo) {
    risk += 15;
    reasons.push('Falta información de contacto del deudor');
  }

  if (input.caseType === 'P2P') {
    risk += 10;
    reasons.push('Caso P2P sin evidencia formal');
  }

  if (input.sameDebtorRecentByUserCount > 0) {
    risk += 15;
    reasons.push('Registro repetido del mismo deudor por el mismo reportante');
  }

  if (input.sameDebtorRecentGlobalCount >= 3) {
    risk += 15;
    reasons.push('Múltiples reportes recientes del mismo deudor');
  }

  const riskScore = Math.min(risk, 100);

  if (riskScore >= 55) {
    return {
      riskScore,
      riskReasons: reasons,
      publishState: 'PENDING_REVIEW',
      reviewStatus: 'NEEDS_REVIEW',
    };
  }

  return {
    riskScore,
    riskReasons: reasons,
    publishState: 'PUBLISHED',
    reviewStatus: 'AUTO_APPROVED',
  };
};

export const buildTrustFromUserSignals = (
  user: { trustLevel?: number },
  userTotalRecords: number,
  userRejectedDisputesAgainstHim: number,
): number => {
  let trust = user.trustLevel ?? 0;

  if (userTotalRecords >= 20 && userRejectedDisputesAgainstHim <= 1) {
    trust = Math.max(trust, 1);
  }

  if (userTotalRecords >= 75 && userRejectedDisputesAgainstHim === 0) {
    trust = Math.max(trust, 2);
  }

  return Math.min(2, Math.max(0, trust));
};

export const getCreateWindowStart = (): Date => {
  const d = new Date();
  d.setHours(d.getHours() - 24);
  return d;
};

export const getRecentDuplicateWindowStart = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

export const parseCreditScoreWeights = (
  raw: string | null | undefined,
): CreditScoreWeights => {
  if (!raw) return DEFAULT_CREDIT_SCORE_WEIGHTS;

  try {
    const parsed = JSON.parse(raw) as Partial<CreditScoreWeights>;
    return {
      activeSinglePenalty: Number(parsed.activeSinglePenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.activeSinglePenalty),
      activeMultiplePenalty: Number(parsed.activeMultiplePenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.activeMultiplePenalty),
      debtModeratePenalty: Number(parsed.debtModeratePenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.debtModeratePenalty),
      debtHighPenalty: Number(parsed.debtHighPenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.debtHighPenalty),
      debtVeryHighPenalty: Number(parsed.debtVeryHighPenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.debtVeryHighPenalty),
      recentPenalty: Number(parsed.recentPenalty ?? DEFAULT_CREDIT_SCORE_WEIGHTS.recentPenalty),
    };
  } catch {
    return DEFAULT_CREDIT_SCORE_WEIGHTS;
  }
};

const getRecommendationFromBand = (riskBand: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
  if (riskBand === 'HIGH') {
    return 'Riesgo alto: solicitar garantía fuerte o rechazar la operación.';
  }
  if (riskBand === 'MEDIUM') {
    return 'Riesgo medio: validar ingresos y considerar codeudor/garantía.';
  }
  return 'Riesgo bajo: operación viable con validación estándar.';
};

const buildTrend = (records: CreditScoreRecordInput[]): CreditTrendWindow[] => {
  const now = new Date();
  const windows: Array<{ months: number; label: '3M' | '6M' | '12M' }> = [
    { months: 3, label: '3M' },
    { months: 6, label: '6M' },
    { months: 12, label: '12M' },
  ];

  return windows.map((w) => {
    const start = new Date(now);
    start.setMonth(start.getMonth() - w.months);

    const subset = records.filter((r) => {
      if (!r.debtDate) return false;
      const d = new Date(r.debtDate);
      if (Number.isNaN(d.getTime())) return false;
      return d >= start;
    });

    const activeCount = subset.filter((r) => (r.debtStatus || '').toUpperCase() === 'ACTIVE').length;
    const totalDebt = subset.reduce((acc, r) => acc + Number(r.debtAmount || 0), 0);

    return {
      label: w.label,
      recordCount: subset.length,
      activeCount,
      totalDebt,
    };
  });
};

export const calculateCreditScoreSummary = (
  records: CreditScoreRecordInput[],
  weights: CreditScoreWeights = DEFAULT_CREDIT_SCORE_WEIGHTS,
): CreditScoreSummary => {
  if (!records.length) {
    return {
      creditScore: 100,
      riskBand: 'LOW',
      alertLevel: 'GREEN',
      recommendation: getRecommendationFromBand('LOW'),
      reasons: ['Sin referencias negativas activas.'],
      trend: buildTrend(records),
    };
  }

  const activeRecords = records.filter((r) => (r.debtStatus || '').toUpperCase() === 'ACTIVE');
  const totalDebt = records.reduce((acc, r) => acc + Number(r.debtAmount || 0), 0);

  let score = 100;
  const reasons: string[] = [];

  if (activeRecords.length >= 3) {
    score -= weights.activeMultiplePenalty;
    reasons.push('Múltiples deudas activas registradas.');
  } else if (activeRecords.length >= 1) {
    score -= weights.activeSinglePenalty;
    reasons.push('Tiene al menos una deuda activa.');
  }

  if (totalDebt >= 20_000_000) {
    score -= weights.debtVeryHighPenalty;
    reasons.push('Monto total adeudado muy alto.');
  } else if (totalDebt >= 5_000_000) {
    score -= weights.debtHighPenalty;
    reasons.push('Monto total adeudado alto.');
  } else if (totalDebt >= 1_000_000) {
    score -= weights.debtModeratePenalty;
    reasons.push('Monto total adeudado moderado.');
  }

  const hasRecentActiveDebt = activeRecords.some((r) => {
    if (!r.debtDate) return false;
    const debtDate = new Date(r.debtDate);
    if (Number.isNaN(debtDate.getTime())) return false;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return debtDate >= ninetyDaysAgo;
  });

  if (hasRecentActiveDebt) {
    score -= weights.recentPenalty;
    reasons.push('Presenta reporte(s) reciente(s) en los últimos 90 días.');
  }

  score = Math.max(0, Math.min(100, score));

  let riskBand: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let alertLevel: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';

  if (score <= 39) {
    riskBand = 'HIGH';
    alertLevel = 'RED';
  } else if (score <= 69) {
    riskBand = 'MEDIUM';
    alertLevel = 'AMBER';
  }

  return {
    creditScore: score,
    riskBand,
    alertLevel,
    recommendation: getRecommendationFromBand(riskBand),
    reasons,
    trend: buildTrend(records),
  };
};
