"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { administratorSchema, type AdministratorInput } from "@/lib/validations";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return supabase;
}

export async function createAdministrator(input: AdministratorInput): Promise<ActionResult> {
  const parsed = administratorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("administrators")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/administradores");
  return { ok: true, id: data.id };
}

export async function updateAdministrator(id: string, input: AdministratorInput): Promise<ActionResult> {
  const parsed = administratorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const supabase = await requireAuth();
  const { error } = await supabase.from("administrators").update(parsed.data).eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/administradores");
  return { ok: true, id };
}

export async function assignClient(clientId: string, administratorId: string): Promise<ActionResult> {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("clients")
    .update({ administrator_id: administratorId })
    .eq("id", clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/administradores/${administratorId}`);
  revalidatePath("/clientes");
  return { ok: true };
}

export async function unassignClient(clientId: string, administratorId: string): Promise<ActionResult> {
  const supabase = await requireAuth();
  const { error } = await supabase
    .from("clients")
    .update({ administrator_id: null })
    .eq("id", clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/administradores/${administratorId}`);
  revalidatePath("/clientes");
  return { ok: true };
}

export async function deleteAdministrator(id: string): Promise<ActionResult> {
  const supabase = await requireAuth();
  // clients.administrator_id se pone en null automáticamente (on delete set null).
  const { error } = await supabase.from("administrators").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/administradores");
  revalidatePath("/clientes");
  return { ok: true };
}
