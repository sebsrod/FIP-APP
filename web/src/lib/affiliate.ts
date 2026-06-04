import { api } from '@/api/client';
import type { ClickSource } from '@/api/types';

/**
 * Log the affiliate click against the session user, then open the link.
 * The POST is fired (not awaited) immediately before window.open so the new
 * tab opens in the same user gesture — avoiding pop-up blockers — while the
 * click is still recorded first.
 */
export function openAffiliate(source: ClickSource, id: string, url: string): void {
  api.clicks.log(source, id).catch(() => {
    /* analytics best-effort; never block the shopper */
  });
  window.open(url, '_blank', 'noopener,noreferrer');
}
