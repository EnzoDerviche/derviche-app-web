import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: client }, { data: administrators }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("administrators").select("id, name").order("name"),
  ]);

  if (!client) notFound();

  return (
    <>
      <PageHeader title="Editar cliente" />
      <ClientForm client={client} administrators={administrators ?? []} />
    </>
  );
}
