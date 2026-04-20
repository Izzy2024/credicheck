import { JWTUtil, JWTPayload, DecodedToken } from '../src/utils/jwt.util';
import { config } from '../src/config/env.config';
import jwt from 'jsonwebtoken';

describe('JWTUtil', () => {
  const testUserId = 'test-user-id';
  const testEmail = 'test@example.com';
  const testRole = 'ANALYST' as const;

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.expiresIn).toBe(config.jwt.accessExpiresIn);
    });

    it('should generate tokens with correct payload structure', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);

      // Decodificar sin verificar para inspeccionar el payload
      const accessPayload = jwt.decode(tokens.accessToken) as JWTPayload;
      const refreshPayload = jwt.decode(tokens.refreshToken) as JWTPayload;

      expect(accessPayload.userId).toBe(testUserId);
      expect(accessPayload.email).toBe(testEmail);
      expect(accessPayload.role).toBe(testRole);
      expect(accessPayload.type).toBe('access');

      expect(refreshPayload.userId).toBe(testUserId);
      expect(refreshPayload.email).toBe(testEmail);
      expect(refreshPayload.role).toBe(testRole);
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      const decoded = JWTUtil.verifyAccessToken(tokens.accessToken);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe(testRole);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtil.verifyAccessToken('invalid-token');
      }).toThrow('Token inválido');
    });

    it('should throw error for refresh token used as access token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      
      expect(() => {
        JWTUtil.verifyAccessToken(tokens.refreshToken);
      }).toThrow('Token inválido');
    });

    it('should throw error for expired token', () => {
      // Crear token que expira inmediatamente
      const expiredToken = jwt.sign(
        { userId: testUserId, email: testEmail, role: testRole, type: 'access' },
        config.jwt.accessSecret,
        { expiresIn: '0s' }
      );

      // Esperar un poco para que expire
      setTimeout(() => {
        expect(() => {
          JWTUtil.verifyAccessToken(expiredToken);
        }).toThrow('Token expirado');
      }, 100);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      const decoded = JWTUtil.verifyRefreshToken(tokens.refreshToken);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe(testRole);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for access token used as refresh token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      
      expect(() => {
        JWTUtil.verifyRefreshToken(tokens.accessToken);
      }).toThrow('Refresh token inválido');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token';
      const header = `Bearer ${token}`;
      
      const extracted = JWTUtil.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      expect(JWTUtil.extractTokenFromHeader('InvalidFormat token')).toBeNull();
      expect(JWTUtil.extractTokenFromHeader('Bearer')).toBeNull();
      expect(JWTUtil.extractTokenFromHeader('Bearer token extra')).toBeNull();
    });

    it('should return null for undefined header', () => {
      expect(JWTUtil.extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe('isTokenNearExpiry', () => {
    it('should return true for token expiring in less than 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const tokenNearExpiry: DecodedToken = {
        userId: testUserId,
        email: testEmail,
        role: testRole,
        type: 'access',
        iat: now - 3600,
        exp: now + 200, // 200 segundos = ~3 minutos
      };

      expect(JWTUtil.isTokenNearExpiry(tokenNearExpiry)).toBe(true);
    });

    it('should return false for token with more than 5 minutes left', () => {
      const now = Math.floor(Date.now() / 1000);
      const tokenNotNearExpiry: DecodedToken = {
        userId: testUserId,
        email: testEmail,
        role: testRole,
        type: 'access',
        iat: now - 3600,
        exp: now + 600, // 600 segundos = 10 minutos
      };

      expect(JWTUtil.isTokenNearExpiry(tokenNotNearExpiry)).toBe(false);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return correct time until expiry', () => {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = 300; // 5 minutos
      const token: DecodedToken = {
        userId: testUserId,
        email: testEmail,
        role: testRole,
        type: 'access',
        iat: now - 3600,
        exp: now + timeUntilExpiry,
      };

      const result = JWTUtil.getTimeUntilExpiry(token);
      expect(result).toBeCloseTo(timeUntilExpiry, -1); // Permitir diferencia de ~10 segundos
    });

    it('should return 0 for expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken: DecodedToken = {
        userId: testUserId,
        email: testEmail,
        role: testRole,
        type: 'access',
        iat: now - 3600,
        exp: now - 100, // Expirado hace 100 segundos
      };

      expect(JWTUtil.getTimeUntilExpiry(expiredToken)).toBe(0);
    });
  });

  describe('refreshAccessTokenFull', () => {
    it('should generate new tokens from valid refresh token', () => {
      const originalTokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      const newTokens = JWTUtil.refreshAccessTokenFull(originalTokens.refreshToken);

      expect(newTokens).toHaveProperty('accessToken');
      expect(newTokens).toHaveProperty('refreshToken');
      expect(newTokens.accessToken).not.toBe(originalTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(originalTokens.refreshToken);

      // Verificar que los nuevos tokens son válidos
      const decoded = JWTUtil.verifyAccessToken(newTokens.accessToken);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe(testRole);
    });
  });

  describe('isValidAccessToken', () => {
    it('should return true for valid access token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      expect(JWTUtil.isValidAccessToken(tokens.accessToken)).toBe(true);
    });

    it('should return false for invalid token', () => {
      expect(JWTUtil.isValidAccessToken('invalid-token')).toBe(false);
    });

    it('should return false for refresh token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      expect(JWTUtil.isValidAccessToken(tokens.refreshToken)).toBe(false);
    });
  });

  describe('isValidRefreshToken', () => {
    it('should return true for valid refresh token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      expect(JWTUtil.isValidRefreshToken(tokens.refreshToken)).toBe(true);
    });

    it('should return false for invalid token', () => {
      expect(JWTUtil.isValidRefreshToken('invalid-token')).toBe(false);
    });

    it('should return false for access token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      expect(JWTUtil.isValidRefreshToken(tokens.accessToken)).toBe(false);
    });
  });

  describe('getUserInfoFromToken', () => {
    it('should extract user info from valid token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      const userInfo = JWTUtil.getUserInfoFromToken(tokens.accessToken);

      expect(userInfo).not.toBeNull();
      expect(userInfo!.userId).toBe(testUserId);
      expect(userInfo!.email).toBe(testEmail);
      expect(userInfo!.role).toBe(testRole);
    });
  });

  describe('generateTemporaryToken', () => {
    it('should generate temporary token with purpose', () => {
      const purpose = 'password-reset';
      const token = JWTUtil.generateTemporaryToken(testUserId, purpose);

      expect(typeof token).toBe('string');
      
      // Decodificar para verificar estructura
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.purpose).toBe(purpose);
      expect(decoded.type).toBe('temporary');
    });
  });

  describe('verifyTemporaryToken', () => {
    it('should verify temporary token with correct purpose', () => {
      const purpose = 'password-reset';
      const token = JWTUtil.generateTemporaryToken(testUserId, purpose);
      const decoded = JWTUtil.verifyTemporaryToken(token, purpose);

      expect(decoded.userId).toBe(testUserId);
    });

    it('should throw error for wrong purpose', () => {
      const token = JWTUtil.generateTemporaryToken(testUserId, 'password-reset');
      
      expect(() => {
        JWTUtil.verifyTemporaryToken(token, 'email-verification');
      }).toThrow('Token temporal inválido');
    });

    it('should throw error for non-temporary token', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      
      expect(() => {
        JWTUtil.verifyTemporaryToken(tokens.accessToken, 'password-reset');
      }).toThrow('Token temporal inválido');
    });
  });

  describe('decodeTokenUnsafe', () => {
    it('should decode token without verification', () => {
      const tokens = JWTUtil.generateTokens(testUserId, testEmail, testRole);
      const decoded = JWTUtil.decodeTokenUnsafe(tokens.accessToken);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe(testRole);
      expect(decoded.type).toBe('access');
    });

    it('should decode even invalid tokens', () => {
      // Crear token con firma inválida pero estructura válida
      const invalidToken = jwt.sign(
        { userId: testUserId, email: testEmail, role: testRole, type: 'access' },
        'wrong-secret'
      );

      const decoded = JWTUtil.decodeTokenUnsafe(invalidToken);
      expect(decoded.userId).toBe(testUserId);
    });
  });
});