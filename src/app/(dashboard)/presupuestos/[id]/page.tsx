import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatusChanger } from "@/components/budgets/StatusChanger";
import { PdfActions } from "@/components/budgets/PdfActions";
import { DeleteBudgetButton, DeletePaymentButton } from "@/components/budgets/BudgetActions";
import { ApproveClientButton } from "@/components/budgets/ApproveClientButton";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { formatCurrency, formatDate, clientFullName } from "@/lib/format";
import { calculateBalance } from "@/lib/calculations";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/constants/statuses";
import type { Budget, BudgetItem, Client, Payment } from "@/types";

export const dynamic = "force-dynamic";

export default async function PresupuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: budgetData } = await supabase
    .from("budgets")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (!budgetData || !budgetData.client) notFound();
  const { client, ...budget } = budgetData as unknown as Budget & { client: Client };

  const [{ data: itemsData }, { data: paymentsData }] = await Promise.all([
    supabase.from("budget_items").select("*").eq("budget_id", id).order("sort_order"),
    supabase.from("payments").select("*").eq("budget_id", id).order("payment_date", { ascending: false }),
  ]);

  const items = (itemsData ?? []) as BudgetItem[];
  const payments = (paymentsData ?? []) as Payment[];

  const { data: address } = budget.address_id
    ? await supabase.from("client_addresses").select("*").eq("id", budget.address_id).single()
    : { data: null };
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = calculateBalance(Number(budget.total), paid);

  return (
    <>
      <PageHeader
        title={budget.budget_number}
        subtitle={`${clientFullName(client)}${client.company ? ` — ${client.company}` : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <PdfActions id={id} budgetNumber={budget.budget_number} />
            <Link href={`/presupuestos/${id}/editar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="size-4" /> Editar
            </Link>
            <DeleteBudgetButton id={id} />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={budget.status} />
      </div>

      {client.is_prospect && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Cliente no registrado.</strong> Este presupuesto es para un prospecto. Al aprobarlo se registra como cliente.
          </p>
          <ApproveClientButton budgetId={id} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card className="p-0">
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <Table>
              <THead>
                <TR>
                  <TH>Descripción</TH>
                  <TH className="text-right">Cant.</TH>
                  <TH>Unidad</TH>
                  <TH className="text-right">P. unit.</TH>
                  <TH className="text-right">Desc.</TH>
                  <TH className="text-right">Subtotal</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((it) => (
                  <TR key={it.id}>
                    <TD>{it.description}</TD>
                    <TD className="text-right">{Number(it.quantity)}</TD>
                    <TD>{it.unit}</TD>
                    <TD className="text-right">{formatCurrency(it.unit_price)}</TD>
                    <TD className="text-right">{formatCurrency(it.discount)}</TD>
                    <TD className="text-right">{formatCurrency(it.subtotal)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <CardContent className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(budget.subtotal)}</span></div>
              {budget.discount > 0 && <div className="flex justify-between"><span>Descuento</span><span>- {formatCurrency(budget.discount)}</span></div>}
              {budget.tax > 0 && <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(budget.tax)}</span></div>}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>TOTAL</span><span>{formatCurrency(budget.total)}</span></div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader><CardTitle>Registrar pago</CardTitle></CardHeader>
            <CardContent>
              <PaymentForm budgetId={id} balance={balance} />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader><CardTitle>Historial de pagos</CardTitle></CardHeader>
            {payments.length === 0 ? (
              <CardContent><p className="text-sm text-muted">Este presupuesto todavía no tiene pagos registrados.</p></CardContent>
            ) : (
              <Table>
                <THead>
                  <TR><TH>Fecha</TH><TH>Tipo</TH><TH className="text-right">Monto</TH><TH>Notas</TH><TH /></TR>
                </THead>
                <TBody>
                  {payments.map((p) => (
                    <TR key={p.id}>
                      <TD>{formatDate(p.payment_date)}</TD>
                      <TD>{PAYMENT_TYPE_LABELS[p.payment_type as PaymentType]}</TD>
                      <TD className="text-right">{formatCurrency(p.amount)}</TD>
                      <TD className="text-muted">{p.notes ?? "—"}</TD>
                      <TD className="text-right"><DeletePaymentButton paymentId={p.id} budgetId={id} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Resumen de pago</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Total</span><span>{formatCurrency(budget.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Pagado</span><span>{formatCurrency(paid)}</span></div>
              <div className="flex justify-between font-semibold"><span>Saldo pendiente</span><span>{formatCurrency(balance)}</span></div>
              <div className="pt-2"><StatusBadge status={budget.status} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
            <CardContent><StatusChanger id={id} current={budget.status} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Creación</span><span>{formatDate(budget.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Envío</span><span>{formatDate(budget.sent_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Cobro completo</span><span>{formatDate(budget.paid_at)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link href={`/clientes/${client.id}`} className="font-medium hover:text-accent">{clientFullName(client)}</Link>
              {client.company && <p className="text-muted">{client.company}</p>}
              {client.tax_id && <p className="text-muted">CUIT/DNI: {client.tax_id}</p>}
              {client.phone && <p className="text-muted">{client.phone}</p>}
              {client.email && <p className="text-muted">{client.email}</p>}
              {address && (
                <p className="mt-2 border-t border-border pt-2">
                  <span className="text-muted">Obra / Dirección: </span>
                  {address.label ? `${address.label} — ` : ""}{address.address}
                  {address.city ? `, ${address.city}` : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
