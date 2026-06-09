/**
 * Affiliate-program domains. A product link on one of these hosts renders a
 * "verified" check; any other (generic) link does not.
 */
const AFFILIATE_HOSTS = [
  'net-a-porter.com',
  'mrporter.com',
  'farfetch.com',
  'ssense.com',
  'mytheresa.com',
  'matchesfashion.com',
  'nordstrom.com',
  'shopbop.com',
  'revolve.com',
  'asos.com',
  'zalando.com',
  'endclothing.com',
  'mango.com',
  'cos.com',
  'arket.com',
  'toteme-studio.com',
  'thereformation.com',
  'ganni.com',
  'adidas.com',
  'newbalance.com',
];

/** True if the URL's host is (or is a subdomain of) a known affiliate host. */
export function isAffiliateVerified(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return AFFILIATE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
