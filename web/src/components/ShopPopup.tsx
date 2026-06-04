import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Props {
  brand: string;
  itemName: string;
  priceCents: number;
  currency: string;
  /** Dot position in the container's coordinate space, as percentages (0–100). */
  anchorXPct: number;
  anchorYPct: number;
  /** The positioned (relative) container the HUD lives inside. */
  containerRef: RefObject<HTMLElement | null>;
  onActivate: () => void;
  onClose: () => void;
}

const GAP = 20; // px below the dot, per spec: top = dot.top + 20px
const EDGE = 8; // keep this far from every frame edge

/**
 * Compact, anchored shopping HUD (not a sheet/modal). Anchors just below the
 * dot, left-aligned to it, and clamps/flips to stay fully inside the frame.
 */
export function ShopPopup({
  brand,
  itemName,
  priceCents,
  currency,
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

      // Left-aligned to the dot, then clamp horizontally.
      let left = dotX;
      left = Math.min(Math.max(EDGE, left), Math.max(EDGE, cw - pw - EDGE));

      // Below the dot; flip above if it would overflow the bottom.
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

  // Escape dismisses.
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
      style={{
        left: pos ? `${pos.left}px` : '-9999px',
        top: pos ? `${pos.top}px` : '-9999px',
      }}
      className="absolute z-30 w-32 rounded-xl border border-white/10 bg-black/75 p-2 text-left text-white shadow-xl backdrop-blur-md motion-safe:animate-fade-in-up"
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-300">{brand}</div>
      <div className="truncate text-xs text-white">{itemName}</div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-rose-400">
          {formatPrice(priceCents, currency)}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden />
      </div>
    </button>
  );
}
