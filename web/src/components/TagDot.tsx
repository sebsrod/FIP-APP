import type { MouseEvent } from 'react';

interface Props {
  xPct: number;
  yPct: number;
  label: string;
  onOpen: () => void;
}

/**
 * Flat, solid crimson affiliate dot. Per spec: exactly
 *   w-2.5 h-2.5 bg-rose-600 rounded-full
 * No animation, pulse, glow, ring, border, or text. The `before:` pseudo only
 * enlarges the (invisible) tap target — it never changes the dot's appearance.
 */
export function TagDot({ xPct, yPct, label, onOpen }: Props) {
  const handle = (e: MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };
  return (
    <button
      type="button"
      aria-label={label}
      onClick={handle}
      className="absolute h-2.5 w-2.5 rounded-full bg-rose-600 before:absolute before:-inset-2.5 before:content-['']"
      style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
    />
  );
}
