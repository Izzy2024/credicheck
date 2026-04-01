import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(2, "Minimo 2 caracteres"),
  lastName: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contrasena actual requerida"),
    newPassword: z.string().min(6, "Minimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contrasena"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
