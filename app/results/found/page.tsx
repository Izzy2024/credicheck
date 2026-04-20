"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  LockKeyhole,
  LogIn,
  Gavel,
} from "lucide-react";
import { FoundResultsSkeleton } from "@/components/loading-skeletons";

type SearchResult = {
  id: string;
  fullName?: string;
  idNumber?: string;
  idType?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  department?: string;
  creditorName?: string;
  debtAmount?: number | string;
  debtStatus?: string;
  debtDate?: string;
  notes?: string;
};

type CreditScoreSummary = {
  creditScore: number;
  riskBand: "LOW" | "MEDIUM" | "HIGH";
  alertLevel: "GREEN" | "AMBER" | "RED";
  recommendation: string;
  reasons: string[];
  trend?: Array<{
    label: "3M" | "6M" | "12M";
    recordCount: number;
    activeCount: number;
    totalDebt: number;
  }>;
};

type SearchMeta = {
  creditScore?: CreditScoreSummary;
};

const toNumber = (value: number | string | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
};

export default function FoundResults() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchMeta, setSearchMeta] = useState<SearchMeta>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<SearchResult | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeFiles, setDisputeFiles] = useState<FileList | null>(null);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  useEffect(() => {
    const query = sessionStorage.getItem("searchQuery");
    const results = sessionStorage.getItem("searchResults");
    const meta = sessionStorage.getItem("searchMeta");

    setIsAuthenticated(!!localStorage.getItem("accessToken"));

    if (query && results) {
      setSearchQuery(query);
      setSearchResults(JSON.parse(results));
      if (meta) {
        try {
          setSearchMeta(JSON.parse(meta));
        } catch {
          setSearchMeta({});
        }
      }
      setSearchDate(
        new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setSearchId(`CRD-${Math.random().toString(36).slice(2, 11).toUpperCase()}`);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }, [router]);

  const personData = searchResults.length > 0 ? searchResults[0] : null;
  const totalAmount = searchResults.reduce((acc, ref) => acc + toNumber(ref.debtAmount), 0);

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

  const scoreSummary = searchMeta.creditScore;

  const getAlertMessage = () => {
    if (!scoreSummary) return null;
    if (scoreSummary.alertLevel === "RED") {
      return "ALERTA CRÍTICA: esta persona presenta alto riesgo crediticio por referencias negativas.";
    }
    if (scoreSummary.alertLevel === "AMBER") {
      return "ALERTA PREVENTIVA: se recomienda validar garantías o soportes adicionales.";
    }
    return "RIESGO CONTROLADO: no hay señales críticas en la consulta actual.";
  };

  const scoreBadgeClass =
    !scoreSummary || scoreSummary.alertLevel === "GREEN"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : scoreSummary.alertLevel === "AMBER"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";

  const openDisputeDialog = (reference: SearchResult) => {
    setSelectedReference(reference);
    setDisputeReason("");
    setDisputeDescription("");
    setDisputeFiles(null);
    setDisputeError(null);
    setDisputeDialogOpen(true);
  };

  const submitDispute = async () => {
    if (!selectedReference?.id) return;

    try {
      setDisputeSubmitting(true);
      setDisputeError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recordId: selectedReference.id,
          reason: disputeReason,
          description: disputeDescription,
        }),
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok || !createResult?.success) {
        setDisputeError(
          createResult?.error ??
            createResult?.message ??
            "No se pudo crear la disputa. Verifica los datos.",
        );
        return;
      }

      const disputeId = createResult.data?.id;

      if (disputeId && disputeFiles && disputeFiles.length > 0) {
        const formData = new FormData();
        Array.from(disputeFiles).forEach((file) => formData.append("files", file));

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes/${disputeId}/attachments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      setDisputeDialogOpen(false);
      router.push("/disputes");
    } catch (error) {
      setDisputeError(error instanceof Error ? error.message : "Error creando la disputa");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("CrediCheck", 14, 22);
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
          ["Identificación", `${personData.idNumber || ""} (${personData.idType || ""})`],
          ["Teléfono", personData.phone || "N/A"],
          ["Email", personData.email || "N/A"],
          [
            "Dirección",
            personData.address ? `${personData.address}, ${personData.city || ""}` : "N/A",
          ],
        ],
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
        margin: { left: 14, right: 14 },
      });
    }

    const currentY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 120;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Referencias Crediticias Negativas", 14, currentY + 10);

    autoTable(doc, {
      startY: currentY + 14,
      head: [["Acreedor", "Monto", "Estado", "Fecha", "Notas"]],
      body: searchResults.map((ref) => [
        ref.creditorName || "",
        `$${new Intl.NumberFormat("es-CO").format(toNumber(ref.debtAmount))}`,
        ref.debtStatus || "",
        ref.debtDate ? new Date(ref.debtDate).toLocaleDateString("es-ES") : "",
        ref.notes || "",
      ]),
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

    doc.save(`reporte_${searchQuery}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading) return <FoundResultsSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apelación / Disputa</DialogTitle>
            <DialogDescription>
              Completa la información para que el administrador revise el caso.
            </DialogDescription>
          </DialogHeader>

          {disputeError && (
            <Alert variant="destructive">
              <AlertDescription>{disputeError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Registro</div>
              <div className="text-muted-foreground">ID: {selectedReference?.id || "-"}</div>
              <div className="text-muted-foreground">Acreedor: {selectedReference?.creditorName || "-"}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo (breve)</label>
              <Input
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Ej: Deuda pagada, identidad equivocada, monto incorrecto..."
                minLength={10}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (detalle)</label>
              <Textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Explica qué pasó, fechas, pruebas, y qué solución solicitas."
                rows={5}
                minLength={20}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Evidencia (opcional)</label>
              <Input type="file" multiple onChange={(e) => setDisputeFiles(e.target.files)} />
              <p className="text-xs text-muted-foreground">Puedes adjuntar hasta 5 archivos.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} disabled={disputeSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={submitDispute}
              disabled={disputeSubmitting || disputeReason.trim().length < 10 || disputeDescription.trim().length < 20}
            >
              {disputeSubmitting ? "Enviando..." : "Enviar disputa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold">CrediCheck</h1>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated ? "Resultados de búsqueda" : "Resultados (vista previa)"}
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Search className="w-4 h-4" /> Búsqueda: "{searchQuery}"
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {searchDate}
              </span>
              <Badge variant="secondary">ID: {searchId}</Badge>
            </div>
          </CardContent>
        </Card>

        {!isAuthenticated ? (
          <>
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 font-medium">
                Coincidencias encontradas: {searchResults.length} registros relacionados.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="w-5 h-5" /> Reporte protegido
                </CardTitle>
                <CardDescription>
                  Inicia sesión para ver detalle completo, exportar PDF y disputar referencias.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="text-lg font-semibold">{personData?.fullName || "***"}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Identificación</p>
                    <p className="text-lg font-semibold">
                      {(personData?.idType || "") + " " + (personData?.idNumber || "")}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ver acreedor, montos y fechas completas</li>
                    <li>Exportar reporte en PDF</li>
                    <li>Apelar/disputar una referencia encontrada</li>
                    <li>Revisar historial y notificaciones</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => router.push("/login")}>
                    <LogIn className="w-4 h-4 mr-2" /> Iniciar sesión
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/signup")}>Crear cuenta</Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {scoreSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Score crediticio de consulta
                  </CardTitle>
                  <CardDescription>
                    Evaluación automática basada en referencias, montos y recurrencia.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={scoreBadgeClass}>Score {scoreSummary.creditScore}/100</Badge>
                    <Badge variant="outline">Riesgo {scoreSummary.riskBand}</Badge>
                    <Badge variant="outline">Alerta {scoreSummary.alertLevel}</Badge>
                  </div>
                  <Alert className={scoreSummary.alertLevel === "RED" ? "border-red-200 bg-red-50" : scoreSummary.alertLevel === "AMBER" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}>
                    <AlertTriangle className="h-5 w-5" />
                    <AlertDescription className="font-medium">{getAlertMessage()}</AlertDescription>
                  </Alert>

                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Recomendación automática</p>
                    <p className="text-sm font-medium mt-1">{scoreSummary.recommendation}</p>
                  </div>

                  {scoreSummary.trend && scoreSummary.trend.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {scoreSummary.trend.map((window) => (
                        <div key={window.label} className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Tendencia {window.label}</p>
                          <p className="text-sm font-semibold">{window.recordCount} registros</p>
                          <p className="text-xs text-muted-foreground">Activas: {window.activeCount}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {scoreSummary.reasons.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {scoreSummary.reasons.slice(0, 4).map((reason, idx) => (
                        <li key={`${reason}-${idx}`}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300 font-medium">
                Referencias negativas encontradas: {searchResults.length}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                {personData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Información personal</CardTitle>
                      <CardDescription>Datos de la persona consultada</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Nombre completo</p>
                        <p className="font-medium">{personData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Identificación</p>
                        <p className="font-medium">{personData.idNumber} ({personData.idType})</p>
                      </div>
                      {personData.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{personData.phone}</span>
                        </div>
                      )}
                      {personData.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{personData.email}</span>
                        </div>
                      )}
                      {personData.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>
                            {personData.address}, {personData.city}, {personData.department}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-center">
                      <p className="text-xs text-red-700 dark:text-red-300">Referencias</p>
                      <p className="text-xl font-bold text-red-600">{searchResults.length}</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-3 text-center">
                      <p className="text-xs text-orange-700 dark:text-orange-300">Monto total</p>
                      <p className="text-lg font-bold text-orange-600">
                        ${new Intl.NumberFormat("es-CO").format(totalAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-center">
                      <p className="text-xs text-blue-700 dark:text-blue-300">Respuesta</p>
                      <p className="text-lg font-bold text-blue-600 inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 1.8s
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 text-center">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Fuentes</p>
                      <p className="text-xl font-bold text-emerald-600">1</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Referencias crediticias negativas</h2>
                  <p className="text-sm text-muted-foreground">
                    Se encontraron {searchResults.length} registros en la base de datos.
                  </p>
                </div>

                {searchResults.map((reference) => (
                  <Card key={reference.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building className="w-5 h-5" /> {reference.creditorName}
                          </CardTitle>
                          <CardDescription>
                            Reportado el {reference.debtDate ? new Date(reference.debtDate).toLocaleDateString("es-ES") : "-"}
                          </CardDescription>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <Badge className={getSeverityColor("high")}>{reference.debtStatus}</Badge>
                          <Button variant="outline" onClick={() => openDisputeDialog(reference)}>
                            <Gavel className="w-4 h-4 mr-2" /> Apelar / Disputar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Monto
                          </p>
                          <p className="font-semibold text-lg">
                            ${new Intl.NumberFormat("es-CO").format(toNumber(reference.debtAmount))}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Fecha de reporte
                          </p>
                          <p className="font-medium">
                            {reference.debtDate ? new Date(reference.debtDate).toLocaleDateString("es-ES") : "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Estado</p>
                          <Badge className={getSeverityColor("high")}>{reference.debtStatus}</Badge>
                        </div>
                      </div>

                      {reference.notes && (
                        <div className="rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 p-3">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                            Descripción del caso
                          </p>
                          <p className="text-sm text-orange-700 dark:text-orange-300">{reference.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    <Search className="w-4 h-4 mr-2" /> Nueva búsqueda
                  </Button>
                  <Button onClick={generatePDF}>
                    <FileDown className="w-4 h-4 mr-2" /> Exportar a PDF
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
