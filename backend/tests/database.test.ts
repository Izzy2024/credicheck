import { PrismaClient } from '@prisma/client';
import { 
  handlePrismaError, 
  isConnectionError, 
  isDuplicateError, 
  isNotFoundError,
  getDuplicateField,
  getSpanishErrorMessage,
  retryDatabaseOperation,
  safeTransaction
} from '../src/utils/database.util';
import { Prisma } from '@prisma/client';

// Mock del cliente Prisma para tests
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePrismaError', () => {
    it('should handle unique constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      const result = handlePrismaError(error);

      expect(result.code).toBe('DUPLICATE_RECORD');
      expect(result.message).toBe('Ya existe un registro con estos datos');
      expect(result.field).toBe('email');
    });

    it('should handle record not found error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      const result = handlePrismaError(error);

      expect(result.code).toBe('RECORD_NOT_FOUND');
      expect(result.message).toBe('Registro no encontrado');
    });

    it('should handle foreign key constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' }
        }
      );

      const result = handlePrismaError(error);

      expect(result.code).toBe('INVALID_REFERENCE');
      expect(result.message).toBe('Referencia inválida a registro relacionado');
      expect(result.field).toBe('userId');
    });

    it('should handle unknown Prisma errors', () => {
      const error = new Prisma.PrismaClientUnknownRequestError(
        'Unknown error',
        { clientVersion: '5.0.0' }
      );

      const result = handlePrismaError(error);

      expect(result.code).toBe('DATABASE_ERROR');
      expect(result.message).toBe('Error desconocido en la base de datos');
    });

    it('should handle validation errors', () => {
      const error = new Prisma.PrismaClientValidationError(
        'Validation failed',
        { clientVersion: '5.0.0' }
      );

      const result = handlePrismaError(error);

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Error de validación en los datos');
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');

      const result = handlePrismaError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Generic error');
    });
  });

  describe('Error type checking functions', () => {
    it('should identify connection errors', () => {
      const connectionError = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        {
          code: 'P1001',
          clientVersion: '5.0.0',
        }
      );

      expect(isConnectionError(connectionError)).toBe(true);
      expect(isConnectionError(new Error('Generic error'))).toBe(false);
    });

    it('should identify duplicate errors', () => {
      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      expect(isDuplicateError(duplicateError)).toBe(true);
      expect(isDuplicateError(new Error('Generic error'))).toBe(false);
    });

    it('should identify not found errors', () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      expect(isNotFoundError(notFoundError)).toBe(true);
      expect(isNotFoundError(new Error('Generic error'))).toBe(false);
    });
  });

  describe('getDuplicateField', () => {
    it('should extract duplicate field from error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      expect(getDuplicateField(error)).toBe('email');
    });

    it('should return null for non-duplicate errors', () => {
      const error = new Error('Generic error');
      expect(getDuplicateField(error)).toBe(null);
    });
  });

  describe('getSpanishErrorMessage', () => {
    it('should return Spanish message for duplicate email', () => {
      const error = { code: 'DUPLICATE_RECORD', field: 'email', message: '' };
      const message = getSpanishErrorMessage(error);
      expect(message).toBe('Ya existe un usuario con este correo electrónico');
    });

    it('should return Spanish message for duplicate ID number', () => {
      const error = { code: 'DUPLICATE_RECORD', field: 'idNumber', message: '' };
      const message = getSpanishErrorMessage(error);
      expect(message).toBe('Ya existe una referencia crediticia con este número de identificación');
    });

    it('should return Spanish message for record not found', () => {
      const error = { code: 'RECORD_NOT_FOUND', message: '' };
      const message = getSpanishErrorMessage(error);
      expect(message).toBe('El registro solicitado no fue encontrado');
    });

    it('should return default message for unknown errors', () => {
      const error = { code: 'UNKNOWN_ERROR', message: 'Custom message' };
      const message = getSpanishErrorMessage(error);
      expect(message).toBe('Custom message');
    });
  });

  describe('retryDatabaseOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryDatabaseOperation(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on connection errors', async () => {
      const connectionError = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        {
          code: 'P1001',
          clientVersion: '5.0.0',
        }
      );

      const operation = jest.fn()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValue('success');
      
      const result = await retryDatabaseOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-connection errors', async () => {
      const validationError = new Prisma.PrismaClientValidationError(
        'Validation failed',
        { clientVersion: '5.0.0' }
      );

      const operation = jest.fn().mockRejectedValue(validationError);
      
      await expect(retryDatabaseOperation(operation, 3, 10))
        .rejects.toThrow(validationError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const connectionError = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        {
          code: 'P1001',
          clientVersion: '5.0.0',
        }
      );

      const operation = jest.fn().mockRejectedValue(connectionError);
      
      await expect(retryDatabaseOperation(operation, 2, 10))
        .rejects.toThrow(connectionError);
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('safeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const operations = jest.fn().mockResolvedValue('operations result');
      (mockPrisma.$transaction as jest.Mock).mockImplementation((fn) => fn());

      const result = await safeTransaction(mockPrisma, operations);
      
      expect(result).toBe('operations result');
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(operations);
    });

    it('should handle transaction errors', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(prismaError);

      const operations = jest.fn();
      
      await expect(safeTransaction(mockPrisma, operations))
        .rejects.toThrow('Ya existe un usuario con este correo electrónico');
    });
  });
});