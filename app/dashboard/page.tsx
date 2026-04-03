"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Shield,
  User,
  LogOut,
  History,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  Loader2,
  LayoutGrid,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState({
    queriesToday: 0,
    activeReferences: 0,
    activeUsers: 0,
    matchRate: "0.00",
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          window.location.href = "/"; // Redirect to login if no token
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (profileResponse.status === 401) {
          window.location.href = "/"; // Redirect to login if token is invalid
          return;
        }

        const profileResult = await profileResponse.json();
        if (profileResult.success) {
          setUser({
            firstName: profileResult.data.firstName,
            lastName: profileResult.data.lastName,
          });
        }

        // Fetch dashboard stats
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (statsResponse.status === 401) {
          window.location.href = "/"; // Redirect to login if token is invalid
          return;
        }

        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }

        const unreadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (unreadResponse.status === 401) {
          window.location.href = "/";
          return;
        }

        const unreadResult = await unreadResponse.json();
        setUnreadCount(unreadResult.count ?? 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Determine search type
    const searchType = /^[0-9]+$/.test(searchQuery) ? "id" : "name";

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        },
      );

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      const results = await response.json();

      sessionStorage.setItem("searchQuery", searchQuery);

      if (results.success && results.data.length > 0) {
        sessionStorage.setItem("searchResults", JSON.stringify(results.data));
        window.location.href = "/results/found";
      } else {
        sessionStorage.removeItem("searchResults");
        window.location.href = "/results/not-found";
      }
    } catch (error) {
      console.error("Error during search:", error);
      alert("No se pudo completar la búsqueda. Intenta nuevamente.");
    } finally {
      clearTimeout(timeoutId);
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        // Llamar al endpoint de logout del backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Limpiar datos de sesión del localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userFirstName");
      localStorage.removeItem("userLastName");
      localStorage.removeItem("userEmail");
      sessionStorage.clear();

      // Redirigir a la página de inicio
      window.location.href = "/";
    }
  };

  const dashboardStats = [
    {
      label: "Consultas Hoy",
      value: stats.queriesToday,
      icon: Search,
      color: "text-cyan-600",
    },
    {
      label: "Referencias Activas",
      value: stats.activeReferences,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      label: "Usuarios Activos",
      value: stats.activeUsers,
      icon: Users,
      color: "text-emerald-600",
    },
    {
      label: "Tasa de Coincidencias",
      value: `${stats.matchRate}%`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card dark:bg-gray-900 border-b border-border dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-card-foreground dark:text-gray-100">
                CrediCheck
              </h1>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Panel de Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/notifications")}
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>No leídas</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-10"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm">
                      {user
                        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                        : "AC"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-card-foreground dark:text-gray-200 font-medium">
                    {user
                      ? `${user.firstName} ${user.lastName}`
                      : "Analista Crédito"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/profile")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Mi Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/history")}
                >
                  <History className="w-4 h-4 mr-2" />
                  Historial de Búsquedas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bienvenido al Panel de Control
          </h2>
          <p className="text-muted-foreground">
            Consulta referencias crediticias de forma rápida y segura
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loadingStats
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6 dark:bg-gray-800">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            : dashboardStats.map((stat, index) => (
                <Card
                  key={index}
                  className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-xl bg-slate-100 dark:bg-gray-700 ${stat.color}`}
                      >
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Búsqueda Principal */}
        <Card className="border-0 dark:border-gray-700 shadow-lg dark:bg-gray-800 mb-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-card-foreground dark:text-gray-100 mb-2">
              Consultar Referencias Crediticias
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-gray-400">
              Ingresa el nombre completo, DNI o número de identificación de la
              persona
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Ej: Juan Pérez, 12345678, CC-12345678"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 text-lg border-border focus-visible:ring-ring"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Buscando...
                  </div>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-muted-foreground">
                Búsqueda por nombre completo
              </Badge>
              <Badge variant="secondary" className="text-muted-foreground">
                Número de identificación
              </Badge>
              <Badge variant="secondary" className="text-muted-foreground">
                DNI o cédula
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => (window.location.href = "/feature-center")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-xl">
                  <LayoutGrid className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground dark:text-gray-100 mb-1">
                    Centro de Funciones
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Navegación visible para usuarios autenticados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => (window.location.href = "/add-record")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                  <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground dark:text-gray-100 mb-1">
                    Agregar Registro
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Añadir nueva referencia crediticia negativa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => (window.location.href = "/history")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground dark:text-gray-100 mb-1">
                    Historial de Consultas
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Ver búsquedas realizadas anteriormente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
