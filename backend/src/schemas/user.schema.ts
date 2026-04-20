import { z } from 'zod';

// Esquema base para usuario
const baseUserSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Nombre muy largo'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50, 'Apellido muy largo'),
  role: z.enum(['ADMIN', 'ANALYST'], {
    errorMap: () => ({ message: 'Rol debe ser ADMIN o ANALYST' }),
  }),
  tenantId: z
    .string()
    .min(1, 'tenantId es requerido')
    .max(80, 'tenantId muy largo')
    .regex(/^[a-zA-Z0-9._:-]+$/, 'tenantId contiene caracteres inválidos')
    .optional(),
  isActive: z.boolean().optional(),
});

// Esquema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema para refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es requerido'),
});

// Esquema para cambiar contraseña
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una minúscula, una mayúscula y un número'
    ),
});

// Esquema para crear usuario (admin)
export const createUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una minúscula, una mayúscula y un número'
    ),
});

// Esquema para signup publico (sin role, se asigna ANALYST por defecto)
export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Nombre muy largo'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50, 'Apellido muy largo'),
  tenantId: z
    .string()
    .min(1, 'tenantId es requerido')
    .max(80, 'tenantId muy largo')
    .regex(/^[a-zA-Z0-9._:-]+$/, 'tenantId contiene caracteres inválidos')
    .optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una minúscula, una mayúscula y un número'
    ),
});

// Esquema para actualizar usuario
export const updateUserSchema = baseUserSchema.partial();

// NUEVO: Esquema para parámetros de consulta de usuarios
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'ANALYST']).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['createdAt', 'email', 'firstName', 'lastName'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// NUEVO: Esquema para validar ID de usuario en parámetros
export const userIdParamSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
});

// Esquema para filtros de búsqueda (legacy - mantener por compatibilidad)
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'ANALYST']).optional(),
  isActive: z
    .string()
    .transform(val => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('10'),
});

// Esquema para toggle de estado
export const toggleUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'El campo isActive es requerido',
    invalid_type_error: 'isActive debe ser un booleano',
  }),
});

// Esquema para estadísticas
export const userStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

// Tipos TypeScript derivados de los esquemas
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
export type UserStatsInput = z.infer<typeof userStatsSchema>;

// Validadores de parámetros de consulta
export const validateCreateUser = (data: unknown) =>
  createUserSchema.parse(data);
export const validateUpdateUser = (data: unknown) =>
  updateUserSchema.parse(data);
export const validateGetUsersQuery = (data: unknown) =>
  getUsersQuerySchema.parse(data);
export const validateUserIdParam = (data: unknown) =>
  userIdParamSchema.parse(data);
export const validateUserFilters = (data: unknown) =>
  userFiltersSchema.parse(data);
export const validateToggleUserStatus = (data: unknown) =>
  toggleUserStatusSchema.parse(data);
export const validateUserStats = (data: unknown) => userStatsSchema.parse(data);
