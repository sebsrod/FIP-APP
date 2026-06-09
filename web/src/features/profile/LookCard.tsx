import { BadgeCheck } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/Button';
import { openAffiliate } from '@/lib/affiliate';
import { formatPrice } from '@/lib/format';
import type { Look } from '@/api/types';

/** A single published profile photo: full vertical image + shoppable items. */
export function LookCard({ look }: { look: Look }) {
  return (
    <article className="overflow-hidden border-b border-zinc-200 pb-6">
      <div className="relative">
        <ImageWithFallback src={look.image_url} alt={look.caption ?? 'Published look'} className="aspect-[4/5] w-full" />
        {look.items.map((it) => (
          <span
            key={it.id}
            className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-rose-600 ring-2 ring-white"
            style={{ left: `${it.x_pct}%`, top: `${it.y_pct}%`, transform: 'translate(-50%, -50%)' }}
            aria-hidden
          />
        ))}
      </div>

      {look.caption ? (
        <p className="px-4 pt-4 font-serif text-[15px] leading-relaxed text-zinc-800">{look.caption}</p>
      ) : null}

      {look.items.length > 0 ? (
        <ul className="mt-3 flex flex-col divide-y divide-zinc-100 px-4">
          {look.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{it.brand}</span>
                  {it.verified ? <BadgeCheck className="h-3 w-3 shrink-0 text-rose-600" aria-label="Verified" /> : null}
                </div>
                <div className="truncate text-sm text-zinc-900">{it.item_name}</div>
                <div className="text-sm font-medium tabular-nums text-zinc-900">{formatPrice(it.price_cents, it.currency)}</div>
              </div>
              <Button variant="outline" className="shrink-0 px-4 py-2" onClick={() => openAffiliate('look_item', it.id, it.affiliate_url)}>
                Buy
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
