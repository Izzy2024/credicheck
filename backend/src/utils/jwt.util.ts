import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';

// Interfaz para el payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ANALYST' | 'ADMIN';
  tenantId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Interfaz para tokens generados
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Interfaz para token decodificado
export interface DecodedToken {
  userId: string;
  email: string;
  role: 'ANALYST' | 'ADMIN';
  tenantId?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Clase para manejo de JWT
export class JWTUtil {
  // Generar par de tokens (access y refresh)
  static generateTokens(
    userId: string,
    email: string,
    role: 'ANALYST' | 'ADMIN',
    tenantId?: string
  ): TokenPair {
    const accessTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email,
      role,
      ...(tenantId ? { tenantId } : {}),
      type: 'access',
    };

    const refreshTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email,
      role,
      ...(tenantId ? { tenantId } : {}),
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      config.jwt.accessSecret,
      {
        expiresIn: config.jwt.accessExpiresIn,
        issuer: 'credicheck-api',
        audience: 'credicheck-client',
        jwtid: randomUUID(),
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'credicheck-api',
        audience: 'credicheck-client',
        jwtid: randomUUID(),
      } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpiresIn,
    };
  }

  // Verificar access token
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'credicheck-api',
        audience: 'credicheck-client',
      }) as JWTPayload;

      if (decoded.type !== 'access') {
        throw new Error('Token inválido: tipo incorrecto');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      throw error;
    }
  }

  // Verificar refresh token
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'credicheck-api',
        audience: 'credicheck-client',
      }) as JWTPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido: tipo incorrecto');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }

  // Decodificar token sin verificar (para debugging)
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  // Obtener tiempo de expiración de un token
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  // Verificar si un token está próximo a expirar (dentro de 5 minutos)
  static isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    return expiration <= fiveMinutesFromNow;
  }

  // Extraer token del header Authorization
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }

  // Generar nuevo access token usando refresh token
  static refreshAccessToken(refreshToken: string): { accessToken: string; expiresIn: string } {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    const accessTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.tenantId ? { tenantId: decoded.tenantId } : {}),
      type: 'access',
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      config.jwt.accessSecret,
      { 
        expiresIn: config.jwt.accessExpiresIn,
        issuer: 'credicheck-api',
        audience: 'credicheck-client',
      } as jwt.SignOptions
    );

    return {
      accessToken,
      expiresIn: config.jwt.accessExpiresIn,
    };
  }

  // Validar formato de token JWT
  static isValidJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  // Obtener información del usuario desde el token
  static getUserInfoFromToken(token: string): { userId: string; email: string; role: 'ANALYST' | 'ADMIN'; tenantId?: string } | null {
    try {
      const decoded = this.verifyAccessToken(token);
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        ...(decoded.tenantId ? { tenantId: decoded.tenantId } : {}),
      };
    } catch {
      return null;
    }
  }

  // Verificar si un token está próximo a expirar (menos de 5 minutos)
  static isTokenNearExpiry(token: DecodedToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = token.exp - now;
    return timeUntilExpiry < 300; // 5 minutos
  }

  // Obtener el tiempo restante hasta la expiración en segundos
  static getTimeUntilExpiry(token: DecodedToken): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, token.exp - now);
  }

  // Generar un nuevo access token usando un refresh token válido
  static refreshAccessTokenFull(refreshToken: string): TokenPair {
    const decoded = this.verifyRefreshToken(refreshToken);

    return this.generateTokens(
      decoded.userId,
      decoded.email,
      decoded.role,
      decoded.tenantId
    );
  }

  // Decodificar un token sin verificar la firma (para debugging)
  static decodeTokenUnsafe(token: string): any {
    return jwt.decode(token);
  }

  // Verificar si un token es válido sin lanzar excepciones
  static isValidAccessToken(token: string): boolean {
    try {
      this.verifyAccessToken(token);
      return true;
    } catch {
      return false;
    }
  }

  // Verificar si un refresh token es válido sin lanzar excepciones
  static isValidRefreshToken(token: string): boolean {
    try {
      this.verifyRefreshToken(token);
      return true;
    } catch {
      return false;
    }
  }

  // Generar un token temporal para operaciones específicas (ej: reset password)
  static generateTemporaryToken(userId: string, purpose: string, expiresIn: string = '1h'): string {
    const payload = {
      userId,
      purpose,
      type: 'temporary',
    };

    return jwt.sign(payload, config.jwt.accessSecret, { expiresIn } as jwt.SignOptions);
  }

  // Verificar un token temporal
  static verifyTemporaryToken(token: string, expectedPurpose: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      
      if (decoded.type !== 'temporary' || decoded.purpose !== expectedPurpose) {
        throw new Error('Token temporal inválido');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token temporal expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token temporal inválido');
      }
      throw error;
    }
  }
}