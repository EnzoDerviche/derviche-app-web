"use client";

import * as React from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

/** Confirmation modal built on the native <dialog> element (accessible, no deps). */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
}: ConfirmDialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      ref.current?.close();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <span onClick={() => ref.current?.showModal()}>{trigger}</span>
      <dialog
        ref={ref}
        className="m-auto rounded-lg border border-border bg-card p-0 backdrop:bg-black/40 max-w-sm w-[90vw]"
      >
        <div className="p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => ref.current?.close()} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={pending}>
              {pending ? "..." : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
