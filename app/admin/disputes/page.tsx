"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PendingDispute = {
  id: string;
  reason: string;
  description: string;
  status: "PENDING";
  createdAt: string;
  adminNotes: string | null;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  record?: {
    id: string;
    fullName: string;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<PendingDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const loadPendingDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      const result: ApiResponse<PendingDispute[]> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "No se pudieron cargar las disputas");
        return;
      }

      setDisputes(result.data || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudieron cargar las disputas",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingDisputes();
  }, []);

  const resolveDispute = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes/${id}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            adminNotes: notesById[id] || undefined,
          }),
        },
      );

      const result: ApiResponse<unknown> = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "No se pudo resolver la disputa");
        return;
      }

      await loadPendingDisputes();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "No se pudo resolver la disputa",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Disputas pendientes
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Revisa casos pendientes y resuelve con notas administrativas.
        </p>
      </div>

      {loading && <p className="text-sm">Cargando disputas...</p>}

      {!loading && disputes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">No hay disputas pendientes.</p>
          </CardContent>
        </Card>
      )}

      {!loading && disputes.length > 0 && (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Disputa #{dispute.id}</CardTitle>
                  <Badge className="bg-amber-100 text-amber-800">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">Usuario:</span>{" "}
                  {[dispute.user?.firstName, dispute.user?.lastName]
                    .filter(Boolean)
                    .join(" ") || dispute.user?.email || "Sin datos"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Registro:</span>{" "}
                  {dispute.record?.fullName || dispute.record?.id || "Sin registro"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span> {dispute.reason}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Descripcion:</span>{" "}
                  {dispute.description}
                </p>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Notas administrativas</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={3}
                    value={notesById[dispute.id] || ""}
                    onChange={(event) =>
                      setNotesById((current) => ({
                        ...current,
                        [dispute.id]: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => resolveDispute(dispute.id, "APPROVED")}>
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => resolveDispute(dispute.id, "REJECTED")}
                  >
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
