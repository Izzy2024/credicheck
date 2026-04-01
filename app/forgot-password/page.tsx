"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function ForgotPasswordPage() {
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
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

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

  const newPasswordValue = resetForm.watch("newPassword");
  const confirmPasswordValue = resetForm.watch("confirmPassword");
  const tokenValue = resetForm.watch("token");
  const passwordStrength = getPasswordStrength(newPasswordValue || "");

  const handleRequestReset = async (data: ForgotPasswordEmailFormData) => {
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: data.email }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setStep(Step.SENT);
        if (result.data.resetToken) {
          setResetToken(result.data.resetToken);
          resetForm.setValue("token", result.data.resetToken);
          toast.info("Token de reset generado (solo desarrollo)");
        } else {
          toast.success("Instrucciones enviadas a tu correo");
        }
      } else {
        toast.error(result.error?.message || "Error al procesar solicitud");
      }
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resetToken: data.token,
            newPassword: data.newPassword,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Contraseña restablecida correctamente");
        setStep(Step.EMAIL);
        emailForm.reset();
        resetForm.reset();
        setResetToken("");

        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        toast.error(result.error?.message || "Error al restablecer contraseña");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </Button>
        </div>

        <Card className="shadow-lg border-0 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-slate-800 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
              {step === Step.EMAIL && "Recuperar Contraseña"}
              {step === Step.SENT && "Revisa tu Email"}
              {step === Step.RESET && "Nueva Contraseña"}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {step === Step.EMAIL &&
                "Ingresa tu email para recibir instrucciones"}
              {step === Step.SENT && "Te hemos enviado las instrucciones"}
              {step === Step.RESET && "Crea una nueva contraseña segura"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === Step.EMAIL && (
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(handleRequestReset)}
                  className="space-y-4"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tu@correo.com"
                              className="pl-10 h-12"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Si el email existe en nuestro sistema, recibirás un
                        correo con instrucciones para restablecer tu contraseña.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Instrucciones
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === Step.SENT && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-gray-300">
                    Si <strong>{emailForm.getValues("email")}</strong> está
                    registrado en nuestro sistema, recibirás un correo con las
                    instrucciones para restablecer tu contraseña.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    ¿No recibes el correo?
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    <li>• Revisa tu carpeta de spam o correo no deseado</li>
                    <li>• Verifica que el email sea correcto</li>
                    <li>• Espera unos minutos</li>
                  </ul>
                </div>

                {resetToken && (
                  <div className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
                      Token de reset (solo desarrollo):
                    </p>
                    <code className="text-xs bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded block break-all">
                      {resetToken}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(Step.RESET)}
                      className="w-full mt-3"
                    >
                      Usar este token (Testing)
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setStep(Step.EMAIL)}
                  className="w-full h-12"
                  disabled={loading}
                >
                  Intentar con otro email
                </Button>
              </div>
            )}

            {step === Step.RESET && (
              <Form {...resetForm}>
                <form
                  onSubmit={resetForm.handleSubmit(handleResetPassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token de Reset</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ingresa el token recibido"
                            className="h-12"
                            disabled={loading}
                            {...field}
                          />
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
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            className="h-12"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {newPasswordValue && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-gray-400">
                          Fortaleza:
                        </span>
                        <span
                          className={`font-medium ${
                            passwordStrength >= 4
                              ? "text-green-600"
                              : passwordStrength >= 3
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {passwordStrength >= 4
                            ? "Fuerte"
                            : passwordStrength >= 3
                              ? "Media"
                              : "Débil"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= passwordStrength
                                ? passwordStrength >= 4
                                  ? "bg-green-600"
                                  : passwordStrength >= 3
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
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
                        <FormLabel>Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirma tu nueva contraseña"
                            className="h-12"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {confirmPasswordValue &&
                    newPasswordValue !== confirmPasswordValue && (
                      <p className="text-xs text-red-600">
                        Las contraseñas no coinciden
                      </p>
                    )}

                  {confirmPasswordValue &&
                    newPasswordValue === confirmPasswordValue && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Las contraseñas coinciden
                      </p>
                    )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPassword"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor="showPassword"
                      className="text-sm cursor-pointer"
                    >
                      Mostrar contraseña
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-slate-800 hover:bg-slate-700"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Restableciendo...
                      </div>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Restablecer Contraseña
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-gray-400 mt-6">
          ¿Necesitas ayuda? Contacta al soporte técnico
        </p>
      </div>
    </div>
  );
}
