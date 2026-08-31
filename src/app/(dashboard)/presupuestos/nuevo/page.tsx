import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { clientFullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, first_name, last_name, company")
    .order("first_name");

  const clients = (data ?? []).map((c) => ({
    id: c.id,
    label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}`,
  }));

  return (
    <>
      <PageHeader title="Nuevo presupuesto" />
      <BudgetForm clients={clients} defaultClientId={cliente} />
    </>
  );
}
