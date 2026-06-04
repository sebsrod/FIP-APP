import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/Button';
import { openAffiliate } from '@/lib/affiliate';
import { formatPrice } from '@/lib/format';
import type { Look } from '@/api/types';

/** A single published look: magazine image, caption, and shoppable items. */
export function LookCard({ look }: { look: Look }) {
  return (
    <article className="overflow-hidden border-b border-white/10 pb-6">
      <div className="relative">
        <ImageWithFallback
          src={look.image_url}
          alt={look.caption ?? 'Published look'}
          className="aspect-[4/5] w-full"
        />
        {/* Decorative pinpoints showing where each item sits */}
        {look.items.map((it) => (
          <span
            key={it.id}
            className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-rose-600"
            style={{ left: `${it.x_pct}%`, top: `${it.y_pct}%`, transform: 'translate(-50%, -50%)' }}
            aria-hidden
          />
        ))}
      </div>

      {look.caption ? (
        <p className="px-4 pt-4 font-serif text-[15px] leading-relaxed text-zinc-200">{look.caption}</p>
      ) : null}

      {look.items.length > 0 ? (
        <ul className="mt-3 flex flex-col divide-y divide-white/5 px-4">
          {look.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {it.brand}
                </div>
                <div className="truncate text-sm text-zinc-100">{it.item_name}</div>
                <div className="text-sm font-medium tabular-nums text-rose-400">
                  {formatPrice(it.price_cents, it.currency)}
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 px-4 py-2"
                onClick={() => openAffiliate('look_item', it.id, it.affiliate_url)}
              >
                Buy
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
