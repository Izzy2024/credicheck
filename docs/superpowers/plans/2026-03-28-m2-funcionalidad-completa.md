# M2 - Funcionalidad Completa: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar las 8 features pendientes de M2: auditoría, token blacklist, admin dashboard con gráficos, settings, export PDF/CSV/Excel.

**Architecture:** Backend-first approach. Cada tarea agrega modelos Prisma + endpoints backend + frontend. Las migraciones se corren una vez al inicio. Los 8 tasks son secuenciales porque cada uno puede depender del anterior (especialmente el modelo AuditLog que usan otros features).

**Tech Stack:** Next.js 15, Express, TypeScript, Prisma, SQLite, recharts (shadcn chart), jsPDF, exceljs

**Spec:** `docs/superpowers/specs/2026-03-28-m2-funcionalidad-completa-design.md`

---

## File Structure

### Backend - New Files

- `backend/prisma/migrations/` - Nueva migración con 3 tablas
- `backend/src/controllers/audit.controller.ts` - AuditLog CRUD
- `backend/src/controllers/settings.controller.ts` - AppConfig CRUD
- `backend/src/routes/audit.routes.ts` - Audit endpoints
- `backend/src/routes/settings.routes.ts` - Settings endpoints
- `backend/src/schemas/audit.schema.ts` - Zod schemas for audit
- `backend/src/schemas/settings.schema.ts` - Zod schemas for settings
- `backend/src/services/export.service.ts` - CSV/Excel generation

### Backend - Modified Files

- `backend/prisma/schema.prisma` - Add AuditLog, TokenBlacklist, AppConfig + User back-relations
- `backend/src/app.ts` - Register new routes
- `backend/src/middleware/admin.middleware.ts` - logAdminAction writes to DB, fix validateRecordIds
- `backend/src/middleware/auth.middleware.ts` - Check token blacklist in authenticateToken
- `backend/src/controllers/auth.controller.ts` - Logout writes to TokenBlacklist
- `backend/src/controllers/dashboard.controller.ts` - Extended stats with chart data
- `backend/src/routes/dashboard.routes.ts` - No changes needed
- `backend/src/routes/credit-reference.routes.ts` - Add export and pdf-data endpoints

### Frontend - New Files

- `app/admin/page.tsx` - Admin dashboard with charts
- `app/admin/settings/page.tsx` - Settings page with tabs

### Frontend - Modified Files

- `lib/auth-context.tsx` - Logout calls backend endpoint
- `app/admin/layout.tsx` - handleLogout calls backend
- `app/admin/records/_components/records-management.tsx` - Replace CSV export with backend call
- `app/results/found/page.tsx` - Add PDF export with jsPDF
- `app/history/page.tsx` - Add export button handler

---

## Task 1: M2.7 - AuditLog (Prisma Model + Middleware + Endpoint)

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/middleware/admin.middleware.ts`
- Create: `backend/src/controllers/audit.controller.ts`
- Create: `backend/src/routes/audit.routes.ts`
- Create: `backend/src/schemas/audit.schema.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Add AuditLog model to Prisma schema**

Add to `backend/prisma/schema.prisma` after the SearchHistory model:

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  action     String
  resource   String
  resourceId String?  @map("resource_id")
  details    String?
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
}
```

Add to the `User` model (before `@@map("users")`):

```prisma
  auditLogs        AuditLog[]
```

- [ ] **Step 2: Run Prisma migration**

Run: `npx prisma migrate dev --name add_audit_log --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`
Expected: Migration created and applied successfully

- [ ] **Step 3: Update logAdminAction middleware to write to DB**

In `backend/src/middleware/admin.middleware.ts`, replace the `logAction` function:

```typescript
async function logAction(req: Request, action: string, _responseData: any) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action,
        resource: req.path.split("/")[1] || "unknown",
        resourceId: req.params.id || null,
        details: JSON.stringify({
          method: req.method,
          path: req.path,
          body: req.body ? Object.keys(req.body) : [],
        }),
        ipAddress: req.ip || req.socket.remoteAddress || "",
        userAgent: req.get("User-Agent") || "",
      },
    });
  } catch (error) {
    console.error("Error registrando acción de administrador:", error);
  }
}
```

- [ ] **Step 4: Fix validateRecordIds to accept CUIDs**

In `backend/src/middleware/admin.middleware.ts`, replace the UUID regex in `validateRecordIds`:

```typescript
const cuidRegex = /^[a-z0-9]{20,}$/i;
return !cuidRegex.test(id);
```

- [ ] **Step 5: Create audit schema**

Create `backend/src/schemas/audit.schema.ts`:

```typescript
import { z } from "zod";

export const getAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});
```

- [ ] **Step 6: Create audit controller**

Create `backend/src/controllers/audit.controller.ts`:

```typescript
import { Request, Response } from "express";
import { prisma } from "../config/database.config";
import { getAuditLogsSchema } from "../schemas/audit.schema";
import { ZodError } from "zod";

export class AuditController {
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = getAuditLogsSchema.parse(req.query);
      const { page, limit, action, resource, userId, fromDate, toDate } =
        filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (action) where.action = action;
      if (resource) where.resource = resource;
      if (userId) where.userId = userId;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Parámetros inválidos",
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }
      console.error("Error getting audit logs:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}
```

- [ ] **Step 7: Create audit routes**

Create `backend/src/routes/audit.routes.ts`:

```typescript
import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.use((req, _res, next) => {
  console.log(
    `Audit Route: ${req.method} ${req.path} - ${new Date().toISOString()}`,
  );
  next();
});

router.get("/", authenticateToken, requireAdmin, AuditController.getAuditLogs);

export default router;
```

- [ ] **Step 8: Register audit routes in app.ts**

In `backend/src/app.ts`, add import:

```typescript
import auditRoutes from "./routes/audit.routes";
```

Add route registration after the user routes line:

```typescript
app.use(`/api/${config.server.apiVersion}/audit`, auditRoutes);
```

- [ ] **Step 9: Test the migration and endpoint**

Run: `npx prisma generate --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`

Then start backend and test:

```bash
curl -H "Authorization: Bearer <admin_token>" http://localhost:3002/api/v1/audit
```

Expected: `{"success":true,"data":[],"meta":{"page":1,"limit":20,"total":0,"totalPages":0,...}}`

- [ ] **Step 10: Commit**

```bash
git add backend/prisma/ backend/src/middleware/admin.middleware.ts backend/src/controllers/audit.controller.ts backend/src/routes/audit.routes.ts backend/src/schemas/audit.schema.ts backend/src/app.ts
git commit -m "feat(M2.7): add AuditLog model, middleware DB logging, and audit endpoint"
```

---

## Task 2: M2.6 - Token Blacklist (Prisma Model + Auth Changes)

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/middleware/auth.middleware.ts`
- Modify: `backend/src/controllers/auth.controller.ts`
- Modify: `lib/auth-context.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Add TokenBlacklist model to Prisma schema**

Add to `backend/prisma/schema.prisma` after AuditLog model:

```prisma
model TokenBlacklist {
  id         String   @id @default(cuid())
  tokenHash  String   @unique @map("token_hash")
  userId     String   @map("user_id")
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")
  user       User     @relation(fields: [userId], references: [id])

  @@index([tokenHash])
  @@index([expiresAt])
  @@map("token_blacklist")
}
```

Add to the `User` model:

```prisma
  tokenBlacklists  TokenBlacklist[]
```

- [ ] **Step 2: Run Prisma migration**

Run: `npx prisma migrate dev --name add_token_blacklist --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`

- [ ] **Step 3: Create token blacklist utility**

Create `backend/src/utils/token-blacklist.util.ts`:

```typescript
import { createHash } from "crypto";
import { prisma } from "../config/database.config";

export class TokenBlacklistUtil {
  private static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    const hash = this.hashToken(token);
    const entry = await prisma.tokenBlacklist.findUnique({
      where: { tokenHash: hash },
    });
    return !!entry;
  }

  static async addToBlacklist(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    const hash = this.hashToken(token);
    await prisma.tokenBlacklist.upsert({
      where: { tokenHash: hash },
      update: {},
      create: { tokenHash: hash, userId, expiresAt },
    });
  }

  static async cleanupExpired(): Promise<number> {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

setInterval(
  () => {
    TokenBlacklistUtil.cleanupExpired().catch(console.error);
  },
  60 * 60 * 1000,
);
```

- [ ] **Step 4: Update authenticateToken middleware to check blacklist**

In `backend/src/middleware/auth.middleware.ts`, add import at top:

```typescript
import { TokenBlacklistUtil } from "../utils/token-blacklist.util";
```

In the `authenticateToken` function, after the line `const decoded: JWTPayload = JWTUtil.verifyAccessToken(token);` and before `req.user = {...}`, add:

```typescript
const isBlacklisted = await TokenBlacklistUtil.isBlacklisted(token);
if (isBlacklisted) {
  const errorResponse: AuthError = {
    success: false,
    error: {
      code: "AUTH_TOKEN_REVOKED",
      message: "Token invalidado. Inicie sesión nuevamente.",
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
  res.status(401).json(errorResponse);
  return;
}
```

- [ ] **Step 5: Update AuthController.logout to blacklist token**

In `backend/src/controllers/auth.controller.ts`, add import:

```typescript
import { TokenBlacklistUtil } from "../utils/token-blacklist.util";
```

Replace the `logout` method body:

```typescript
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization
      const token = JWTUtil.extractTokenFromHeader(authHeader)

      if (token && req.user) {
        const decoded: any = JWTUtil.verifyAccessToken(token)
        const expiresAt = new Date(decoded.exp * 1000)
        await TokenBlacklistUtil.addToBlacklist(token, req.user.id, expiresAt)
      }

      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: { message: 'Sesión cerrada exitosamente' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: { message: 'Sesión cerrada exitosamente' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      }
      res.status(200).json(response)
    }
  }
```

- [ ] **Step 6: Update auth-context.tsx logout to call backend**

In `lib/auth-context.tsx`, modify the `logout` function to call the backend before clearing storage:

```typescript
const logout = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Continue with local logout even if backend call fails
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userFirstName");
  localStorage.removeItem("userLastName");
  localStorage.removeItem("userEmail");
  setUser(null);
  window.location.href = "/";
};
```

- [ ] **Step 7: Update admin layout logout to use auth context**

In `app/admin/layout.tsx`, the `handleLogout` function should be updated to call the backend. Find the existing `handleLogout` and replace with a call to the backend logout endpoint following the same pattern as auth-context (fetch POST to `/api/v1/auth/logout` with Bearer token, then clear localStorage).

- [ ] **Step 8: Generate Prisma client and test**

Run: `npx prisma generate --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`

- [ ] **Step 9: Commit**

```bash
git add backend/prisma/ backend/src/utils/token-blacklist.util.ts backend/src/middleware/auth.middleware.ts backend/src/controllers/auth.controller.ts lib/auth-context.tsx app/admin/layout.tsx
git commit -m "feat(M2.6): add TokenBlacklist with SHA-256, update logout to blacklist tokens"
```

---

## Task 3: M2.4 - Admin Dashboard Page (Layout + Stats)

**Files:**

- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create admin dashboard page**

Create `app/admin/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Shield,
} from "lucide-react";

interface DashboardData {
  queriesToday: number;
  activeReferences: number;
  activeUsers: number;
  matchRate: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          window.location.href = "/";
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.status === 401) {
          window.location.href = "/";
          return;
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  const stats = [
    {
      title: "Consultas Hoy",
      value: data.queriesToday,
      icon: Search,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Referencias Activas",
      value: data.activeReferences,
      icon: FileText,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      title: "Usuarios Activos",
      value: data.activeUsers,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Tasa de Coincidencia",
      value: `${data.matchRate}%`,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel General</h1>
        <p className="text-slate-600">
          Resumen general del sistema -{" "}
          {new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Placeholder - Gráficos disponibles en M2.8
          </CardTitle>
          <CardDescription>
            Los gráficos de tendencias se activarán al completar M2.8
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page loads at /admin**

Navigate to `http://localhost:3000/admin` and verify it shows 4 stat cards.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(M2.4): add admin dashboard page with stat cards"
```

---

## Task 4: M2.8 - Dashboard Mejorado (Graficos con Recharts)

**Files:**

- Modify: `backend/src/controllers/dashboard.controller.ts`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Extend DashboardController with chart data**

In `backend/src/controllers/dashboard.controller.ts`, replace the entire file with extended stats:

Add these queries after the existing `matchRate` calculation, inside the try block:

```typescript
const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

const referencesByMonthRaw = await prisma.creditReference.groupBy({
  by: ["createdAt"],
  _count: true,
  where: { createdAt: { gte: twelveMonthsAgo }, deletedAt: null },
});

const monthMap = new Map<string, number>();
for (let i = 0; i < 12; i++) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  monthMap.set(key, 0);
}
referencesByMonthRaw.forEach((r) => {
  const d = new Date(r.createdAt);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (monthMap.has(key)) {
    monthMap.set(key, (monthMap.get(key) || 0) + r._count);
  }
});
const referencesByMonth = Array.from(monthMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([month, count]) => ({ month, count }));

const referencesByStatus = await prisma.creditReference.groupBy({
  by: ["debtStatus"],
  _count: true,
  where: { deletedAt: null },
});
const referencesByStatusFormatted = referencesByStatus.map((r) => ({
  status: r.debtStatus,
  count: r._count,
}));

const thirtyDaysAgo = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 30,
);
const searchesByDayRaw = await prisma.searchHistory.groupBy({
  by: ["createdAt"],
  _count: true,
  where: { createdAt: { gte: thirtyDaysAgo } },
});
const dayMap = new Map<string, number>();
for (let i = 0; i < 30; i++) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  dayMap.set(key, 0);
}
searchesByDayRaw.forEach((r) => {
  const d = new Date(r.createdAt);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (dayMap.has(key)) {
    dayMap.set(key, (dayMap.get(key) || 0) + r._count);
  }
});
const searchesByDay = Array.from(dayMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, count]) => ({ date, count }));

const topSearchedRaw = await prisma.searchHistory.groupBy({
  by: ["searchTerm"],
  _count: true,
  orderBy: { _count: "desc" },
  take: 10,
});
const topSearched = topSearchedRaw.map((r) => ({
  name: r.searchTerm,
  count: r._count,
}));

const recentActivity = await prisma.auditLog.findMany({
  take: 20,
  orderBy: { createdAt: "desc" },
  include: {
    user: {
      select: { firstName: true, lastName: true },
    },
  },
});
const recentActivityFormatted = recentActivity.map((log) => ({
  id: log.id,
  action: log.action,
  resource: log.resource,
  resourceId: log.resourceId,
  details: log.details,
  userName: `${log.user.firstName} ${log.user.lastName}`,
  createdAt: log.createdAt.toISOString(),
}));
```

Add all new fields to the response data object:

```typescript
        data: {
          queriesToday,
          activeReferences,
          activeUsers,
          matchRate: matchRate.toFixed(2),
          referencesByMonth,
          referencesByStatus: referencesByStatusFormatted,
          topSearched,
          recentActivity: recentActivityFormatted,
          searchesByDay,
        },
```

- [ ] **Step 2: Rewrite admin dashboard page with charts**

Replace `app/admin/page.tsx` with full version including recharts. Use `components/ui/chart.tsx` wrapper with recharts `LineChart`, `BarChart`, and `PieChart`. Include:

- 4 stat cards (existing)
- Line chart for references by month
- Bar chart for searches by day
- Pie/donut chart for references by status
- Top 10 searched table
- Recent activity table

The component should fetch from `/api/v1/dashboard` and render all charts.

- [ ] **Step 3: Test dashboard page**

Navigate to `/admin` and verify all charts render with data.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/dashboard.controller.ts app/admin/page.tsx
git commit -m "feat(M2.8): add dashboard charts with recharts - references, searches, status distribution"
```

---

## Task 5: M2.5 - Admin Settings Page

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/controllers/settings.controller.ts`
- Create: `backend/src/routes/settings.routes.ts`
- Create: `backend/src/schemas/settings.schema.ts`
- Modify: `backend/src/app.ts`
- Create: `app/admin/settings/page.tsx`

- [ ] **Step 1: Add AppConfig model to Prisma schema**

Add to `backend/prisma/schema.prisma` after TokenBlacklist model:

```prisma
model AppConfig {
  id           String   @id @default(cuid())
  key          String   @unique
  value        String
  updatedAt    DateTime @updatedAt @map("updated_at")
  updatedBy    String?  @map("updated_by")
  updatedByUser User?   @relation(fields: [updatedBy], references: [id])

  @@map("app_config")
}
```

Add to the `User` model:

```prisma
  appConfigs        AppConfig[]
```

- [ ] **Step 2: Run Prisma migration**

Run: `npx prisma migrate dev --name add_app_config --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`

- [ ] **Step 3: Create seed data for AppConfig**

Add seed logic at the end of the existing seed file or create a small script. Run directly:

```bash
npx prisma db execute --schema backend/prisma/schema.prisma --stdin <<'SQL'
INSERT OR IGNORE INTO app_config (id, key, value, updated_at) VALUES
  ('seed1', 'company_name', 'CrediCheck', datetime('now')),
  ('seed2', 'max_search_results', '50', datetime('now'));
SQL
```

- [ ] **Step 4: Create settings schema**

Create `backend/src/schemas/settings.schema.ts`:

```typescript
import { z } from "zod";

export const updateSettingsSchema = z.object({
  configs: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      }),
    )
    .min(1),
});
```

- [ ] **Step 5: Create settings controller**

Create `backend/src/controllers/settings.controller.ts`:

```typescript
import { Request, Response } from "express";
import { prisma } from "../config/database.config";
import { updateSettingsSchema } from "../schemas/settings.schema";
import { ZodError } from "zod";

export class SettingsController {
  static async getAllSettings(_req: Request, res: Response): Promise<void> {
    try {
      const configs = await prisma.appConfig.findMany({
        orderBy: { key: "asc" },
      });
      const settingsMap: Record<string, string> = {};
      configs.forEach((c) => {
        settingsMap[c.key] = c.value;
      });

      res.status(200).json({
        success: true,
        data: settingsMap,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: _req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor",
          timestamp: new Date().toISOString(),
          requestId: _req.headers["x-request-id"] as string,
        },
      });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { configs } = updateSettingsSchema.parse(req.body);

      const updates = configs.map((c) =>
        prisma.appConfig.upsert({
          where: { key: c.key },
          update: { value: c.value, updatedBy: req.user!.id },
          create: { key: c.key, value: c.value, updatedBy: req.user!.id },
        }),
      );
      await prisma.$transaction(updates);

      const allConfigs = await prisma.appConfig.findMany({
        orderBy: { key: "asc" },
      });
      const settingsMap: Record<string, string> = {};
      allConfigs.forEach((c) => {
        settingsMap[c.key] = c.value;
      });

      res.status(200).json({
        success: true,
        data: settingsMap,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Datos inválidos",
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}
```

- [ ] **Step 6: Create settings routes**

Create `backend/src/routes/settings.routes.ts`:

```typescript
import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin, logAdminAction } from "../middleware/admin.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireAdmin,
  SettingsController.getAllSettings,
);
router.put(
  "/",
  authenticateToken,
  requireAdmin,
  logAdminAction("UPDATE_SETTINGS"),
  SettingsController.updateSettings,
);

export default router;
```

- [ ] **Step 7: Register settings routes in app.ts**

In `backend/src/app.ts`, add import:

```typescript
import settingsRoutes from "./routes/settings.routes";
```

Add route registration:

```typescript
app.use(`/api/${config.server.apiVersion}/settings`, settingsRoutes);
```

- [ ] **Step 8: Create admin settings page**

Create `app/admin/settings/page.tsx` with tabs for:

- **Perfil**: Form with firstName, lastName, email fields. Calls `PUT /api/v1/auth/profile`
- **Seguridad**: Change password form. Calls `POST /api/v1/auth/change-password`
- **Empresa**: Company name config. Calls `GET/PUT /api/v1/settings`
- **Sistema**: Max search results config. Calls `GET/PUT /api/v1/settings`

Use shadcn Tabs, Input, Label, Button components. Use `fetch` with Bearer token from localStorage.

- [ ] **Step 9: Generate Prisma client and test**

Run: `npx prisma generate --schema backend/prisma/schema.prisma`
Workdir: `/home/fedora26/Descargas/credicheck-app`

- [ ] **Step 10: Commit**

```bash
git add backend/prisma/ backend/src/controllers/settings.controller.ts backend/src/routes/settings.routes.ts backend/src/schemas/settings.schema.ts backend/src/app.ts app/admin/settings/
git commit -m "feat(M2.5): add AppConfig model, settings API, and admin settings page"
```

---

## Task 6: M2.1 - Export PDF Individual con jsPDF

**Files:**

- Install: `jspdf`, `jspdf-autotable` (frontend)
- Modify: `app/results/found/page.tsx`

- [ ] **Step 1: Install jsPDF**

Run: `npm install jspdf jspdf-autotable`
Workdir: `/home/fedora26/Descargas/credicheck-app`

- [ ] **Step 2: Add PDF export function to results page**

In `app/results/found/page.tsx`, add imports:

```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
```

Add `generatePDF` function inside the component:

```typescript
const generatePDF = () => {
  const doc = new jsPDF();
  const companyName = "CrediCheck";

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(companyName, 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Reporte de Referencia Crediticia", 14, 30);
  doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 36);
  doc.text(`ID Consulta: ${searchId}`, 14, 42);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 46, 196, 46);

  if (personData) {
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Información Personal", 14, 56);

    autoTable(doc, {
      startY: 60,
      head: [["Campo", "Valor"]],
      body: [
        ["Nombre Completo", personData.fullName || ""],
        [
          "Identificación",
          `${personData.idNumber || ""} (${personData.idType || ""})`,
        ],
        ["Teléfono", personData.phone || "N/A"],
        ["Email", personData.email || "N/A"],
        [
          "Dirección",
          personData.address
            ? `${personData.address}, ${personData.city || ""}`
            : "N/A",
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });
  }

  const currentY = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Referencias Crediticias Negativas", 14, currentY + 10);

  const refBody = searchResults.map((ref: any) => [
    ref.creditorName || "",
    `$${new Intl.NumberFormat("es-CO").format(typeof ref.debtAmount === "string" ? parseFloat(ref.debtAmount) : ref.debtAmount)}`,
    ref.debtStatus || "",
    new Date(ref.debtDate).toLocaleDateString("es-ES"),
    ref.notes || "",
  ]);

  autoTable(doc, {
    startY: currentY + 14,
    head: [["Acreedor", "Monto", "Estado", "Fecha", "Notas"]],
    body: refBody,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
    columnStyles: { 4: { cellWidth: 60 } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount}`, 14, 287);
    doc.text("CrediCheck - Reporte confidencial", 100, 287);
  }

  doc.save(
    `reporte_${searchQuery}_${new Date().toISOString().split("T")[0]}.pdf`,
  );
};
```

Update the two export buttons to call `generatePDF`:

```tsx
  <Button variant="outline" onClick={generatePDF}>Descargar Reporte Completo</Button>
  <Button variant="outline" onClick={generatePDF}>Exportar a PDF</Button>
```

- [ ] **Step 3: Test PDF generation**

Navigate to `/results/found` (perform a search first) and click "Exportar a PDF". Verify PDF downloads.

- [ ] **Step 4: Commit**

```bash
git add app/results/found/page.tsx package.json package-lock.json
git commit -m "feat(M2.1): add PDF export with jsPDF for individual reference reports"
```

---

## Task 7: M2.2 - Export CSV/Excel desde Backend

**Files:**

- Install: `exceljs` (backend)
- Create: `backend/src/services/export.service.ts`
- Modify: `backend/src/routes/credit-reference.routes.ts`
- Create: `backend/src/controllers/export.controller.ts`
- Modify: `app/admin/records/_components/records-management.tsx`

- [ ] **Step 1: Install exceljs in backend**

Run: `npm install exceljs`
Workdir: `/home/fedora26/Descargas/credicheck-app/backend`

- [ ] **Step 2: Create export service**

Create `backend/src/services/export.service.ts`:

```typescript
import { prisma } from "../config/database.config";
import ExcelJS from "exceljs";

export class ExportService {
  static async exportRecordsCSV(): Promise<string> {
    const records = await prisma.creditReference.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });

    const headers = [
      "Nombre",
      "Tipo ID",
      "Numero ID",
      "Monto Deuda",
      "Acreedor",
      "Estado",
      "Fecha Deuda",
      "Ciudad",
      "Notas",
      "Creado Por",
      "Fecha Creacion",
    ];

    const rows = records.map((r) => [
      r.fullName,
      r.idType,
      r.idNumber,
      r.debtAmount.toString(),
      r.creditorName,
      r.debtStatus,
      r.debtDate.toISOString().split("T")[0],
      r.city || "",
      r.notes || "",
      `${r.creator.firstName} ${r.creator.lastName}`,
      r.createdAt.toISOString().split("T")[0],
    ]);

    const escape = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    return [
      headers.join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ].join("\n");
  }

  static async exportRecordsExcel(): Promise<Buffer> {
    const records = await prisma.creditReference.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Referencias Crediticias");

    sheet.columns = [
      { header: "Nombre", key: "fullName", width: 25 },
      { header: "Tipo ID", key: "idType", width: 12 },
      { header: "Numero ID", key: "idNumber", width: 15 },
      { header: "Monto Deuda", key: "debtAmount", width: 15 },
      { header: "Acreedor", key: "creditorName", width: 20 },
      { header: "Estado", key: "debtStatus", width: 15 },
      { header: "Fecha Deuda", key: "debtDate", width: 12 },
      { header: "Ciudad", key: "city", width: 15 },
      { header: "Notas", key: "notes", width: 30 },
      { header: "Creado Por", key: "createdBy", width: 20 },
      { header: "Fecha Creacion", key: "createdAt", width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    records.forEach((r) => {
      sheet.addRow({
        fullName: r.fullName,
        idType: r.idType,
        idNumber: r.idNumber,
        debtAmount: Number(r.debtAmount),
        creditorName: r.creditorName,
        debtStatus: r.debtStatus,
        debtDate: r.debtDate.toISOString().split("T")[0],
        city: r.city || "",
        notes: r.notes || "",
        createdBy: `${r.creator.firstName} ${r.creator.lastName}`,
        createdAt: r.createdAt.toISOString().split("T")[0],
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
```

- [ ] **Step 3: Create export controller**

Create `backend/src/controllers/export.controller.ts`:

```typescript
import { Request, Response } from "express";
import { ExportService } from "../services/export.service";

export class ExportController {
  static async exportRecords(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query.format as string) || "csv";

      if (format === "excel") {
        const buffer = await ExportService.exportRecordsExcel();
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=registros_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        res.send(buffer);
        return;
      }

      const csv = await ExportService.exportRecordsCSV();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=registros_${new Date().toISOString().split("T")[0]}.csv`,
      );
      res.send("\uFEFF" + csv);
    } catch (error) {
      console.error("Error exporting records:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "EXPORT_ERROR",
          message: "Error al exportar registros",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}
```

- [ ] **Step 4: Add export route to credit-reference routes**

In `backend/src/routes/credit-reference.routes.ts`, add import:

```typescript
import { ExportController } from "../controllers/export.controller";
```

Add the export endpoint BEFORE the `/:id` parameterized routes (to avoid route conflicts):

```typescript
router.get(
  "/export",
  authenticateToken,
  requireAdmin,
  ExportController.exportRecords,
);
```

- [ ] **Step 5: Update records-management.tsx export button**

In `app/admin/records/_components/records-management.tsx`, replace the `handleExport` function:

```typescript
const handleExport = async (format: "csv" | "excel") => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/export?format=${format}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Datos exportados como ${format.toUpperCase()}.`);
  } catch (error) {
    console.error(error);
    toast.error("No se pudieron exportar los datos.");
  }
};
```

Replace the Export button JSX with a DropdownMenu:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" disabled={filteredRecords.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Exportar
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleExport("csv")}>
      Exportar CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExport("excel")}>
      Exportar Excel
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- [ ] **Step 6: Test CSV and Excel export**

Navigate to `/admin/records`, click Export dropdown, verify both CSV and Excel download correctly.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/export.service.ts backend/src/controllers/export.controller.ts backend/src/routes/credit-reference.routes.ts app/admin/records/_components/records-management.tsx backend/package.json backend/package-lock.json
git commit -m "feat(M2.2): add server-side CSV/Excel export with exceljs for records"
```

---

## Task 8: M2.3 - Export Historial de Busqueda

**Files:**

- Modify: `backend/src/services/export.service.ts`
- Modify: `backend/src/controllers/export.controller.ts`
- Modify: `backend/src/routes/credit-reference.routes.ts`
- Modify: `app/history/page.tsx`

- [ ] **Step 1: Add history CSV export to ExportService**

In `backend/src/services/export.service.ts`, add method:

```typescript
  static async exportHistoryCSV(userId?: string): Promise<string> {
    const where: any = {}
    if (userId) where.userId = userId

    const history = await prisma.searchHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    })

    const headers = [
      'Fecha', 'Tipo Busqueda', 'Termino', 'Resultados', 'Tiempo (ms)', 'Usuario',
    ]

    const rows = history.map((h) => [
      h.createdAt.toISOString(),
      h.searchType,
      h.searchTerm,
      h.resultsCount.toString(),
      h.executionTimeMs.toString(),
      `${h.user.firstName} ${h.user.lastName}`,
    ])

    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    return [headers.join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
  }
```

- [ ] **Step 2: Add history export endpoint to ExportController**

In `backend/src/controllers/export.controller.ts`, add method:

```typescript
  static async exportHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.id
      const csv = await ExportService.exportHistoryCSV(userId)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=historial_${new Date().toISOString().split('T')[0]}.csv`)
      res.send('\uFEFF' + csv)
    } catch (error) {
      console.error('Error exporting history:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Error al exportar historial',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      })
    }
  }
```

- [ ] **Step 3: Add history export route**

In `backend/src/routes/credit-reference.routes.ts`, add the history export route BEFORE the `/:id` parameterized routes but after the existing `/history` route:

```typescript
router.get(
  "/history/export",
  authenticateToken,
  ExportController.exportHistory,
);
```

- [ ] **Step 4: Update history page export button**

In `app/history/page.tsx`, add a handler function:

```typescript
const handleExportHistory = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/history/export`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting history:", error);
  }
};
```

Update the Export button to call `handleExportHistory`:

```tsx
<Button
  variant="outline"
  className="w-full bg-transparent"
  onClick={handleExportHistory}
>
  <Download className="w-4 h-4 mr-2" />
  Exportar
</Button>
```

- [ ] **Step 5: Test history export**

Navigate to `/history`, click "Exportar", verify CSV downloads with correct data.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/export.service.ts backend/src/controllers/export.controller.ts backend/src/routes/credit-reference.routes.ts app/history/page.tsx
git commit -m "feat(M2.3): add search history CSV export endpoint and frontend handler"
```

---

## Post-Implementation

- [ ] **Update ROADMAP.md**: Mark all M2 items as done
- [ ] **Run full verification**: Start both frontend and backend, test all 8 features
- [ ] **Final commit**: Update roadmap
