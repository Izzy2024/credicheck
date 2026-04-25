"use client";

import { API_BASE_URL } from '@/lib/api-base';

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Download,
  Eye,
  FileUp,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Shield,
} from "lucide-react";

type DisputeStatus = "PENDING" | "APPROVED" | "REJECTED";

type DisputeMessage = {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

type DisputeAttachment = {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
};

type DisputeRecord = {
  id: string;
  status: DisputeStatus;
  reason: string;
  description: string;
  adminNotes: string | null;
  createdAt: string;
  recordId: string;
  record?: {
    id: string;
    fullName: string;
    idType: string;
    idNumber: string;
    debtAmount: unknown;
    creditorName: string;
    debtStatus: string;
  } | null;
  attachments?: DisputeAttachment[];
  messages?: DisputeMessage[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
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

function DisputesPageContent() {
  const searchParams = useSearchParams();
  const targetDisputeIdRef = useRef<string | null>(null);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const [newMessageByDispute, setNewMessageByDispute] = useState<
    Record<string, string>
  >({});
  const [filesByDispute, setFilesByDispute] = useState<
    Record<string, FileList | null>
  >({});

  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(
    null,
  );
  const [attachmentActionId, setAttachmentActionId] = useState<string | null>(null);
  const [loadingMessagesId, setLoadingMessagesId] = useState<string | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/disputes/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const result: ApiResponse<DisputeRecord[]> = await response.json();
      if (result.success) {
        setDisputes(result.data || []);
      } else {
        setError(result.error || "No se pudieron cargar las disputas");
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
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const targetId = searchParams.get("disputeId");
    targetDisputeIdRef.current = targetId;

    loadDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetId = targetDisputeIdRef.current;
    if (!targetId) return;

    const exists = disputes.some((d) => d.id === targetId);
    if (!exists) return;

    // Abrir hilo y cargar mensajes una sola vez
    targetDisputeIdRef.current = null;
    setOpenThreads((prev) => ({ ...prev, [targetId]: true }));
    void loadMessages(targetId);

    // scroll al card
    const el = document.getElementById(`dispute-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [disputes]);

  const loadMessages = async (disputeId: string) => {
    try {
      setLoadingMessagesId(disputeId);
      setError(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/disputes/${disputeId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const result: ApiResponse<DisputeMessage[]> = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "No se pudieron cargar los mensajes");
        return;
      }

      setDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, messages: result.data } : d)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes");
    } finally {
      setLoadingMessagesId(null);
    }
  };

  const handleSendMessage = async (disputeId: string) => {
    const message = (newMessageByDispute[disputeId] || "").trim();
    if (!message) return;

    try {
      setSendingMessageId(disputeId);
      setError(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/disputes/${disputeId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      const result: ApiResponse<DisputeMessage> = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "No se pudo enviar el mensaje");
        return;
      }

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, messages: [...(d.messages || []), result.data] }
            : d,
        ),
      );

      setNewMessageByDispute((prev) => ({ ...prev, [disputeId]: "" }));
      setOpenThreads((prev) => ({ ...prev, [disputeId]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje");
    } finally {
      setSendingMessageId(null);
    }
  };

  const sendTemplateMessage = async (disputeId: string, message: string) => {
    try {
      setSendingMessageId(disputeId);
      setError(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/disputes/${disputeId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      const result: ApiResponse<DisputeMessage> = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "No se pudo enviar la solicitud");
        return;
      }

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, messages: [...(d.messages || []), result.data] }
            : d,
        ),
      );
      setOpenThreads((prev) => ({ ...prev, [disputeId]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
    } finally {
      setSendingMessageId(null);
    }
  };

  const handleOpenAttachment = async (
    disputeId: string,
    attachment: DisputeAttachment,
    asDownload = false,
  ) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      setAttachmentActionId(attachment.id);
      const endpoint = `${API_BASE_URL}/api/v1/disputes/${disputeId}/attachments/${attachment.id}/download${asDownload ? "?download=1" : ""}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const txt = await response.text();
        setError(txt || "No se pudo abrir el archivo");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (asDownload) {
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el archivo");
    } finally {
      setAttachmentActionId(null);
    }
  };

  const handleUploadEvidence = async (disputeId: string) => {
    const files = filesByDispute[disputeId];
    if (!files || files.length === 0) return;

    try {
      setUploadingEvidenceId(disputeId);
      setError(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const response = await fetch(
        `${API_BASE_URL}/api/v1/disputes/${disputeId}/attachments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const txt = await response.text();
        setError(txt || "No se pudieron subir los adjuntos");
        return;
      }

      setFilesByDispute((prev) => ({ ...prev, [disputeId]: null }));
      await loadDisputes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir evidencia");
    } finally {
      setUploadingEvidenceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Mis disputas
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Revisa el estado, agrega comentarios y sube evidencia.
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Volver al Dashboard
          </Button>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && <p className="text-sm">Cargando disputas...</p>}

        {!loading && disputes.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No tienes disputas aún</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Para abrir una disputa, busca tu referencia y presiona el botón
                “Apelar / Disputar” en el resultado.
              </p>
              <div className="mt-4">
                <Button onClick={() => (window.location.href = "/dashboard")}>
                  Ir a buscar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && disputes.length > 0 && (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const threadOpen = !!openThreads[dispute.id];
              const messages = dispute.messages || [];
              const attachments = dispute.attachments || [];

              return (
                <Card id={`dispute-${dispute.id}`} key={dispute.id} className="dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          Disputa #{dispute.id}
                        </CardTitle>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(dispute.createdAt).toLocaleString("es-ES")}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Registro:</span> {dispute.recordId}
                            {dispute.record?.creditorName ? (
                              <span>
                                {" "}
                                • <span className="font-medium">Acreedor:</span>{" "}
                                {dispute.record.creditorName}
                              </span>
                            ) : null}
                          </div>
                          {dispute.record?.fullName ? (
                            <div>
                              <span className="font-medium">Persona:</span>{" "}
                              {dispute.record.fullName} ({dispute.record.idType}{" "}
                              {dispute.record.idNumber})
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(dispute.status)}
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const nextOpen = !threadOpen;
                            setOpenThreads((prev) => ({
                              ...prev,
                              [dispute.id]: nextOpen,
                            }));

                            if (nextOpen) {
                              await loadMessages(dispute.id);
                            }
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {threadOpen ? "Ocultar" : "Ver"} mensajes
                        </Button>

                        {threadOpen && (
                          <Button
                            variant="outline"
                            onClick={() => loadMessages(dispute.id)}
                            disabled={loadingMessagesId === dispute.id}
                          >
                            {loadingMessagesId === dispute.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Actualizando...
                              </>
                            ) : (
                              "Actualizar"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Motivo</div>
                        <div className="text-sm text-slate-700 dark:text-slate-200">
                          {dispute.reason}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Descripción</div>
                        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {dispute.description}
                        </div>
                      </div>
                    </div>

                    {dispute.adminNotes && (
                      <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-900">
                        <div className="text-sm font-medium mb-1">Notas del administrador</div>
                        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {dispute.adminNotes}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Paperclip className="w-4 h-4" /> Evidencia
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setFilesByDispute((prev) => ({
                                ...prev,
                                [dispute.id]: e.target.files,
                              }))
                            }
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleUploadEvidence(dispute.id)}
                            disabled={uploadingEvidenceId === dispute.id}
                          >
                            {uploadingEvidenceId === dispute.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <FileUp className="w-4 h-4 mr-2" />
                                Subir
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        {attachments.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No has adjuntado evidencia aún.
                          </p>
                        ) : (
                          <ul className="text-sm space-y-2">
                            {attachments.map((a) => (
                              <li
                                key={a.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-2"
                              >
                                <span className="text-slate-700 dark:text-slate-200">
                                  {a.fileName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenAttachment(dispute.id, a, false)}
                                    disabled={attachmentActionId === a.id}
                                  >
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenAttachment(dispute.id, a, true)}
                                    disabled={attachmentActionId === a.id}
                                  >
                                    <Download className="w-4 h-4 mr-1" /> Descargar
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-900">
                      <div className="text-sm font-medium mb-2">Solicitudes sugeridas (sin cambiar estado directamente)</div>
                      <p className="text-xs text-slate-500 mb-3">
                        Recomendación: el usuario no debe cambiar el estado de deuda de forma directa; debe solicitarlo en la disputa para validación del admin.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            sendTemplateMessage(
                              dispute.id,
                              "Solicito actualización del estado a PAGADA. Adjunto soporte de pago y autorización para revisión.",
                            )
                          }
                          disabled={sendingMessageId === dispute.id}
                        >
                          Solicitar marcar como PAGADA
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            sendTemplateMessage(
                              dispute.id,
                              "Solicito corrección de estado/valor del registro por inconsistencia detectada. Adjunto evidencia.",
                            )
                          }
                          disabled={sendingMessageId === dispute.id}
                        >
                          Solicitar corrección de estado
                        </Button>
                      </div>
                    </div>

                    {threadOpen && (
                      <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium">Mensajes</div>
                          {loadingMessagesId === dispute.id && (
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Cargando...
                            </div>
                          )}
                        </div>

                        {messages.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Aún no hay mensajes. Puedes enviar un comentario o añadir información.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((m) => (
                              <div key={m.id} className="rounded-md bg-slate-50 dark:bg-gray-900 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium">
                                    {m.user.firstName} {m.user.lastName}{" "}
                                    <span className="text-xs text-slate-500">
                                      ({m.user.role})
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {new Date(m.createdAt).toLocaleString("es-ES")}
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                  {m.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 dark:border-gray-700">
                          <label className="text-sm font-medium">Agregar comentario</label>
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={newMessageByDispute[dispute.id] || ""}
                              onChange={(e) =>
                                setNewMessageByDispute((prev) => ({
                                  ...prev,
                                  [dispute.id]: e.target.value,
                                }))
                              }
                              placeholder="Escribe tu comentario, fechas, aclaraciones o nueva evidencia (y adjunta archivos arriba si aplica)."
                              rows={4}
                            />
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleSendMessage(dispute.id)}
                                disabled={sendingMessageId === dispute.id}
                              >
                                {sendingMessageId === dispute.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <p className="text-sm text-slate-500">Cargando disputas...</p>
        </div>
      }
    >
      <DisputesPageContent />
    </Suspense>
  );
}
