"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/loading-skeletons";
import { RecordsManagement, CreditReference } from "../records/_components/records-management";

export default function AdminModerationPage() {
  const [records, setRecords] = useState<CreditReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ success: boolean; data: CreditReference[] }>(
          "/api/v1/records/moderation/queue",
          { params: { minRisk: "55" } },
        );

        if (data.success) {
          setRecords(data.data || []);
        } else {
          setError("Error al obtener la cola de moderación");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar la cola de moderación",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cola de Moderación</h1>
          <p className="text-slate-600 mt-2">
            Revisa primero los registros con mayor riesgo para aprobar o rechazar.
          </p>
        </div>
        <TableSkeleton rows={10} cols={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cola de Moderación</h1>
          <p className="text-slate-600 mt-2">
            Revisa primero los registros con mayor riesgo para aprobar o rechazar.
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error al cargar cola de moderación
            </h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Cola de Moderación</h1>
        <p className="text-slate-600 mt-2">
          Revisa primero los registros con mayor riesgo para aprobar o rechazar.
        </p>
      </div>

      <RecordsManagement
        initialRecords={records}
        startInModerationMode
        hideModeToggle
      />
    </div>
  );
}
