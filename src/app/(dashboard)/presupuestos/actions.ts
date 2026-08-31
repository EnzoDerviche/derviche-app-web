"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { budgetSchema, paymentSchema, type BudgetInput, type PaymentInput } from "@/lib/validations";
import { calculateBudgetTotals, calculateItemSubtotal, calculateBalance } from "@/lib/calculations";
import type { BudgetStatus } from "@/constants/statuses";
import type { Budget } from "@/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return supabase;
}

/** Build the persisted items + totals from validated input (server is authority). */
function buildTotals(input: BudgetInput) {
  const totals = calculateBudgetTotals({
    items: input.items,
    discount: input.discount,
    taxRate: input.tax_rate,
  });
  const items = input.items.map((it) => ({
    description: it.description,
    quantity: it.quantity,
    unit: it.unit,
    unit_price: it.unit_price,
    discount: it.discount ?? 0,
    subtotal: calculateItemSubtotal(it),
  }));
  return { totals, items };
}

export async function createBudget(input: BudgetInput): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { totals, items } = buildTotals(parsed.data);

  const { data, error } = await supabase.rpc("create_budget", {
    p_client_id: parsed.data.client_id,
    p_status: parsed.data.status,
    p_subtotal: totals.subtotal,
    p_discount: totals.discount,
    p_tax: totals.tax,
    p_total: totals.total,
    p_notes: parsed.data.notes ?? null,
    p_sent_at: parsed.data.sent_at || null,
    p_accepted_at: parsed.data.accepted_at || null,
    p_items: items,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  return { ok: true, id: data as string };
}

export async function updateBudget(id: string, input: BudgetInput): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { totals, items } = buildTotals(parsed.data);

  const { error } = await supabase.rpc("update_budget", {
    p_id: id,
    p_client_id: parsed.data.client_id,
    p_status: parsed.data.status,
    p_subtotal: totals.subtotal,
    p_discount: totals.discount,
    p_tax: totals.tax,
    p_total: totals.total,
    p_notes: parsed.data.notes ?? null,
    p_sent_at: parsed.data.sent_at || null,
    p_accepted_at: parsed.data.accepted_at || null,
    p_items: items,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  return { ok: true, id };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = await requireAuth();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/presupuestos");
  return { ok: true };
}

export async function changeBudgetStatus(
  id: string,
  status: BudgetStatus,
  sentAt?: string | null,
): Promise<ActionResult> {
  const supabase = await requireAuth();

  // Marcar como "Cobrado" salda automáticamente el presupuesto:
  // registra el pago restante con la fecha de hoy y recalcula el estado.
  if (status === "paid") {
    const { data: budget } = await supabase
      .from("budgets")
      .select("total, payments(amount)")
      .eq("id", id)
      .single();
    if (!budget) return { ok: false, error: "Presupuesto no encontrado" };

    const paid = (budget.payments as unknown as { amount: number }[]).reduce((s, p) => s + Number(p.amount), 0);
    const balance = calculateBalance(Number(budget.total), paid);

    if (balance > 0) {
      const { error: payErr } = await supabase.from("payments").insert({
        budget_id: id,
        amount: balance,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_type: "final",
        notes: "Cobro total (marcado como Cobrado)",
      });
      if (payErr) return { ok: false, error: payErr.message };
    }
    // recalc pone payment_status = fully_paid, status = paid y paid_at = ahora.
    await supabase.rpc("recalc_budget_payment", { p_budget_id: id });
    revalidatePath(`/presupuestos/${id}`);
    revalidatePath("/presupuestos");
    return { ok: true };
  }

  const { data: current } = await supabase
    .from("budgets")
    .select("sent_at")
    .eq("id", id)
    .single();

  const patch: Partial<Budget> = { status };
  // Stamp the sent date once, without overwriting history.
  if (status === "sent") patch.sent_at = sentAt || current?.sent_at || new Date().toISOString();

  const { error } = await supabase.from("budgets").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath("/presupuestos");
  return { ok: true };
}

export async function registerPayment(
  budgetId: string,
  input: PaymentInput,
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();

  const { data: budget } = await supabase
    .from("budgets")
    .select("total, payments(amount)")
    .eq("id", budgetId)
    .single();

  if (!budget) return { ok: false, error: "Presupuesto no encontrado" };

  const paid = (budget.payments as unknown as { amount: number }[]).reduce((s, p) => s + Number(p.amount), 0);
  const balance = calculateBalance(Number(budget.total), paid);

  if (parsed.data.amount > balance) {
    return { ok: false, error: `El monto supera el saldo pendiente (${balance}).` };
  }

  const { error } = await supabase.from("payments").insert({
    budget_id: budgetId,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    payment_type: parsed.data.payment_type,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("recalc_budget_payment", { p_budget_id: budgetId });
  revalidatePath(`/presupuestos/${budgetId}`);
  return { ok: true };
}

export async function deletePayment(paymentId: string, budgetId: string): Promise<ActionResult> {
  const supabase = await requireAuth();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("recalc_budget_payment", { p_budget_id: budgetId });
  revalidatePath(`/presupuestos/${budgetId}`);
  return { ok: true };
}
