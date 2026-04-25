"use client";

import { API_BASE_URL } from '@/lib/api-base';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Mail,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  forgotPasswordEmailSchema,
  resetPasswordSchema,
  type ForgotPasswordEmailFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

enum Step {
  EMAIL = "email",
  SENT = "sent",
  RESET = "reset",
}

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return Math.min(score, 5);
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(Step.EMAIL);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: "", newPassword: "", confirmPassword: "" },
  });

  // Check for token in URL on mount
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      resetForm.setValue("token", token);
      setStep(Step.RESET);
    }
  }, [searchParams, resetForm]);

  const newPasswordValue = resetForm.watch("newPassword");
  const confirmPasswordValue = resetForm.watch("confirmPassword");
  const passwordStrength = getPasswordStrength(newPasswordValue || "");

  const handleRequestReset = async (data: ForgotPasswordEmailFormData) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(Step.SENT);

        if (result.data?.resetToken) {
          setResetToken(result.data.resetToken);
          resetForm.setValue("token", result.data.resetToken);
          toast.info("Token de reset generado (solo desarrollo)");
        } else {
          toast.success("Instrucciones enviadas a tu correo");
        }
        return;
      }

      toast.error(result.error?.message || "Error al procesar solicitud");
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken: data.token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Contraseña restablecida correctamente");
        setStep(Step.EMAIL);
        emailForm.reset();
        resetForm.reset();
        setResetToken("");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }

      toast.error(result.error?.message || "Error al restablecer contraseña");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        <div className="hidden lg:block space-y-5 pt-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-blue-50 border border-blue-100">
            <Shield className="w-4 h-4 text-[#1F5EFF]" />
            <span className="font-bold text-[#1F5EFF] text-xs tracking-[0.14em] uppercase">Seguridad</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Recupera tu acceso de forma segura
          </h1>
          <p className="text-slate-500">
            Te ayudamos a restablecer tu contraseña para volver a tus funcionalidades premium.
          </p>
          <Button variant="outline" className="border-slate-200" onClick={() => router.push("/login")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al login
          </Button>
        </div>

        <Card className="bg-white border border-slate-200 shadow-xl rounded-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#1F5EFF]" />
            </div>
            <CardTitle className="text-3xl font-black text-slate-900">
              {step === Step.EMAIL && "Recuperar contraseña"}
              {step === Step.SENT && "Revisa tu email"}
              {step === Step.RESET && "Nueva contraseña"}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {step === Step.EMAIL && "Ingresa tu correo para recibir instrucciones"}
              {step === Step.SENT && "Te enviamos los pasos para continuar"}
              {step === Step.RESET && "Define una contraseña nueva y segura"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === Step.EMAIL && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleRequestReset)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Correo electrónico</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tu@correo.com"
                              className="pl-10 h-12 border-slate-200 bg-slate-50"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Si el email existe, recibirás instrucciones para restablecer tu contraseña.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                      </span>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" /> Enviar instrucciones
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === Step.SENT && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">
                    Si <strong>{emailForm.getValues("email")}</strong> está registrado, enviaremos un correo con los pasos.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">¿No recibes el correo?</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Revisa spam/no deseado</li>
                    <li>• Confirma que el correo sea correcto</li>
                    <li>• Espera unos minutos</li>
                  </ul>
                </div>

                {resetToken && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-2">Token (solo desarrollo):</p>
                    <code className="text-xs bg-white px-2 py-1 rounded block break-all border border-slate-200">
                      {resetToken}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => setStep(Step.RESET)} className="w-full mt-3 border-slate-200">
                      Usar este token (testing)
                    </Button>
                  </div>
                )}

                <Button variant="outline" onClick={() => setStep(Step.EMAIL)} className="w-full h-12 border-slate-200" disabled={loading}>
                  Intentar con otro email
                </Button>
              </div>
            )}

            {step === Step.RESET && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Token de reset</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el token" className="h-12 border-slate-200 bg-slate-50" disabled={loading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Nueva contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Mínimo 8 caracteres"
                              className="h-12 border-slate-200 bg-slate-50 pr-10"
                              disabled={loading}
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

                  {newPasswordValue && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Fortaleza</span>
                        <span className={`font-medium ${passwordStrength >= 4 ? "text-emerald-600" : passwordStrength >= 3 ? "text-amber-600" : "text-red-600"}`}>
                          {passwordStrength >= 4 ? "Fuerte" : passwordStrength >= 3 ? "Media" : "Débil"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full ${
                              level <= passwordStrength
                                ? passwordStrength >= 4
                                  ? "bg-emerald-500"
                                  : passwordStrength >= 3
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Confirmar contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirma tu contraseña"
                            className="h-12 border-slate-200 bg-slate-50"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {confirmPasswordValue && newPasswordValue !== confirmPasswordValue && (
                    <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
                  )}

                  {confirmPasswordValue && newPasswordValue === confirmPasswordValue && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#1F5EFF] hover:bg-[#2F7BFF] hover:shadow-[0_0_0_3px_rgba(47,123,255,0.22)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Restableciendo...
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" /> Restablecer contraseña
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
