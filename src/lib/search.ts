/**
 * Build a PostgREST `.or()` filter string that matches `q` (case-insensitive)
 * against any of the given columns. Returns "" when q is empty.
 *
 * Strips PostgREST/ILIKE control chars (, ) * % so the term can't break the
 * filter grammar or inject wildcards.
 */
export function orIlike(q: string, columns: string[]): string {
  const term = q.trim().replace(/[,()*%]/g, "");
  if (!term) return "";
  return columns.map((c) => `${c}.ilike.%${term}%`).join(",");
}
