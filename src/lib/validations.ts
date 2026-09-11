import { z } from "zod";
import {
  BUDGET_STATUSES,
  PAYMENT_TYPES,
  UNITS,
} from "@/constants/statuses";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const clientSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio"),
  last_name: z.string().trim().min(1, "El apellido es obligatorio"),
  company: optionalText,
  tax_id: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  address: optionalText,
  city: optionalText,
  province: optionalText,
  notes: optionalText,
  administrator_id: optionalText,
});

export type ClientInput = z.infer<typeof clientSchema>;

export const administratorSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: optionalText,
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: optionalText,
});

export type AdministratorInput = z.infer<typeof administratorSchema>;

export const addressSchema = z.object({
  address: z.string().trim().min(1, "La dirección es obligatoria"),
  city: optionalText,
  province: optionalText,
  notes: optionalText,
});

export type AddressInput = z.infer<typeof addressSchema>;

export const budgetItemSchema = z.object({
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unit: z.enum(UNITS),
  unit_price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  discount: z.coerce.number().min(0, "El descuento no puede ser negativo").default(0),
});

export type BudgetItemInput = z.infer<typeof budgetItemSchema>;

export const budgetSchema = z
  .object({
    client_id: z.string().optional().transform((v) => (v ? v : undefined)),
    // Prospecto: cliente no registrado para el que se hace el presupuesto.
    new_client_first_name: optionalText,
    new_client_last_name: optionalText,
    new_client_phone: optionalText,
    new_client_tax_id: optionalText,
    new_client_address: optionalText,
    new_client_administrator_id: optionalText,
    address_id: optionalText,
    status: z.enum(BUDGET_STATUSES).default("sent"),
    discount: z.coerce.number().min(0).default(0),
    tax_rate: z.coerce.number().min(0).default(0),
    notes: optionalText,
    sent_at: optionalText,
    accepted_at: optionalText,
    items: z.array(budgetItemSchema).min(1, "Agregá al menos un item"),
  })
  .superRefine((d, ctx) => {
    if (!d.client_id && !d.new_client_first_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccioná un cliente o cargá uno nuevo",
        path: ["client_id"],
      });
    }
  });

export type BudgetInput = z.infer<typeof budgetSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  payment_date: z.string().min(1, "La fecha es obligatoria"),
  payment_type: z.enum(PAYMENT_TYPES),
  notes: optionalText,
});

export type PaymentInput = z.infer<typeof paymentSchema>;
