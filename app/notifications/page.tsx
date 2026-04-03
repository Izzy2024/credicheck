"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Archive, CheckCheck, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Notification = {
  id: string;
  title: string;
  message: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const loadNotifications = async () => {
      const [unreadResponse, notificationsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const unreadResult = await unreadResponse.json();
      const notificationsResult = await notificationsResponse.json();

      setUnreadCount(unreadResult.count ?? 0);
      setNotifications(notificationsResult.notifications ?? []);
    };

    void loadNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              No leídas
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Notificaciones
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Revisa alertas del sistema, marca como leídas o archiva mensajes.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/feature-center">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Centro de Funciones
              </Link>
            </Button>
            <Button variant="outline" className="bg-transparent">
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bandeja
            </CardTitle>
            <CardDescription>
              {unreadCount} sin leer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No hay notificaciones para mostrar.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                        {notification.title}
                      </h2>
                      <Badge variant="secondary">{notification.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Leer
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Archive className="mr-2 h-4 w-4" />
                      Archivar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
