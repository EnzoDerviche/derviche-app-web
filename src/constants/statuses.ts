export const BUDGET_STATUSES = ["sent", "approved", "rejected", "partial_paid", "paid"] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const BUDGET_STATUS_META: Record<
  BudgetStatus,
  { label: string; className: string }
> = {
  sent: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Aprobado", className: "bg-green-100 text-green-700" },
  rejected: { label: "Desaprobado", className: "bg-red-100 text-red-700" },
  partial_paid: { label: "Cobro parcial", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Cobrado", className: "bg-emerald-200 text-emerald-900" },
};

export const PAYMENT_STATUSES = [
  "unpaid",
  "advance_received",
  "partially_paid",
  "fully_paid",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  unpaid: { label: "Sin pago", className: "bg-stone-200 text-stone-700" },
  advance_received: { label: "Adelanto recibido", className: "bg-sky-100 text-sky-700" },
  partially_paid: { label: "Pagado parcialmente", className: "bg-amber-100 text-amber-800" },
  fully_paid: { label: "Pagado completo", className: "bg-green-100 text-green-700" },
};

export const PAYMENT_TYPES = [
  "advance",
  "partial",
  "final",
  "other",
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  advance: "Adelanto",
  partial: "Pago parcial",
  final: "Pago final",
  other: "Otro",
};

export const UNITS = [
  "unidad",
  "m²",
  "m³",
  "metro",
  "hora",
  "día",
  "servicio",
  "global",
] as const;

export type Unit = (typeof UNITS)[number];
