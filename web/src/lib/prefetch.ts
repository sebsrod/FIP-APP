/** Warm the browser image cache so the next poll has no flash/pop. */
const seen = new Set<string>();

export function prefetchImage(url: string | null | undefined): void {
  if (!url || seen.has(url)) return;
  seen.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

export function prefetchImages(urls: Array<string | null | undefined>): void {
  for (const u of urls) prefetchImage(u);
}
