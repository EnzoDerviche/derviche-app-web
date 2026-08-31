import { formatCurrency } from "@/lib/format";

/** Horizontal bar chart — no dependencies. Bars scaled to the max value. */
export function BarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-muted" title={it.label}>
            {it.label}
          </span>
          <div className="h-6 flex-1 rounded bg-stone-100">
            <div
              className="flex h-6 items-center rounded bg-accent px-2"
              style={{ width: `${Math.max(4, (it.value / max) * 100)}%` }}
            >
              <span className="truncate text-xs font-medium text-accent-foreground">
                {formatCurrency(it.value)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
