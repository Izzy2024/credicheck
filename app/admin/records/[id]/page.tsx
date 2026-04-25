"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RecordDetail = {
  id: string;
  fullName: string;
  idType: string;
  idNumber: string;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  debtAmount: number;
  debtDate: string;
  creditorName: string;
  debtStatus: string;
  caseType?: string;
  publishState?: string;
  reviewStatus?: string;
  riskScore?: number;
  riskReasons?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function AdminRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ success: boolean; data: RecordDetail }>(
          `/api/v1/records/${id}`,
        );
        if (!res.success) {
          setError("No se pudo cargar el registro.");
          return;
        }
        setRecord(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando detalle.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const riskReasons = useMemo(() => {
    if (!record?.riskReasons) return [] as string[];
    try {
      const parsed = JSON.parse(record.riskReasons);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [record?.riskReasons]);

  if (loading) {
    return <div className="p-6">Cargando registro...</div>;
  }

  if (error || !record) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || "Registro no encontrado"}</span>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/records">Volver a registros</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Detalle del registro</h1>
        <Button asChild variant="outline">
          <Link href="/admin/records">Volver</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4">
        <Field label="Nombre" value={record.fullName} />
        <Field label="Documento" value={`${record.idType} ${record.idNumber}`} />
        <Field label="Acreedor" value={record.creditorName} />
        <Field
          label="Monto"
          value={new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(record.debtAmount)}
        />
        <Field label="Estado deuda" value={record.debtStatus} />
        <Field label="Fecha deuda" value={new Date(record.debtDate).toLocaleDateString()} />
        <Field label="Teléfono" value={record.phone || "-"} />
        <Field label="Email" value={record.email || "-"} />
        <Field label="Ciudad" value={record.city || "-"} />
        <Field label="Estado" value={record.state || "-"} />
        <Field label="País" value={record.country || "-"} />
        <Field label="Dirección" value={record.address || "-"} />
        <Field label="Tipo caso" value={record.caseType || "FORMAL"} />
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Moderación</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{record.publishState || "PENDING_AUTOMATION"}</Badge>
          <Badge variant="secondary">{record.reviewStatus || "PENDING"}</Badge>
          <Badge
            className={
              (record.riskScore || 0) >= 70
                ? "bg-red-100 text-red-800"
                : (record.riskScore || 0) >= 40
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
            }
          >
            Riesgo {record.riskScore ?? 0}
          </Badge>
        </div>
        {riskReasons.length > 0 && (
          <ul className="list-disc ml-5 text-sm text-slate-700">
            {riskReasons.map((reason, idx) => (
              <li key={`${reason}-${idx}`}>{reason}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Notas</h2>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.notes || "Sin notas"}</p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}
