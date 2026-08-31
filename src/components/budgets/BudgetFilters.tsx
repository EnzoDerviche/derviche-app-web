"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUDGET_STATUSES, PAYMENT_STATUSES, BUDGET_STATUS_META, PAYMENT_STATUS_META } from "@/constants/statuses";

export function BudgetFilters({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const get = (k: string) => searchParams.get(k) ?? "";
  const hasFilters = ["status", "payment_status", "client_id", "from", "to", "with_balance", "q"].some((k) => get(k));
  const active = "border-accent ring-1 ring-accent";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Select aria-label="Estado" className={get("status") ? active : ""} value={get("status")} onChange={(e) => setParam("status", e.target.value)}>
        <option value="">Todos los estados</option>
        {BUDGET_STATUSES.map((s) => (
          <option key={s} value={s}>{BUDGET_STATUS_META[s].label}</option>
        ))}
      </Select>

      <Select aria-label="Estado de pago" className={get("payment_status") ? active : ""} value={get("payment_status")} onChange={(e) => setParam("payment_status", e.target.value)}>
        <option value="">Todos los pagos</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>{PAYMENT_STATUS_META[s].label}</option>
        ))}
      </Select>

      <Select aria-label="Cliente" className={get("client_id") ? active : ""} value={get("client_id")} onChange={(e) => setParam("client_id", e.target.value)}>
        <option value="">Todos los clientes</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </Select>

      <div>
        <label className="text-xs text-muted">Desde</label>
        <Input type="date" className={get("from") ? active : ""} value={get("from")} onChange={(e) => setParam("from", e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted">Hasta</label>
        <Input type="date" className={get("to") ? active : ""} value={get("to")} onChange={(e) => setParam("to", e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={get("with_balance") === "1"}
          onChange={(e) => setParam("with_balance", e.target.checked ? "1" : "")}
          className="size-4 accent-accent"
        />
        Con saldo pendiente
      </label>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={() => router.replace(pathname)} className="justify-self-start">
          <X className="size-4" /> Limpiar filtros
        </Button>
      )}
    </div>
  );
}
