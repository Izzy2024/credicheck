"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CheckCircle, Clock, XCircle, AlertCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export type RecordStatus =
  | "ACTIVE"
  | "PAID"
  | "INACTIVE"
  | "PAYMENT_PLAN"
  | "DISPUTED";

interface StatusManagerProps {
  currentStatus: RecordStatus;
  recordId: string;
  recordName: string;
  onStatusChange?: (newStatus: RecordStatus) => void;
  disabled?: boolean;
}

export function StatusManager({
  currentStatus,
  recordId,
  recordName,
  onStatusChange,
  disabled = false,
}: StatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RecordStatus | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const getStatusExtendedDescription = (status: RecordStatus) => {
    switch (status) {
      case "ACTIVE":
        return "La deuda está activa y requiere atención";
      case "PAID":
        return "La deuda ha sido completamente cancelada";
      case "INACTIVE":
        return "La deuda está inactiva por cualquier motivo";
      case "PAYMENT_PLAN":
        return "La deuda está en un plan de pagos acordado";
      case "DISPUTED":
        return "La deuda está siendo disputada o revisada";
      default:
        return "";
    }
  };

  const getAvailableStatuses = (): RecordStatus[] => {
    const allStatuses: RecordStatus[] = [
      "PAID",
      "INACTIVE",
      "PAYMENT_PLAN",
      "DISPUTED",
    ];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    setIsLoading(true);
    try {
      await api.put(`/api/v1/records/${recordId}/status`, {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });

      toast.success("Estado actualizado correctamente.");
      setIsDialogOpen(false);
      setNotes("");
      setSelectedStatus(null);

      if (onStatusChange) {
        onStatusChange(selectedStatus);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el estado.");
    } finally {
      setIsLoading(false);
    }
  };

  const openStatusDialog = (status: RecordStatus) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge
          variant={getStatusVariant(currentStatus)}
          className="flex items-center gap-1"
        >
          {getStatusIcon(currentStatus)}
          {getStatusDescription(currentStatus)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Cambiar Estado del Registro
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Registro: <strong>{recordName}</strong>
              <br />
              Estado actual:{" "}
              <Badge variant={getStatusVariant(currentStatus)} className="ml-1">
                {getStatusDescription(currentStatus)}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo estado</Label>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableStatuses().map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    className="justify-start h-auto p-3"
                    onClick={() => setSelectedStatus(status)}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <div className="text-left">
                        <div className="font-medium">
                          {getStatusDescription(status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusExtendedDescription(status)}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Añade notas sobre el cambio de estado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || isLoading}
            >
              {isLoading ? "Actualizando..." : "Confirmar Cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StatusBadgeProps {
  status: RecordStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
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
        return <CheckCircle className="h-3 w-3" />;
      case "INACTIVE":
        return <XCircle className="h-3 w-3" />;
      case "PAYMENT_PLAN":
        return <Clock className="h-3 w-3" />;
      case "DISPUTED":
        return <AlertCircle className="h-3 w-3" />;
      case "ACTIVE":
      default:
        return <AlertCircle className="h-3 w-3" />;
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

  return (
    <Badge
      variant={getStatusVariant(status)}
      className="flex items-center gap-1 w-fit"
    >
      {showIcon && getStatusIcon(status)}
      {getStatusDescription(status)}
    </Badge>
  );
}

interface StatusStatsProps {
  stats: Record<RecordStatus, number>;
  onStatusClick?: (status: RecordStatus) => void;
}

export function StatusStats({ stats, onStatusClick }: StatusStatsProps) {
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

  const getStatusColor = (status: RecordStatus) => {
    switch (status) {
      case "PAID":
        return "text-green-600";
      case "INACTIVE":
        return "text-gray-600";
      case "PAYMENT_PLAN":
        return "text-blue-600";
      case "DISPUTED":
        return "text-red-600";
      case "ACTIVE":
      default:
        return "text-red-600";
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          onClick={() => onStatusClick?.(status)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">
              {getStatusDescription(status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">
              {stats[status] || 0}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {getStatusDescription(status)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
