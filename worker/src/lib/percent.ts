/** Server-authoritative vote percentages. */
export function percentages(a: number, b: number): { a_pct: number; b_pct: number } {
  const total = a + b;
  if (total <= 0) return { a_pct: 0, b_pct: 0 }; // 0/0 -> 0% / 0%, never NaN
  const aPct = Math.round((a / total) * 100);
  return { a_pct: aPct, b_pct: 100 - aPct }; // forces A + B === 100
}
