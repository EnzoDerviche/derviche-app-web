import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { BudgetPdf } from "@/lib/pdf/budgetPdf";
import type { Budget, Client } from "@/types";

// @react-pdf/renderer needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadLogo(req: Request): Promise<string | undefined> {
  try {
    const host = req.headers.get("host");
    if (!host) return undefined;
    const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const res = await fetch(`${proto}://${host}/logo.png`);
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    // Sniff real format (the file may be a JPEG renamed .png).
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function GET(
  req: Request,
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

  const { data: address } = budgetRow.address_id
    ? await supabase.from("client_addresses").select("*").eq("id", budgetRow.address_id).single()
    : { data: null };

  const logo = await loadLogo(req);
  const buffer = await renderToBuffer(
    BudgetPdf({ budget: budgetRow, client, items: items ?? [], payments: payments ?? [], address, logo }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${budget.budget_number}.pdf"`,
    },
  });
}
