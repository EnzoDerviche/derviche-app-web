"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { BudgetStatus } from "@/constants/statuses";

type Result = { ok: true; message: string } | { ok: false; error: string };

async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return supabase;
}

const CLIENT_IDS = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
];

/** Deletes ONLY demo rows (is_demo = true). Real data is never touched. */
export async function clearTestData(): Promise<Result> {
  const supabase = await requireAuth();
  // budgets cascade to items + payments.
  const { error: bErr } = await supabase.from("budgets").delete().eq("is_demo", true);
  if (bErr) return { ok: false, error: bErr.message };
  const { error: cErr } = await supabase.from("clients").delete().eq("is_demo", true);
  if (cErr) return { ok: false, error: cErr.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Datos de prueba eliminados." };
}

export async function loadTestData(): Promise<Result> {
  const supabase = await requireAuth();
  await clearTestData();

  const { error: cErr } = await supabase.from("clients").insert([
    { id: CLIENT_IDS[0], first_name: "Juan", last_name: "García", company: "García SRL", tax_id: "20-11111111-1", phone: "11-5555-1111", email: "juan@garcia.test", city: "Quilmes", province: "Buenos Aires", is_demo: true },
    { id: CLIENT_IDS[1], first_name: "María", last_name: "López", tax_id: "27-22222222-2", phone: "11-5555-2222", email: "maria@lopez.test", city: "Berazategui", province: "Buenos Aires", is_demo: true },
    { id: CLIENT_IDS[2], first_name: "Pedro", last_name: "Fernández", company: "Constructora Fernández", tax_id: "30-33333333-3", phone: "11-5555-3333", email: "pedro@fernandez.test", city: "La Plata", province: "Buenos Aires", is_demo: true },
  ]);
  if (cErr) return { ok: false, error: cErr.message };

  const budgets: {
    id: string; client_id: string; status: BudgetStatus;
    subtotal: number; discount: number; tax: number; total: number; sent_at?: string;
  }[] = [
    { id: "aaaaaaaa-0000-0000-0000-000000000001", client_id: CLIENT_IDS[0], status: "partial_paid", subtotal: 80000, discount: 0, tax: 16800, total: 96800 },
    { id: "aaaaaaaa-0000-0000-0000-000000000002", client_id: CLIENT_IDS[1], status: "sent", subtotal: 40000, discount: 0, tax: 0, total: 40000 },
    { id: "aaaaaaaa-0000-0000-0000-000000000003", client_id: CLIENT_IDS[2], status: "paid", subtotal: 300000, discount: 20000, tax: 58800, total: 338800 },
    { id: "aaaaaaaa-0000-0000-0000-000000000004", client_id: CLIENT_IDS[0], status: "sent", subtotal: 30000, discount: 0, tax: 0, total: 30000, sent_at: new Date().toISOString() },
  ];
  const { error: bErr } = await supabase.from("budgets").insert(budgets.map((b) => ({ ...b, is_demo: true })));
  if (bErr) return { ok: false, error: bErr.message };

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("budget_items").insert([
    { budget_id: budgets[0].id, description: "Pintura de fachada", quantity: 10, unit: "m²", unit_price: 5000, subtotal: 50000, sort_order: 0 },
    { budget_id: budgets[0].id, description: "Mano de obra", quantity: 1, unit: "global", unit_price: 30000, subtotal: 30000, sort_order: 1 },
    { budget_id: budgets[1].id, description: "Consultoría técnica", quantity: 5, unit: "hora", unit_price: 8000, subtotal: 40000, sort_order: 0 },
    { budget_id: budgets[2].id, description: "Contrapiso y carpeta", quantity: 100, unit: "m²", unit_price: 3000, subtotal: 300000, sort_order: 0 },
    { budget_id: budgets[3].id, description: "Inspección de obra", quantity: 2, unit: "servicio", unit_price: 15000, subtotal: 30000, sort_order: 0 },
  ]);

  await supabase.from("payments").insert([
    { budget_id: budgets[0].id, amount: 30000, payment_date: today, payment_type: "advance", notes: "Adelanto inicial" },
    { budget_id: budgets[2].id, amount: 100000, payment_date: today, payment_type: "advance" },
    { budget_id: budgets[2].id, amount: 100000, payment_date: today, payment_type: "partial" },
    { budget_id: budgets[2].id, amount: 138800, payment_date: today, payment_type: "final" },
  ]);

  // Let the DB derive payment_status / paid_at from the real payments.
  for (const b of budgets) {
    await supabase.rpc("recalc_budget_payment", { p_budget_id: b.id });
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Datos de prueba cargados." };
}
