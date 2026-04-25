"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  changePasswordSchema,
  type ProfileFormData,
  type ChangePasswordFormData,
} from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Save,
  Loader2,
  Shield,
  Lock,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { type User as UserProfile } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileSkeleton } from "@/components/loading-skeletons";
import { API_BASE_URL } from '@/lib/api-base';

interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = passwordForm.watch("newPassword");
  const confirmPassword = passwordForm.watch("confirmPassword");

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);
  const [checkingCompromised, setCheckingCompromised] = useState(false);
  const [isCompromised, setIsCompromised] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        profileForm.reset({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
        });
        console.log("Perfil cargado:", {
          email: result.data.email,
          role: result.data.role,
          isActive: result.data.isActive,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error", {
        description: "No se pudo cargar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = async (password: string) => {
    if (!password) {
      setPasswordStrength(null);
      setIsCompromised(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/password-strength?password=${encodeURIComponent(password)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      if (result.success) {
        setPasswordStrength(result.data.strength);
        setIsCompromised(result.data.isCompromised);
      }
    } catch (error) {
      console.error("Error checking password strength:", error);
    } finally {
      setCheckingCompromised(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    if (isCompromised) {
      toast.error("Contraseña comprometida", {
        description:
          "Esta contraseña ha sido encontrada en filtraciones de datos. Por favor elige otra.",
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Contraseña actualizada", {
          description: "La contraseña se ha cambiado correctamente",
        });
        passwordForm.reset();
        setPasswordStrength(null);
        setIsCompromised(false);
      } else {
        toast.error("Error", {
          description:
            result.error?.message || "No se pudo cambiar la contraseña",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Error", {
        description: "No se pudo cambiar la contraseña",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        toast.success("Perfil actualizado", {
          description: "Los cambios se han guardado correctamente",
        });
      } else {
        toast.error("Error", {
          description:
            result.error?.message || "No se pudo actualizar el perfil",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error", {
        description: "No se pudo actualizar el perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAdminAccess = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Sesión expirada", {
        description: "Por favor inicia sesión nuevamente",
      });
      window.location.href = "/login";
      return;
    }

    window.location.href = "/admin/records";
  };

  const isAdminUser = (role: string) => {
    return role && (role === "ADMIN" || role === "admin");
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="mr-0 sm:mr-2 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="flex items-center justify-center w-10 h-10 bg-slate-800 dark:bg-gray-700 rounded-xl">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                Mi Perfil
              </h1>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                Editar información personal
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100"
            >
              <User className="w-4 h-4" /> Perfil
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100"
            >
              <Lock className="w-4 h-4" /> Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-lg dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                  Información Personal
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Actualiza tu información personal y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">
                              Nombre
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ingresa tu nombre"
                                className="h-12 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">
                              Apellido
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ingresa tu apellido"
                                className="h-12 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">
                            Correo Electrónico
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Ingresa tu correo electrónico"
                              className="h-12 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {profile && (
                      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
                          Información de la Cuenta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600 dark:text-gray-400">
                              Rol:
                            </span>
                            <span className="ml-2 font-medium dark:text-gray-200">
                              {profile.role === "ADMIN"
                                ? "Administrador"
                                : "Analista"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-gray-400">
                              Estado:
                            </span>
                            <span
                              className={`ml-2 font-medium ${profile.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {profile.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-gray-400">
                              Creado:
                            </span>
                            <span className="ml-2 font-medium dark:text-gray-200">
                              {new Date(profile.createdAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-gray-400">
                              Última actualización:
                            </span>
                            <span className="ml-2 font-medium dark:text-gray-200">
                              {new Date(profile.updatedAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                        </div>

                        {isAdminUser(profile.role) && (
                          <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
                            <h4 className="text-md font-semibold text-slate-800 dark:text-gray-100 mb-3">
                              Acceso de Administrador
                            </h4>
                            <Button
                              type="button"
                              onClick={handleAdminAccess}
                              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium flex items-center gap-2"
                            >
                              <Shield className="w-5 h-5" />
                              Panel de Administración
                            </Button>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                              Accede al panel de administración para gestionar
                              registros crediticios y usuarios del sistema.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 pt-6">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="h-12 px-8 bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium"
                      >
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                          </div>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => (window.location.href = "/dashboard")}
                        className="h-12 px-8 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-lg dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Actualiza tu contraseña de acceso de forma segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">
                            Contraseña Actual
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={
                                  showPasswords.current ? "text" : "password"
                                }
                                placeholder="Ingresa tu contraseña actual"
                                className="h-12 pr-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    current: !prev.current,
                                  }))
                                }
                                className="absolute right-0 top-0 h-12 w-12 px-0 hover:bg-transparent dark:hover:bg-transparent"
                              >
                                {showPasswords.current ? (
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

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">
                            Nueva Contraseña
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPasswords.new ? "text" : "password"}
                                placeholder="Ingresa tu nueva contraseña"
                                className="h-12 pr-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setCheckingCompromised(true);
                                  checkPasswordStrength(e.target.value);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    new: !prev.new,
                                  }))
                                }
                                className="absolute right-0 top-0 h-12 w-12 px-0 hover:bg-transparent dark:hover:bg-transparent"
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />

                          {passwordStrength && (
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-gray-400">
                                  Fortaleza:
                                </span>
                                <span
                                  className={`font-medium ${
                                    passwordStrength.score >= 4
                                      ? "text-green-600 dark:text-green-400"
                                      : passwordStrength.score >= 3
                                        ? "text-yellow-600 dark:text-yellow-400"
                                        : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {passwordStrength.score >= 4
                                    ? "Fuerte"
                                    : passwordStrength.score >= 3
                                      ? "Media"
                                      : "Débil"}
                                </span>
                              </div>
                              <Progress
                                value={(passwordStrength.score / 5) * 100}
                                className={`h-2 ${
                                  passwordStrength.score >= 4
                                    ? "bg-green-200 dark:bg-green-900"
                                    : passwordStrength.score >= 3
                                      ? "bg-yellow-200 dark:bg-yellow-900"
                                      : "bg-red-200 dark:bg-red-900"
                                }`}
                              />

                              {checkingCompromised && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Verificando en base de datos de
                                  filtraciones...
                                </div>
                              )}

                              {isCompromised && (
                                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                  <X className="w-3 h-3" />
                                  Esta contraseña ha sido comprometida en
                                  filtraciones de datos
                                </div>
                              )}

                              {!isCompromised &&
                                passwordStrength.score >= 4 &&
                                newPassword && (
                                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                    <Check className="w-3 h-3" />
                                    Contraseña segura
                                  </div>
                                )}

                              <div className="space-y-1 mt-2">
                                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">
                                  Requisitos:
                                </p>
                                <ul className="space-y-1">
                                  {[
                                    {
                                      met: newPassword.length >= 8,
                                      text: "Al menos 8 caracteres",
                                    },
                                    {
                                      met: /[a-z]/.test(newPassword),
                                      text: "Al menos una minúscula",
                                    },
                                    {
                                      met: /[A-Z]/.test(newPassword),
                                      text: "Al menos una mayúscula",
                                    },
                                    {
                                      met: /\d/.test(newPassword),
                                      text: "Al menos un número",
                                    },
                                    {
                                      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                                        newPassword,
                                      ),
                                      text: "Al menos un símbolo especial",
                                    },
                                  ].map((req, i) => (
                                    <li
                                      key={i}
                                      className={`flex items-center gap-2 text-xs ${
                                        req.met
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-slate-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {req.met ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <X className="w-3 h-3" />
                                      )}
                                      {req.text}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">
                            Confirmar Nueva Contraseña
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={
                                  showPasswords.confirm ? "text" : "password"
                                }
                                placeholder="Confirma tu nueva contraseña"
                                className="h-12 pr-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    confirm: !prev.confirm,
                                  }))
                                }
                                className="absolute right-0 top-0 h-12 w-12 px-0 hover:bg-transparent dark:hover:bg-transparent"
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          {confirmPassword &&
                            newPassword !== confirmPassword && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Las contraseñas no coinciden
                              </p>
                            )}
                          {confirmPassword &&
                            newPassword === confirmPassword && (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Las contraseñas coinciden
                              </p>
                            )}
                        </FormItem>
                      )}
                    />

                    <Separator className="dark:bg-gray-700" />

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="h-12 px-8 bg-slate-800 hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium"
                      >
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cambiando...
                          </div>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Cambiar Contraseña
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
