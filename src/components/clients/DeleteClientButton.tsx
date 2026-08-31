"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteClientRecord } from "@/app/(dashboard)/clientes/actions";

export function DeleteClientButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const result = await deleteClientRecord(id);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Cliente eliminado.");
    router.push("/clientes");
    router.refresh();
  }

  return (
    <ConfirmDialog
      title="¿Eliminar este cliente?"
      description="Esta acción no se puede deshacer."
      onConfirm={handleDelete}
      trigger={
        <Button variant="danger" size="sm">
          <Trash2 className="size-4" /> Eliminar
        </Button>
      }
    />
  );
}
