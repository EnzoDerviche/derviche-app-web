"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Plus, Trash2, Pencil, UserCog } from "lucide-react";
import { administratorSchema, type AdministratorInput } from "@/lib/validations";
import {
  createAdministrator,
  updateAdministrator,
  deleteAdministrator,
} from "@/app/(dashboard)/administradores/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { Administrator } from "@/types";

type FormValues = z.input<typeof administratorSchema>;
type Row = Administrator & { clients: { count: number }[] };

export function AdministratorManager({ administrators }: { administrators: Row[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "new" | string>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(administratorSchema) });

  function openNew() {
    reset({ name: "", phone: "", email: "", notes: "" });
    setMode("new");
  }
  function openEdit(a: Administrator) {
    reset({ name: a.name, phone: a.phone ?? "", email: a.email ?? "", notes: a.notes ?? "" });
    setMode(a.id);
  }

  async function onSubmit(values: FormValues) {
    const input = values as AdministratorInput;
    const result =
      mode === "new" ? await createAdministrator(input) : await updateAdministrator(mode as string, input);
    if (!result.ok) return toast(result.error, "error");
    toast(mode === "new" ? "Administrador creado." : "Administrador actualizado.");
    setMode(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteAdministrator(id);
    if (!result.ok) return toast(result.error, "error");
    toast("Administrador eliminado.");
    router.refresh();
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border border-border p-3">
      <div>
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setMode(null)}>
          Cancelar
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardContent className="space-y-3">
        {administrators.length === 0 && mode !== "new" && (
          <p className="text-sm text-muted">No hay administradores cargados.</p>
        )}

        {administrators.map((a) =>
          mode === a.id ? (
            <div key={a.id}>{form}</div>
          ) : (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
              <div className="flex items-start gap-2">
                <UserCog className="mt-0.5 size-4 shrink-0 text-accent" />
                <div className="text-sm">
                  <Link href={`/administradores/${a.id}`} className="font-medium hover:text-accent">{a.name}</Link>
                  {(a.phone || a.email) && (
                    <p className="text-muted">{[a.phone, a.email].filter(Boolean).join(" · ")}</p>
                  )}
                  <p className="text-muted">
                    {(a.clients?.[0]?.count ?? 0)} cliente{(a.clients?.[0]?.count ?? 0) === 1 ? "" : "s"} asignado
                    {(a.clients?.[0]?.count ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button aria-label="Editar administrador" className="rounded p-1 hover:bg-stone-100" onClick={() => openEdit(a)}>
                  <Pencil className="size-4" />
                </button>
                <ConfirmDialog
                  title="¿Eliminar este administrador?"
                  description="Los clientes asignados quedan sin administrador."
                  onConfirm={() => handleDelete(a.id)}
                  trigger={
                    <button aria-label="Eliminar administrador" className="rounded p-1 hover:bg-stone-100">
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
            <Plus className="size-4" /> Nuevo administrador
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
