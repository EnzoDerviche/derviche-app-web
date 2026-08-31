"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="max-w-md text-sm text-muted">{error.message || "Ocurrió un error inesperado."}</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
