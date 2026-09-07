import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { clientFullName } from "@/lib/format";
import { groupAddresses } from "@/lib/addresses";

export const dynamic = "force-dynamic";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: budget }, { data: itemsData }, { data: clientsData }, { data: addressesData }] = await Promise.all([
    supabase.from("budgets").select("*").eq("id", id).single(),
    supabase.from("budget_items").select("*").eq("budget_id", id).order("sort_order"),
    supabase.from("clients").select("id, first_name, last_name, company").order("first_name"),
    supabase.from("client_addresses").select("id, client_id, label, address").order("created_at"),
  ]);

  if (!budget) notFound();

  const clients = (clientsData ?? []).map((c) => ({
    id: c.id,
    label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}`,
  }));
  const addressesByClient = groupAddresses(addressesData ?? []);

  return (
    <>
      <PageHeader title={`Editar ${budget.budget_number}`} />
      <BudgetForm clients={clients} addressesByClient={addressesByClient} budget={budget} items={itemsData ?? []} />
    </>
  );
}
