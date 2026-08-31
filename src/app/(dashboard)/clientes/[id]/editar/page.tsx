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
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  return (
    <>
      <PageHeader title="Editar cliente" />
      <ClientForm client={client} />
    </>
  );
}
