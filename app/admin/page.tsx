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
  Clock,
} from "lucide-react";
import { AdminSkeleton } from "@/components/loading-skeletons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { type DashboardData } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#ef4444",
  PAID: "#22c55e",
  INACTIVE: "#94a3b8",
  PAYMENT_PLAN: "#f59e0b",
  DISPUTED: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PAID: "Pagado",
  INACTIVE: "Inactivo",
  PAYMENT_PLAN: "Plan de Pago",
  DISPUTED: "Disputado",
};

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
    return <AdminSkeleton />;
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
          Panel General
        </h1>
        <p className="text-slate-600 dark:text-gray-300">
          Resumen general del sistema -{" "}
          {new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-0 shadow-sm dark:bg-gray-800 dark:border-gray-700"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-300 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* References by Month */}
        <Card className="border-0 shadow-sm lg:col-span-2 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">
              Referencias por Mes
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Ultimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.referencesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");
                      return `${month}/${year.slice(2)}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) => `Mes: ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Referencias"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* References by Status */}
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">
              Por Estado
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Distribucion de referencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.referencesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) =>
                      `${STATUS_LABELS[status as string] || status}: ${count}`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {data.referencesByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      STATUS_LABELS[name] || name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Searches by Day */}
        <Card className="border-0 shadow-sm lg:col-span-2 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">
              Busquedas por Dia
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Ultimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.searchesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const parts = value.split("-");
                      return `${parts[2]}/${parts[1]}`;
                    }}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) => `Fecha: ${value}`}
                  />
                  <Bar
                    dataKey="count"
                    fill="#06b6d4"
                    radius={[2, 2, 0, 0]}
                    name="Busquedas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Searched */}
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">
              Top 10 Buscados
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Personas mas consultadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.topSearched.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 dark:text-gray-400">
                  No hay datos de busqueda disponibles
                </p>
              ) : (
                data.topSearched.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className="w-6 h-6 flex items-center justify-center p-0 text-xs shrink-0"
                      >
                        {index + 1}
                      </Badge>
                      <span className="text-sm truncate dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <Badge className="ml-2 shrink-0">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
            <Activity className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Ultimas acciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4 dark:text-gray-400">
              No hay actividad reciente registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accion</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentActivity.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-gray-300">
                      {log.resource}
                    </TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell className="text-slate-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
