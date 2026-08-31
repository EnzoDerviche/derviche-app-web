"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteBudget, deletePayment } from "@/app/(dashboard)/presupuestos/actions";

export function DeleteBudgetButton({ id }: { id: string }) {
  const router = useRouter();
  async function handle() {
    const result = await deleteBudget(id);
    if (!result.ok) return toast(result.error, "error");
    toast("Presupuesto eliminado.");
    router.push("/presupuestos");
    router.refresh();
  }
  return (
    <ConfirmDialog
      title="¿Eliminar este presupuesto?"
      description="Esta acción no se puede deshacer. Se eliminarán también sus items y pagos."
      onConfirm={handle}
      trigger={<Button variant="danger" size="sm"><Trash2 className="size-4" /> Eliminar</Button>}
    />
  );
}

export function DeletePaymentButton({ paymentId, budgetId }: { paymentId: string; budgetId: string }) {
  const router = useRouter();
  async function handle() {
    const result = await deletePayment(paymentId, budgetId);
    if (!result.ok) return toast(result.error, "error");
    toast("Pago eliminado.");
    router.refresh();
  }
  return (
    <ConfirmDialog
      title="¿Eliminar este pago?"
      description="El saldo y el estado de pago se recalcularán."
      onConfirm={handle}
      trigger={
        <button aria-label="Eliminar pago" className="rounded p-1 hover:bg-stone-100">
          <Trash2 className="size-4 text-red-600" />
        </button>
      }
    />
  );
}
