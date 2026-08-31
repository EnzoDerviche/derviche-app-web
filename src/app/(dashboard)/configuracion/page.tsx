import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestDataButtons } from "@/components/config/TestDataButtons";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const APP_VERSION = "1.0.0";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const host = supabaseUrl ? new URL(supabaseUrl).host : "no configurado";

  return (
    <>
      <PageHeader title="Configuración" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Empresa</CardTitle></CardHeader>
          <CardContent>
            <Row label="Nombre" value="Derviche Construcciones" />
            <Row label="Rubro" value="Construcción" />
            <p className="mt-3 text-xs text-muted">
              Dirección, teléfono, email, logo y condiciones de pago se agregarán en una próxima versión.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sesión</CardTitle></CardHeader>
          <CardContent>
            <Row label="Usuario" value={user?.email ?? "—"} />
            <Row label="Estado" value="Conectado" />
            <form action={logout} className="mt-3">
              <Button variant="danger" size="sm">Cerrar sesión</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sistema</CardTitle></CardHeader>
          <CardContent>
            <Row label="Versión" value={APP_VERSION} />
            <Row label="Supabase" value={host} />
            <Row label="Conexión" value={supabaseUrl ? "OK" : "Sin configurar"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Datos de prueba</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted">
              Cargá un set de clientes y presupuestos de ejemplo para explorar la app. Solo afecta registros demo.
            </p>
            <TestDataButtons />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
