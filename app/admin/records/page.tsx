"use client";

import React, { useState, useEffect } from "react";
import { RecordsManagement } from "./_components/records-management";
import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type RecordStatus =
  | "ACTIVE"
  | "PAID"
  | "INACTIVE"
  | "PAYMENT_PLAN"
  | "DISPUTED";

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

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<CreditReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<{ success: boolean; data: CreditReference[] }>(
        "/api/v1/records",
      );

      if (data.success) {
        setRecords(data.data || []);
      } else {
        setError("Error al obtener los registros");
      }
    } catch (err) {
      console.error("[GET_RECORDS_ERROR]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar los registros",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Administración de Registros Crediticios
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona los estados de los registros crediticios, realiza
            actualizaciones masivas y exporta datos.
          </p>
        </div>
        <TableSkeleton rows={10} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Administración de Registros Crediticios
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona los estados de los registros crediticios, realiza
            actualizaciones masivas y exporta datos.
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error al cargar registros
            </h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={fetchRecords}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Administración de Registros Crediticios
        </h1>
        <p className="text-slate-600 mt-2">
          Gestiona los estados de los registros crediticios, realiza
          actualizaciones masivas y exporta datos.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/moderation">Ir a cola de moderación</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/disputes">Ir a disputas pendientes</Link>
          </Button>
        </div>
      </div>

      {records.length > 0 ? (
        <RecordsManagement initialRecords={records} />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No hay registros disponibles
          </h3>
          <p className="text-slate-500">
            No se encontraron registros o hubo un error al cargarlos.
          </p>
        </div>
      )}
    </div>
  );
}
