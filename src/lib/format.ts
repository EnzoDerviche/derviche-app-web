const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatCurrency(n: number | null | undefined): string {
  return currency.format(n ?? 0);
}

/** Format an ISO string / date as DD/MM/YYYY. Returns "—" for null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function clientFullName(c: {
  first_name: string;
  last_name: string;
}): string {
  return `${c.first_name} ${c.last_name}`.trim();
}

/** For <input type="date"> value binding. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}
