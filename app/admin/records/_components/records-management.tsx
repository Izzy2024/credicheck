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
  createdAt: string;
  deletedAt: string | null;
  notes?: string;
}

interface RecordsManagementProps {
  initialRecords: CreditReference[];
}

export function RecordsManagement({ initialRecords }: RecordsManagementProps) {
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

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ success: boolean; data: CreditReference[] }>(
        "/api/v1/records",
      );
      setRecords(data.data);
      setSelectedRecords([]);
      toast.success("Datos actualizados correctamente.");
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
              <Button
                variant="outline"
                onClick={refreshData}
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
  isLoading: boolean;
}

function RecordsTable({
  records,
  selectedRecords,
  onSelectRecord,
  onSelectAll,
  onDelete,
  onRefresh,
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
