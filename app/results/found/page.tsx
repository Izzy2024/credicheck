"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Building,
  FileDown,
} from "lucide-react";
import { FoundResultsSkeleton } from "@/components/loading-skeletons";

export default function FoundResults() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = sessionStorage.getItem("searchQuery");
    const results = sessionStorage.getItem("searchResults");

    if (query && results) {
      setSearchQuery(query);
      setSearchResults(JSON.parse(results));
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800";
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    }
  };

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

  if (loading) {
    return <FoundResultsSkeleton />;
  }

  const personData = searchResults.length > 0 ? searchResults[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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

      <main className="max-w-6xl mx-auto px-6 py-8">
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

        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 mb-8">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300 font-medium">
            <strong>Referencias negativas encontradas:</strong> Se encontraron{" "}
            {searchResults.length} referencias crediticias negativas para esta
            persona.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {personData && (
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800 dark:text-gray-100">
                    Información Personal
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Datos de la persona consultada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1">
                        Nombre Completo
                      </h4>
                      <p className="text-slate-600 dark:text-gray-300">
                        {personData.fullName}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1">
                        Identificación
                      </h4>
                      <p className="text-slate-600 dark:text-gray-300">
                        {personData.idNumber} ({personData.idType})
                      </p>
                    </div>
                    {personData.phone && (
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> Teléfono
                        </h4>
                        <p className="text-slate-600 dark:text-gray-300">
                          {personData.phone}
                        </p>
                      </div>
                    )}
                    {personData.email && (
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email
                        </h4>
                        <p className="text-slate-600 dark:text-gray-300">
                          {personData.email}
                        </p>
                      </div>
                    )}
                    {personData.address && (
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Dirección
                        </h4>
                        <p className="text-slate-600 dark:text-gray-300 text-sm">
                          {personData.address}, {personData.city},{" "}
                          {personData.department}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-2">
                  Referencias Crediticias Negativas
                </h2>
                <p className="text-slate-600 dark:text-gray-300">
                  Se encontraron {searchResults.length} referencias en nuestra
                  base de datos
                </p>
              </div>

              {searchResults.map((reference) => (
                <Card
                  key={reference.id}
                  className="border-0 shadow-sm dark:bg-gray-800"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-800 dark:text-gray-100 flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          {reference.creditorName}
                        </CardTitle>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          Reportado el{" "}
                          {new Date(reference.debtDate).toLocaleDateString(
                            "es-ES",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getSeverityColor("high")}>
                        {reference.debtStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Monto
                        </h4>
                        <p className="text-lg font-semibold text-slate-700 dark:text-gray-200">
                          $
                          {new Intl.NumberFormat("es-CO").format(
                            typeof reference.debtAmount === "string"
                              ? parseFloat(reference.debtAmount)
                              : reference.debtAmount,
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Fecha de Reporte
                        </h4>
                        <p className="text-slate-600 dark:text-gray-300">
                          {new Date(reference.debtDate).toLocaleDateString(
                            "es-ES",
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-gray-100 mb-1">
                          Estado Actual
                        </h4>
                        <Badge className={getSeverityColor("high")}>
                          {reference.debtStatus}
                        </Badge>
                      </div>
                    </div>
                    {reference.notes && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
                          Descripción del Caso
                        </h4>
                        <p className="text-orange-700 dark:text-orange-300 text-sm">
                          {reference.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm mt-8 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 dark:text-gray-100">
              Resumen de la Consulta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                  Referencias Encontradas
                </h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {searchResults.length}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  Monto Total
                </h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    searchResults.reduce(
                      (acc, ref) =>
                        acc +
                        (typeof ref.debtAmount === "string"
                          ? parseFloat(ref.debtAmount)
                          : ref.debtAmount),
                      0,
                    ),
                  )}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  Tiempo de Respuesta
                </h4>
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-2xl font-bold">1.8s</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-center">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  Fuentes Consultadas
                </h4>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  1
                </p>
              </div>
            </div>

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
                onClick={generatePDF}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Reporte Completo
              </Button>

              <Button
                variant="outline"
                onClick={generatePDF}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar a PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
