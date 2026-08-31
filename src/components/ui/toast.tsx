"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

let counter = 0;
const listeners = new Set<(t: Toast) => void>();

export function toast(message: string, kind: ToastKind = "success") {
  const t = { id: ++counter, message, kind };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const add = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-md px-4 py-3 text-sm shadow-lg border max-w-xs",
            t.kind === "success" && "bg-green-50 border-green-200 text-green-800",
            t.kind === "error" && "bg-red-50 border-red-200 text-red-800",
            t.kind === "info" && "bg-card border-border",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
