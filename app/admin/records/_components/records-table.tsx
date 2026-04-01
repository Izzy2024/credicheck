"use client";

import React, { useState } from "react";
import { CreditReference, RecordStatus } from "../page";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RecordsTableProps {
  records: CreditReference[];
}

export function RecordsTable({ records }: RecordsTableProps) {
  const router = useRouter();
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.creditorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || record.debtStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const handleStatusChange = async (
    id: string,
    status: RecordStatus,
    notes?: string,
  ) => {
    setIsLoading(true);
    try {
      await api.put(`/api/v1/records/${id}/status`, { status, notes });

      toast.success("Estado actualizado correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el estado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusChange = async (
    status: RecordStatus,
    notes?: string,
  ) => {
    if (selectedRecords.length === 0) {
      toast.error("Por favor selecciona al menos un registro.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/v1/records/bulk-update-status", {
        recordIds: selectedRecords,
        status,
        notes,
      });

      toast.success(
        `${selectedRecords.length} registros actualizados correctamente.`,
      );
      setSelectedRecords([]);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron actualizar los estados.");
    } finally {
      setIsLoading(false);
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
      await api.del<{ success: boolean }>(`/api/v1/records/${id}`);
      toast.success("Registro eliminado correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: RecordStatus) => {
    switch (status) {
      case "PAID":
        return "success";
      case "INACTIVE":
        return "secondary";
      case "PAYMENT_PLAN":
        return "outline";
      case "DISPUTED":
        return "destructive";
      case "ACTIVE":
      default:
        return "destructive";
    }
  };

  const getStatusIcon = (status: RecordStatus) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4" />;
      case "INACTIVE":
        return <XCircle className="h-4 w-4" />;
      case "PAYMENT_PLAN":
        return <Clock className="h-4 w-4" />;
      case "DISPUTED":
        return <AlertCircle className="h-4 w-4" />;
      case "ACTIVE":
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status: RecordStatus) => {
    switch (status) {
      case "ACTIVE":
        return "Activa";
      case "PAID":
        return "Pagada";
      case "INACTIVE":
        return "Inactiva";
      case "PAYMENT_PLAN":
        return "Plan de Pago";
      case "DISPUTED":
        return "En Disputa";
      default:
        return status;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {(
          [
            "ACTIVE",
            "PAID",
            "INACTIVE",
            "PAYMENT_PLAN",
            "DISPUTED",
          ] as RecordStatus[]
        ).map((status) => (
          <Card
            key={status}
            className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-300">
                {getStatusDescription(status)}
              </CardTitle>
              {getStatusIcon(status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">
                {statusStats[status] || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">
            Administración de Registros
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Gestiona los estados de los registros crediticios. Se muestran{" "}
            {filteredRecords.length} de {records.length} registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleBulkStatusChange(
                      "PAID",
                      "Actualización masiva a pagado",
                    )
                  }
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Pagados ({selectedRecords.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleBulkStatusChange(
                      "INACTIVE",
                      "Actualización masiva a inactivo",
                    )
                  }
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar como Inactivos ({selectedRecords.length})
                </Button>
              </div>
            )}
          </div>

          <div className="hidden md:block rounded-md border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedRecords.length === filteredRecords.length &&
                        filteredRecords.length > 0
                      }
                      onCheckedChange={handleSelectAll}
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
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={record.deletedAt ? "opacity-40" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.includes(record.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRecord(record.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.fullName}
                    </TableCell>
                    <TableCell>{record.idNumber}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(record.debtAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(record.debtStatus)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(record.debtStatus)}
                        {getStatusDescription(record.debtStatus)}
                      </Badge>
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
                              handleStatusChange(record.id, "PAID")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Pagado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(record.id, "PAYMENT_PLAN")
                            }
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            En Plan de Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(record.id, "INACTIVE")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Marcar como Inactivo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(record.id, "DISPUTED")
                            }
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Marcar en Disputa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(record.id)}
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
          </div>

          <div className="md:hidden space-y-3">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className={`dark:bg-gray-800 dark:border-gray-700 ${record.deletedAt ? "opacity-40" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium dark:text-gray-100">
                          {record.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          {record.idNumber}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusVariant(record.debtStatus)}
                        className="flex items-center gap-1 ml-2"
                      >
                        {getStatusIcon(record.debtStatus)}
                        {getStatusDescription(record.debtStatus)}
                      </Badge>
                    </div>
                    <Separator className="dark:bg-gray-700" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground dark:text-gray-400">
                          Monto:
                        </span>{" "}
                        <span className="font-medium dark:text-gray-200">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                          }).format(record.debtAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground dark:text-gray-400">
                          Fecha:
                        </span>{" "}
                        <span className="dark:text-gray-300">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(record.id, "PAID")}
                        disabled={isLoading}
                        className="dark:border-gray-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pagado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(record.id, "PAYMENT_PLAN")
                        }
                        disabled={isLoading}
                        className="dark:border-gray-600"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Plan de Pago
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(record.id, "INACTIVE")
                        }
                        disabled={isLoading}
                        className="dark:border-gray-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactivo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(record.id, "DISPUTED")
                        }
                        disabled={isLoading}
                        className="dark:border-gray-600"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Disputa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 dark:border-gray-600"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron registros con los filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
