"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Bell,
  History,
  LayoutGrid,
  Menu,
  PencilLine,
  Shield,
  Upload,
  Users,
  FileText,
  User,
  CheckCircle2,
  Activity,
  Settings,
  ListChecks,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "general" | "admin";
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Buscar referencias",
    description: "Consulta información desde el panel principal.",
    href: "/dashboard",
    icon: Shield,
    section: "general",
  },
  {
    title: "Historial",
    description: "Revisa búsquedas previas y exporta resultados.",
    href: "/history",
    icon: History,
    section: "general",
  },
  {
    title: "Agregar registros",
    description: "Carga nuevas referencias crediticias negativas.",
    href: "/add-record",
    icon: FileText,
    section: "general",
  },
  {
    title: "Mis registros",
    description: "Gestiona registros creados por ti (estado, notas y datos).",
    href: "/my-records",
    icon: PencilLine,
    section: "general",
  },
  {
    title: "Carga masiva CSV",
    description: "Importa múltiples registros desde archivo CSV.",
    href: "/bulk-upload",
    icon: Upload,
    section: "general",
  },
  {
    title: "Disputas",
    description: "Centro de seguimiento de casos y apelaciones.",
    href: "/disputes",
    icon: AlertTriangle,
    section: "general",
  },
  {
    title: "Notificaciones",
    description: "Revisa alertas y actualizaciones del sistema.",
    href: "/notifications",
    icon: Bell,
    section: "general",
  },
  {
    title: "Perfil",
    description: "Tu información y configuración básica.",
    href: "/profile",
    icon: User,
    section: "general",
  },
  {
    title: "Verificaciones",
    description: "Validaciones y revisiones internas.",
    href: "/verifications",
    icon: CheckCircle2,
    section: "general",
  },
  {
    title: "Risk Score",
    description: "Herramientas de riesgo y análisis.",
    href: "/risk-score",
    icon: Activity,
    section: "general",
  },

  // Admin
  {
    title: "Admin (Inicio)",
    description: "Panel de administración.",
    href: "/admin",
    icon: Users,
    section: "admin",
  },
  {
    title: "Admin: Usuarios",
    description: "Gestión de usuarios.",
    href: "/admin/users",
    icon: Users,
    section: "admin",
  },
  {
    title: "Admin: Registros",
    description: "Supervisión de registros.",
    href: "/admin/records",
    icon: ListChecks,
    section: "admin",
  },
  {
    title: "Admin: Disputas",
    description: "Revisión y resolución de disputas.",
    href: "/admin/disputes",
    icon: AlertTriangle,
    section: "admin",
  },
  {
    title: "Admin: Ajustes",
    description: "Configuración y parámetros.",
    href: "/admin/settings",
    icon: Settings,
    section: "admin",
  },
];

function cx(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function SidebarContent({
  collapsed,
  isAdmin,
  onNavigate,
}: {
  collapsed?: boolean;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const general = NAV_ITEMS.filter((x) => x.section === "general");
  const admin = NAV_ITEMS.filter((x) => x.section === "admin");
  const visibleAdmin = isAdmin ? admin : [];

  const Item = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href;
    const Icon = item.icon;

    const linkEl = (
      <Link
        href={item.href}
        onClick={() => onNavigate?.()}
        className={cx(
          "group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
          "hover:bg-[#eceef0] dark:hover:bg-[#1a2736]",
          active && "bg-[#eceef0] dark:bg-[#1a2736]",
          collapsed && "justify-center px-2",
        )}
      >
        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            "bg-[#f2f4f6] text-[#041221]",
            "dark:bg-[#0f1c2c] dark:text-white",
            "group-hover:bg-[#041221] group-hover:text-white",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#041221] dark:text-white truncate">
              {item.title}
            </div>
            {item.description ? (
              <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {item.description}
              </div>
            ) : null}
          </div>
        ) : null}
      </Link>
    );

    if (!collapsed) return linkEl;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-white text-[#041221] border-outline-variant/15 shadow-[0_8px_24px_rgba(25,28,30,0.10)]"
        >
          <div className="text-xs font-semibold">{item.title}</div>
          {item.description ? (
            <div className="text-[11px] text-slate-600">{item.description}</div>
          ) : null}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-full flex-col">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold tracking-tight text-[#041221] dark:text-white">
              {collapsed ? "CC" : "CrediCheck"}
            </div>
            {!collapsed ? (
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Funciones
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <Badge variant="secondary" className="bg-[#eceef0] text-[#041221] dark:bg-[#1a2736] dark:text-white">
              Auth
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {!collapsed ? (
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2">
            General
          </div>
        ) : null}
        <div className="space-y-1">
          {general.map((item) => (
            <Item key={item.href} item={item} />
          ))}
        </div>

        {(!collapsed && isAdmin) ? (
          <div className="mt-6 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2">
            Administración
          </div>
        ) : null}
        {collapsed && isAdmin && <div className="mt-3" />}
        <div className="space-y-1">
          {visibleAdmin.map((item) => (
            <Item key={item.href} item={item} />
          ))}
        </div>

      <div className="px-4 pb-6">
        <Button
          className={cx(
            "w-full rounded-xl",
            "bg-gradient-to-br from-[#041221] to-[#1a2736] text-white",
            "hover:opacity-95",
          )}
          onClick={() => {
            // logout simple: limpiar token y volver a login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          }}
        >
          {collapsed ? "Salir" : "Cerrar sesión"}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}

export default function FeatureCenterPage() {
  const [query, setQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Verificar rol contra el servidor
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setIsAdmin(result.data.user.role === "ADMIN");
          // Sincronizar localStorage con datos reales del servidor
          localStorage.setItem("userRole", result.data.user.role);
          localStorage.setItem("userFirstName", result.data.user.firstName);
          localStorage.setItem("userLastName", result.data.user.lastName);
          localStorage.setItem("userEmail", result.data.user.email);
        }
      })
      .catch(() => {
        // Si falla, confiar en localStorage como fallback
        setIsAdmin(localStorage.getItem("userRole") === "ADMIN");
      });

    const stored = localStorage.getItem("featureCenterSidebarCollapsed");
    if (stored === "1") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "featureCenterSidebarCollapsed",
      sidebarCollapsed ? "1" : "0",
    );
  }, [sidebarCollapsed]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visibleItems = isAdmin ? NAV_ITEMS : NAV_ITEMS.filter((x) => x.section !== "admin");
    if (!q) return visibleItems;
    return visibleItems.filter((x) => {
      const hay = `${x.title} ${x.description || ""} ${x.href}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, isAdmin]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] dark:bg-[#041221] dark:text-white">
      {/* Desktop sidebar */}
      <aside
        className={cx(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72",
          "bg-[#f2f4f6] dark:bg-[#041221]",
        )}
      >
        <div className={cx("relative h-full group", sidebarCollapsed && "px-1")}>
          <div className="absolute -right-3 top-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 rounded-full bg-white/90 dark:bg-[#0f1c2c] border-none shadow-[0_8px_24px_rgba(25,28,30,0.10)]"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <SidebarContent collapsed={sidebarCollapsed} isAdmin={isAdmin} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="fixed left-4 top-4 z-50 bg-white/80 dark:bg-[#041221]/80 backdrop-blur-xl"
            >
              <Menu className="h-4 w-4 mr-2" />
              Menú
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 bg-[#f2f4f6] dark:bg-[#041221] border-none"
          >
            <SheetHeader className="px-4 pt-6">
              <SheetTitle className="text-[#041221] dark:text-white">Navegación</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-72px)]">
              <SidebarContent isAdmin={isAdmin} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main canvas */}
      <main className={cx(sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#041221]/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(25,28,30,0.06)]">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar funciones o herramientas..."
                  className={cx(
                    "h-10 pl-4 pr-4 rounded-xl border-0",
                    "bg-[#e0e3e5] focus-visible:ring-2 focus-visible:ring-[#041221]",
                    "dark:bg-[#0f1c2c] dark:focus-visible:ring-white",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="rounded-xl">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl">
                <Link href="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Title */}
          <section className="mb-10">
            <Badge
              variant="secondary"
              className="w-fit bg-[#eceef0] text-[#041221] dark:bg-[#1a2736] dark:text-white"
            >
              Acceso autenticado
            </Badge>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#041221] dark:text-white">
              Centro de Funciones
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Un hub premium para operar: búsquedas, registros, disputas, auditoría y administración.
            </p>
          </section>

          {/* Hero */}
          <section className="mb-12 overflow-hidden rounded-[18px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#041221] via-[#041221]/85 to-transparent" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#3b82f6,transparent_50%)]" />
            <div className="relative px-8 py-10 sm:px-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1a2736] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Acceso principal
              </div>
              <h2 className="mt-4 text-3xl font-bold text-white tracking-tight">
                Control Centralizado
              </h2>
              <p className="mt-3 max-w-2xl text-[#d6e4f9]">
                Ir directo al panel para buscar. El resto de funciones (crear registros, disputas,
                administración) viven aquí.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-white text-[#041221] hover:bg-[#e6e8ea]">
                  <Link href="/dashboard">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent text-white border-white/20 hover:bg-white/10"
                  onClick={() => {
                    const el = document.getElementById("tools");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Ver herramientas
                </Button>
              </div>
            </div>
            <div className="h-[1px]" />
          </section>

          {/* Tools */}
          <section id="tools">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#041221] dark:text-white">
                  Herramientas del Sistema
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Accesos rápidos a todas las secciones.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl bg-[#eceef0] border-none text-[#041221] hover:bg-[#e6e8ea] dark:bg-[#1a2736] dark:text-white dark:hover:bg-[#0f1c2c]"
                  onClick={() => setQuery("")}
                >
                  Limpiar filtro
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "group rounded-[18px] p-6",
                      "bg-white dark:bg-[#0f1c2c]",
                      "shadow-[0_8px_24px_rgba(25,28,30,0.04)]",
                      "hover:shadow-[0_12px_32px_rgba(25,28,30,0.08)]",
                      "transition-all",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cx(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          "bg-[#f2f4f6] text-[#041221]",
                          "dark:bg-[#1a2736] dark:text-white",
                          "group-hover:bg-[#041221] group-hover:text-white",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold text-[#041221] dark:text-white">
                          {item.title}
                        </div>
                        {item.description ? (
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {item.description}
                          </div>
                        ) : null}

                        <div className="mt-6 flex items-center gap-2 text-xs font-bold tracking-wide text-[#041221] dark:text-white">
                          ABRIR
                          <span className="inline-block transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredCards.length === 0 ? (
              <div className="mt-8 rounded-xl bg-[#eceef0] dark:bg-[#0f1c2c] p-6 text-sm text-slate-700 dark:text-slate-200">
                No se encontraron funciones para “{query}”.
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
