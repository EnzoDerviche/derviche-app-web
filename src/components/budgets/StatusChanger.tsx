"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeBudgetStatus } from "@/app/(dashboard)/presupuestos/actions";
import { BUDGET_STATUSES, BUDGET_STATUS_META, type BudgetStatus } from "@/constants/statuses";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function StatusChanger({ id, current }: { id: string; current: BudgetStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<BudgetStatus>(current);
  const [pending, setPending] = useState(false);

  async function apply() {
    setPending(true);
    const result = await changeBudgetStatus(id, status);
    setPending(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Estado actualizado.");
    router.refresh();
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted">Cambiar estado</label>
        <Select value={status} onChange={(e) => setStatus(e.target.value as BudgetStatus)}>
          {BUDGET_STATUSES.map((s) => (
            <option key={s} value={s}>{BUDGET_STATUS_META[s].label}</option>
          ))}
        </Select>
      </div>
      <Button onClick={apply} disabled={pending || status === current} size="sm">
        {pending ? "..." : "Aplicar"}
      </Button>
    </div>
  );
}
