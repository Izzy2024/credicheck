"use client";

import { API_BASE_URL } from '@/lib/api-base';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Shield,
  Save,
  AlertTriangle,
  CheckCircle,
  User,
  CreditCard,
} from "lucide-react";
import {
  createRecordSchema,
  type CreateRecordFormData,
} from "@/lib/validations/credit-reference";

const defaultValues: CreateRecordFormData = {
  fullName: "",
  idNumber: "",
  idType: "CC",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  department: "",
  creditorName: "",
  debtAmount: "",
  debtDate: "",
  debtStatus: "ACTIVE",
  notes: "",
};

export default function AddRecord() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recordCount, setRecordCount] = useState<number | null>(null);

  const form = useForm<CreateRecordFormData>({
    resolver: zodResolver(createRecordSchema),
    defaultValues,
  });

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/records/count`,
        );
        const result = await response.json();
        if (result.success) {
          setRecordCount(result.data.count);
        }
      } catch (error) {
        console.error("Error fetching records count:", error);
      }
    };

    fetchCount();
  }, []);

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");

    if (numericValue) {
      return parseInt(numericValue).toLocaleString();
    }
    return "";
  };

  const onSubmit = async (data: CreateRecordFormData) => {
    setIsSubmitting(true);
    setShowError(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const apiData = {
        fullName: data.fullName.trim(),
        idNumber: data.idNumber.trim(),
        idType: data.idType,
        birthDate: data.birthDate || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        department: data.department || undefined,
        creditorName: data.creditorName.trim(),
        debtAmount: parseFloat(data.debtAmount.replace(/[^ -~]/g, "")),
        debtDate: data.debtDate,
        debtStatus: data.debtStatus,
        notes: data.notes.trim(),
      };

      console.log("Enviando datos:", apiData);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const result = await response.json();
      console.log("Respuesta:", result);

      if (result.success) {
        setShowSuccess(true);
        setRecordCount((prevCount) => (prevCount !== null ? prevCount + 1 : 1));
        setTimeout(() => {
          form.reset(defaultValues);
          setShowSuccess(false);
        }, 3000);
      } else {
        if (Array.isArray(result.error?.details)) {
          const errorMessages = result.error.details
            .map((detail: any) => `• ${detail.message}`)
            .join("\n");
          setErrorMessage(errorMessages);
        } else if (result.error?.details) {
          setErrorMessage(result.error.details);
        } else {
          setErrorMessage(
            result.error?.message || "Error al crear el registro",
          );
        }
        setShowError(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Error de conexión con el servidor");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                CrediCheck
              </h1>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                Agregar Registro
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-2">
                Agregar Nueva Referencia Crediticia
              </h2>
              <p className="text-slate-600 dark:text-gray-300">
                Completa la información para agregar un nuevo registro a la base
                de datos
              </p>
            </div>
            {recordCount !== null && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Registros Totales
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                  {recordCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {showSuccess && (
          <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 mb-6">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300 font-medium">
              ¡Registro agregado exitosamente! La información ha sido guardada
              en la base de datos.
            </AlertDescription>
          </Alert>
        )}

        {showError && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 mb-6">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300 font-medium whitespace-pre-line">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 dark:text-gray-100 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Datos de identificación de la persona
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Nombre Completo *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Juan Carlos Pérez Rodríguez"
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Número de Identificación *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="12345678"
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Tipo de Identificación *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem
                              value="CC"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Cédula de Ciudadanía
                            </SelectItem>
                            <SelectItem
                              value="CE"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Cédula de Extranjería
                            </SelectItem>
                            <SelectItem
                              value="TI"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Tarjeta de Identidad
                            </SelectItem>
                            <SelectItem
                              value="PP"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Pasaporte
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Fecha de Nacimiento
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="3001234567"
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="juan.perez@email.com"
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Dirección
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Calle 123 #45-67"
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Ciudad
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Bogotá"
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Departamento
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Cundinamarca"
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 dark:text-gray-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Información de la Referencia Crediticia
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Detalles del reporte crediticio negativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="creditorName"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Nombre del Acreedor *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Banco Nacional, Cooperativa Financiera, etc."
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="debtAmount"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Monto de la Deuda *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="1500000"
                            onChange={(e) => {
                              const formatted = formatAmount(e.target.value);
                              field.onChange(formatted);
                            }}
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="debtDate"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Fecha de la Deuda *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className={`${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="debtStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                          Estado de la Deuda *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem
                              value="ACTIVE"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Activa
                            </SelectItem>
                            <SelectItem
                              value="PAID"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              Pagada
                            </SelectItem>
                            <SelectItem
                              value="DISPUTED"
                              className="dark:text-gray-100 dark:focus:bg-gray-700"
                            >
                              En Disputa
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">
                        Notas *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe los detalles del caso, motivos de la mora, acciones tomadas, etc."
                          className={`min-h-[100px] ${error ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                <strong>Importante:</strong> Asegúrate de que toda la
                información sea precisa y esté debidamente verificada antes de
                agregar el registro. Esta información será utilizada para
                consultas crediticias.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  form.reset(defaultValues);
                  setShowError(false);
                  setShowSuccess(false);
                }}
                disabled={isSubmitting}
                className="text-slate-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Limpiar Formulario
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                disabled={isSubmitting}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Registro
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
