"use client";

import { API_BASE_URL } from '@/lib/api-base';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Lock,
  Building,
  Settings as SettingsIcon,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { type SettingsData } from "@/types";
import { SettingsSkeleton } from "@/components/loading-skeletons";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsData, setSettingsData] = useState<SettingsData>({
    company_name: "",
    max_search_results: "50",
    score_active_single_penalty: "20",
    score_active_multiple_penalty: "35",
    score_debt_moderate_penalty: "10",
    score_debt_high_penalty: "20",
    score_debt_very_high_penalty: "30",
    score_recent_penalty: "15",
  });

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const loadData = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/v1/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileJson = await profileRes.json();
        const settingsJson = await settingsRes.json();

        if (profileJson.success) {
          profileForm.reset({
            firstName: profileJson.data.firstName || "",
            lastName: profileJson.data.lastName || "",
            email: profileJson.data.email || "",
          });
        }

        if (settingsJson.success) {
          let parsedWeights: Record<string, number> = {};
          try {
            parsedWeights = JSON.parse(settingsJson.data.credit_score_weights || "{}");
          } catch {
            parsedWeights = {};
          }

          setSettingsData({
            company_name: settingsJson.data.company_name || "CrediCheck",
            max_search_results: settingsJson.data.max_search_results || "50",
            score_active_single_penalty: String(parsedWeights.activeSinglePenalty ?? 20),
            score_active_multiple_penalty: String(parsedWeights.activeMultiplePenalty ?? 35),
            score_debt_moderate_penalty: String(parsedWeights.debtModeratePenalty ?? 10),
            score_debt_high_penalty: String(parsedWeights.debtHighPenalty ?? 20),
            score_debt_very_high_penalty: String(parsedWeights.debtVeryHighPenalty ?? 30),
            score_recent_penalty: String(parsedWeights.recentPenalty ?? 15),
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
      return null;
    }
    return token;
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(
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
      const json = await res.json();
      if (json.success) {
        toast.success("Perfil actualizado correctamente");
        localStorage.setItem("userFirstName", data.firstName);
        localStorage.setItem("userLastName", data.lastName);
        localStorage.setItem("userEmail", data.email);
      } else {
        toast.error(json.error?.message || "Error al actualizar perfil");
      }
    } catch {
      toast.error("Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(
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
      const json = await res.json();
      if (json.success) {
        toast.success("Contraseña cambiada correctamente");
        passwordForm.reset();
      } else {
        toast.error(json.error?.message || "Error al cambiar contraseña");
      }
    } catch {
      toast.error("Error al cambiar contraseña");
    } finally {
      setSaving(false);
    }
  };

  const applyScorePreset = (preset: "CONSERVADOR" | "BALANCEADO" | "AGRESIVO") => {
    if (preset === "CONSERVADOR") {
      setSettingsData((prev) => ({
        ...prev,
        score_active_single_penalty: "25",
        score_active_multiple_penalty: "40",
        score_debt_moderate_penalty: "12",
        score_debt_high_penalty: "24",
        score_debt_very_high_penalty: "35",
        score_recent_penalty: "18",
      }));
      toast.success("Preset conservador aplicado");
      return;
    }

    if (preset === "AGRESIVO") {
      setSettingsData((prev) => ({
        ...prev,
        score_active_single_penalty: "15",
        score_active_multiple_penalty: "28",
        score_debt_moderate_penalty: "8",
        score_debt_high_penalty: "15",
        score_debt_very_high_penalty: "22",
        score_recent_penalty: "10",
      }));
      toast.success("Preset agresivo aplicado");
      return;
    }

    setSettingsData((prev) => ({
      ...prev,
      score_active_single_penalty: "20",
      score_active_multiple_penalty: "35",
      score_debt_moderate_penalty: "10",
      score_debt_high_penalty: "20",
      score_debt_very_high_penalty: "30",
      score_recent_penalty: "15",
    }));
    toast.success("Preset balanceado aplicado");
  };

  const resetScoreWeightsToDefault = () => {
    setSettingsData((prev) => ({
      ...prev,
      score_active_single_penalty: "20",
      score_active_multiple_penalty: "35",
      score_debt_moderate_penalty: "10",
      score_debt_high_penalty: "20",
      score_debt_very_high_penalty: "30",
      score_recent_penalty: "15",
    }));
    toast.success("Pesos restaurados a valores por defecto");
  };

  const handleSaveSettings = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/settings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            configs: [
              { key: "company_name", value: settingsData.company_name },
              {
                key: "max_search_results",
                value: settingsData.max_search_results,
              },
              {
                key: "credit_score_weights",
                value: JSON.stringify({
                  activeSinglePenalty: Number(settingsData.score_active_single_penalty || 20),
                  activeMultiplePenalty: Number(settingsData.score_active_multiple_penalty || 35),
                  debtModeratePenalty: Number(settingsData.score_debt_moderate_penalty || 10),
                  debtHighPenalty: Number(settingsData.score_debt_high_penalty || 20),
                  debtVeryHighPenalty: Number(settingsData.score_debt_very_high_penalty || 30),
                  recentPenalty: Number(settingsData.score_recent_penalty || 15),
                }),
              },
            ],
          }),
        },
      );
      const json = await res.json();
      if (json.success) {
        toast.success("Configuración guardada correctamente");
      } else {
        toast.error(json.error?.message || "Error al guardar configuración");
      }
    } catch {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
          Configuración
        </h1>
        <p className="text-slate-600 dark:text-gray-300">
          Administra la configuración del sistema y tu cuenta
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="flex items-center gap-2">
            <Lock className="w-4 h-4" /> Seguridad
          </TabsTrigger>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="border-0 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Perfil de Usuario
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleSaveProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad">
          <Card className="border-0 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Actual</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
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
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <Button type="submit" disabled={saving}>
                    <Lock className="w-4 h-4 mr-2" />
                    {saving ? "Cambiando..." : "Cambiar Contraseña"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa">
          <Card className="border-0 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Información de la Empresa
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Configura los datos de tu organización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName">Nombre de la Empresa</label>
                <Input
                  id="companyName"
                  value={settingsData.company_name}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      company_name: e.target.value,
                    })
                  }
                />
              </div>
              <Separator />
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <Card className="border-0 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Configuración del Sistema
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Ajusta parámetros operativos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="maxResults">
                  Máximo de Resultados de Búsqueda
                </label>
                <Input
                  id="maxResults"
                  type="number"
                  value={settingsData.max_search_results}
                  onChange={(e) =>
                    setSettingsData({
                      ...settingsData,
                      max_search_results: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Número máximo de resultados que se muestran en las búsquedas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="scoreActiveSingle">Penalización: 1 deuda activa</label>
                  <Input
                    id="scoreActiveSingle"
                    type="number"
                    value={settingsData.score_active_single_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_active_single_penalty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="scoreActiveMultiple">Penalización: múltiples deudas activas</label>
                  <Input
                    id="scoreActiveMultiple"
                    type="number"
                    value={settingsData.score_active_multiple_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_active_multiple_penalty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="scoreDebtModerate">Penalización: deuda moderada</label>
                  <Input
                    id="scoreDebtModerate"
                    type="number"
                    value={settingsData.score_debt_moderate_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_debt_moderate_penalty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="scoreDebtHigh">Penalización: deuda alta</label>
                  <Input
                    id="scoreDebtHigh"
                    type="number"
                    value={settingsData.score_debt_high_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_debt_high_penalty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="scoreDebtVeryHigh">Penalización: deuda muy alta</label>
                  <Input
                    id="scoreDebtVeryHigh"
                    type="number"
                    value={settingsData.score_debt_very_high_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_debt_very_high_penalty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="scoreRecent">Penalización: reporte reciente (90d)</label>
                  <Input
                    id="scoreRecent"
                    type="number"
                    value={settingsData.score_recent_penalty}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, score_recent_penalty: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Estos pesos afectan el score crediticio mostrado al consultar una persona.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => applyScorePreset("CONSERVADOR")}>
                  Preset conservador
                </Button>
                <Button type="button" variant="outline" onClick={() => applyScorePreset("BALANCEADO")}>
                  Preset balanceado
                </Button>
                <Button type="button" variant="outline" onClick={() => applyScorePreset("AGRESIVO")}>
                  Preset agresivo
                </Button>
                <Button type="button" variant="secondary" onClick={resetScoreWeightsToDefault}>
                  Restaurar valores por defecto
                </Button>
              </div>

              <Separator />
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
