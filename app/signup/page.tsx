"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { API_BASE_URL } from '@/lib/api-base';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSuccessMessage("");
    setFormError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage("¡Usuario creado exitosamente! Ya puedes iniciar sesión.");
        form.reset();
        return;
      }

      if (result.error?.details) {
        result.error.details.forEach((detail: { path?: string[]; message: string }) => {
          if (detail.path && detail.path.length > 0) {
            form.setError(detail.path[0] as keyof SignupFormData, {
              message: detail.message,
            });
          }
        });
      } else {
        setFormError(result.error?.message || "Error al crear usuario");
      }
    } catch {
      setFormError("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        <div className="hidden lg:block space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-blue-50 border border-blue-100">
            <Shield className="w-4 h-4 text-[#1F5EFF]" />
            <span className="font-bold text-[#1F5EFF] text-xs tracking-[0.14em] uppercase">Crear cuenta</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Registra tu acceso para funciones premium
          </h1>
          <p className="text-slate-500 text-base">
            Crea tu cuenta y accede a agregar registros, disputar referencias y gestionar historial completo.
          </p>

          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Puedes explorar la búsqueda pública sin necesidad de cuenta.
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-slate-200"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-white border border-slate-200 shadow-xl rounded-3xl">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#1F5EFF]" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-center text-slate-900">Crear cuenta</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Completa el formulario para habilitar acceso premium
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Nombre</FormLabel>
                        <FormControl>
                          <Input className="h-12 border-slate-200 bg-slate-50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Apellido</FormLabel>
                        <FormControl>
                          <Input className="h-12 border-slate-200 bg-slate-50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Correo electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" className="h-12 border-slate-200 bg-slate-50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="h-12 border-slate-200 bg-slate-50 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Confirmar contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="h-12 border-slate-200 bg-slate-50 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)] text-white font-bold"
                >
                  {isLoading ? "Creando cuenta..." : "CREAR CUENTA"}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-slate-500 mt-2">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-[#1F5EFF] hover:text-[#2F7BFF] font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
