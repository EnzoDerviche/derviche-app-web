type AddressRow = { id: string; client_id: string; label: string | null; address: string };

/** Group address rows into { [clientId]: [{ id, label }] } for the budget form select. */
export function groupAddresses(rows: AddressRow[]): Record<string, { id: string; label: string }[]> {
  const map: Record<string, { id: string; label: string }[]> = {};
  for (const a of rows) {
    (map[a.client_id] ??= []).push({
      id: a.id,
      label: a.label ? `${a.label} — ${a.address}` : a.address,
    });
  }
  return map;
}
