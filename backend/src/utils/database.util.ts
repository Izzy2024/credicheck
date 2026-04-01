// Database utility functions - Simplified version
import { Prisma } from '@prisma/client';

// Tipos de errores de Prisma más comunes
export enum PrismaErrorCode {
  UNIQUE_CONSTRAINT_VIOLATION = 'P2002',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'P2003',
  RECORD_NOT_FOUND = 'P2025',
  CONNECTION_ERROR = 'P1001',
  DATABASE_NOT_FOUND = 'P1003',
  TIMEOUT = 'P1008',
  MIGRATION_ERROR = 'P3000',
}

// Interfaz para errores de base de datos personalizados
export interface DatabaseError {
  code: string;
  message: string;
  field?: string;
  table?: string;
  constraint?: string;
}

// Función para manejar errores de Prisma
export const handlePrismaError = (error: unknown): DatabaseError => {
  // Check for Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION:
        const target = error.meta?.['target'];
        const field = Array.isArray(target) ? target[0] : (target as string);
        return {
          code: 'DUPLICATE_RECORD',
          message: 'Ya existe un registro con estos datos',
          field: field,
          constraint: error.meta?.['constraint'] as string,
        };

      case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION:
        return {
          code: 'INVALID_REFERENCE',
          message: 'Referencia inválida a registro relacionado',
          field: error.meta?.['field_name'] as string,
        };

      case PrismaErrorCode.RECORD_NOT_FOUND:
        return {
          code: 'RECORD_NOT_FOUND',
          message: 'Registro no encontrado',
        };

      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'Error en la base de datos',
        };
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Error desconocido en la base de datos',
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      code: 'DATABASE_PANIC',
      message: 'Error crítico en la base de datos',
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Error de conexión a la base de datos',
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Error de validación en los datos',
    };
  }

  // Error genérico
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Error desconocido',
  };
};

// Función para verificar si un error es de conexión
export const isConnectionError = (error: unknown): boolean => {
  if (error instanceof Error && 'code' in error) {
    return [
      PrismaErrorCode.CONNECTION_ERROR,
      PrismaErrorCode.DATABASE_NOT_FOUND,
      PrismaErrorCode.TIMEOUT,
    ].includes(error.code as PrismaErrorCode);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return false;
};

// Función para verificar si un error es de duplicado
export const isDuplicateError = (error: unknown): boolean => {
  if (error instanceof Error && 'code' in error) {
    return error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION;
  }
  return false;
};

// Función para verificar si un error es de registro no encontrado
export const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof Error && 'code' in error) {
    return error.code === PrismaErrorCode.RECORD_NOT_FOUND;
  }
  return false;
};

// Función para obtener información del campo duplicado
export const getDuplicateField = (error: unknown): string | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
      const target = error.meta?.['target'];
      if (Array.isArray(target)) {
        return target[0];
      }
      return (target as string) || null;
    }
  }
  return null;
};

// Función para crear mensajes de error en español
export const getSpanishErrorMessage = (error: DatabaseError): string => {
  switch (error.code) {
    case 'DUPLICATE_RECORD':
      if (error.field === 'email') {
        return 'Ya existe un usuario con este correo electrónico';
      }
      if (error.field === 'idNumber') {
        return 'Ya existe una referencia crediticia con este número de identificación';
      }
      return 'Ya existe un registro con estos datos';

    case 'RECORD_NOT_FOUND':
      return 'El registro solicitado no fue encontrado';

    case 'INVALID_REFERENCE':
      return 'Referencia inválida a un registro relacionado';

    case 'DATABASE_CONNECTION_ERROR':
      return 'Error de conexión con la base de datos';

    case 'VALIDATION_ERROR':
      return 'Los datos proporcionados no son válidos';

    case 'DATABASE_ERROR':
      return 'Error interno de la base de datos';

    default:
      return error.message || 'Error desconocido en la base de datos';
  }
};

// Función para retry de operaciones de base de datos
export const retryDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Solo reintentar en errores de conexión
      if (!isConnectionError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

// Función para transacciones seguras
export const safeTransaction = async <T>(
  prisma: any,
  operations: (tx: any) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(operations);
  } catch (error) {
    const dbError = handlePrismaError(error);
    throw new Error(getSpanishErrorMessage(dbError));
  }
};
