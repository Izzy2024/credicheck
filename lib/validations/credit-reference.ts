import { z } from "zod";

export const createRecordSchema = z.object({
  fullName: z
    .string()
    .refine((val) => val.trim().length > 0, "El nombre completo es requerido")
    .refine(
      (val) => val.trim().length >= 3,
      "El nombre debe tener al menos 3 caracteres",
    ),
  idNumber: z
    .string()
    .refine(
      (val) => val.trim().length > 0,
      "El número de identificación es requerido",
    )
    .refine(
      (val) => val.trim().length >= 6,
      "El número de identificación debe tener al menos 6 caracteres",
    ),
  idType: z.string(),
  birthDate: z.string(),
  phone: z
    .string()
    .refine(
      (val) => !val || /^\+?[\d\s\-()]{10,}$/.test(val.replace(/\s/g, "")),
      "Ingresa un número de teléfono válido",
    ),
  email: z
    .string()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Ingresa un email válido",
    ),
  address: z.string(),
  city: z.string(),
  country: z.string().default("CO"),
  phoneCountryCode: z.string().optional(),
  state: z.string(),
  creditorName: z
    .string()
    .refine(
      (val) => val.trim().length > 0,
      "El nombre del acreedor es requerido",
    ),
  debtAmount: z
    .string()
    .refine((val) => val.trim().length > 0, "El monto de la deuda es requerido")
    .refine((val) => {
      const amount = parseFloat(val.replace(/[^\d.]/g, ""));
      return !isNaN(amount) && amount > 0;
    }, "Ingresa un monto válido"),
  debtDate: z
    .string()
    .refine((val) => val.trim().length > 0, "La fecha de la deuda es requerida")
    .refine(
      (val) => new Date(val) <= new Date(),
      "La fecha de la deuda no puede ser futura",
    ),
  debtStatus: z.string(),
  notes: z
    .string()
    .refine((val) => val.trim().length > 0, "Las notas son requeridas")
    .refine(
      (val) => val.trim().length >= 10,
      "Las notas deben tener al menos 10 caracteres",
    ),
});

export type CreateRecordFormData = z.infer<typeof createRecordSchema>;
