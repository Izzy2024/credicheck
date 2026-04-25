

"use client";

import { API_BASE_URL } from '@/lib/api-base';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Eye, EyeOff, Shield, CheckCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      router.push("/feature-center");
    }
  }, [router]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setFormError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("userRole", result.data.user.role);
        localStorage.setItem("userFirstName", result.data.user.firstName);
        localStorage.setItem("userLastName", result.data.user.lastName);
        localStorage.setItem("userEmail", result.data.user.email);
        router.push("/feature-center");
      } else {
        setFormError(result.error?.message || "Credenciales inválidas");
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
            <span className="font-bold text-[#1F5EFF] text-xs tracking-[0.14em] uppercase">Acceso premium</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Inicia sesión para gestionar funciones avanzadas
          </h1>
          <p className="text-slate-500 text-base">
            Podrás agregar registros, disputar referencias y revisar tu historial completo con la nueva experiencia CrediCheck.
          </p>

          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Puedes seguir usando la búsqueda pública sin iniciar sesión.
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
            <CardTitle className="text-3xl font-black text-center text-slate-900">Iniciar sesión</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Accede a funcionalidades premium de CrediCheck
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@empresa.com"
                          className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-[#1F5EFF]/30"
                          {...field}
                        />
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
                      <FormLabel className="text-slate-700 font-medium">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-[#1F5EFF]/30 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
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

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="text-sm font-medium text-[#1F5EFF] hover:text-[#2F7BFF]">
                    ¿Olvidaste tu contraseña?
                  </Link>

                  <Link href="/signup" className="text-sm font-medium text-[#1F5EFF] hover:text-[#2F7BFF]">
                    Crear cuenta
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)] text-white font-bold transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Ingresando..." : "INICIAR SESIÓN"}
                </Button>

                <div className="pt-4 border-t border-slate-200 lg:hidden">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Puedes seguir usando la búsqueda sin iniciar sesión.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-slate-200"
                    onClick={() => router.push("/dashboard")}
                  >
                    Volver al Dashboard
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
