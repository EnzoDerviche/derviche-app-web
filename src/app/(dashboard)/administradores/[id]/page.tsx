import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdministratorClients } from "@/components/administrators/AdministratorClients";
import { clientFullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdministradorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: admin } = await supabase.from("administrators").select("*").eq("id", id).single();
  if (!admin) notFound();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, first_name, last_name, administrator_id")
    .order("first_name");

  const clients = clientsData ?? [];
  const assigned = clients
    .filter((c) => c.administrator_id === id)
    .map((c) => ({ id: c.id, name: clientFullName(c) }));
  const assignable = clients
    .filter((c) => c.administrator_id !== id)
    .map((c) => ({ id: c.id, name: clientFullName(c) }));

  return (
    <>
      <PageHeader
        title={admin.name}
        subtitle={[admin.phone, admin.email].filter(Boolean).join(" · ") || undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>Clientes asignados ({assigned.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AdministratorClients administratorId={id} assigned={assigned} assignable={assignable} />
        </CardContent>
      </Card>
    </>
  );
}
