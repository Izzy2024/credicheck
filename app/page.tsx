"use client";

import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [publicSearchValue, setPublicSearchValue] = useState("");

  const handlePublicSearch = async () => {
    if (!publicSearchValue.trim()) return;

    const query = publicSearchValue.trim();
    const searchType = /^[0-9]+$/.test(query) ? "id" : "name";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/records/search?query=${encodeURIComponent(query)}&type=${searchType}`,
    );

    const result = await response.json();
    sessionStorage.setItem("searchQuery", query);

    if (result.success && result.data?.length > 0) {
      sessionStorage.setItem("searchResults", JSON.stringify(result.data));
      window.location.href = "/results/found";
      return;
    }

    sessionStorage.removeItem("searchResults");
    window.location.href = "/results/not-found";
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      window.location.href = "/feature-center";
    }
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setFormError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        },
      );

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("userRole", result.data.user.role);
        localStorage.setItem("userFirstName", result.data.userFirstName);
        localStorage.setItem("userLastName", result.data.userLastName);
        localStorage.setItem("userEmail", result.data.userEmail);
        window.location.href = "/feature-center";
      } else {
        setFormError(result.error?.message || "Credenciales invalidas");
      }
    } catch (error) {
      setFormError("Error de conexion con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-800 dark:text-gray-100">
              Búsqueda pública
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-gray-300">
              Consulta referencias antes de iniciar sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-700 font-medium dark:text-gray-300" htmlFor="public-document-number">
                Número de documento
              </label>
              <Input
                id="public-document-number"
                value={publicSearchValue}
                onChange={(event) => setPublicSearchValue(event.target.value)}
                placeholder="12345678"
                className="h-11 border-slate-300 focus-visible:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <Button
              type="button"
              className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white font-medium"
              onClick={handlePublicSearch}
            >
              Consultar referencias
            </Button>

            <p className="text-sm text-slate-500 dark:text-gray-400">
              La búsqueda pública redirige a resultados básicos sin autenticación.
            </p>
          </CardContent>
        </Card>

        <div className="w-full max-w-md justify-self-center">
          <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 dark:bg-gray-700 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 dark:text-gray-100">
            CrediCheck
          </h1>
          <p className="text-slate-600 dark:text-gray-300">
            Consulta de referencias crediticias
          </p>
        </div>

        <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-800 dark:text-gray-100">
              Iniciar Sesion
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-gray-300">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                      <FormLabel className="text-slate-700 font-medium dark:text-gray-300">
                        Correo Electronico
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@empresa.com"
                          className="h-11 border-slate-300 focus-visible:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
                      <FormLabel className="text-slate-700 font-medium dark:text-gray-300">
                        Contrasena
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="--------"
                            className="h-11 pr-10 border-slate-300 focus-visible:ring-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>

                <Alert className="border-cyan-200 bg-cyan-50 dark:bg-cyan-900/30 dark:border-cyan-800">
                  <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <AlertDescription className="text-cyan-800">
                    Conexion segura SSL. Tus datos estan protegidos.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesion..." : "Iniciar Sesion"}
                </Button>

                <p className="text-center text-sm text-slate-500 mt-6 dark:text-gray-400">
                  No tienes una cuenta?{" "}
                  <Link
                    href="/signup"
                    className="text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Registrate
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
