"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { createClientRecord, updateClientRecord } from "@/app/(dashboard)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { Client } from "@/types";

type FormValues = z.input<typeof clientSchema>;

const FIELDS: { name: keyof FormValues; label: string; type?: string }[] = [
  { name: "first_name", label: "Nombre *" },
  { name: "last_name", label: "Apellido *" },
  { name: "tax_id", label: "DNI / CUIT" },
  { name: "phone", label: "Teléfono" },
  { name: "email", label: "Email", type: "email" },
];

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          first_name: client.first_name,
          last_name: client.last_name,
          company: client.company ?? "",
          tax_id: client.tax_id ?? "",
          phone: client.phone ?? "",
          email: client.email ?? "",
          address: client.address ?? "",
          city: client.city ?? "",
          province: client.province ?? "",
          notes: client.notes ?? "",
        }
      : undefined,
  });

  async function onSubmit(values: FormValues) {
    const input = values as ClientInput;
    const result = client
      ? await updateClientRecord(client.id, input)
      : await createClientRecord(input);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(client ? "Cliente actualizado correctamente." : "Cliente creado correctamente.");
    router.push(client ? `/clientes/${client.id}` : `/clientes/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input id={f.name} type={f.type} {...register(f.name)} />
            {errors[f.name] && (
              <p className="mt-1 text-xs text-red-600">{errors[f.name]?.message}</p>
            )}
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
