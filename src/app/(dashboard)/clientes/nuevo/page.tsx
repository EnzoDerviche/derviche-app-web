import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("administrators").select("id, name").order("name");

  return (
    <>
      <PageHeader title="Nuevo cliente" />
      <ClientForm administrators={data ?? []} />
    </>
  );
}
