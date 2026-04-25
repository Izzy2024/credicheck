"use client";

import { API_BASE_URL } from '@/lib/api-base';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Verificar autenticación y permisos contra el servidor
    const verifyAdmin = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/dashboard");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          // Token inválido o expirado
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userFirstName");
          localStorage.removeItem("userLastName");
          localStorage.removeItem("userEmail");
          router.push("/dashboard");
          return;
        }

        const result = await response.json();
        if (!result.success || result.data.user.role !== "ADMIN") {
          toast.error("Acceso denegado", {
            description: "No tienes permisos de administrador.",
          });
          router.push("/dashboard");
          return;
        }

        // Rol confirmado por el servidor — sincronizar localStorage
        setUserRole(result.data.user.role);
        setUserName(`${result.data.user.firstName} ${result.data.user.lastName}`);
        localStorage.setItem("userRole", result.data.user.role);
        localStorage.setItem("userFirstName", result.data.user.firstName);
        localStorage.setItem("userLastName", result.data.user.lastName);
        localStorage.setItem("userEmail", result.data.user.email);
      } catch {
        // Error de conexión — no conceder acceso
        router.push("/dashboard");
      }
    };

    verifyAdmin();
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
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
    localStorage.removeItem("userProfile");

    toast.success("Sesión cerrada", {
      description: "Has cerrado sesión correctamente.",
    });

    router.push("/dashboard");
  };

  const navigationItems = [
    {
      name: "Panel General",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Vista general del sistema",
    },
    {
      name: "Gestión de Registros",
      href: "/admin/records",
      icon: FileText,
      description: "Administrar referencias crediticias",
    },
    {
      name: "Gestión de Usuarios",
      href: "/admin/users",
      icon: Users,
      description: "Administrar usuarios y roles",
    },
    {
      name: "Disputas",
      href: "/admin/disputes",
      icon: AlertTriangle,
      description: "Revisar y resolver disputas pendientes",
    },
    {
      name: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      description: "Configuración del sistema",
    },
  ];

  const isActivePath = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Panel de Administración
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {userRole}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {userName}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-50
          w-80 lg:w-64
          bg-white dark:bg-gray-800 shadow-lg lg:shadow-none
           transform transition-transform duration-300 ease-in-out
           border-r dark:border-gray-700
        `}
        >
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    CrediCheck
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sistema de Administración
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = isActivePath(item.href);
                  return (
                    <Card
                      key={item.href}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent"
                      }`}
                      onClick={() => {
                        router.push(item.href);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isActive
                                ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                isActive
                                  ? "text-blue-900 dark:text-blue-200"
                                  : "text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {item.name}
                            </h3>
                            <p
                              className={`text-sm ${
                                isActive
                                  ? "text-blue-700 dark:text-blue-300"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                Sistema activo
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
