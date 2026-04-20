"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowLeft,
  Search,
  Shield,
  Calendar,
  Clock,
} from "lucide-react";
import { NotFoundResultsSkeleton } from "@/components/loading-skeletons";

export default function NotFoundResults() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = sessionStorage.getItem("searchQuery");

    if (query) {
      setSearchQuery(query);
      setSearchDate(
        new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setSearchId(
        "CRD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      );
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <NotFoundResultsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                CrediCheck
              </h1>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                Resultados de Búsqueda
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 mb-2">
            <Search className="w-4 h-4" />
            <span>Búsqueda realizada: &quot;{searchQuery}&quot;</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{searchDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>ID: {searchId}</span>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg mb-8 dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-3">
              No se encontraron referencias negativas
            </h2>

            <p className="text-lg text-slate-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              La persona consultada no aparece en nuestra base de datos de
              referencias crediticias negativas.
            </p>

            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-sm px-4 py-2">
              ✓ Consulta completada exitosamente
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mb-6 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 dark:text-gray-100">
              Detalles de la Consulta
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Información sobre la búsqueda realizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-2">
                  Término de Búsqueda
                </h4>
                <p className="text-slate-600 dark:text-gray-300">
                  {searchQuery}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-2">
                  Bases de Datos Consultadas
                </h4>
                <p className="text-slate-600 dark:text-gray-300">
                  1 fuente verificada
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-2">
                  Tiempo de Respuesta
                </h4>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>1.2 segundos</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-2">
                  Estado de la Consulta
                </h4>
                <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900">
                  Completada
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Realizar Nueva Búsqueda
          </Button>

          <Button
            variant="outline"
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => (window.location.href = "/login")}
          >
            Iniciar sesión (premium)
          </Button>
        </div>
      </main>
    </div>
  );
}
