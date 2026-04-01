import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
  toggleUserStatusSchema,
} from '../schemas/user.schema';
import { PasswordUtil } from '../utils/password.util';
import { ZodError } from 'zod';

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

export class UserController {
  /**
   * GET /api/v1/users
   * Obtener lista de usuarios con filtros y paginación
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Validar parámetros de consulta con el nuevo schema
      const queryParams = getUsersQuerySchema.parse(req.query);

      // Construir filtros
      const where: any = {
        deletedAt: null, // Excluir usuarios eliminados (soft delete)
      };

      if (queryParams.search) {
        where.OR = [
          { firstName: { contains: queryParams.search, mode: 'insensitive' } },
          { lastName: { contains: queryParams.search, mode: 'insensitive' } },
          { email: { contains: queryParams.search, mode: 'insensitive' } },
        ];
      }

      if (queryParams.role) {
        where.role = queryParams.role;
      }

      if (queryParams.isActive !== undefined) {
        where.isActive = queryParams.isActive;
      }

      // Calcular offset para paginación
      const offset = (queryParams.page - 1) * queryParams.limit;

      // Obtener usuarios
      const users = await prisma.user.findMany({
        where,
        skip: offset,
        take: queryParams.limit,
        orderBy: {
          [queryParams.sortBy]: queryParams.sortOrder,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Obtener total para paginación
      const total = await prisma.user.count({ where });

      const response: SuccessResponse<{
        users: typeof users;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }> = {
        success: true,
        data: {
          users,
          pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total,
            totalPages: Math.ceil(total / queryParams.limit),
            hasNext: offset + queryParams.limit < total,
            hasPrev: queryParams.page > 1,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al obtener usuarios',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Obtener un usuario específico por ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = userIdParamSchema.parse(req.params);

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: SuccessResponse<typeof user> = {
        success: true,
        data: user,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID de usuario inválido',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al obtener usuario',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * POST /api/v1/users
   * Crear un nuevo usuario
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validatedData = createUserSchema.parse(req.body);

      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Ya existe un usuario con este email',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(409).json(errorResponse);
        return;
      }

      // Hashear contraseña
      const passwordHash = await PasswordUtil.hashPassword(
        validatedData.password
      );

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role || 'ANALYST',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

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
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de usuario inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al crear usuario',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Actualizar un usuario existente
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);

      // NUEVO: Protección contra auto-modificación de rol o desactivación
      if (req.user && req.user.id === id) {
        // No permitir que un admin cambie su propio rol
        if (validatedData.role && validatedData.role !== req.user.role) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'CANNOT_MODIFY_OWN_ROLE',
              message:
                'No puedes cambiar tu propio rol. Solicita a otro administrador que lo haga.',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] as string,
            },
          };
          res.status(400).json(errorResponse);
          return;
        }

        // No permitir que un admin se desactive a sí mismo
        if (validatedData.isActive === false) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'CANNOT_DEACTIVATE_SELF',
              message:
                'No puedes desactivar tu propia cuenta. Solicita a otro administrador que lo haga.',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] as string,
            },
          };
          res.status(400).json(errorResponse);
          return;
        }
      }

      // Verificar que el usuario existe y no está eliminado
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.deletedAt) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      // Si se está actualizando el email, verificar que no esté en uso
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: validatedData.email },
        });

        if (emailExists) {
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'El email ya está en uso por otro usuario',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] as string,
            },
          };
          res.status(409).json(errorResponse);
          return;
        }
      }

      // Preparar datos de actualización
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validatedData.firstName !== undefined)
        updateData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined)
        updateData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined)
        updateData.email = validatedData.email;
      if (validatedData.role !== undefined)
        updateData.role = validatedData.role;
      if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: SuccessResponse<typeof updatedUser> = {
        success: true,
        data: updatedUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de actualización inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al actualizar usuario',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Eliminar un usuario (soft delete)
   * CORREGIDO: Ahora usa deletedAt apropiadamente
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = userIdParamSchema.parse(req.params);

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.deletedAt) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      // No permitir que un usuario se elimine a sí mismo
      if (req.user && req.user.id === id) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'No puedes eliminar tu propia cuenta',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Soft delete: marcar como eliminado con timestamp
      const deletedUser = await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(), // CORREGIDO: Ahora usa deletedAt
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: SuccessResponse<typeof deletedUser> = {
        success: true,
        data: deletedUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID de usuario inválido',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al eliminar usuario',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * POST /api/v1/users/:id/toggle-status
   * Activar/desactivar un usuario
   * CORREGIDO: Ahora usa el body de la request
   */
  static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const { isActive } = toggleUserStatusSchema.parse(req.body);

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.deletedAt) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      // No permitir que un usuario se desactive a sí mismo
      if (req.user && req.user.id === id && isActive === false) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'CANNOT_DEACTIVATE_SELF',
            message: 'No puedes desactivar tu propia cuenta',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      // CORREGIDO: Usar el valor del body en lugar de alternar
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isActive: isActive,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: SuccessResponse<typeof updatedUser> = {
        success: true,
        data: updatedUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al cambiar estado del usuario',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * GET /api/v1/users/stats
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const [totalUsers, activeUsers, adminUsers, analystUsers, recentUsers] =
        await Promise.all([
          prisma.user.count({ where: { deletedAt: null } }),
          prisma.user.count({ where: { isActive: true, deletedAt: null } }),
          prisma.user.count({
            where: { role: 'ADMIN', isActive: true, deletedAt: null },
          }),
          prisma.user.count({
            where: { role: 'ANALYST', isActive: true, deletedAt: null },
          }),
          prisma.user.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              createdAt: true,
            },
          }),
        ]);

      const response: SuccessResponse<{
        total: number;
        active: number;
        inactive: number;
        admins: number;
        analysts: number;
        recentUsers: typeof recentUsers;
      }> = {
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          admins: adminUsers,
          analysts: analystUsers,
          recentUsers,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: _req.headers['x-request-id'] as string,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al obtener estadísticas de usuarios',
          timestamp: new Date().toISOString(),
          requestId: _req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(errorResponse);
    }
  }
}
