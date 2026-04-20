"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PencilLine, Save, LayoutGrid } from "lucide-react";

export type RecordStatus =
  | "ACTIVE"
  | "PAID"
  | "INACTIVE"
  | "PAYMENT_PLAN"
  | "DISPUTED";

type CreditReference = {
  id: string;
  fullName: string;
  idType: string;
  idNumber: string;
  creditorName: string;
  debtAmount: number | string;
  debtDate: string;
  debtStatus: RecordStatus;
  notes?: string | null;
  createdAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
};

export default function MyRecordsPage() {
  const [records, setRecords] = useState<CreditReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, RecordStatus>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteModeDraft, setNoteModeDraft] = useState<Record<string, "append" | "replace">>({});
  const [creditorDraft, setCreditorDraft] = useState<Record<string, string>>({});
  const [amountDraft, setAmountDraft] = useState<Record<string, string>>({});
  const [dateDraft, setDateDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [auditByRecord, setAuditByRecord] = useState<Record<string, AuditLog[]>>({});
  const [auditOpen, setAuditOpen] = useState<Record<string, boolean>>({});
  const [loadingAuditId, setLoadingAuditId] = useState<string | null>(null);

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("accessToken");
  }, []);

  const loadMyRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.get<{ success: boolean; data: CreditReference[] }>(
        "/api/v1/records/mine",
      );

      if (result.success) {
        setRecords(result.data || []);
      } else {
        setError("No se pudieron cargar tus registros");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar tus registros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) {
      window.location.href = "/login";
      return;
    }
    loadMyRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (r: CreditReference) => {
    setEditingId(r.id);
    setStatusDraft((prev) => ({ ...prev, [r.id]: r.debtStatus }));
    setNoteDraft((prev) => ({ ...prev, [r.id]: "" }));
    setNoteModeDraft((prev) => ({ ...prev, [r.id]: "append" }));
    setCreditorDraft((prev) => ({ ...prev, [r.id]: r.creditorName || "" }));
    setAmountDraft((prev) => ({ ...prev, [r.id]: String(r.debtAmount ?? "") }));

    const d = new Date(r.debtDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDateDraft((prev) => ({ ...prev, [r.id]: `${yyyy}-${mm}-${dd}` }));
  };

  const saveChanges = async (id: string) => {
    try {
      setSavingId(id);
      setError(null);

      const status = statusDraft[id];
      const notes = (noteDraft[id] || "").trim();
      const notesMode = noteModeDraft[id] || "append";
      const creditorName = (creditorDraft[id] || "").trim();
      const debtAmount = (amountDraft[id] || "").trim();
      const debtDate = (dateDraft[id] || "").trim();

      const result = await api.patch<
        { success: boolean; data: CreditReference; message?: string }
      >(`/api/v1/records/${id}`, {
        status,
        creditorName,
        debtAmount,
        debtDate,
        ...(notes ? { notes, notesMode } : {}),
      });

      if (!result.success) {
        setError("No se pudo actualizar el registro");
        return;
      }

      setRecords((prev) => prev.map((r) => (r.id === id ? result.data : r)));
      setEditingId(null);
    } catch (e: any) {
      // backend a veces responde {success:false,error:{message}}
      const msg =
        e?.error?.message || e?.message || "No se pudo actualizar el registro";
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  const toggleAudit = async (recordId: string) => {
    const nextOpen = !auditOpen[recordId];
    setAuditOpen((prev) => ({ ...prev, [recordId]: nextOpen }));
    if (!nextOpen) return;

    if (auditByRecord[recordId] && auditByRecord[recordId].length > 0) return;

    try {
      setLoadingAuditId(recordId);
      const result = await api.get<{ success: boolean; data: AuditLog[] }>(
        `/api/v1/records/${recordId}/audit-logs`,
      );
      if (result.success) {
        setAuditByRecord((prev) => ({ ...prev, [recordId]: result.data || [] }));
      }
    } catch {
      // no-op
    } finally {
      setLoadingAuditId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Mis registros creados
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Edita el estado y agrega notas/evidencia interna a los registros que creaste.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/feature-center">
                <LayoutGrid className="w-4 h-4 mr-2" /> Centro de Funciones
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        )}

        {!loading && records.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No has creado registros aún</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Cuando crees referencias nuevas, aparecerán aquí para que puedas
                mantenerlas actualizadas.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/add-record">Crear registro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && records.length > 0 && (
          <div className="space-y-4">
            {records.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <Card key={r.id} className="dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                          {r.fullName} ({r.idType} {r.idNumber})
                        </CardTitle>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          Acreedor: <span className="font-medium">{r.creditorName}</span>
                          {" "}• Monto: <span className="font-medium">{String(r.debtAmount)}</span>
                          {" "}• Fecha: <span className="font-medium">{new Date(r.debtDate).toLocaleDateString("es-ES")}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Creado: {new Date(r.createdAt).toLocaleString("es-ES")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{r.debtStatus}</Badge>
                        <Button
                          variant="outline"
                          onClick={() => toggleAudit(r.id)}
                          disabled={loadingAuditId === r.id}
                        >
                          {loadingAuditId === r.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Historial
                            </>
                          ) : auditOpen[r.id] ? (
                            "Ocultar historial"
                          ) : (
                            "Ver historial"
                          )}
                        </Button>
                        {!isEditing ? (
                          <Button variant="outline" onClick={() => startEdit(r)}>
                            <PencilLine className="w-4 h-4 mr-2" /> Editar
                          </Button>
                        ) : (
                          <Button
                            onClick={() => saveChanges(r.id)}
                            disabled={savingId === r.id}
                          >
                            {savingId === r.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" /> Guardar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {auditOpen[r.id] && (
                    <CardContent className="space-y-2">
                      {(auditByRecord[r.id] || []).length === 0 ? (
                        <p className="text-sm text-slate-500">Sin historial aún.</p>
                      ) : (
                        <div className="space-y-2">
                          {(auditByRecord[r.id] || []).map((log) => {
                            let changes: any[] = [];
                            try {
                              const parsed = log.details ? JSON.parse(log.details) : null;
                              changes = parsed?.changes || [];
                            } catch {
                              changes = [];
                            }

                            return (
                              <div
                                key={log.id}
                                className="rounded-lg border border-slate-200 dark:border-gray-700 p-3 bg-slate-50 dark:bg-gray-900"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium">
                                    {log.user
                                      ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})`
                                      : "Usuario"}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {new Date(log.createdAt).toLocaleString("es-ES")}
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                  {changes.length === 0 ? (
                                    <span>Cambio registrado.</span>
                                  ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {changes.map((c, idx) => (
                                        <li key={idx}>
                                          <span className="font-medium">{c.field}</span>

                                          {c.field === "notes" && c.mode === "replace" ? (
                                            <span>
                                              {" "}(replace)
                                              {" "}prevLen={c.previous?.length}
                                              {" "}prevHash={String(c.previous?.sha256 || "").slice(0, 12)}
                                              {" "}newLen={c.next?.length}
                                              {" "}newHash={String(c.next?.sha256 || "").slice(0, 12)}
                                              {c.snippet ? ` — nuevo: ${c.snippet}` : ""}
                                            </span>
                                          ) : c.mode ? (
                                            <span>
                                              {" "}({c.mode}){c.snippet ? `: ${c.snippet}` : ""}
                                            </span>
                                          ) : (
                                            <span>
                                              {": "}{String(c.from)} → {String(c.to)}
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  )}

                  {isEditing && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Acreedor</div>
                          <Input
                            value={creditorDraft[r.id] || ""}
                            onChange={(e) =>
                              setCreditorDraft((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="Nombre del acreedor"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Monto</div>
                          <Input
                            value={amountDraft[r.id] || ""}
                            onChange={(e) =>
                              setAmountDraft((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="Ej: 1500000"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Fecha</div>
                          <Input
                            type="date"
                            value={dateDraft[r.id] || ""}
                            onChange={(e) =>
                              setDateDraft((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Estado</div>
                          <Select
                            value={statusDraft[r.id] || r.debtStatus}
                            onValueChange={(v) =>
                              setStatusDraft((prev) => ({
                                ...prev,
                                [r.id]: v as RecordStatus,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PAID">PAID (Pagada)</SelectItem>
                              <SelectItem value="INACTIVE">INACTIVE (Inactiva)</SelectItem>
                              <SelectItem value="PAYMENT_PLAN">PAYMENT_PLAN (Acuerdo)</SelectItem>
                              <SelectItem value="DISPUTED">DISPUTED (En disputa)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            Nota: el estado ACTIVE no se puede asignar manualmente.
                          </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium">
                              {noteModeDraft[r.id] === "replace"
                                ? "Reemplazar notas"
                                : "Agregar nota"}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <Button
                                type="button"
                                variant={
                                  (noteModeDraft[r.id] || "append") === "append"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setNoteModeDraft((prev) => ({
                                    ...prev,
                                    [r.id]: "append",
                                  }))
                                }
                              >
                                Agregar
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  (noteModeDraft[r.id] || "append") === "replace"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setNoteModeDraft((prev) => ({
                                    ...prev,
                                    [r.id]: "replace",
                                  }))
                                }
                              >
                                Reemplazar
                              </Button>
                            </div>
                          </div>

                          {(noteModeDraft[r.id] || "append") === "replace" ? (
                            <p className="text-xs text-amber-600">
                              Advertencia: esto sobrescribe por completo el historial de notas.
                            </p>
                          ) : null}

                          <Textarea
                            value={noteDraft[r.id] || ""}
                            onChange={(e) =>
                              setNoteDraft((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              (noteModeDraft[r.id] || "append") === "replace"
                                ? "Escribe el nuevo contenido completo de notas (reemplaza todo)."
                                : "Ej: se confirmó pago, se actualizó el monto, se recibió evidencia..."
                            }
                            rows={4}
                          />
                        </div>
                      </div>

                      {r.notes ? (
                        <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-900">
                          <div className="text-sm font-medium mb-2">Historial de notas</div>
                          <pre className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                            {r.notes}
                          </pre>
                        </div>
                      ) : null}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
