"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { createBudget, updateBudget } from "@/app/(dashboard)/presupuestos/actions";
import { calculateBudgetTotals, calculateItemSubtotal } from "@/lib/calculations";
import { formatCurrency, toDateInput } from "@/lib/format";
import { UNITS, BUDGET_STATUSES, BUDGET_STATUS_META } from "@/constants/statuses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { Budget, BudgetItem } from "@/types";

type FormValues = z.input<typeof budgetSchema>;

interface Props {
  clients: { id: string; label: string }[];
  addressesByClient: Record<string, { id: string; label: string }[]>;
  budget?: Budget;
  items?: BudgetItem[];
  defaultClientId?: string;
}

function LiveTotals({ control }: { control: Control<FormValues> }) {
  const items = useWatch({ control, name: "items" }) ?? [];
  const discount = Number(useWatch({ control, name: "discount" }) ?? 0);
  const taxRate = Number(useWatch({ control, name: "tax_rate" }) ?? 0);

  const totals = calculateBudgetTotals({
    items: items.map((i) => ({
      quantity: Number(i?.quantity) || 0,
      unit_price: Number(i?.unit_price) || 0,
      discount: Number(i?.discount) || 0,
    })),
    discount,
    taxRate,
  });

  return (
    <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
      <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
      {totals.discount > 0 && <Row label="Descuento" value={`- ${formatCurrency(totals.discount)}`} />}
      {totals.tax > 0 && <Row label={`IVA (${taxRate}%)`} value={formatCurrency(totals.tax)} />}
      <div className="border-t border-border pt-1">
        <Row label="TOTAL" value={formatCurrency(totals.total)} bold />
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function BudgetForm({ clients, addressesByClient, budget, items, defaultClientId }: Props) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      client_id: budget?.client_id ?? defaultClientId ?? "",
      address_id: budget?.address_id ?? "",
      status: budget?.status ?? "sent",
      discount: budget?.discount ?? 0,
      tax_rate: budget && budget.tax > 0 && budget.subtotal > budget.discount
        ? Math.round((budget.tax / (budget.subtotal - budget.discount)) * 100)
        : 0,
      notes: budget?.notes ?? "",
      sent_at: toDateInput(budget?.sent_at),
      accepted_at: toDateInput(budget?.accepted_at),
      items:
        items && items.length > 0
          ? items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit as (typeof UNITS)[number],
              unit_price: i.unit_price,
              discount: i.discount,
            }))
          : [{ description: "Mano de obra", quantity: 1, unit: "global", unit_price: 0, discount: 0 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });
  const [showDiscount, setShowDiscount] = useState(!!(budget && budget.discount > 0));
  const [showTax, setShowTax] = useState(!!(budget && budget.tax > 0));
  const selectedClientId = useWatch({ control, name: "client_id" }) as string;
  const addresses = addressesByClient[selectedClientId] ?? [];

  async function onSubmit(values: FormValues) {
    const input = values as BudgetInput;
    const result = budget
      ? await updateBudget(budget.id, input)
      : await createBudget(input);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(budget ? "Presupuesto actualizado." : "Presupuesto creado.");
    router.push(`/presupuestos/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client_id">Cliente *</Label>
            <Select id="client_id" {...register("client_id")}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
            {errors.client_id && <p className="mt-1 text-xs text-red-600">{errors.client_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="address_id">Dirección</Label>
            <Select id="address_id" {...register("address_id")} disabled={addresses.length === 0}>
              <option value="">
                {addresses.length === 0 ? "El cliente no tiene direcciones" : "Sin dirección específica"}
              </option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select id="status" {...register("status")}>
              {BUDGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BUDGET_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sent_at">Fecha de envío</Label>
            <Input id="sent_at" type="date" {...register("sent_at")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Label htmlFor="notes">Trabajo a realizar</Label>
          <Textarea id="notes" {...register("notes")} placeholder="Descripción del trabajo, alcance, observaciones..." />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unit: "unidad", unit_price: 0, discount: 0 })}
            >
              <Plus className="size-4" /> Agregar item
            </Button>
          </div>
          {errors.items?.message && <p className="text-xs text-red-600">{errors.items.message}</p>}

          <div className="space-y-3">
            {fields.map((field, i) => (
              <ItemRow
                key={field.id}
                index={i}
                control={control}
                register={register}
                setValue={setValue}
                onRemove={() => remove(i)}
                onUp={() => i > 0 && move(i, i - 1)}
                onDown={() => i < fields.length - 1 && move(i, i + 1)}
                errors={errors.items?.[i]}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={showDiscount}
                onChange={(e) => {
                  setShowDiscount(e.target.checked);
                  if (!e.target.checked) setValue("discount", 0);
                }}
              />
              Agregar descuento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={showTax}
                onChange={(e) => {
                  setShowTax(e.target.checked);
                  if (!e.target.checked) setValue("tax_rate", 0);
                }}
              />
              Agregar IVA
            </label>
          </div>

          {(showDiscount || showTax) && (
            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              {showDiscount && (
                <div>
                  <Label htmlFor="discount">Descuento global</Label>
                  <Input id="discount" type="number" step="0.01" min="0" {...register("discount")} />
                </div>
              )}
              {showTax && (
                <div>
                  <Label htmlFor="tax_rate">IVA (%)</Label>
                  <Input id="tax_rate" type="number" step="0.01" min="0" {...register("tax_rate")} />
                </div>
              )}
            </div>
          )}

          <LiveTotals control={control} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar presupuesto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ItemRow({
  index,
  control,
  register,
  setValue,
  onRemove,
  onUp,
  onDown,
  errors,
}: {
  index: number;
  control: Control<FormValues>;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  errors?: { description?: { message?: string }; quantity?: { message?: string }; unit_price?: { message?: string } };
}) {
  const item = useWatch({ control, name: `items.${index}` });
  // A "global" line is a lump sum: only a price (quantity forced to 1, no discount).
  const isGlobal = item?.unit === "global";
  const subtotal = calculateItemSubtotal({
    quantity: isGlobal ? 1 : Number(item?.quantity) || 0,
    unit_price: Number(item?.unit_price) || 0,
    discount: isGlobal ? 0 : Number(item?.discount) || 0,
  });

  const unitReg = register(`items.${index}.unit`);

  return (
    <div className="rounded-md border border-border p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-end">
        <div>
          <Label className="text-xs">Descripción</Label>
          <Input {...register(`items.${index}.description`)} placeholder="Descripción del item" />
        </div>
        {!isGlobal && (
          <div className="w-24">
            <Label className="text-xs">Cantidad</Label>
            <Input type="number" step="0.001" min="0" {...register(`items.${index}.quantity`)} />
          </div>
        )}
        <div className="w-28">
          <Label className="text-xs">Unidad</Label>
          <Select
            {...unitReg}
            onChange={(e) => {
              unitReg.onChange(e);
              if (e.target.value === "global") {
                setValue(`items.${index}.quantity`, 1);
                setValue(`items.${index}.discount`, 0);
              }
            }}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <Label className="text-xs">{isGlobal ? "Precio" : "P. unitario"}</Label>
          <Input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`)} />
        </div>
        {!isGlobal && (
          <div className="w-24">
            <Label className="text-xs">Descuento</Label>
            <Input type="number" step="0.01" min="0" {...register(`items.${index}.discount`)} />
          </div>
        )}
        <div className="flex items-center gap-1 pb-0.5">
          <Button type="button" variant="ghost" size="icon" onClick={onUp} aria-label="Subir"><ArrowUp className="size-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={onDown} aria-label="Bajar"><ArrowDown className="size-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Eliminar item"><Trash2 className="size-4 text-red-600" /></Button>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-red-600">
          {errors?.description?.message || errors?.quantity?.message || errors?.unit_price?.message}
        </span>
        <span className="text-muted">Subtotal: <strong>{formatCurrency(subtotal)}</strong></span>
      </div>
    </div>
  );
}
