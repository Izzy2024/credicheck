import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  loginSchema,
  refreshTokenSchema,
  updateUserSchema,
  changePasswordSchema,
  signupSchema,
  LoginRequest,
  RefreshTokenRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from '../schemas/user.schema';
import { ZodError } from 'zod';
import { JWTUtil } from '../utils/jwt.util';
import { TokenBlacklistUtil } from '../utils/token-blacklist.util';
import { PasswordUtil } from '../utils/password.util';

// Interfaz para respuestas exitosas
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Interfaz para respuestas de error
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

export class AuthController {
  /**
   * POST /api/auth/login
   * Autentica un usuario y devuelve tokens JWT
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = loginSchema.parse(req.body) as LoginRequest;

      // Autenticar usuario
      const loginResponse = await AuthService.login(validatedData);

      const response: SuccessResponse<typeof loginResponse> = {
        success: true,
        data: loginResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_LOGIN_FAILED',
          message:
            error instanceof Error ? error.message : 'Error de autenticación',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(401).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/signup
   * Crea un nuevo usuario
   */
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = signupSchema.parse(req.body);
      const signupData = {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
        role: 'ANALYST' as const,
        ...(validatedData.tenantId ? { tenantId: validatedData.tenantId } : {}),
      };

      // Crear usuario
      const newUser = await AuthService.signup(signupData);

      const response: SuccessResponse<typeof newUser> = {
        success: true,
        data: newUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_SIGNUP_FAILED',
          message:
            error instanceof Error ? error.message : 'Error al crear usuario',
          details: error instanceof ZodError ? error.errors : undefined,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra la sesión del usuario (invalidar token en el cliente)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader
        ? JWTUtil.extractTokenFromHeader(authHeader)
        : null;

      if (token && req.user) {
        const decoded: any = JWTUtil.verifyAccessToken(token);
        const expiresAt = new Date(decoded.exp * 1000);
        await TokenBlacklistUtil.addToBlacklist(token, req.user.id, expiresAt);
      }

      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Sesión cerrada exitosamente',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      // Even if blacklisting fails, return success to the client
      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Sesión cerrada exitosamente',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(200).json(response);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresca el access token usando un refresh token válido
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = refreshTokenSchema.parse(
        req.body
      ) as RefreshTokenRequest;

      // Refrescar token
      const refreshResponse = await AuthService.refreshToken(
        validatedData.refreshToken
      );

      const response: SuccessResponse<typeof refreshResponse> = {
        success: true,
        data: refreshResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_REFRESH_FAILED',
          message:
            error instanceof Error ? error.message : 'Error al refrescar token',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(401).json(errorResponse);
    }
  }

  /**
   * GET /api/auth/profile
   * Obtiene el perfil del usuario autenticado
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }

      const profile = await AuthService.getProfile(req.user.id);

      const response: SuccessResponse<typeof profile> = {
        success: true,
        data: profile,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_PROFILE_FAILED',
          message:
            error instanceof Error ? error.message : 'Error al obtener perfil',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * PUT /api/auth/profile
   * Actualiza el perfil del usuario autenticado
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar datos de entrada
      const validatedData = updateUserSchema.parse(
        req.body
      ) as UpdateUserRequest;

      // Filtrar solo los campos que se van a actualizar
      const updateData: {
        firstName?: string;
        lastName?: string;
        email?: string;
      } = {};
      if (validatedData.firstName !== undefined)
        updateData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined)
        updateData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined)
        updateData.email = validatedData.email;

      // Actualizar perfil
      const updatedProfile = await AuthService.updateProfile(
        req.user.id,
        updateData
      );

      const response: SuccessResponse<typeof updatedProfile> = {
        success: true,
        data: updatedProfile,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_UPDATE_PROFILE_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al actualizar perfil',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario autenticado
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar datos de entrada
      const validatedData = changePasswordSchema.parse(
        req.body
      ) as ChangePasswordRequest;

      // Cambiar contraseña
      await AuthService.changePassword(req.user.id, validatedData);

      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Contraseña cambiada exitosamente',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_CHANGE_PASSWORD_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al cambiar contraseña',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/validate-token
   * Valida un token de acceso
   */
  static async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtil.extractTokenFromHeader(authHeader);

      if (!token) {
        throw new Error('Token no proporcionado');
      }

      const user = await AuthService.validateToken(token);

      const response: SuccessResponse<{ valid: boolean; user: typeof user }> = {
        success: true,
        data: {
          valid: true,
          user,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_TOKEN_VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Token inválido',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(401).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Genera un token para reset de contraseña
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new Error('Email es requerido');
      }

      // Generar token de reset
      const resetToken = await AuthService.generatePasswordResetToken(email);

      // En una implementación completa, aquí se enviaría el email
      // Por ahora, devolvemos el token (solo para desarrollo)
      const response: SuccessResponse<{
        message: string;
        resetToken?: string;
      }> = {
        success: true,
        data: {
          message:
            'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
          ...(process.env['NODE_ENV'] === 'development' && { resetToken }),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_FORGOT_PASSWORD_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al procesar solicitud',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Restablece la contraseña usando un token temporal
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        throw new Error('Token de reset y nueva contraseña son requeridos');
      }

      // Restablecer contraseña
      await AuthService.resetPassword(resetToken, newPassword);

      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Contraseña restablecida exitosamente',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_RESET_PASSWORD_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al restablecer contraseña',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * GET /api/auth/password-strength
   * Evalúa la fortaleza de una contraseña
   */
  static async checkPasswordStrength(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { password } = req.query;

      if (!password || typeof password !== 'string') {
        throw new Error('Contraseña es requerida');
      }

      const strength = PasswordUtil.validatePasswordStrength(password);
      const crackTime = PasswordUtil.estimateCrackTime(password);
      const isCompromised = await PasswordUtil.isPasswordCompromised(password);

      const response: SuccessResponse<{
        strength: typeof strength;
        crackTime: typeof crackTime;
        isCompromised: boolean;
      }> = {
        success: true,
        data: {
          strength,
          crackTime,
          isCompromised,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_PASSWORD_STRENGTH_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al evaluar contraseña',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * GET /api/auth/login-stats
   * Obtiene estadísticas de login del usuario autenticado
   */
  static async getLoginStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }

      const stats = await AuthService.getUserLoginStats(req.user.id);

      const response: SuccessResponse<typeof stats> = {
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_LOGIN_STATS_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Error al obtener estadísticas',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(500).json(errorResponse);
    }
  }
}
