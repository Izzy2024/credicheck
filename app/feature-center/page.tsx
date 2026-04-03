"use client";

import React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, History, Shield, Users, FileText, AlertTriangle, Upload } from "lucide-react";

const FEATURES = [
  {
    title: "Buscar referencias",
    description: "Consulta información desde el panel principal.",
    href: "/dashboard",
    icon: Shield,
  },
  {
    title: "Historial",
    description: "Revisa búsquedas previas y exporta resultados.",
    href: "/history",
    icon: History,
  },
  {
    title: "Agregar registros",
    description: "Carga nuevas referencias crediticias negativas.",
    href: "/add-record",
    icon: FileText,
  },
  {
    title: "Carga masiva CSV",
    description: "Importa múltiples registros desde archivo CSV.",
    href: "/bulk-upload",
    icon: Upload,
  },
  {
    title: "Administración",
    description: "Gestiona usuarios, ajustes y supervisión interna.",
    href: "/admin",
    icon: Users,
  },
  {
    title: "Disputas",
    description: "Centro de revisión y resolución para casos en conflicto.",
    href: "/history",
    icon: AlertTriangle,
  },
];

export default function FeatureCenterPage() {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              Acceso autenticado
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Centro de Funciones
            </h1>
            <p className="max-w-2xl text-slate-600 dark:text-slate-300">
              Punto de entrada principal para usuarios normales y administradores.
            </p>
          </div>

          <Button asChild className="w-fit">
            <Link href="/dashboard">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Ir al panel
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-900 p-3 text-cyan-400 dark:bg-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={feature.href}>Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
