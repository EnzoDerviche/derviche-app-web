import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { AdministratorManager } from "@/components/administrators/AdministratorManager";
import type { Administrator } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdministradoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("administrators")
    .select("*, clients(count)")
    .order("name");

  const administrators = (data ?? []) as unknown as (Administrator & { clients: { count: number }[] })[];

  return (
    <>
      <PageHeader title="Administradores" subtitle="Administradores de edificios y sus clientes asignados" />
      <AdministratorManager administrators={administrators} />
    </>
  );
}
