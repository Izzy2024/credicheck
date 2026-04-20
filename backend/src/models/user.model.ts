import { User as PrismaUser } from '@prisma/client';

// Modelo TypeScript basado en Prisma
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ANALYST' | 'ADMIN';
  tenantId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Modelo para crear usuario (sin campos generados automáticamente)
export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: 'ANALYST' | 'ADMIN';
}

// Modelo para actualizar usuario
export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ANALYST' | 'ADMIN';
  isActive?: boolean;
}

// Modelo para respuesta de usuario (sin password hash)
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ANALYST' | 'ADMIN';
  tenantId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Modelo para login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Modelo para respuesta de login
export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Modelo para refresh token
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Modelo para cambio de contraseña
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Función para convertir de Prisma User a UserResponse
export const toUserResponse = (user: PrismaUser): UserResponse => {
  const response: UserResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as 'ANALYST' | 'ADMIN',
    tenantId: (user as PrismaUser & { tenantId?: string }).tenantId,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  
  if (user.lastLogin) {
    response.lastLogin = user.lastLogin;
  }
  
  return response;
};

// Función para obtener el nombre completo
export const getFullName = (user: User | UserResponse): string => {
  return `${user.firstName} ${user.lastName}`;
};

// Función para verificar si el usuario es administrador
export const isAdmin = (user: User | UserResponse): boolean => {
  return user.role === 'ADMIN';
};

// Función para verificar si el usuario es analista
export const isAnalyst = (user: User | UserResponse): boolean => {
  return user.role === 'ANALYST';
};

// Función para verificar si el usuario está activo
export const isActiveUser = (user: User | UserResponse): boolean => {
  return user.isActive;
};