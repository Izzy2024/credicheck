import { Request, Response, NextFunction } from 'express';
import { 
  authenticateToken, 
  requireRole, 
  requireActiveUser, 
  requireAdmin, 
  requireAnalystOrAdmin,
  optionalAuth,
  requireOwnershipOrAdmin,
  checkTokenExpiry,
  logUserActivity,
  userRateLimit
} from '../src/middleware/auth.middleware';
import { JWTUtil, DecodedToken } from '../src/utils/jwt.util';
import { UserResponse } from '../src/models/user.model';

// Extender la interfaz Request para incluir token y user
declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
      token?: DecodedToken;
    }
  }
}

// Mock de JWTUtil
jest.mock('../src/utils/jwt.util');
const mockJWTUtil = JWTUtil as jest.Mocked<typeof JWTUtil>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser: UserResponse = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ANALYST',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDecodedToken = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'ANALYST' as const,
    type: 'access' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtil.verifyAccessToken.mockReturnValue(mockDecodedToken);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJWTUtil.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${token}`);
      expect(mockJWTUtil.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockRequest.token).toEqual(mockDecodedToken);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(mockDecodedToken.userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      mockRequest.headers = {};
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_MISSING',
            message: 'Token de acceso requerido',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtil.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_INVALID',
            message: 'Token de acceso inválido',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      const token = 'expired-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtil.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expirado');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_EXPIRED',
            message: 'Token de acceso expirado',
          }),
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should allow user with correct role', () => {
      mockRequest.user = { ...mockUser, role: 'ADMIN' };
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow user with one of multiple allowed roles', () => {
      mockRequest.user = { ...mockUser, role: 'ANALYST' };
      const middleware = requireRole('ANALYST', 'ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      mockRequest.user = { ...mockUser, role: 'ANALYST' };
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_INSUFFICIENT_PERMISSIONS',
            message: 'Permisos insuficientes para acceder a este recurso',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without user', () => {
      mockRequest.user = undefined;
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireActiveUser', () => {
    it('should allow active user', () => {
      mockRequest.user = { ...mockUser, isActive: true };

      requireActiveUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject inactive user', () => {
      mockRequest.user = { ...mockUser, isActive: false };

      requireActiveUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTH_ACCOUNT_DISABLED',
            message: 'Cuenta deshabilitada. Contacte al administrador',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without user', () => {
      mockRequest.user = undefined;

      requireActiveUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      mockRequest.user = { ...mockUser, role: 'ADMIN' };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-admin user', () => {
      mockRequest.user = { ...mockUser, role: 'ANALYST' };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnalystOrAdmin', () => {
    it('should allow analyst user', () => {
      mockRequest.user = { ...mockUser, role: 'ANALYST' };

      requireAnalystOrAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin user', () => {
      mockRequest.user = { ...mockUser, role: 'ADMIN' };

      requireAnalystOrAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate valid token', async () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtil.verifyAccessToken.mockReturnValue(mockDecodedToken);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication if no token', async () => {
      mockRequest.headers = {};
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication if invalid token', async () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      mockJWTUtil.extractTokenFromHeader.mockReturnValue(token);
      mockJWTUtil.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow owner to access their own data', () => {
      mockRequest.user = { ...mockUser, id: 'user-123' };
      mockRequest.params = { id: 'user-123' };
      const middleware = requireOwnershipOrAdmin();

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin to access any data', () => {
      mockRequest.user = { ...mockUser, id: 'admin-123', role: 'ADMIN' };
      mockRequest.params = { id: 'user-456' };
      const middleware = requireOwnershipOrAdmin();

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-owner non-admin', () => {
      mockRequest.user = { ...mockUser, id: 'user-123', role: 'ANALYST' };
      mockRequest.params = { id: 'user-456' };
      const middleware = requireOwnershipOrAdmin();

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', () => {
      mockRequest.user = { ...mockUser, id: 'user-123' };
      mockRequest.params = { userId: 'user-123' };
      const middleware = requireOwnershipOrAdmin('userId');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkTokenExpiry', () => {
    it('should set refresh headers for near-expiry token', () => {
      const nearExpiryToken = {
        ...mockDecodedToken,
        exp: Math.floor(Date.now() / 1000) + 200, // 200 seconds
      };
      mockRequest.token = nearExpiryToken;
      
      mockJWTUtil.isTokenNearExpiry.mockReturnValue(true);
      mockJWTUtil.getTimeUntilExpiry.mockReturnValue(200);

      checkTokenExpiry(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Token-Refresh-Needed', 'true');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Token-Expires-In', '200');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set headers for token with time left', () => {
      mockRequest.token = mockDecodedToken;
      mockJWTUtil.isTokenNearExpiry.mockReturnValue(false);

      checkTokenExpiry(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without token', () => {
      mockRequest.token = undefined;

      checkTokenExpiry(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logUserActivity', () => {
    it('should log activity for authenticated user', () => {
      mockRequest.user = mockUser;
      mockRequest.method = 'GET';
      mockRequest.path = '/api/test';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logUserActivity(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`User activity: ${mockUser.email} - GET /api/test`)
      );
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not log for unauthenticated user', () => {
      mockRequest.user = undefined;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logUserActivity(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('userRateLimit', () => {
    it('should allow requests within limit', () => {
      mockRequest.user = mockUser;
      const middleware = userRateLimit(5, 60000); // 5 requests per minute

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue for unauthenticated user', () => {
      mockRequest.user = undefined;
      const middleware = userRateLimit(5, 60000);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      mockRequest.user = mockUser;
      const middleware = userRateLimit(2, 60000); // 2 requests per minute

      // First two requests should pass
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Demasiadas solicitudes. Intente nuevamente más tarde',
          }),
        })
      );
      expect(mockNext).toHaveBeenCalledTimes(2); // Should not be called for third request
    });
  });
});