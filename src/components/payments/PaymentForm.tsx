"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { paymentSchema, type PaymentInput } from "@/lib/validations";
import { registerPayment } from "@/app/(dashboard)/presupuestos/actions";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/constants/statuses";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function PaymentForm({ budgetId, balance }: { budgetId: string; balance: number }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().slice(0, 10),
      payment_type: "advance",
    },
  });

  if (balance <= 0) {
    return <p className="text-sm text-muted">El presupuesto está saldado. No hay saldo pendiente.</p>;
  }

  async function onSubmit(values: z.input<typeof paymentSchema>) {
    if (Number(values.amount) > balance) {
      toast(`El monto no puede superar el saldo pendiente (${formatCurrency(balance)}).`, "error");
      return;
    }
    const result = await registerPayment(budgetId, values as PaymentInput);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Pago registrado.");
    reset({ payment_date: new Date().toISOString().slice(0, 10), payment_type: "partial", amount: undefined, notes: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <p className="text-sm text-muted">Saldo pendiente: <strong>{formatCurrency(balance)}</strong></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="amount">Monto *</Label>
          <Input id="amount" type="number" step="0.01" inputMode="decimal" {...register("amount")} />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <Label htmlFor="payment_date">Fecha *</Label>
          <Input id="payment_date" type="date" {...register("payment_date")} />
        </div>
        <div>
          <Label htmlFor="payment_type">Tipo</Label>
          <Select id="payment_type" {...register("payment_type")}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" {...register("notes")} />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} size="sm">
        {isSubmitting ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
