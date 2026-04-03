"use client";

import { FormEvent, useEffect, useState } from "react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DisputeStatus = "PENDING" | "APPROVED" | "REJECTED";

type DisputeRecord = {
  id: string;
  status: DisputeStatus;
  reason: string;
  description: string;
  adminNotes: string | null;
  createdAt: string;
  recordId: string;
  attachments?: Array<{ id: string; fileName: string }>;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

function getStatusBadge(status: DisputeStatus) {
  if (status === "APPROVED") {
    return <Badge className="bg-emerald-100 text-emerald-800">Aprobada</Badge>;
  }

  if (status === "REJECTED") {
    return <Badge className="bg-rose-100 text-rose-800">Rechazada</Badge>;
  }

  return <Badge className="bg-amber-100 text-amber-800">Pendiente</Badge>;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recordId, setRecordId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes/me`,
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

      const result: ApiResponse<DisputeRecord[]> = await response.json();
      if (result.success) {
        setDisputes(result.data || []);
      }
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
    loadDisputes();
  }, []);

  const handleCreateDispute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recordId,
            reason,
            description,
          }),
        },
      );

      const createResult: ApiResponse<{ id: string }> & { error?: string } =
        await createResponse.json();

      if (!createResponse.ok || !createResult.success) {
        setError(createResult.error || "No se pudo crear la disputa");
        return;
      }

      if (files && files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append("files", file);
        });

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/disputes/${createResult.data.id}/attachments`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );
      }

      setRecordId("");
      setReason("");
      setDescription("");
      setFiles(null);
      await loadDisputes();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo abrir la disputa",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Abrir disputa
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Crea una disputa para un registro y consulta su estado.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Nueva disputa</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateDispute}>
              <div className="space-y-1">
                <label className="text-sm font-medium">ID de registro</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={recordId}
                  onChange={(event) => setRecordId(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Motivo</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  minLength={10}
                  maxLength={500}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Descripcion</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minLength={20}
                  maxLength={2000}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Adjuntos (opcional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(event) => setFiles(event.target.files)}
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar disputa"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis disputas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm">Cargando disputas...</p>}
            {!loading && disputes.length === 0 && (
              <p className="text-sm text-slate-500">No hay disputas registradas.</p>
            )}
            {!loading && disputes.length > 0 && (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="rounded-lg border bg-white p-4 dark:bg-slate-950"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">#{dispute.id}</p>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Registro:</span> {dispute.recordId}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Motivo:</span> {dispute.reason}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Descripcion:</span>{" "}
                      {dispute.description}
                    </p>
                    {dispute.adminNotes && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Notas admin:</span>{" "}
                        {dispute.adminNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
