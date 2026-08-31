"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { clientSchema, type ClientInput } from "@/lib/validations";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return supabase;
}

export async function createClientRecord(input: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("clients")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  return { ok: true, id: data.id };
}

export async function updateClientRecord(
  id: string,
  input: ClientInput,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true, id };
}

export async function deleteClientRecord(id: string): Promise<ActionResult> {
  const supabase = await requireAuth();

  const { count } = await supabase
    .from("budgets")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Este cliente tiene presupuestos asociados y no puede eliminarse.",
    };
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}
