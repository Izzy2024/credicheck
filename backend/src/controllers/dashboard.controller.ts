import { Request, Response } from 'express';
import { prisma } from '../config/database.config';

export class DashboardController {
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || 'default';
      const now = new Date();
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const tomorrow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );

      const queriesToday = await prisma.searchHistory.count({
        where: {
          tenantId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const activeReferences = await prisma.creditReference.count({
        where: { debtStatus: 'ACTIVE', deletedAt: null, tenantId },
      });

      const activeUsers = await prisma.user.count({
        where: { isActive: true, tenantId },
      });

      const totalSearches = await prisma.searchHistory.count({
        where: { tenantId },
      });
      const searchesWithResults = await prisma.searchHistory.count({
        where: { tenantId, resultsCount: { gt: 0 } },
      });

      const matchRate =
        totalSearches > 0 ? (searchesWithResults / totalSearches) * 100 : 0;

      // References by month (last 12 months)
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );
      const allReferences = await prisma.creditReference.findMany({
        where: { createdAt: { gte: twelveMonthsAgo }, deletedAt: null, tenantId },
        select: { createdAt: true },
      });
      const monthMap = new Map<string, number>();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, 0);
      }
      allReferences.forEach(r => {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
      });
      const referencesByMonth = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // References by status
      const statusCounts = await prisma.creditReference.groupBy({
        by: ['debtStatus'],
        _count: true,
        where: { deletedAt: null, tenantId },
      });
      const referencesByStatus = statusCounts.map(r => ({
        status: r.debtStatus,
        count: r._count,
      }));

      // Searches by day (last 30 days)
      const thirtyDaysAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30
      );
      const allSearches = await prisma.searchHistory.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, tenantId },
        select: { createdAt: true },
      });
      const dayMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i
        );
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dayMap.set(key, 0);
      }
      allSearches.forEach(r => {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dayMap.has(key)) {
          dayMap.set(key, (dayMap.get(key) || 0) + 1);
        }
      });
      const searchesByDay = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      // Top searched
      const topSearchedRaw = await prisma.searchHistory.groupBy({
        by: ['searchTerm'],
        _count: true,
        where: { tenantId },
        orderBy: { _count: { searchTerm: 'desc' } },
        take: 10,
      });
      const topSearched = topSearchedRaw.map(r => ({
        name: r.searchTerm,
        count: r._count,
      }));

      // Recent activity from AuditLog
      let recentActivity: any[] = [];
      try {
        const logs = await prisma.auditLog.findMany({
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        });
        recentActivity = logs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          details: log.details,
          userName: `${log.user.firstName} ${log.user.lastName}`,
          createdAt: log.createdAt.toISOString(),
        }));
      } catch (auditError) {
        console.log('AuditLog table may not exist yet:', auditError);
      }

      res.status(200).json({
        success: true,
        data: {
          queriesToday,
          activeReferences,
          activeUsers,
          matchRate: matchRate.toFixed(2),
          referencesByMonth,
          referencesByStatus,
          topSearched,
          recentActivity,
          searchesByDay,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }
}
