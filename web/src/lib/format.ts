/** Client-side formatters. Money is stored as integer cents — format here. */

export function formatPrice(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    // Unknown currency code -> simple fallback.
    return `$${(cents / 100).toFixed(0)}`;
  }
}

/** Compact vote/follower counts: 1284 -> "1,284", 8421 -> "8,421". */
export function formatCount(n: number): string {
  return new Intl.NumberFormat().format(n);
}

/** Compact large counts for tight UI: 1284 -> "1.3k". */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Local mirror of the server's percentage rule (used for optimistic display). */
export function percentages(a: number, b: number): { a_pct: number; b_pct: number } {
  const total = a + b;
  if (total <= 0) return { a_pct: 0, b_pct: 0 };
  const aPct = Math.round((a / total) * 100);
  return { a_pct: aPct, b_pct: 100 - aPct };
}
