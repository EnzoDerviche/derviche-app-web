"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function PdfActions({ id, budgetNumber }: { id: string; budgetNumber: string }) {
  const [loading, setLoading] = useState<"download" | "share" | null>(null);
  const url = `/api/presupuestos/${id}/pdf`;
  const filename = `${budgetNumber}.pdf`;

  async function fetchPdf(): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("PDF request failed");
    return res.blob();
  }

  async function download() {
    setLoading("download");
    try {
      const blob = await fetchPdf();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast("No pudimos generar el PDF. Intentá nuevamente.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function share() {
    setLoading("share");
    try {
      const blob = await fetchPdf();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: budgetNumber });
      } else {
        toast("Compartir no está disponible en este dispositivo. Descargá el PDF.", "info");
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast("No pudimos compartir el PDF.", "error");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={download} disabled={loading !== null}>
        <Download className="size-4" /> {loading === "download" ? "Generando PDF..." : "Descargar PDF"}
      </Button>
      <Button variant="outline" size="sm" onClick={share} disabled={loading !== null}>
        <Share2 className="size-4" /> {loading === "share" ? "Generando..." : "Compartir"}
      </Button>
    </div>
  );
}
