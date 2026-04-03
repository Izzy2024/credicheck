"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Shield, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RiskScorePage() {
  const [documentNumber, setDocumentNumber] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              Acceso autenticado
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Score de Riesgo
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Consulta el score crediticio de una persona con credenciales válidas.
            </p>
          </div>

          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/feature-center">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Centro de Funciones
            </Link>
          </Button>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Búsqueda de Riesgo
            </CardTitle>
            <CardDescription>
              Ingresa un número de documento para calcular el score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="documentNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Número de documento
              </label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                placeholder="12345678"
              />
            </div>

            <Button className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Calcular score
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
