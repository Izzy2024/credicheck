import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(2, "Minimo 2 caracteres"),
  lastName: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
  role: z.enum(["ADMIN", "ANALYST"], { required_error: "Selecciona un rol" }),
});

export const editUserSchema = z.object({
  firstName: z.string().min(2, "Minimo 2 caracteres"),
  lastName: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  role: z.enum(["ADMIN", "ANALYST"], { required_error: "Selecciona un rol" }),
  isActive: z.boolean(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
