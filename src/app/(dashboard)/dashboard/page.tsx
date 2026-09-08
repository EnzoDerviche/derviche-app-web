import { Users, FileText, Wallet, TrendingUp, CircleDollarSign, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { BUDGET_STATUS_META, type BudgetStatus } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/database";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="break-words text-lg font-bold sm:text-xl">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dashboard_stats");
  const stats = (data ?? {
    total_clients: 0,
    total_budgets: 0,
    by_status: {},
    budgets_with_balance: 0,
    total_budgeted: 0,
    total_collected: 0,
    total_pending: 0,
  }) as DashboardStats;

  const byStatus = stats.by_status ?? {};

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Resumen general de la actividad" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Clientes" value={stats.total_clients} icon={Users} accent="bg-blue-100 text-blue-600" />
        <Stat label="Presupuestos" value={stats.total_budgets} icon={FileText} accent="bg-amber-100 text-amber-600" />
        <Stat label="Con saldo pendiente" value={stats.budgets_with_balance} icon={Clock} accent="bg-orange-100 text-orange-600" />
        <Stat label="Total presupuestado" value={formatCurrency(stats.total_budgeted)} icon={TrendingUp} accent="bg-stone-200 text-stone-700" />
        <Stat label="Total cobrado" value={formatCurrency(stats.total_collected)} icon={CircleDollarSign} accent="bg-green-100 text-green-600" />
        <Stat label="Total pendiente" value={formatCurrency(stats.total_pending)} icon={Wallet} accent="bg-red-100 text-red-600" />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Presupuestos por estado</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(Object.keys(BUDGET_STATUS_META) as BudgetStatus[]).map((s) => (
          <Card key={s} className={cn("border-l-4 p-4", accentBorder(s))}>
            <div className="mb-2">
              <StatusBadge status={s} />
            </div>
            <p className="text-2xl font-bold">{byStatus[s] ?? 0}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Left-border tint per status, matching the badge palette. */
function accentBorder(s: BudgetStatus): string {
  const map: Record<BudgetStatus, string> = {
    sent: "border-l-blue-400",
    partial_paid: "border-l-amber-400",
    paid: "border-l-green-500",
  };
  return map[s];
}
