import type { BudgetStatus, PaymentStatus, PaymentType } from "@/constants/statuses";

export type { BudgetStatus, PaymentStatus, PaymentType };

// NOTE: these are `type` aliases, not interfaces, so they satisfy supabase-js's
// `Record<string, unknown>` table constraint (interfaces don't get an implicit
// index signature and make the typed client collapse to `never`).

export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  budget_number: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  paid_at: string | null;
  status: BudgetStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  is_demo: boolean;
  address_id: string | null;
};

export type ClientAddress = {
  id: string;
  client_id: string;
  label: string | null;
  address: string;
  city: string | null;
  province: string | null;
  notes: string | null;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  budget_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  subtotal: number;
  sort_order: number;
};

export type Payment = {
  id: string;
  budget_id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  notes: string | null;
  created_at: string;
};

/** Budget joined with its client (list/detail views). */
export type BudgetWithClient = Budget & { client: Client };
