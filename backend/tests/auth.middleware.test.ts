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
  userRateLimit,
} from '../src/middleware/auth.middleware';
import { JWTUtil } from '../src/utils/jwt.util';
import { TokenBlacklistUtil } from '../src/utils/token-blacklist.util';
import logger from '../src/utils/logger.util';
import { prisma } from '../src/config/database.config';

jest.mock('../src/utils/jwt.util');
jest.mock('../src/utils/token-blacklist.util', () => ({
  TokenBlacklistUtil: {
    isBlacklisted: jest.fn(),
  },
}));
jest.mock('../src/config/database.config', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('../src/utils/logger.util', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
  logContext: {
    authError: jest.fn(() => ({})),
    userActivity: jest.fn(() => ({})),
  },
}));

type MockRequest = Partial<Request> & {
  user?: Request['user'];
  token?: Request['token'];
  headers: Record<string, string>;
  params?: Record<string, string>;
  method?: string;
  path?: string;
  ip?: string;
};

describe('Auth Middleware', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'ANALYST' as const,
    tenantId: 'default',
    isActive: true,
  };

  const mockDecodedToken = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'ANALYST' as const,
    tenantId: 'default',
    type: 'access' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
      ip: '127.0.0.1',
      method: 'GET',
      path: '/api/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    (TokenBlacklistUtil.isBlacklisted as jest.Mock).mockResolvedValue(false);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ isActive: true });
  });

  describe('authenticateToken', () => {
    it('authenticates a valid token and stores req.user/req.token', async () => {
      const token = 'valid-token';
      mockRequest.headers.authorization = `Bearer ${token}`;
      (JWTUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
      (JWTUtil.isValidJWTFormat as jest.Mock).mockReturnValue(true);
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockDecodedToken);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.token).toEqual(mockDecodedToken);
      expect(mockRequest.user).toEqual({
        id: mockDecodedToken.userId,
        email: mockDecodedToken.email,
        role: mockDecodedToken.role,
        tenantId: mockDecodedToken.tenantId,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('rejects missing token', async () => {
      (JWTUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('rejects revoked token', async () => {
      const token = 'revoked-token';
      mockRequest.headers.authorization = `Bearer ${token}`;
      (JWTUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
      (JWTUtil.isValidJWTFormat as jest.Mock).mockReturnValue(true);
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (TokenBlacklistUtil.isBlacklisted as jest.Mock).mockResolvedValue(true);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole helpers', () => {
    it('allows matching role', () => {
      mockRequest.user = { ...mockUser, role: 'ADMIN' };
      requireRole('ADMIN')(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('blocks mismatched role', () => {
      mockRequest.user = mockUser;
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('allows analyst or admin', () => {
      mockRequest.user = mockUser;
      requireAnalystOrAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireActiveUser', () => {
    it('allows active user from DB', async () => {
      mockRequest.user = mockUser;
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ isActive: true });

      await requireActiveUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user?.isActive).toBe(true);
    });

    it('rejects inactive user from DB', async () => {
      mockRequest.user = mockUser;
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ isActive: false });

      await requireActiveUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'AUTH_ACCOUNT_DISABLED' }),
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('continues without token', () => {
      (JWTUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('hydrates user when token is valid', () => {
      const token = 'valid-token';
      mockRequest.headers.authorization = `Bearer ${token}`;
      (JWTUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
      (JWTUtil.isValidJWTFormat as jest.Mock).mockReturnValue(true);
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockDecodedToken);

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user?.tenantId).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('allows owner', () => {
      mockRequest.user = { ...mockUser, id: 'owner-id' };
      mockRequest.params = { id: 'owner-id' };

      requireOwnershipOrAdmin()(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('blocks non-owner non-admin', () => {
      mockRequest.user = { ...mockUser, id: 'user-1', role: 'ANALYST' };
      mockRequest.params = { id: 'user-2' };

      requireOwnershipOrAdmin()(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('checkTokenExpiry', () => {
    it('sets headers when token is near expiry', () => {
      mockRequest.token = mockDecodedToken;
      (JWTUtil.isTokenNearExpiry as jest.Mock).mockReturnValue(true);
      (JWTUtil.getTimeUntilExpiry as jest.Mock).mockReturnValue(200);

      checkTokenExpiry(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Token-Refresh-Needed', 'true');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Token-Expires-In', '200');
    });
  });

  describe('logUserActivity', () => {
    it('logs authenticated activity through logger', () => {
      mockRequest.user = mockUser;
      logUserActivity(mockRequest as Request, mockResponse as Response, mockNext);
      expect(logger.info).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('userRateLimit', () => {
    it('blocks after limit is exceeded', () => {
      mockRequest.user = mockUser;
      const middleware = userRateLimit(2, 60000);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });
  });
});
