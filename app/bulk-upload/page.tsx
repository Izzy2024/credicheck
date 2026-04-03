'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    created?: number;
    updated?: number;
    failed?: number;
    errors?: string[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/bulk-upload/template', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error al descargar el template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Por favor seleccione un archivo CSV válido');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor seleccione un archivo CSV');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const csvContent = await file.text();

      const response = await fetch('/api/v1/bulk-upload/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ csvContent }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setResult({
          success: false,
          errors: [data.error || 'Error al procesar el archivo'],
        });
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setResult({
        success: false,
        errors: ['Error de conexión al subir el archivo'],
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Carga Masiva de Registros</h1>
        <p className="text-muted-foreground">
          Importa múltiples referencias crediticias desde un archivo CSV
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Download Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Paso 1: Descargar Plantilla
            </CardTitle>
            <CardDescription>
              Descarga el archivo CSV de plantilla con el formato correcto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Descargar template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Paso 2: Cargar Archivo
            </CardTitle>
            <CardDescription>
              Selecciona y carga tu archivo CSV con los registros a importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>

            {file && (
              <div className="text-sm text-muted-foreground">
                Archivo seleccionado: <span className="font-medium">{file.name}</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Carga Completada
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Error en la Carga
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.success && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{result.created || 0}</div>
                    <div className="text-sm text-green-600">Creados</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{result.updated || 0}</div>
                    <div className="text-sm text-blue-600">Actualizados</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{result.failed || 0}</div>
                    <div className="text-sm text-red-600">Fallidos</div>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Formato del CSV</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>El archivo CSV debe contener las siguientes columnas:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>fullName</strong>: Nombre completo del deudor</li>
              <li><strong>idType</strong>: Tipo de identificación (CC, CE, NIT, etc.)</li>
              <li><strong>idNumber</strong>: Número de identificación</li>
              <li><strong>debtAmount</strong>: Monto de la deuda</li>
              <li><strong>debtDate</strong>: Fecha de la deuda (formato: YYYY-MM-DD)</li>
              <li><strong>creditorName</strong>: Nombre del acreedor</li>
              <li><strong>debtStatus</strong>: Estado (ACTIVE, PAID, INACTIVE, PAYMENT_PLAN, DISPUTED)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
