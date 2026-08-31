import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { BudgetPdf } from "@/lib/pdf/budgetPdf";
import type { Budget, Client } from "@/types";

// @react-pdf/renderer needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [{ data: budget }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("budgets").select("*, client:clients(*)").eq("id", id).single(),
    supabase.from("budget_items").select("*").eq("budget_id", id).order("sort_order"),
    supabase.from("payments").select("*").eq("budget_id", id).order("payment_date"),
  ]);

  if (!budget || !budget.client) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  const { client, ...budgetRow } = budget as unknown as Budget & { client: Client };
  const buffer = await renderToBuffer(
    BudgetPdf({ budget: budgetRow, client, items: items ?? [], payments: payments ?? [] }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${budget.budget_number}.pdf"`,
    },
  });
}
