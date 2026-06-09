import { ImageWithFallback } from '@/components/ImageWithFallback';
import { TagDot } from '@/components/TagDot';
import { cn } from '@/lib/cn';
import type { Side, Tag } from '@/api/types';

// Exact high-key studio look for the losing image (never muddy gray).
const LOSER_FILTER = 'grayscale brightness-110 contrast-125';

interface Props {
  side: Side;
  imageUrl: string;
  tags: Tag[];
  voted: boolean;
  isLoser: boolean;
  pct: number | null;
  votes: number | null;
  showDots: boolean;
  onVote: () => void;
  onOpenTag: (tag: Tag) => void;
}

export function SideCanvas({
  side,
  imageUrl,
  tags,
  voted,
  isLoser,
  pct,
  votes,
  showDots,
  onVote,
  onOpenTag,
}: Props) {
  return (
    <div className="relative h-full w-1/2 overflow-hidden">
      {/* Image layer */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={imageUrl}
          alt={`Look ${side}`}
          eager
          className="h-full w-full"
          imgClassName={isLoser ? LOSER_FILTER : undefined}
        />
      </div>

      {/* Transparent vote target (real button, paints above the image) */}
      <button
        type="button"
        aria-label={`Vote for look ${side}`}
        onClick={onVote}
        className="absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/40"
      />

      {/* Affiliate dots — visible only before voting, paint above the button */}
      {showDots
        ? tags.map((t) => (
            <TagDot
              key={t.id}
              xPct={t.x_pct}
              yPct={t.y_pct}
              label={`${t.brand} — ${t.item_name}`}
              onOpen={() => onOpenTag(t)}
            />
          ))
        : null}

      {/* Post-vote figure, centered with a subtle scrim for legibility */}
      {voted && pct !== null ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="rounded-2xl bg-white/80 px-4 py-2 text-center shadow-sm backdrop-blur-[2px]">
            <div
              className={cn(
                'font-sans text-5xl font-semibold tabular-nums leading-none',
                isLoser ? 'text-zinc-400' : 'text-zinc-900',
              )}
            >
              {pct}%
            </div>
            {votes !== null ? (
              <div className="mt-1 text-[11px] tabular-nums tracking-wide text-zinc-500">
                {votes.toLocaleString()} votes
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
