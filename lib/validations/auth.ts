import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresa un email valido"),
  password: z
    .string()
    .min(8, "Minimo 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe contener al menos una minuscula, una mayuscula y un numero",
    ),
});

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "Minimo 2 caracteres"),
    lastName: z.string().min(2, "Minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    password: z
      .string()
      .min(8, "Minimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener al menos una minuscula, una mayuscula y un numero",
      ),
    confirmPassword: z.string().min(1, "Confirma tu contrasena"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Email invalido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requerido"),
    newPassword: z.string().min(6, "Minimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contrasena"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordEmailFormData = z.infer<
  typeof forgotPasswordEmailSchema
>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
