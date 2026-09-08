import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { AddressManager } from "@/components/clients/AddressManager";
import { formatCurrency, formatDate, clientFullName } from "@/lib/format";
import { calculateBalance } from "@/lib/calculations";
import type { Budget, Payment } from "@/types";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const { data: addressesData } = await supabase
    .from("client_addresses")
    .select("*")
    .eq("client_id", id)
    .order("created_at");

  const { data: budgetsData } = await supabase
    .from("budgets")
    .select("*, payments(amount)")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const budgets = (budgetsData ?? []) as unknown as (Budget & { payments: Pick<Payment, "amount">[] })[];

  return (
    <>
      <PageHeader
        title={clientFullName(client)}
        subtitle={client.company ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/clientes/${id}/editar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="size-4" /> Editar
            </Link>
            <Link href={`/presupuestos/nuevo?cliente=${id}`} className={buttonVariants({ variant: "primary", size: "sm" })}>
              <Plus className="size-4" /> Nuevo presupuesto
            </Link>
            <DeleteClientButton id={id} />
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="DNI / CUIT" value={client.tax_id} />
            <Field label="Teléfono" value={client.phone} />
            <Field label="Email" value={client.email} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Notas" value={client.notes} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Direcciones</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressManager clientId={id} addresses={addressesData ?? []} />
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Presupuestos</h2>
      <Card className="p-0">
        {budgets.length === 0 ? (
          <EmptyState
            title="Este cliente no tiene presupuestos."
            action={
              <Link href={`/presupuestos/nuevo?cliente=${id}`} className={buttonVariants({ variant: "primary", size: "sm" })}>
                Crear presupuesto
              </Link>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Número</TH>
                <TH>Fecha</TH>
                <TH>Estado</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Saldo</TH>
              </TR>
            </THead>
            <TBody>
              {budgets.map((b) => {
                const paid = b.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <TR key={b.id} className="hover:bg-stone-50">
                    <TD>
                      <Link href={`/presupuestos/${b.id}`} className="font-medium hover:text-accent">
                        {b.budget_number}
                      </Link>
                    </TD>
                    <TD>{formatDate(b.created_at)}</TD>
                    <TD><StatusBadge status={b.status} /></TD>
                    <TD className="text-right">{formatCurrency(b.total)}</TD>
                    <TD className="text-right">{formatCurrency(calculateBalance(b.total, paid))}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
