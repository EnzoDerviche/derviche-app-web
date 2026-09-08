import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { clientFullName } from "@/lib/format";
import { orIlike } from "@/lib/search";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function formatAddresses(addrs: { label: string | null; address: string }[] | null): string {
  if (!addrs || addrs.length === 0) return "—";
  const first = addrs[0].label || addrs[0].address;
  return addrs.length > 1 ? `${first} +${addrs.length - 1}` : first;
}

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*, budgets(count), client_addresses(label, address), administrator:administrators(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const filter = orIlike(q, ["first_name", "last_name", "company", "tax_id", "phone", "email"]);
  if (filter) query = query.or(filter);

  const { data, count } = await query;
  const clients = data ?? [];
  const query_ = q ? `q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/clientes/nuevo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" /> Nuevo cliente
          </Link>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchBar placeholder="Buscar clientes..." />
      </div>

      <Card className="p-0">
        {clients.length === 0 ? (
          <EmptyState
            title={q ? "No encontramos clientes que coincidan con tu búsqueda." : "No hay clientes registrados."}
            action={
              !q && (
                <Link href="/clientes/nuevo" className={buttonVariants({ variant: "primary", size: "sm" })}>
                  Crear cliente
                </Link>
              )
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Dirección</TH>
                <TH>Teléfono</TH>
                <TH>CUIT / DNI</TH>
                <TH>Administrador</TH>
                <TH className="text-right">Presupuestos</TH>
              </TR>
            </THead>
            <TBody>
              {clients.map((c) => (
                <TR key={c.id} className="hover:bg-stone-50">
                  <TD>
                    <Link href={`/clientes/${c.id}`} className="font-medium hover:text-accent">
                      {clientFullName(c)}
                    </Link>
                  </TD>
                  <TD>{formatAddresses(c.client_addresses as unknown as { label: string | null; address: string }[] | null)}</TD>
                  <TD>{c.phone ?? "—"}</TD>
                  <TD>{c.tax_id ?? "—"}</TD>
                  <TD>{(c.administrator as unknown as { name: string } | null)?.name ?? "—"}</TD>
                  <TD className="text-right">
                    {(c.budgets as unknown as { count: number }[] | null)?.[0]?.count ?? 0}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        query={query_}
        basePath="/clientes"
      />
    </>
  );
}
