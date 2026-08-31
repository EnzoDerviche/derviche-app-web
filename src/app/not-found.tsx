import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="text-muted">El recurso que buscás no existe o fue movido.</p>
      <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
        Volver al inicio
      </Link>
    </main>
  );
}
