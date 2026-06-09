import { api } from '@/api/client';
import type { ClickSource } from '@/api/types';

// Mirror of the Worker's affiliate host list — for the live "verified" hint in
// the composer only. The server recomputes it authoritatively on save.
const AFFILIATE_HOSTS = [
  'net-a-porter.com', 'mrporter.com', 'farfetch.com', 'ssense.com', 'mytheresa.com',
  'matchesfashion.com', 'nordstrom.com', 'shopbop.com', 'revolve.com', 'asos.com',
  'zalando.com', 'endclothing.com', 'mango.com', 'cos.com', 'arket.com',
  'toteme-studio.com', 'thereformation.com', 'ganni.com', 'adidas.com', 'newbalance.com',
];

export function isAffiliateVerifiedClient(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return AFFILIATE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

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
