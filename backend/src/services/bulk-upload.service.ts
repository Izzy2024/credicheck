import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';
import { RecordStatus } from '@prisma/client';

export interface CsvRecord {
  fullName: string;
  idNumber: string;
  idType: string;
  country?: string;
  phoneCountryCode?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  department?: string;
  debtAmount: string;
  debtDate: string;
  creditorName: string;
  debtStatus?: string;
  notes?: string;
}

export interface BulkUploadResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  createdRecords: Array<{
    id: string;
    fullName: string;
    idNumber: string;
  }>;
}

/**
 * Parsea un archivo CSV simple
 */
export function parseCSV(csvContent: string): CsvRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  // Primera línea es el header
  const firstLine = lines[0];
  if (!firstLine) {
    return [];
  }
  const headers = firstLine.split(',').map(h => h.trim());

  // Resto de líneas son los datos
  const records: CsvRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const record: any = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        record[header] = values[j] || '';
      }
    }

    records.push(record as CsvRecord);
  }

  return records;
}

/**
 * Valida un registro del CSV
 */
function validateCsvRecord(
  record: CsvRecord,
  rowNumber: number
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Campos requeridos
  if (!record.fullName || record.fullName.trim() === '') {
    errors.push(`Fila ${rowNumber}: fullName es requerido`);
  }
  if (!record.idNumber || record.idNumber.trim() === '') {
    errors.push(`Fila ${rowNumber}: idNumber es requerido`);
  }
  if (!record.idType || record.idType.trim() === '') {
    errors.push(`Fila ${rowNumber}: idType es requerido`);
  }
  if (!record.debtAmount || record.debtAmount.trim() === '') {
    errors.push(`Fila ${rowNumber}: debtAmount es requerido`);
  } else {
    const amount = parseFloat(record.debtAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Fila ${rowNumber}: debtAmount debe ser un número positivo`);
    }
  }
  if (!record.debtDate || record.debtDate.trim() === '') {
    errors.push(`Fila ${rowNumber}: debtDate es requerido`);
  }
  if (!record.creditorName || record.creditorName.trim() === '') {
    errors.push(`Fila ${rowNumber}: creditorName es requerido`);
  }

  // Validar status si está presente
  if (record.debtStatus) {
    const validStatuses = [
      'ACTIVE',
      'PAID',
      'INACTIVE',
      'PAYMENT_PLAN',
      'DISPUTED',
    ];
    if (!validStatuses.includes(record.debtStatus.toUpperCase())) {
      errors.push(
        `Fila ${rowNumber}: debtStatus debe ser uno de: ${validStatuses.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Procesa un archivo CSV y crea los registros en batch
 */
export async function bulkUploadFromCSV(
  csvContent: string,
  userId: string,
  tenantId: string
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    success: false,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [],
    createdRecords: [],
  };

  try {
    // Parsear CSV
    const records = parseCSV(csvContent);
    result.totalRecords = records.length;

    if (records.length === 0) {
      throw new Error(
        'El archivo CSV está vacío o no tiene el formato correcto'
      );
    }

    logger.info('Starting bulk upload', {
      context: 'bulk_upload_service',
      totalRecords: records.length,
      userId,
    });

    // Procesar cada registro
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record) continue;

      const rowNumber = i + 2; // +2 porque fila 1 es header y empezamos en 0

      // Validar registro
      const validation = validateCsvRecord(record, rowNumber);
      if (!validation.valid) {
        result.failedRecords++;
        result.errors.push({
          row: rowNumber,
          data: record,
          error: validation.errors.join('; '),
        });
        continue;
      }

      try {
        // Crear registro en la base de datos
        const newReference = await prisma.creditReference.create({
          data: {
            fullName: record.fullName,
            idNumber: record.idNumber,
            idType: record.idType,
            birthDate: record.birthDate ? new Date(record.birthDate) : null,
            phone: record.phone || null,
            email: record.email || null,
            address: record.address || null,
            city: record.city || null,
            country: record.country || 'CO',
            phoneCountryCode: record.phoneCountryCode || null,
            state: record.state || null,
            debtAmount: parseFloat(record.debtAmount),
            debtDate: new Date(record.debtDate),
            creditorName: record.creditorName,
            debtStatus:
              (record.debtStatus?.toUpperCase() as RecordStatus) || 'ACTIVE',
            notes: record.notes || null,
            tenantId,
            createdBy: userId,
          },
        });

        result.successfulRecords++;
        result.createdRecords.push({
          id: newReference.id,
          fullName: newReference.fullName,
          idNumber: newReference.idNumber,
        });
      } catch (error) {
        result.failedRecords++;
        result.errors.push({
          row: rowNumber,
          data: record,
          error:
            error instanceof Error
              ? error.message
              : 'Error desconocido al crear el registro',
        });
      }
    }

    result.success = result.successfulRecords > 0;

    logger.info('Bulk upload completed', {
      context: 'bulk_upload_service',
      totalRecords: result.totalRecords,
      successfulRecords: result.successfulRecords,
      failedRecords: result.failedRecords,
      userId,
    });

    return result;
  } catch (error) {
    logger.error('Error in bulk upload', {
      context: 'bulk_upload_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}

/**
 * Genera un template CSV para que los usuarios sepan el formato
 */
export function generateCSVTemplate(): string {
  const headers = [
    'fullName',
    'idNumber',
    'idType',
    'birthDate',
    'phone',
    'email',
    'address',
    'city',
    'department',
    'debtAmount',
    'debtDate',
    'creditorName',
    'debtStatus',
    'notes',
  ];

  const exampleRow = [
    'Juan Pérez García',
    '12345678',
    'DNI',
    '1990-01-15',
    '555-1234',
    'juan@example.com',
    'Calle Principal 123',
    'Lima',
    'Lima',
    '5000.50',
    '2024-01-10',
    'Banco XYZ',
    'ACTIVE',
    'Primera deuda registrada',
  ];

  return `${headers.join(',')}\n${exampleRow.join(',')}`;
}
