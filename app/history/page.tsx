"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { HistorySkeleton } from "@/components/loading-skeletons";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const result = await response.json();
        if (result.success) {
          setHistoryData(result.data);
        }
      } catch (error) {
        console.error("Error fetching search history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filtrar datos
  const filteredData = historyData.filter((item) => {
    const matchesSearch =
      item.searchTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResult =
      filterResult === "all" ||
      (filterResult === "found" && item.resultsCount > 0) ||
      (filterResult === "not_found" && item.resultsCount === 0);

    const itemDate = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const matchesDate =
      filterDate === "all" ||
      (filterDate === "today" &&
        itemDate.toDateString() === today.toDateString()) ||
      (filterDate === "yesterday" &&
        itemDate.toDateString() === yesterday.toDateString());

    return matchesSearch && matchesResult && matchesDate;
  });

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getResultBadge = (count: number) => {
    if (count > 0) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {count} referencia{count !== 1 ? "s" : ""} encontrada
          {count !== 1 ? "s" : ""}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sin referencias
        </Badge>
      );
    }
  };

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

  const handleViewDetails = async (item: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/search?query=${encodeURIComponent(item.searchTerm)}&type=${item.searchType.toLowerCase()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const results = await response.json();

      sessionStorage.setItem("searchQuery", item.searchTerm);

      if (results.success && results.data.length > 0) {
        sessionStorage.setItem("searchResults", JSON.stringify(results.data));
        sessionStorage.setItem("searchMeta", JSON.stringify(results.meta || {}));
        window.location.href = "/results/found";
      } else {
        sessionStorage.removeItem("searchResults");
        sessionStorage.removeItem("searchMeta");
        window.location.href = "/results/not-found";
      }
    } catch (error) {
      console.error("Error during search from history:", error);
    }
  };

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                CrediCheck
              </h1>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                Historial de Consultas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/disputes")}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Disputas
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/feature-center")}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Centro de Funciones
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Título y estadísticas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-2">
            Historial de Consultas
          </h2>
          <p className="text-slate-600 dark:text-gray-400">
            Revisa todas las búsquedas realizadas en el sistema
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                    Total Consultas
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {historyData.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  <Search className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                    Con Referencias
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {historyData.filter((item) => item.resultsCount > 0).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                    Sin Referencias
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {
                      historyData.filter((item) => item.resultsCount === 0)
                        .length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                    Hoy
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                    {
                      historyData.filter(
                        (item) =>
                          new Date(item.createdAt).toDateString() ===
                          new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 dark:text-gray-100 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Búsqueda
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Filtra las consultas por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="ID, nombre o identificación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Resultado
                </label>
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los resultados</SelectItem>
                    <SelectItem value="found">Con referencias</SelectItem>
                    <SelectItem value="not_found">Sin referencias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Fecha
                </label>
                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="yesterday">Ayer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Acciones
                </label>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleExportHistory}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de historial */}
        <Card className="border-0 dark:border-gray-700 shadow-sm dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 dark:text-gray-100">
              Consultas Recientes ({filteredData.length} resultados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Consulta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium text-slate-800 dark:text-gray-100">
                        {item.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium dark:text-gray-200">
                            {item.searchTerm}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-slate-600 dark:text-gray-300"
                        >
                          {item.searchType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getResultBadge(item.resultsCount)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(item.createdAt).toLocaleTimeString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-gray-300">
                        {item.executionTimeMs}ms
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-gray-300">
                        {item.user.firstName} {item.user.lastName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                          className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedData.map((item) => (
                <Card
                  key={item.id}
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-gray-100 truncate">
                            {item.searchTerm}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
                            ID: {item.id}
                          </p>
                        </div>
                        {getResultBadge(item.resultsCount)}
                      </div>
                      <Separator className="dark:bg-gray-700" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground dark:text-gray-400">
                            Tipo:
                          </span>{" "}
                          <Badge
                            variant="secondary"
                            className="text-slate-600 dark:text-gray-300 text-xs"
                          >
                            {item.searchType}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground dark:text-gray-400">
                            Duración:
                          </span>{" "}
                          <span className="dark:text-gray-300">
                            {item.executionTimeMs}ms
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground dark:text-gray-400">
                            Fecha:
                          </span>{" "}
                          <span className="dark:text-gray-300">
                            {new Date(item.createdAt).toLocaleDateString(
                              "es-ES",
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground dark:text-gray-400">
                            Usuario:
                          </span>{" "}
                          <span className="dark:text-gray-300">
                            {item.user.firstName} {item.user.lastName}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                          className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 dark:border-gray-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {paginatedData.length === 0 && (
                <p className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  No se encontraron consultas.
                </p>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} a{" "}
                  {Math.min(startIndex + itemsPerPage, filteredData.length)} de{" "}
                  {filteredData.length} resultados
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
