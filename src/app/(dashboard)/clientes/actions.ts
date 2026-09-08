"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { clientSchema, addressSchema, type ClientInput, type AddressInput } from "@/lib/validations";

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

// ── Direcciones del cliente (varias, ej. administrador de edificios) ──────────

export async function createAddress(
  clientId: string,
  input: AddressInput,
): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase
    .from("client_addresses")
    .insert({ client_id: clientId, ...parsed.data });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}

export async function updateAddress(
  addressId: string,
  clientId: string,
  input: AddressInput,
): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase
    .from("client_addresses")
    .update(parsed.data)
    .eq("id", addressId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}

export async function deleteAddress(
  addressId: string,
  clientId: string,
): Promise<ActionResult> {
  const supabase = await requireAuth();
  const { error } = await supabase.from("client_addresses").delete().eq("id", addressId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}
