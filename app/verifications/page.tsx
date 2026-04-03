'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Verification {
  id: string;
  recordId: string;
  userId: string;
  type: 'CONFIRMED' | 'DISPUTED';
  confidence: number;
  comment?: string;
  createdAt: string;
  record?: {
    fullName: string;
    idNumber: string;
    idType: string;
    debtAmount: number;
    creditorName: string;
  };
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/verifications/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerifications(data.data || []);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 4) return <Badge className="bg-green-600">Alta</Badge>;
    if (confidence >= 3) return <Badge className="bg-yellow-600">Media</Badge>;
    return <Badge className="bg-red-600">Baja</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'CONFIRMED') {
      return (
        <Badge variant="outline" className="border-green-600 text-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          Confirmada
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-red-600 text-red-700">
        <XCircle className="mr-1 h-3 w-3" />
        Disputada
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando verificaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Verificaciones</h1>
        <p className="text-muted-foreground">
          Revisión de confirmaciones y disputas de referencias crediticias
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pendientes de revisión
          </CardTitle>
          <CardDescription>
            {verifications.length === 0
              ? 'No hay verificaciones pendientes'
              : `${verifications.length} verificación(es) registrada(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No se encontraron verificaciones pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <Card key={verification.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {verification.record?.fullName || 'N/A'}
                        </CardTitle>
                        <CardDescription>
                          {verification.record?.idType} {verification.record?.idNumber}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getTypeBadge(verification.type)}
                        {getConfidenceBadge(verification.confidence)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {verification.record && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Acreedor:</span>
                          <p className="font-medium">{verification.record.creditorName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Monto:</span>
                          <p className="font-medium">
                            ${verification.record.debtAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {verification.comment && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Comentario:</p>
                            <p className="text-sm">{verification.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Registrado: {new Date(verification.createdAt).toLocaleString()}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver detalles
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Resolver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Las verificaciones representan confirmaciones o disputas de referencias crediticias:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Confirmadas</strong>: Usuarios que confirman la validez de la referencia</li>
            <li><strong>Disputadas</strong>: Usuarios que cuestionan la validez de la referencia</li>
            <li><strong>Confianza</strong>: Nivel de certeza reportado (1-5)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
