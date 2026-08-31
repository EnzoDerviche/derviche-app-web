"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { loadTestData, clearTestData } from "@/app/(dashboard)/configuracion/actions";

export function TestDataButtons() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (!result.ok) return toast(result.error ?? "Error", "error");
    toast(result.message ?? "Listo.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(loadTestData)}>
        Cargar datos de prueba
      </Button>
      <ConfirmDialog
        title="¿Eliminar datos de prueba?"
        description="Solo se eliminarán los registros marcados como demo. Tus datos reales no se tocan."
        confirmLabel="Eliminar demo"
        onConfirm={() => run(clearTestData)}
        trigger={<Button variant="outline" size="sm" disabled={pending}>Eliminar datos de prueba</Button>}
      />
    </div>
  );
}
