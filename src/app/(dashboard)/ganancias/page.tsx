import Link from "next/link";
import { CircleDollarSign, Receipt, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { GananciasFilters } from "@/components/reports/GananciasFilters";
import { BarChart } from "@/components/reports/BarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency, formatDate, clientFullName } from "@/lib/format";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/constants/statuses";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ client_id?: string; from?: string; to?: string }>;

/** "2026-08" -> "ago 26". */
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const name = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "short" });
  return `${name} ${String(y).slice(2)}`;
}

type PaymentRow = {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  budget: {
    id: string;
    budget_number: string;
    client: { first_name: string; last_name: string; company: string | null } | null;
  } | null;
};

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3 p-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default async function GananciasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select("id, amount, payment_date, payment_type, budget:budgets(id, budget_number, client:clients(first_name, last_name, company))")
    .order("payment_date", { ascending: false });

  if (sp.from) query = query.gte("payment_date", sp.from);
  if (sp.to) query = query.lte("payment_date", sp.to);

  if (sp.client_id) {
    const { data: budgetIds } = await supabase.from("budgets").select("id").eq("client_id", sp.client_id);
    const ids = (budgetIds ?? []).map((b) => b.id);
    // No budgets for this client → force empty result.
    query = query.in("budget_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data } = await query;
  const payments = (data ?? []) as unknown as PaymentRow[];

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const clientsPaid = new Set(payments.map((p) => p.budget?.client && clientFullName(p.budget.client))).size;

  // Monthly breakdown (chronological, last 12 months).
  const byMonth = new Map<string, number>();
  for (const p of payments) {
    const key = p.payment_date.slice(0, 7); // YYYY-MM
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount));
  }
  const monthChart = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([m, value]) => ({ label: monthLabel(m), value }));

  // Breakdown by client (top 8).
  const byClient = new Map<string, number>();
  for (const p of payments) {
    const name = p.budget?.client ? clientFullName(p.budget.client) : "Sin cliente";
    byClient.set(name, (byClient.get(name) ?? 0) + Number(p.amount));
  }
  const clientChart = [...byClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  const clientsData = (await supabase.from("clients").select("id, first_name, last_name, company").order("first_name")).data ?? [];
  const clientOptions = clientsData.map((c) => ({ id: c.id, label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}` }));

  return (
    <>
      <PageHeader title="Ganancias" subtitle="Ingresos cobrados por período" />

      <div className="mb-6">
        <GananciasFilters clients={clientOptions} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Total cobrado" value={formatCurrency(total)} icon={CircleDollarSign} accent="bg-green-100 text-green-600" />
        <Kpi label="Cantidad de pagos" value={payments.length} icon={Receipt} accent="bg-amber-100 text-amber-600" />
        <Kpi label="Clientes que pagaron" value={clientsPaid} icon={Users} accent="bg-blue-100 text-blue-600" />
      </div>

      {payments.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Cobrado por mes</CardTitle></CardHeader>
            <CardContent>
              <BarChart items={monthChart} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top clientes</CardTitle></CardHeader>
            <CardContent>
              <BarChart items={clientChart} />
            </CardContent>
          </Card>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Detalle de cobros</h2>
      <Card className="p-0">
        {payments.length === 0 ? (
          <EmptyState title="No hay cobros registrados para los filtros seleccionados." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Cliente</TH>
                <TH>Presupuesto</TH>
                <TH>Tipo</TH>
                <TH className="text-right">Monto</TH>
              </TR>
            </THead>
            <TBody>
              {payments.map((p) => (
                <TR key={p.id} className="hover:bg-stone-50">
                  <TD>{formatDate(p.payment_date)}</TD>
                  <TD>{p.budget?.client ? clientFullName(p.budget.client) : "—"}</TD>
                  <TD>
                    {p.budget ? (
                      <Link href={`/presupuestos/${p.budget.id}`} className="font-medium hover:text-accent">
                        {p.budget.budget_number}
                      </Link>
                    ) : "—"}
                  </TD>
                  <TD>{PAYMENT_TYPE_LABELS[p.payment_type]}</TD>
                  <TD className="text-right font-medium">{formatCurrency(p.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
