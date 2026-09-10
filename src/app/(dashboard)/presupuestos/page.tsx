import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { BudgetFilters } from "@/components/budgets/BudgetFilters";
import { StatusBadge } from "@/components/common/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency, formatDate, clientFullName } from "@/lib/format";
import { calculateBalance } from "@/lib/calculations";
import { orIlike } from "@/lib/search";
import type { Budget, Client, Payment } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  q?: string;
  page?: string;
  status?: string;
  payment_status?: string;
  client_id?: string;
  from?: string;
  to?: string;
  with_balance?: string;
}>;

export default async function PresupuestosPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Search across budget_number OR client fields OR address (two-step to span relations).
  let orClause = "";
  if (q) {
    const term = q.trim().replace(/[,()*%]/g, "");
    const [{ data: matchedClients }, { data: matchedAddrs }] = await Promise.all([
      supabase.from("clients").select("id").or(orIlike(q, ["first_name", "last_name", "company", "tax_id", "phone"])),
      supabase.from("client_addresses").select("id").or(orIlike(q, ["label", "address", "city"])),
    ]);
    const clientIds = (matchedClients ?? []).map((c) => c.id);
    const addrIds = (matchedAddrs ?? []).map((a) => a.id);
    const parts = [`budget_number.ilike.%${term}%`];
    if (clientIds.length) parts.push(`client_id.in.(${clientIds.join(",")})`);
    if (addrIds.length) parts.push(`address_id.in.(${addrIds.join(",")})`);
    orClause = parts.join(",");
  }

  let query = supabase
    .from("budgets")
    .select("*, client:clients(*), payments(amount), address:client_addresses(label, address)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (orClause) query = query.or(orClause);
  if (sp.status) query = query.eq("status", sp.status as Budget["status"]);
  if (sp.payment_status) query = query.eq("payment_status", sp.payment_status as Budget["payment_status"]);
  if (sp.client_id) query = query.eq("client_id", sp.client_id);
  if (sp.from) query = query.gte("created_at", sp.from);
  if (sp.to) query = query.lte("created_at", `${sp.to}T23:59:59`);
  if (sp.with_balance === "1") query = query.neq("payment_status", "fully_paid");

  const { data, count } = await query;
  const budgets = (data ?? []) as unknown as (Budget & {
    client: Client;
    payments: Pick<Payment, "amount">[];
    address: { label: string | null; address: string } | null;
  })[];

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, first_name, last_name, company")
    .order("first_name");
  const clientOptions = (clientsData ?? []).map((c) => ({
    id: c.id,
    label: `${clientFullName(c)}${c.company ? ` — ${c.company}` : ""}`,
  }));

  const queryString = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][],
  ).toString();

  return (
    <>
      <PageHeader
        title="Presupuestos"
        action={
          <Link href="/presupuestos/nuevo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" /> Nuevo presupuesto
          </Link>
        }
      />

      <div className="mb-4 space-y-3">
        <div className="max-w-md">
          <SearchBar placeholder="Buscar por número, cliente, CUIT, dirección..." />
        </div>
        <BudgetFilters clients={clientOptions} />
      </div>

      <Card className="p-0">
        {budgets.length === 0 ? (
          <EmptyState
            title={
              q || queryString
                ? "No encontramos presupuestos que coincidan con los filtros."
                : "No hay presupuestos registrados."
            }
            action={
              !q && !queryString ? (
                <Link href="/presupuestos/nuevo" className={buttonVariants({ variant: "primary", size: "sm" })}>
                  Crear presupuesto
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Número</TH>
                <TH>Cliente</TH>
                <TH>Dirección</TH>
                <TH>Fecha</TH>
                <TH>Estado</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Pagado</TH>
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
                    <TD>
                      {clientFullName(b.client)}
                      {b.client.is_prospect && <span className="ml-1 text-xs text-amber-600">(no registrado)</span>}
                    </TD>
                    <TD>{b.address ? (b.address.label || b.address.address) : "—"}</TD>
                    <TD>{formatDate(b.created_at)}</TD>
                    <TD><StatusBadge status={b.status} /></TD>
                    <TD className="text-right">{formatCurrency(b.total)}</TD>
                    <TD className="text-right">{formatCurrency(paid)}</TD>
                    <TD className="text-right">{formatCurrency(calculateBalance(b.total, paid))}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} query={queryString} basePath="/presupuestos" />
    </>
  );
}
