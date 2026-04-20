"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3,
  Sparkles,
  Upload,
  Eye,
  Building,
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

type LatestResult = {
  date: string;
  reference: string;
  idNumber: string;
  status: "Encontrado" | "Sin registro";
  type: "person" | "company";
};

type SearchHistoryItem = {
  createdAt?: string;
  searchTerm?: string;
  resultsCount?: number;
  searchType?: string;
};

const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userFirstName");
  localStorage.removeItem("userLastName");
  localStorage.removeItem("userEmail");
};

const latestResultsStorageVersion = "latestResults:v2";
const legacyLatestResultsStorageKey = "latestResults";
const publicScopeStorageKey = `${latestResultsStorageVersion}:public:public`;

type TokenClaims = {
  sub?: string;
  userId?: string;
  tenantId?: string;
  tenant_id?: string;
  orgId?: string;
  organizationId?: string;
  workspaceId?: string;
  companyId?: string;
};

const sanitizeKeyPart = (value?: string | null) => {
  if (!value) return "unknown";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._:-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
};

const decodeTokenClaims = (token?: string | null): TokenClaims => {
  if (!token) return {};
  const parts = token.split(".");
  if (parts.length < 2) return {};

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as TokenClaims;
  } catch {
    return {};
  }
};

const resolveTenantId = (token?: string | null) => {
  const claims = decodeTokenClaims(token);
  return (
    claims.tenantId ||
    claims.tenant_id ||
    claims.orgId ||
    claims.organizationId ||
    claims.workspaceId ||
    claims.companyId ||
    localStorage.getItem("tenantId") ||
    localStorage.getItem("orgId") ||
    localStorage.getItem("organizationId") ||
    localStorage.getItem("workspaceId") ||
    null
  );
};

const buildLatestResultsStorageKey = (params: { userId?: string | null; userEmail?: string | null; token?: string | null }) => {
  const tenantId = sanitizeKeyPart(resolveTenantId(params.token) || "public");
  const claims = decodeTokenClaims(params.token);
  const userPart = sanitizeKeyPart(params.userId || claims.userId || claims.sub || params.userEmail || "public");
  return `${latestResultsStorageVersion}:${tenantId}:${userPart}`;
};

const isLatestResult = (value: unknown): value is LatestResult => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LatestResult>;
  return (
    typeof candidate.date === "string" &&
    typeof candidate.reference === "string" &&
    typeof candidate.idNumber === "string" &&
    (candidate.status === "Encontrado" || candidate.status === "Sin registro") &&
    (candidate.type === "person" || candidate.type === "company")
  );
};

const parseLatestResults = (raw: string | null): LatestResult[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLatestResult).slice(0, 6);
  } catch {
    return [];
  }
};

const readLatestResults = (storageKey: string): LatestResult[] => {
  const sessionRows = parseLatestResults(sessionStorage.getItem(storageKey));
  if (sessionRows.length > 0) return sessionRows;

  const localRows = parseLatestResults(localStorage.getItem(storageKey));
  if (localRows.length > 0) return localRows;

  if (storageKey !== legacyLatestResultsStorageKey) {
    const legacyRows = parseLatestResults(sessionStorage.getItem(legacyLatestResultsStorageKey));
    if (legacyRows.length > 0) return legacyRows;
    return parseLatestResults(localStorage.getItem(legacyLatestResultsStorageKey));
  }

  return [];
};

const persistLatestResults = (storageKey: string, rows: LatestResult[]) => {
  const payload = JSON.stringify(rows.slice(0, 6));
  sessionStorage.setItem(storageKey, payload);
  localStorage.setItem(storageKey, payload);
};

export default function Dashboard() {
  const router = useRouter();

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
  const [user, setUser] = useState<{ id?: string; email?: string; firstName: string; lastName: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [latestResultsStorageKey, setLatestResultsStorageKey] = useState(publicScopeStorageKey);
  const [latestResults, setLatestResults] = useState<LatestResult[]>([]);

  const formatRelativeDate = (isoDate?: string) => {
    if (!isoDate) return "Reciente";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "Reciente";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

    const timeLabel = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    if (diffDays === 0) return `Hoy, ${timeLabel}`;
    if (diffDays === 1) return `Ayer, ${timeLabel}`;

    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);

    const initialScopedKey = token ? buildLatestResultsStorageKey({ token }) : publicScopeStorageKey;
    setLatestResultsStorageKey(initialScopedKey);

    const hydratedLatest = readLatestResults(initialScopedKey);
    setLatestResults(hydratedLatest);

    setAuthChecked(true);

    const fetchDashboardData = async () => {
      if (!token) {
        setUser(null);
        setUnreadCount(0);
        setLoadingStats(false);
        return;
      }

      try {
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.status === 401) {
          clearSession();
          setAccessToken(null);
          setUser(null);
          setUnreadCount(0);
          setLatestResultsStorageKey(publicScopeStorageKey);
          setLatestResults(readLatestResults(publicScopeStorageKey));
          return;
        }

        const profileResult = await profileResponse.json();
        if (profileResult.success) {
          const scopedKey = buildLatestResultsStorageKey({
            userId: profileResult.data.id,
            userEmail: profileResult.data.email,
            token,
          });

          setLatestResultsStorageKey(scopedKey);
          const scopedHydratedRows = readLatestResults(scopedKey);
          setLatestResults(scopedHydratedRows);

          setUser({
            id: profileResult.data.id,
            email: profileResult.data.email,
            firstName: profileResult.data.firstName,
            lastName: profileResult.data.lastName,
          });
        }

        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsResponse.status !== 401) {
          const statsResult = await statsResponse.json();
          if (statsResult.success) setStats(statsResult.data);
        }

        const unreadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (unreadResponse.status !== 401) {
          const unreadResult = await unreadResponse.json();
          setUnreadCount(unreadResult.count ?? 0);
        }

        const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (historyResponse.status !== 401) {
          const historyResult = await historyResponse.json();
          if (historyResult.success && Array.isArray(historyResult.data)) {
            const mappedRows: LatestResult[] = historyResult.data.slice(0, 6).map((item: SearchHistoryItem) => ({
              date: formatRelativeDate(item.createdAt),
              reference: item.searchTerm || "Consulta",
              idNumber: /^[0-9.\-kK]+$/.test(item.searchTerm || "") ? item.searchTerm : "-",
              status: (item.resultsCount ?? 0) > 0 ? "Encontrado" : "Sin registro",
              type: item.searchType === "ID" ? "person" : "company",
            }));

            setLatestResults(mappedRows);
            const scopedKey = buildLatestResultsStorageKey({
              userId: profileResult?.data?.id,
              userEmail: profileResult?.data?.email,
              token,
            });
            persistLatestResults(scopedKey, mappedRows);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const savedSearch = sessionStorage.getItem("searchQuery");
    if (savedSearch) setSearchQuery(savedSearch);

    fetchDashboardData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const searchType = /^[0-9]+$/.test(searchQuery) ? "id" : "name";

    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`,
        { headers, signal: controller.signal },
      );

      if (response.status === 401) {
        clearSession();
        setAccessToken(null);
        setUser(null);
      }

      const results = await response.json();
      sessionStorage.setItem("searchQuery", searchQuery);

      const hasResults = results.success && results.data.length > 0;

      if (hasResults) {
        sessionStorage.setItem("searchResults", JSON.stringify(results.data));
        sessionStorage.setItem("searchMeta", JSON.stringify(results.meta || {}));
      } else {
        sessionStorage.removeItem("searchResults");
        sessionStorage.removeItem("searchMeta");
      }

      const first = hasResults ? results.data[0] : null;
      const newRow: LatestResult = {
        date: "Ahora",
        reference: hasResults ? first?.fullName || first?.creditorName || searchQuery : searchQuery,
        idNumber: hasResults ? first?.idNumber || (/^[0-9.\-kK]+$/.test(searchQuery) ? searchQuery : "-") : /^[0-9.\-kK]+$/.test(searchQuery) ? searchQuery : "-",
        status: hasResults ? "Encontrado" : "Sin registro",
        type: /^[0-9.\-kK]+$/.test(searchQuery) || first?.fullName ? "person" : "company",
      };

      setLatestResults((prev) => {
        const deduped = prev.filter((row) => row.reference !== newRow.reference || row.idNumber !== newRow.idNumber || row.status !== newRow.status);
        const next = [newRow, ...deduped].slice(0, 6);
        persistLatestResults(latestResultsStorageKey, next);
        return next;
      });

      if (hasResults) {
        router.push("/results/found");
      } else {
        router.push("/results/not-found");
      }
    } catch (error) {
      console.error("Error during search:", error);
      alert("No se pudo completar la búsqueda. Intenta nuevamente.");
    } finally {
      clearTimeout(timeoutId);
      setIsSearching(false);
    }
  };

  const handleGoToAddRecord = () => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    router.push("/add-record");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
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
      clearSession();
      sessionStorage.clear();
      localStorage.removeItem(latestResultsStorageKey);
      localStorage.removeItem(legacyLatestResultsStorageKey);
      setLatestResultsStorageKey(publicScopeStorageKey);
      setLatestResults([]);
      setAccessToken(null);
      setUser(null);
      setUnreadCount(0);
      setLoggingOut(false);
      router.push("/dashboard");
    }
  };

  const dashboardStats = useMemo(
    () => [
      { label: "Consultas hoy", value: stats.queriesToday, icon: Search, color: "text-[#1F5EFF]", progress: "w-[65%]" },
      { label: "Referencias activas", value: stats.activeReferences, icon: AlertTriangle, color: "text-[#1F5EFF]", progress: "w-[80%]" },
      { label: "Usuarios activos", value: stats.activeUsers, icon: Users, color: "text-[#1F5EFF]", progress: "w-[35%]" },
      { label: "Tasa de coincidencia", value: `${stats.matchRate}%`, icon: TrendingUp, color: "text-[#1F5EFF]", progress: "w-[72%]" },
    ],
    [stats],
  );

  const statusBadge = (status: LatestResult["status"]) => {
    if (status === "Encontrado") {
      return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Encontrado</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Sin registro</Badge>;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-background flex items-center justify-center">
        <div className="text-sm text-slate-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-background">
      <div className={`min-h-screen ${accessToken ? "flex" : ""}`}>
        {accessToken && (
          <aside className="hidden lg:flex w-72 border-r border-slate-200 bg-white flex-col py-8 gap-2">
            <div className="px-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#1F5EFF]" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-bold text-lg leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
                  </h2>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Executive Access</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4">
              <Button className="w-full justify-start bg-blue-50 text-[#1F5EFF] hover:bg-blue-100" onClick={() => router.push("/dashboard")}>
                <Search className="w-4 h-4 mr-2" /> Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900" onClick={() => router.push("/history")}>
                <History className="w-4 h-4 mr-2" /> History
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900" onClick={() => router.push("/risk-score")}>
                <BarChart3 className="w-4 h-4 mr-2" /> Reports
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900" onClick={() => router.push("/feature-center")}>
                <LayoutGrid className="w-4 h-4 mr-2" /> Settings
              </Button>
            </nav>

            <div className="mt-auto px-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[0.2em]">System status</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-slate-800">Operational</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {accessToken ? (
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-24">
              <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                <div className="flex items-center gap-10">
                  <span className="text-2xl font-black text-[#1F5EFF] tracking-tight">CrediCheck</span>
                  <div className="hidden lg:flex gap-8">
                    <button className="text-[#1F5EFF] font-extrabold border-b-2 border-[#1F5EFF] py-1 text-sm tracking-widest uppercase">Core Dashboard</button>
                    <button className="text-slate-500 font-bold hover:text-[#1F5EFF] transition-colors text-sm tracking-widest uppercase">Analytics</button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <Button variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-[#1F5EFF] hover:bg-blue-100">
                    Premium API
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push("/notifications")}>
                    <Bell className="w-5 h-5 text-slate-600" />
                  </Button>
                  {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "CC"}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline">{user ? `${user.firstName} ${user.lastName}` : "Mi cuenta"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="w-4 h-4 mr-2" /> Mi cuenta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/history")}>
                        <History className="w-4 h-4 mr-2" /> Historial de búsquedas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={handleLogout} disabled={loggingOut}>
                        {loggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                        {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
          ) : null}

          <div className={`${accessToken ? "max-w-7xl px-8 py-8 space-y-8" : "max-w-6xl px-6 md:px-10 py-10 md:py-14 space-y-8"} mx-auto`}>
            {!accessToken && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-3 rounded-full px-4 py-1.5 bg-blue-50 border border-blue-100">
                  <Shield className="w-4 h-4 text-[#1F5EFF]" />
                  <span className="font-bold text-[#1F5EFF] text-xs tracking-[0.14em] uppercase">CrediCheck Public</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Consulta pública de referencias</h1>
                <p className="text-slate-500 mt-2">Ingresa nombre, cédula o NIT para consultar. Sin navegación, solo búsqueda.</p>
              </div>
            )}

            <Card className={`bg-white border border-slate-200 ${accessToken ? "shadow-sm rounded-2xl" : "shadow-xl rounded-3xl"}`}>
              <CardHeader>
                <CardTitle className={`${accessToken ? "text-3xl" : "text-4xl"} font-black text-slate-900`}>Consultar Referencias Crediticias</CardTitle>
                <CardDescription className="text-slate-500 text-base">Realiza búsquedas por nombre, cédula o NIT y obtén resultados al instante.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F5EFF]" />
                  <Input
                    placeholder="Ingrese nombre, número de identificación o NIT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className={`${accessToken ? "h-14" : "h-16 text-lg"} pl-12 pr-36 text-base bg-slate-50 border-slate-200`}
                    disabled={isSearching}
                  />
                  <div className="absolute right-1.5 top-1.5">
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      className={`${accessToken ? "h-11" : "h-12"} px-7 bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)] transition-all`}
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONSULTAR"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-50 text-[#1F5EFF] hover:bg-blue-50 border border-blue-100">Búsqueda rápida</Badge>
                  <Badge variant="secondary">Consulta por documento</Badge>
                  <Badge variant="secondary">Consulta por empresa</Badge>
                  {!accessToken && <Badge variant="secondary">Vista pública</Badge>}
                </div>
              </CardContent>
            </Card>

            {accessToken && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {loadingStats
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border-slate-200">
                          <CardContent className="p-6">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                          </CardContent>
                        </Card>
                      ))
                    : dashboardStats.map((stat) => (
                        <Card key={stat.label} className="rounded-2xl border-slate-200 shadow-sm">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold">{stat.label}</p>
                              <div className="p-2 rounded-lg bg-blue-50">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                              </div>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-[#1F5EFF] rounded-full ${stat.progress}`} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <section className="xl:col-span-4 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1.5 h-6 bg-[#1F5EFF] rounded-full" />
                      <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800">Centro de funciones</h2>
                    </div>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={handleGoToAddRecord}>
                      <CardContent className="p-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1F5EFF] flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Agregar Registro</p>
                            <p className="text-xs text-slate-500">Inserta nueva referencia manual</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToAddRecord();
                          }}
                          className="bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)]"
                        >
                          Más usado
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/bulk-upload")}>
                      <CardContent className="p-5 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Carga Masiva</p>
                          <p className="text-xs text-slate-500">Importar base de datos (.csv, .xlsx)</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/history")}>
                      <CardContent className="p-5 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Historial</p>
                          <p className="text-xs text-slate-500">Ver consultas y estados recientes</p>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="xl:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[#1F5EFF] rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-800">Últimos resultados</h2>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#1F5EFF]" onClick={() => router.push("/history")}>
                        Ver todo
                      </Button>
                    </div>

                    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-slate-500">Fecha</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-slate-500">Referencia</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-slate-500">ID / NIT</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-slate-500">Estado</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-slate-500 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {latestResults.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                  Aún no hay resultados recientes.
                                </td>
                              </tr>
                            ) : (
                              latestResults.map((row, idx) => (
                                <tr key={`${row.idNumber}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.date}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1F5EFF] flex items-center justify-center">
                                        {row.type === "person" ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                      </div>
                                      <span className="font-semibold text-slate-900">{row.reference}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{row.idNumber}</td>
                                  <td className="px-6 py-4">{statusBadge(row.status)}</td>
                                  <td className="px-6 py-4 text-center">
                                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-[#1F5EFF]" onClick={() => router.push("/history")}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </section>
                </div>
              </>
            )}

            {!accessToken && (
              <Card className="bg-white rounded-2xl border border-blue-100">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#1F5EFF]" />
                    <p className="text-sm text-slate-600">Para funciones premium (agregar registros, disputas e historial), inicia sesión.</p>
                  </div>
                  <Button onClick={() => router.push("/login")} className="bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)]">Iniciar sesión</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
