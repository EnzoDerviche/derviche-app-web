"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { assignClient, unassignClient } from "@/app/(dashboard)/administradores/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "@/components/ui/toast";

type ClientOption = { id: string; name: string };

export function AdministratorClients({
  administratorId,
  assigned,
  assignable,
}: {
  administratorId: string;
  assigned: ClientOption[];
  assignable: ClientOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);

  async function assign() {
    if (!selected) return;
    setPending(true);
    const result = await assignClient(selected, administratorId);
    setPending(false);
    if (!result.ok) return toast(result.error, "error");
    toast("Cliente asignado.");
    setSelected("");
    router.refresh();
  }

  async function remove(clientId: string) {
    setPending(true);
    const result = await unassignClient(clientId, administratorId);
    setPending(false);
    if (!result.ok) return toast(result.error, "error");
    toast("Cliente quitado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs text-muted">Asignar cliente</label>
          <Select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={assignable.length === 0}>
            <option value="">
              {assignable.length === 0 ? "No hay clientes para asignar" : "Seleccionar cliente..."}
            </option>
            {assignable.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={assign} disabled={pending || !selected}>
          Asignar
        </Button>
      </div>

      {assigned.length === 0 ? (
        <EmptyState title="Este administrador no tiene clientes asignados." />
      ) : (
        <div className="space-y-2">
          {assigned.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <Link href={`/clientes/${c.id}`} className="text-sm font-medium hover:text-accent">
                {c.name}
              </Link>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => remove(c.id)}>
                <X className="size-4" /> Quitar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
