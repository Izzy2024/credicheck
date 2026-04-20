import { z } from 'zod';
import { 
  isValidIdNumber, 
  isValidColombianPhone, 
  isValidEmail, 
  isValidFullName,
  isValidDebtAmount,
  isValidBirthDate,
  isValidDebtDate,
  cleanIdNumber,
  normalizeName
} from '../utils/validation.util';

// Schema para crear referencia crediticia
export const createCreditReferenceSchema = z.object({
  fullName: z
    .string()
    .min(1, 'El nombre completo es obligatorio')
    .max(255, 'El nombre completo no puede tener más de 255 caracteres')
    .refine(isValidFullName, 'El nombre completo debe tener al menos 2 palabras y solo contener letras')
    .transform(normalizeName),
  
  idNumber: z
    .string()
    .min(1, 'El número de identificación es obligatorio')
    .max(50, 'El número de identificación no puede tener más de 50 caracteres')
    .transform(cleanIdNumber),
  
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'], {
      errorMap: () => ({ message: 'El tipo de identificación debe ser CC, CE, TI o PP' })
    }),
  
  birthDate: z
    .string()
    .optional()
    .transform((val) => val ? new Date(val) : undefined)
    .refine((date) => !date || isValidBirthDate(date), 'La fecha de nacimiento no es válida'),
  
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || isValidColombianPhone(phone), 'El teléfono debe ser un número colombiano válido (10 dígitos)'),
  
  email: z
    .string()
    .optional()
    .refine((email) => !email || isValidEmail(email), 'El email no es válido'),
  
  address: z
    .string()
    .max(500, 'La dirección no puede tener más de 500 caracteres')
    .optional(),
  
  city: z
    .string()
    .max(100, 'La ciudad no puede tener más de 100 caracteres')
    .optional(),
  
  department: z
    .string()
    .max(100, 'El departamento no puede tener más de 100 caracteres')
    .optional(),
  
  debtAmount: z
    .number()
    .positive('El monto de la deuda debe ser mayor a 0')
    .max(999999999999, 'El monto de la deuda es demasiado alto')
    .refine(isValidDebtAmount, 'El monto de la deuda no es válido'),
  
  debtDate: z
    .string()
    .min(1, 'La fecha de la deuda es obligatoria')
    .transform((val) => new Date(val))
    .refine(isValidDebtDate, 'La fecha de la deuda no es válida'),
  
  creditorName: z
    .string()
    .min(1, 'El nombre del acreedor es obligatorio')
    .max(255, 'El nombre del acreedor no puede tener más de 255 caracteres'),
  
  debtStatus: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .optional()
    .default('ACTIVE'),

  caseType: z
    .enum(['FORMAL', 'P2P', 'SERVICE'])
    .optional()
    .default('FORMAL'),
  
  notes: z
    .string()
    .max(1000, 'Las notas no pueden tener más de 1000 caracteres')
    .optional(),
}).refine((data) => isValidIdNumber(data.idNumber, data.idType), {
  message: 'El número de identificación no es válido para el tipo seleccionado',
  path: ['idNumber'],
});

// Schema para actualizar referencia crediticia
export const updateCreditReferenceSchema = z.object({
  fullName: z
    .string()
    .max(255, 'El nombre completo no puede tener más de 255 caracteres')
    .refine(isValidFullName, 'El nombre completo debe tener al menos 2 palabras y solo contener letras')
    .transform(normalizeName)
    .optional(),
  
  idNumber: z
    .string()
    .max(50, 'El número de identificación no puede tener más de 50 caracteres')
    .transform(cleanIdNumber)
    .optional(),
  
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'])
    .optional(),
  
  birthDate: z
    .string()
    .transform((val) => new Date(val))
    .refine(isValidBirthDate, 'La fecha de nacimiento no es válida')
    .optional(),
  
  phone: z
    .string()
    .refine(isValidColombianPhone, 'El teléfono debe ser un número colombiano válido (10 dígitos)')
    .optional(),
  
  email: z
    .string()
    .refine(isValidEmail, 'El email no es válido')
    .optional(),
  
  address: z
    .string()
    .max(500, 'La dirección no puede tener más de 500 caracteres')
    .optional(),
  
  city: z
    .string()
    .max(100, 'La ciudad no puede tener más de 100 caracteres')
    .optional(),
  
  department: z
    .string()
    .max(100, 'El departamento no puede tener más de 100 caracteres')
    .optional(),
  
  debtAmount: z
    .number()
    .positive('El monto de la deuda debe ser mayor a 0')
    .max(999999999999, 'El monto de la deuda es demasiado alto')
    .refine(isValidDebtAmount, 'El monto de la deuda no es válido')
    .optional(),
  
  debtDate: z
    .string()
    .transform((val) => new Date(val))
    .refine(isValidDebtDate, 'La fecha de la deuda no es válida')
    .optional(),
  
  creditorName: z
    .string()
    .max(255, 'El nombre del acreedor no puede tener más de 255 caracteres')
    .optional(),
  
  debtStatus: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .optional(),
  
  notes: z
    .string()
    .max(1000, 'Las notas no pueden tener más de 1000 caracteres')
    .optional(),
}).refine((data) => {
  if (data.idNumber && data.idType) {
    return isValidIdNumber(data.idNumber, data.idType);
  }
  return true;
}, {
  message: 'El número de identificación no es válido para el tipo seleccionado',
  path: ['idNumber'],
});

// Schema para búsqueda por nombre
export const searchByNameSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede tener más de 255 caracteres'),
  fuzzy: z
    .boolean()
    .optional()
    .default(true),
  limit: z
    .number()
    .int()
    .min(1, 'El límite debe ser al menos 1')
    .max(100, 'El límite no puede ser mayor a 100')
    .optional()
    .default(10),
  offset: z
    .number()
    .int()
    .min(0, 'El offset debe ser mayor o igual a 0')
    .optional()
    .default(0),
});

// Schema para búsqueda por ID
export const searchByIdSchema = z.object({
  idNumber: z
    .string()
    .min(1, 'El número de identificación es obligatorio')
    .transform(cleanIdNumber),
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'])
    .optional(),
}).refine((data) => {
  if (data.idType) {
    return isValidIdNumber(data.idNumber, data.idType);
  }
  return true;
}, {
  message: 'El número de identificación no es válido para el tipo seleccionado',
  path: ['idNumber'],
});

// Schema para búsqueda por documento
export const searchByDocumentSchema = z.object({
  idNumber: z
    .string()
    .min(1, 'El número de documento es obligatorio')
    .transform(cleanIdNumber),
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'], {
      errorMap: () => ({ message: 'El tipo de documento debe ser CC, CE, TI o PP' })
    }),
}).refine((data) => isValidIdNumber(data.idNumber, data.idType), {
  message: 'El número de documento no es válido para el tipo seleccionado',
  path: ['idNumber'],
});

// Schema para búsqueda avanzada
export const advancedSearchSchema = z.object({
  fullName: z
    .string()
    .optional(),
  idNumber: z
    .string()
    .transform((val) => val ? cleanIdNumber(val) : undefined)
    .optional(),
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'])
    .optional(),
  city: z
    .string()
    .optional(),
  department: z
    .string()
    .optional(),
  debtStatus: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .optional(),
  creditorName: z
    .string()
    .optional(),
  debtAmountMin: z
    .number()
    .positive('El monto mínimo debe ser mayor a 0')
    .optional(),
  debtAmountMax: z
    .number()
    .positive('El monto máximo debe ser mayor a 0')
    .optional(),
  debtDateFrom: z
    .string()
    .transform((val) => val ? new Date(val) : undefined)
    .optional(),
  debtDateTo: z
    .string()
    .transform((val) => val ? new Date(val) : undefined)
    .optional(),
  limit: z
    .number()
    .int()
    .min(1, 'El límite debe ser al menos 1')
    .max(100, 'El límite no puede ser mayor a 100')
    .optional()
    .default(10),
  offset: z
    .number()
    .int()
    .min(0, 'El offset debe ser mayor o igual a 0')
    .optional()
    .default(0),
}).refine((data) => {
  if (data.debtAmountMin && data.debtAmountMax) {
    return data.debtAmountMin <= data.debtAmountMax;
  }
  return true;
}, {
  message: 'El monto mínimo debe ser menor o igual al monto máximo',
  path: ['debtAmountMax'],
}).refine((data) => {
  if (data.debtDateFrom && data.debtDateTo) {
    return data.debtDateFrom <= data.debtDateTo;
  }
  return true;
}, {
  message: 'La fecha inicial debe ser menor o igual a la fecha final',
  path: ['debtDateTo'],
});

// Schema para validación de duplicados
export const duplicateCheckSchema = z.object({
  idNumber: z
    .string()
    .min(1, 'El número de identificación es obligatorio')
    .transform(cleanIdNumber),
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP']),
  excludeId: z
    .string()
    .uuid('El ID debe ser un UUID válido')
    .optional(),
}).refine((data) => isValidIdNumber(data.idNumber, data.idType), {
  message: 'El número de identificación no es válido para el tipo seleccionado',
  path: ['idNumber'],
});

// Schema para parámetros de ruta con ID
export const creditReferenceIdParamSchema = z.object({
  id: z
    .string()
    .uuid('El ID debe ser un UUID válido'),
});

// Schema para parámetros de consulta de referencias
export const getCreditReferencesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => val > 0, 'La página debe ser mayor a 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 10)
    .refine((val) => val > 0 && val <= 100, 'El límite debe estar entre 1 y 100'),
  search: z
    .string()
    .optional(),
  debtStatus: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .optional(),
  idType: z
    .enum(['CC', 'CE', 'TI', 'PP'])
    .optional(),
  department: z
    .string()
    .optional(),
  city: z
    .string()
    .optional(),
  sortBy: z
    .enum(['fullName', 'idNumber', 'debtAmount', 'debtDate', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Tipos TypeScript derivados de los schemas
export type CreateCreditReferenceRequest = z.infer<typeof createCreditReferenceSchema>;
export type UpdateCreditReferenceRequest = z.infer<typeof updateCreditReferenceSchema>;
export type SearchByNameRequest = z.infer<typeof searchByNameSchema>;
export type SearchByIdRequest = z.infer<typeof searchByIdSchema>;
export type SearchByDocumentRequest = z.infer<typeof searchByDocumentSchema>;
export type AdvancedSearchRequest = z.infer<typeof advancedSearchSchema>;
export type DuplicateCheckRequest = z.infer<typeof duplicateCheckSchema>;
export type CreditReferenceIdParam = z.infer<typeof creditReferenceIdParamSchema>;
export type GetCreditReferencesQuery = z.infer<typeof getCreditReferencesQuerySchema>;
// Schema para actualizar el estado de una referencia crediticia
export const updateCreditReferenceStatusSchema = z.object({
  status: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .refine((val) => val !== 'ACTIVE', {
      message: 'No se puede establecer el estado como ACTIVO manualmente',
    }),
  notes: z
    .string()
    .max(500, 'Las notas no pueden tener más de 500 caracteres')
    .optional(),
});

// Schema para actualización masiva de estados
export const bulkUpdateStatusSchema = z.object({
  recordIds: z
    .array(z.string().uuid('ID de registro inválido'))
    .min(1, 'Debe seleccionar al menos un registro')
    .max(100, 'No se pueden actualizar más de 100 registros a la vez'),
  status: z
    .enum(['ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED'])
    .refine((val) => val !== 'ACTIVE', {
      message: 'No se puede establecer el estado como ACTIVO manualmente',
    }),
  notes: z
    .string()
    .max(500, 'Las notas no pueden tener más de 500 caracteres')
    .optional(),
});

// Tipos TypeScript derivados de los nuevos schemas
export type UpdateCreditReferenceStatusRequest = z.infer<typeof updateCreditReferenceStatusSchema>;
export type BulkUpdateStatusRequest = z.infer<typeof bulkUpdateStatusSchema>;
