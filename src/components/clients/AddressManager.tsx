"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Plus, Trash2, Pencil, MapPin } from "lucide-react";
import { addressSchema, type AddressInput } from "@/lib/validations";
import { createAddress, updateAddress, deleteAddress } from "@/app/(dashboard)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { ClientAddress } from "@/types";

type FormValues = z.input<typeof addressSchema>;

export function AddressManager({
  clientId,
  addresses,
}: {
  clientId: string;
  addresses: ClientAddress[];
}) {
  const router = useRouter();
  // null = form closed; "new" = adding; otherwise the id being edited.
  const [mode, setMode] = useState<null | "new" | string>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(addressSchema) });

  function openNew() {
    reset({ address: "", city: "", province: "", notes: "" });
    setMode("new");
  }

  function openEdit(a: ClientAddress) {
    reset({ address: a.address, city: a.city ?? "", province: a.province ?? "", notes: a.notes ?? "" });
    setMode(a.id);
  }

  async function onSubmit(values: FormValues) {
    const input = values as AddressInput;
    const result =
      mode === "new"
        ? await createAddress(clientId, input)
        : await updateAddress(mode as string, clientId, input);
    if (!result.ok) return toast(result.error, "error");
    toast(mode === "new" ? "Dirección agregada." : "Dirección actualizada.");
    setMode(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteAddress(id, clientId);
    if (!result.ok) return toast(result.error, "error");
    toast("Dirección eliminada.");
    router.refresh();
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border border-border p-3">
      <div>
        <Label htmlFor="address">Dirección *</Label>
        <Input id="address" placeholder="Calle y número" {...register("address")} />
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">Localidad</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div>
          <Label htmlFor="province">Provincia</Label>
          <Input id="province" {...register("province")} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" placeholder="Piso, referencia, etc." {...register("notes")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar dirección"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setMode(null)}>
          Cancelar
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {addresses.length === 0 && mode !== "new" && (
        <p className="text-sm text-muted">Este cliente no tiene direcciones cargadas.</p>
      )}

      {addresses.map((a) =>
        mode === a.id ? (
          <div key={a.id}>{form}</div>
        ) : (
          <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <div className="text-sm">
                <p className="font-medium">{a.address}</p>
                {(a.city || a.province) && (
                  <p className="text-muted">{[a.city, a.province].filter(Boolean).join(", ")}</p>
                )}
                {a.notes && <p className="text-muted">{a.notes}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button aria-label="Editar dirección" className="rounded p-1 hover:bg-stone-100" onClick={() => openEdit(a)}>
                <Pencil className="size-4" />
              </button>
              <ConfirmDialog
                title="¿Eliminar esta dirección?"
                description="Los presupuestos que la usaban quedan sin dirección asignada."
                onConfirm={() => handleDelete(a.id)}
                trigger={
                  <button aria-label="Eliminar dirección" className="rounded p-1 hover:bg-stone-100">
                    <Trash2 className="size-4 text-red-600" />
                  </button>
                }
              />
            </div>
          </div>
        ),
      )}

      {mode === "new" ? (
        form
      ) : mode === null ? (
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus className="size-4" /> Agregar dirección
        </Button>
      ) : null}
    </div>
  );
}
