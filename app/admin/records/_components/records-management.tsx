"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusManager,
  StatusBadge,
  StatusStats,
  RecordStatus,
} from "./status-manager";
import {
  Search,
  Filter,
  Download,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface CreditReference {
  id: string;
  fullName: string;
  idNumber: string;
  debtAmount: number;
  debtDate: string;
  creditorName: string;
  debtStatus: RecordStatus;
  caseType?: "FORMAL" | "P2P" | "SERVICE";
  publishState?:
    | "DRAFT"
    | "PENDING_AUTOMATION"
    | "PENDING_REVIEW"
    | "PUBLISHED"
    | "REJECTED"
    | "UNDER_DISPUTE";
  reviewStatus?:
    | "PENDING"
    | "AUTO_APPROVED"
    | "NEEDS_REVIEW"
    | "APPROVED"
    | "REJECTED";
  riskScore?: number;
  createdAt: string;
  deletedAt: string | null;
  notes?: string;
}

interface RecordsManagementProps {
  initialRecords: CreditReference[];
  startInModerationMode?: boolean;
  hideModeToggle?: boolean;
}

export function RecordsManagement({
  initialRecords,
  startInModerationMode = false,
  hideModeToggle = false,
}: RecordsManagementProps) {
  const [records, setRecords] = useState<CreditReference[]>(initialRecords);
  const [filteredRecords, setFilteredRecords] =
    useState<CreditReference[]>(initialRecords);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: "PAID" | "INACTIVE" | "PAYMENT_PLAN" | "DISPUTED" | null;
  }>({ open: false, action: null });
  const [bulkNotes, setBulkNotes] = useState("");
  const [moderationMode, setModerationMode] = useState(startInModerationMode);
  const [minRiskFilter, setMinRiskFilter] = useState("55");
  const [maxRiskFilter, setMaxRiskFilter] = useState("");
  const [riskSort, setRiskSort] = useState<"DESC" | "ASC" | "CREATED">("DESC");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.creditorName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (record) => record.debtStatus === statusFilter,
      );
    }

    if (moderationMode) {
      filtered = [...filtered].sort((a, b) => {
        if (riskSort === "ASC") {
          return (a.riskScore ?? 0) - (b.riskScore ?? 0);
        }

        if (riskSort === "CREATED") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        return (b.riskScore ?? 0) - (a.riskScore ?? 0);
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, moderationMode, riskSort]);

  useEffect(() => {
    refreshData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moderationMode, minRiskFilter, maxRiskFilter]);

  const refreshData = async (showToast = true) => {
    setIsLoading(true);
    try {
      const data = await api.get<{ success: boolean; data: CreditReference[] }>(
        moderationMode ? "/api/v1/records/moderation/queue" : "/api/v1/records",
        moderationMode
          ? {
              params: {
                minRisk: minRiskFilter || "55",
                maxRisk: maxRiskFilter,
              },
            }
          : undefined,
      );
      setRecords(data.data);
      setSelectedRecords([]);
      if (showToast) {
        toast.success("Datos actualizados correctamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords((prev) => [...prev, recordId]);
    } else {
      setSelectedRecords((prev) => prev.filter((id) => id !== recordId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map((record) => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este registro? Esta acción es irreversible.",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await api.del(`/api/v1/records/${id}`);
      toast.success("Registro eliminado correctamente.");
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkActionDialog.action || selectedRecords.length === 0) return;

    setIsLoading(true);
    try {
      await api.post("/api/v1/records/bulk-update-status", {
        recordIds: selectedRecords,
        status: bulkActionDialog.action,
        notes: bulkNotes.trim() || undefined,
      });

      toast.success(
        `${selectedRecords.length} registros actualizados correctamente.`,
      );
      setBulkActionDialog({ open: false, action: null });
      setBulkNotes("");
      setSelectedRecords([]);
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron actualizar los estados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerationAction = async (
    id: string,
    action: "APPROVE" | "REJECT",
    notes?: string,
  ) => {
    setIsLoading(true);
    try {
      await api.patch(`/api/v1/records/${id}/moderation`, {
        action,
        notes: notes?.trim() || undefined,
      });
      toast.success(
        action === "APPROVE"
          ? "Registro aprobado y publicado."
          : "Registro rechazado en moderación.",
      );
      await refreshData(false);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo aplicar la acción de moderación.");
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectReason("");
    setRejectDialog({ open: true, id });
  };

  const confirmReject = async () => {
    if (!rejectDialog.id) return;
    if (!rejectReason.trim()) {
      toast.error("Debes ingresar un motivo para rechazar.");
      return;
    }

    await handleModerationAction(rejectDialog.id, "REJECT", rejectReason);
    setRejectDialog({ open: false, id: null });
    setRejectReason("");
  };

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

  const statusStats = records.reduce(
    (acc, record) => {
      acc[record.debtStatus] = (acc[record.debtStatus] || 0) + 1;
      return acc;
    },
    {} as Record<RecordStatus, number>,
  );

  return (
    <div className="space-y-6">
      <StatusStats
        stats={statusStats}
        onStatusClick={(status) => setStatusFilter(status)}
      />

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-gray-100">
                Administración de Registros Crediticios
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Gestiona los estados de los registros crediticios. Se muestran{" "}
                {filteredRecords.length} de {records.length} registros.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!hideModeToggle && (
                <Button
                  variant={moderationMode ? "default" : "outline"}
                  onClick={() => {
                    setModerationMode((prev) => !prev);
                    setStatusFilter("ALL");
                    setSearchTerm("");
                    setSelectedRecords([]);
                  }}
                  disabled={isLoading}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {moderationMode ? "Vista normal" : "Cola moderación"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  void refreshData();
                }}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={filteredRecords.length === 0}
                  >
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {moderationMode && (
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="min-risk">Riesgo mín.</Label>
                <Input
                  id="min-risk"
                  type="number"
                  min={0}
                  max={100}
                  value={minRiskFilter}
                  onChange={(e) => setMinRiskFilter(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="max-risk">Riesgo máx.</Label>
                <Input
                  id="max-risk"
                  type="number"
                  min={0}
                  max={100}
                  value={maxRiskFilter}
                  onChange={(e) => setMaxRiskFilter(e.target.value)}
                  className="w-24"
                  placeholder="100"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="risk-sort">Orden</Label>
                <Select value={riskSort} onValueChange={(v) => setRiskSort(v as "DESC" | "ASC" | "CREATED")}>
                  <SelectTrigger id="risk-sort" className="w-[220px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESC">Riesgo: mayor a menor</SelectItem>
                    <SelectItem value="ASC">Riesgo: menor a mayor</SelectItem>
                    <SelectItem value="CREATED">Más recientes primero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" onClick={() => setStatusFilter("ALL")}>
                Todos ({records.length})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Activos ({statusStats.ACTIVE || 0})
              </TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setStatusFilter("PAID")}>
                Pagados ({statusStats.PAID || 0})
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                onClick={() => setStatusFilter("PAYMENT_PLAN")}
              >
                Plan Pago ({statusStats.PAYMENT_PLAN || 0})
              </TabsTrigger>
              <TabsTrigger
                value="disputed"
                onClick={() => setStatusFilter("DISPUTED")}
              >
                Disputados ({statusStats.DISPUTED || 0})
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                onClick={() => setStatusFilter("INACTIVE")}
              >
                Inactivos ({statusStats.INACTIVE || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ControlsPanel
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                selectedRecords={selectedRecords}
                onBulkAction={(action) =>
                  setBulkActionDialog({ open: true, action })
                }
                disabled={isLoading}
              />
              <RecordsTable
                records={filteredRecords}
                selectedRecords={selectedRecords}
                onSelectRecord={handleSelectRecord}
                onSelectAll={handleSelectAll}
                onDelete={handleDelete}
                onRefresh={refreshData}
                onApprove={(id) => handleModerationAction(id, "APPROVE")}
                onReject={openRejectDialog}
                moderationMode={moderationMode}
                isLoading={isLoading}
              />
            </TabsContent>

            {(
              [
                "ACTIVE",
                "PAID",
                "PAYMENT_PLAN",
                "DISPUTED",
                "INACTIVE",
              ] as RecordStatus[]
            ).map((status) => (
              <TabsContent
                key={status}
                value={status.toLowerCase()}
                className="space-y-4"
              >
                <ControlsPanel
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  selectedRecords={selectedRecords}
                  onBulkAction={(action) =>
                    setBulkActionDialog({ open: true, action })
                  }
                  disabled={isLoading}
                />
                <RecordsTable
                  records={filteredRecords}
                  selectedRecords={selectedRecords}
                  onSelectRecord={handleSelectRecord}
                  onSelectAll={handleSelectAll}
                  onDelete={handleDelete}
                  onRefresh={refreshData}
                  onApprove={(id) => handleModerationAction(id, "APPROVE")}
                  onReject={openRejectDialog}
                  moderationMode={moderationMode}
                  isLoading={isLoading}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={bulkActionDialog.open}
        onOpenChange={(open) =>
          setBulkActionDialog({ ...bulkActionDialog, open })
        }
      >
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Actualización Masiva de Estados
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Se actualizarán {selectedRecords.length} registros seleccionados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Acción a realizar</Label>
              <StatusBadge status={bulkActionDialog.action || "ACTIVE"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Notas (opcional)</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Añade notas sobre esta actualización masiva..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog({ open: false, action: null })}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulkStatusChange} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Confirmar Actualización"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Rechazar registro
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Debes ingresar un motivo para rechazar este registro en moderación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Motivo de rechazo</Label>
            <Textarea
              id="reject-reason"
              placeholder="Describe por qué se rechaza el registro..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, id: null });
                setRejectReason("");
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={isLoading}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ControlsPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: RecordStatus | "ALL";
  setStatusFilter: (filter: RecordStatus | "ALL") => void;
  selectedRecords: string[];
  onBulkAction: (
    action: "PAID" | "INACTIVE" | "PAYMENT_PLAN" | "DISPUTED",
  ) => void;
  disabled: boolean;
}

function ControlsPanel({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectedRecords,
  onBulkAction,
  disabled,
}: ControlsPanelProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, ID o acreedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as RecordStatus | "ALL")
        }
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          <SelectItem value="ACTIVE">Activa</SelectItem>
          <SelectItem value="PAID">Pagada</SelectItem>
          <SelectItem value="INACTIVE">Inactiva</SelectItem>
          <SelectItem value="PAYMENT_PLAN">Plan de Pago</SelectItem>
          <SelectItem value="DISPUTED">En Disputa</SelectItem>
        </SelectContent>
      </Select>

      {selectedRecords.length > 0 && (
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={disabled}>
                Acciones Masivas ({selectedRecords.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Seleccionar acción</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onBulkAction("PAID")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Pagados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("PAYMENT_PLAN")}>
                <Clock className="h-4 w-4 mr-2" />
                Establecer Plan de Pago
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("INACTIVE")}>
                <XCircle className="h-4 w-4 mr-2" />
                Marcar como Inactivos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("DISPUTED")}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Marcar en Disputa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

interface RecordsTableProps {
  records: CreditReference[];
  selectedRecords: string[];
  onSelectRecord: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  moderationMode: boolean;
  isLoading: boolean;
}

function RecordsTable({
  records,
  selectedRecords,
  onSelectRecord,
  onSelectAll,
  onDelete,
  onRefresh,
  onApprove,
  onReject,
  moderationMode,
  isLoading,
}: RecordsTableProps) {
  return (
    <div className="rounded-md border dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedRecords.length === records.length &&
                  records.length > 0
                }
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>No. Identificación</TableHead>
            <TableHead>Monto Deuda</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Moderación</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              className={record.deletedAt ? "opacity-40" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedRecords.includes(record.id)}
                  onCheckedChange={(checked) =>
                    onSelectRecord(record.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="font-medium">{record.fullName}</TableCell>
              <TableCell>{record.idNumber}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(record.debtAmount)}
              </TableCell>
              <TableCell>
                <StatusManager
                  currentStatus={record.debtStatus}
                  recordId={record.id}
                  recordName={record.fullName}
                  onStatusChange={onRefresh}
                  disabled={isLoading}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={record.publishState === "PUBLISHED" ? "default" : "secondary"}>
                    {record.publishState || "PENDING_AUTOMATION"}
                  </Badge>
                  {typeof record.riskScore === "number" && (
                    <Badge
                      className={
                        record.riskScore >= 70
                          ? "bg-red-100 text-red-800"
                          : record.riskScore >= 40
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }
                    >
                      Riesgo {record.riskScore}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500">
                    {record.reviewStatus || "PENDING"}
                  </span>
                  {moderationMode &&
                  (record.publishState === "PENDING_REVIEW" ||
                    record.reviewStatus === "NEEDS_REVIEW") ? (
                    <div className="flex gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => onApprove(record.id)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isLoading}
                        onClick={() => onReject(record.id)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {new Date(record.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(`/admin/records/${record.id}`, "_blank")
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {records.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron registros con los filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
}
