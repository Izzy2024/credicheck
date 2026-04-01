import { CreditReference as PrismaCreditReferenceType, RecordStatus } from '@prisma/client';

export type PrismaCreditReference = PrismaCreditReferenceType;
export type RecordStatusType = RecordStatus;

// Modelo TypeScript basado en Prisma
export interface CreditReference {
  id: string;
  fullName: string;
  idNumber: string;
  idType: 'CC' | 'CE' | 'TI' | 'PP';
  birthDate?: Date;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  department?: string;
  debtAmount: number;
  debtDate: Date;
  creditorName: string;
  debtStatus: 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modelo para crear referencia crediticia
export interface CreateCreditReferenceData {
  fullName: string;
  idNumber: string;
  idType: 'CC' | 'CE' | 'TI' | 'PP';
  birthDate?: Date;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  department?: string;
  debtAmount: number;
  debtDate: Date;
  creditorName: string;
  debtStatus?: 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED';
  notes?: string;
  createdBy: string;
}

// Modelo para actualizar referencia crediticia
export interface UpdateCreditReferenceData {
  fullName?: string;
  idNumber?: string;
  idType?: 'CC' | 'CE' | 'TI' | 'PP';
  birthDate?: Date;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  department?: string;
  debtAmount?: number;
  debtDate?: Date;
  creditorName?: string;
  debtStatus?: 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED';
  notes?: string;
}

// Modelo para respuesta de referencia crediticia con información del creador
export interface CreditReferenceResponse extends CreditReference {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Modelo para búsqueda de referencias crediticias
export interface SearchCreditReferenceParams {
  fullName?: string;
  idNumber?: string;
  idType?: 'CC' | 'CE' | 'TI' | 'PP';
  city?: string;
  department?: string;
  debtStatus?: 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED';
  creditorName?: string;
  debtAmountMin?: number;
  debtAmountMax?: number;
  debtDateFrom?: Date;
  debtDateTo?: Date;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

// Modelo para resultados de búsqueda
export interface SearchCreditReferenceResult {
  references: CreditReferenceResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Modelo para validación de duplicados
export interface DuplicateCheckParams {
  idNumber: string;
  idType: 'CC' | 'CE' | 'TI' | 'PP';
  excludeId?: string; // Para excluir un ID específico en actualizaciones
}

// Modelo para estadísticas de referencias crediticias
export interface CreditReferenceStats {
  total: number;
  byStatus: {
    active: number;
    paid: number;
    disputed: number;
  };
  byIdType: {
    CC: number;
    CE: number;
    TI: number;
    PP: number;
  };
  byDepartment: Array<{
    department: string;
    count: number;
  }>;
  averageDebtAmount: number;
  totalDebtAmount: number;
}

// Función para convertir de Prisma CreditReference a CreditReference
export const toCreditReference = (ref: PrismaCreditReference): CreditReference => {
  const creditRef: CreditReference = {
    id: ref.id,
    fullName: ref.fullName,
    idNumber: ref.idNumber,
    idType: ref.idType as 'CC' | 'CE' | 'TI' | 'PP',
    debtAmount: Number(ref.debtAmount),
    debtDate: ref.debtDate,
    creditorName: ref.creditorName,
    debtStatus: ref.debtStatus,
    createdBy: ref.createdBy,
    createdAt: ref.createdAt,
    updatedAt: ref.updatedAt,
  };
  
  if (ref.birthDate) creditRef.birthDate = ref.birthDate;
  if (ref.phone) creditRef.phone = ref.phone;
  if (ref.email) creditRef.email = ref.email;
  if (ref.address) creditRef.address = ref.address;
  if (ref.city) creditRef.city = ref.city;
  if (ref.department) creditRef.department = ref.department;
  if (ref.notes) creditRef.notes = ref.notes;
  
  return creditRef;
};

// Función para formatear el monto de la deuda
export const formatDebtAmount = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para obtener la descripción del tipo de ID
export const getIdTypeDescription = (idType: 'CC' | 'CE' | 'TI' | 'PP'): string => {
  const descriptions = {
    CC: 'Cédula de Ciudadanía',
    CE: 'Cédula de Extranjería',
    TI: 'Tarjeta de Identidad',
    PP: 'Pasaporte',
  };
  return descriptions[idType];
};

// Función para obtener la descripción del estado de la deuda
export const getDebtStatusDescription = (status: 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED'): string => {
  const descriptions = {
    ACTIVE: 'Activa',
    PAID: 'Pagada',
    INACTIVE: 'Inactiva',
    PAYMENT_PLAN: 'Plan de Pago',
    DISPUTED: 'En Disputa',
  };
  return descriptions[status];
};

// Función para verificar si una referencia está activa
export const isActiveDebt = (reference: CreditReference): boolean => {
  return reference.debtStatus === 'ACTIVE';
};

// Función para calcular la antigüedad de la deuda en días
export const getDebtAgeInDays = (reference: CreditReference): number => {
  const today = new Date();
  const debtDate = new Date(reference.debtDate);
  const diffTime = Math.abs(today.getTime() - debtDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Función para verificar si una deuda es reciente (menos de 30 días)
export const isRecentDebt = (reference: CreditReference): boolean => {
  return getDebtAgeInDays(reference) <= 30;
};