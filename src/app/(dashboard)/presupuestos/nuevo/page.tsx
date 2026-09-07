import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { clientFullName } from "@/lib/format";
import { groupAddresses } from "@/lib/addresses";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: addressesData }] = await Promise.all([
    supabase.from("clients").select("id, first_name, last_name, company").order("first_name"),
    supabase.from("client_addresses").select("id, client_id, label, address").order("created_at"),
  ]);

  const clients = (data ?? []).map((c) => ({
    id: c.id,
    label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}`,
  }));
  const addressesByClient = groupAddresses(addressesData ?? []);

  return (
    <>
      <PageHeader title="Nuevo presupuesto" />
      <BudgetForm clients={clients} addressesByClient={addressesByClient} defaultClientId={cliente} />
    </>
  );
}
