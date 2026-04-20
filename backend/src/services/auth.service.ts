import { prisma } from '../config/database.config';
import { JWTUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/password.util';
import { CreateUserRequest } from '../schemas/user.schema';
import {
  toUserResponse,
  UserResponse,
  LoginCredentials,
  LoginResponse,
  ChangePasswordRequest,
} from '../models/user.model';
import {
  handlePrismaError,
  getSpanishErrorMessage,
} from '../utils/database.util';

export class AuthService {
  /**
   * Autentica un usuario con email y contraseña
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        throw new Error('Cuenta deshabilitada. Contacte al administrador');
      }

      // Verificar contraseña
      const isPasswordValid = await PasswordUtil.verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Generar tokens
      const tokens = JWTUtil.generateTokens(
        user.id,
        user.email,
        user.role as 'ANALYST' | 'ADMIN',
        user.tenantId
      );

      // Actualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Convertir a respuesta de usuario
      const userResponse = toUserResponse(user);

      return {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Crea un nuevo usuario
   */
  static async signup(
    userData: Omit<CreateUserRequest, 'role'> & { role?: string; tenantId?: string }
  ): Promise<UserResponse> {
    try {
      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('El email ya está en uso');
      }

      // Hashear contraseña
      const passwordHash = await PasswordUtil.hashPassword(userData.password);

      // Crear usuario
      const userDataWithRole = {
        ...userData,
        role: userData.role || ('ANALYST' as const),
        tenantId: userData.tenantId || 'default',
      };
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userDataWithRole.role,
          tenantId: userDataWithRole.tenantId,
        },
      });

      return toUserResponse(newUser);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Refresca un access token usando un refresh token válido
   */
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      // Verificar refresh token
      const decoded = JWTUtil.verifyRefreshToken(refreshToken);

      // Buscar usuario para verificar que sigue activo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new Error('Cuenta deshabilitada');
      }

      // Generar nuevos tokens
      const tokens = JWTUtil.generateTokens(
        user.id,
        user.email,
        user.role as 'ANALYST' | 'ADMIN',
        user.tenantId
      );

      // Convertir a respuesta de usuario
      const userResponse = toUserResponse(user);

      return {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  static async getProfile(userId: string): Promise<UserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return toUserResponse(user);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  static async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  ): Promise<UserResponse> {
    try {
      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          throw new Error('El email ya está en uso');
        }
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return toUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  static async changePassword(
    userId: string,
    changePasswordData: ChangePasswordRequest
  ): Promise<void> {
    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await PasswordUtil.verifyPassword(
        changePasswordData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await PasswordUtil.verifyPassword(
        changePasswordData.newPassword,
        user.passwordHash
      );

      if (isSamePassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      // Validar fortaleza de la nueva contraseña
      const passwordStrength = PasswordUtil.validatePasswordStrength(
        changePasswordData.newPassword
      );

      if (!passwordStrength.isValid) {
        throw new Error(
          `Contraseña no válida: ${passwordStrength.feedback.join(', ')}`
        );
      }

      // Verificar si la contraseña está comprometida
      const isCompromised = await PasswordUtil.isPasswordCompromised(
        changePasswordData.newPassword
      );

      if (isCompromised) {
        throw new Error(
          'Esta contraseña ha sido comprometida. Elija una diferente'
        );
      }

      // Generar hash de la nueva contraseña
      const newPasswordHash = await PasswordUtil.hashPassword(
        changePasswordData.newPassword
      );

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Valida un token de acceso
   */
  static async validateToken(token: string): Promise<UserResponse> {
    try {
      const decoded = JWTUtil.verifyAccessToken(token);

      // Verificar que el usuario sigue existiendo y activo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new Error('Cuenta deshabilitada');
      }

      return toUserResponse(user);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Genera un token temporal para reset de contraseña
   */
  static async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        throw new Error(
          'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        );
      }

      if (!user.isActive) {
        throw new Error('Cuenta deshabilitada');
      }

      // Generar token temporal válido por 1 hora
      const resetToken = JWTUtil.generateTemporaryToken(
        user.id,
        'password-reset',
        '1h'
      );

      return resetToken;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Restablece la contraseña usando un token temporal
   */
  static async resetPassword(
    resetToken: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Verificar token temporal
      const decoded = JWTUtil.verifyTemporaryToken(
        resetToken,
        'password-reset'
      );

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new Error('Cuenta deshabilitada');
      }

      // Validar nueva contraseña
      const passwordStrength =
        PasswordUtil.validatePasswordStrength(newPassword);

      if (!passwordStrength.isValid) {
        throw new Error(
          `Contraseña no válida: ${passwordStrength.feedback.join(', ')}`
        );
      }

      // Verificar si la contraseña está comprometida
      const isCompromised =
        await PasswordUtil.isPasswordCompromised(newPassword);

      if (isCompromised) {
        throw new Error(
          'Esta contraseña ha sido comprometida. Elija una diferente'
        );
      }

      // Generar hash de la nueva contraseña
      const newPasswordHash = await PasswordUtil.hashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }

  /**
   * Obtiene estadísticas de login del usuario
   */
  static async getUserLoginStats(userId: string): Promise<{
    lastLogin?: Date;
    loginCount: number;
    accountCreated: Date;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // En una implementación completa, tendríamos una tabla de login_history
      // Por ahora, simulamos algunos datos
      const result: {
        lastLogin?: Date;
        loginCount: number;
        accountCreated: Date;
      } = {
        loginCount: 1, // Placeholder
        accountCreated: user.createdAt,
      };

      if (user.lastLogin) {
        result.lastLogin = user.lastLogin;
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const dbError = handlePrismaError(error);
      throw new Error(getSpanishErrorMessage(dbError));
    }
  }
}
