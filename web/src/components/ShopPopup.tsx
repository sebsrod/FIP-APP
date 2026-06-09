import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Props {
  brand: string;
  itemName: string;
  priceCents: number;
  currency: string;
  verified?: boolean;
  anchorXPct: number;
  anchorYPct: number;
  containerRef: RefObject<HTMLElement | null>;
  onActivate: () => void;
  onClose: () => void;
}

const GAP = 20;
const EDGE = 8;

/** Compact, anchored shopping HUD that clamps/flips to stay inside the frame. */
export function ShopPopup({
  brand,
  itemName,
  priceCents,
  currency,
  verified,
  anchorXPct,
  anchorYPct,
  containerRef,
  onActivate,
  onClose,
}: Props) {
  const popupRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const container = containerRef.current;
      const popup = popupRef.current;
      if (!container || !popup) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const pw = popup.offsetWidth;
      const ph = popup.offsetHeight;
      const dotX = (anchorXPct / 100) * cw;
      const dotY = (anchorYPct / 100) * ch;

      let left = Math.min(Math.max(EDGE, dotX), Math.max(EDGE, cw - pw - EDGE));
      let top = dotY + GAP;
      if (top + ph > ch - EDGE) {
        const above = dotY - ph - GAP / 2;
        top = above >= EDGE ? above : top;
      }
      top = Math.min(Math.max(EDGE, top), Math.max(EDGE, ch - ph - EDGE));
      setPos({ left, top });
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchorXPct, anchorYPct, containerRef]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <button
      ref={popupRef}
      type="button"
      aria-label={`Shop ${brand} ${itemName}, ${formatPrice(priceCents, currency)}`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      style={{ left: pos ? `${pos.left}px` : '-9999px', top: pos ? `${pos.top}px` : '-9999px' }}
      className="absolute z-30 w-36 rounded-xl border border-zinc-200 bg-white/90 p-2 text-left text-zinc-900 shadow-xl backdrop-blur-md motion-safe:animate-fade-in-up"
    >
      <div className="flex items-center gap-1">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{brand}</span>
        {verified ? <BadgeCheck className="h-3 w-3 shrink-0 text-rose-600" aria-label="Verified" /> : null}
      </div>
      <div className="truncate text-xs text-zinc-900">{itemName}</div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatPrice(priceCents, currency)}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
      </div>
    </button>
  );
}
