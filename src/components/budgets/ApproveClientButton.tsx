"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { approveBudgetClient } from "@/app/(dashboard)/presupuestos/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ApproveClientButton({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function approve() {
    setPending(true);
    const result = await approveBudgetClient(budgetId);
    setPending(false);
    if (!result.ok) return toast(result.error, "error");
    toast("Cliente registrado.");
    router.refresh();
  }

  return (
    <Button size="sm" onClick={approve} disabled={pending}>
      <UserPlus className="size-4" /> {pending ? "Registrando..." : "Aprobar y registrar cliente"}
    </Button>
  );
}
