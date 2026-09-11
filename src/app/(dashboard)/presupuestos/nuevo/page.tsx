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
  const [{ data }, { data: addressesData }, { data: adminsData }] = await Promise.all([
    supabase.from("clients").select("id, first_name, last_name, company").eq("is_prospect", false).order("first_name"),
    supabase.from("client_addresses").select("id, client_id, label, address").order("created_at"),
    supabase.from("administrators").select("id, name").order("name"),
  ]);

  const clients = (data ?? []).map((c) => ({
    id: c.id,
    label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}`,
  }));
  const addressesByClient = groupAddresses(addressesData ?? []);

  return (
    <>
      <PageHeader title="Nuevo presupuesto" />
      <BudgetForm
        clients={clients}
        addressesByClient={addressesByClient}
        administrators={adminsData ?? []}
        defaultClientId={cliente}
      />
    </>
  );
}
