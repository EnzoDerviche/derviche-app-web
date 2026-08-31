"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function GananciasFilters({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const get = (k: string) => searchParams.get(k) ?? "";

  function setParams(next: Record<string, string>) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const now = new Date();
  const ranges = {
    today: { from: iso(now), to: iso(now) },
    month: { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) },
    year: { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(new Date(now.getFullYear(), 11, 31)) },
  } as const;

  function preset(kind: "today" | "month" | "year" | "all") {
    if (kind === "all") setParams({ from: "", to: "" });
    else setParams(ranges[kind]);
  }

  const from = get("from");
  const to = get("to");
  const activePreset =
    !from && !to ? "all"
    : from === ranges.today.from && to === ranges.today.to ? "today"
    : from === ranges.month.from && to === ranges.month.to ? "month"
    : from === ranges.year.from && to === ranges.year.to ? "year"
    : null;

  const hasFilters = ["client_id", "from", "to"].some((k) => get(k));
  const activeField = "border-accent ring-1 ring-accent";

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">Período:</span>
          {(["today", "month", "year", "all"] as const).map((k) => (
            <Button
              key={k}
              variant={activePreset === k ? "primary" : "outline"}
              size="sm"
              onClick={() => preset(k)}
            >
              {{ today: "Hoy", month: "Este mes", year: "Este año", all: "Todo" }[k]}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="f-client">Cliente</Label>
            <Select id="f-client" className={get("client_id") ? activeField : ""} value={get("client_id")} onChange={(e) => setParams({ client_id: e.target.value })}>
              <option value="">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-from">Desde</Label>
            <Input id="f-from" type="date" className={from ? activeField : ""} value={from} onChange={(e) => setParams({ from: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="f-to">Hasta</Label>
            <Input id="f-to" type="date" className={to ? activeField : ""} value={to} onChange={(e) => setParams({ to: e.target.value })} />
          </div>
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" onClick={() => router.replace(pathname)}>
            <X className="size-4" /> Limpiar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
