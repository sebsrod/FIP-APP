import { useEffect, useRef, useState } from 'react';
import { SideCanvas } from './SideCanvas';
import { useVote } from './useVote';
import { ShopPopup } from '@/components/ShopPopup';
import { percentages } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { openAffiliate } from '@/lib/affiliate';
import type { Poll, Side, Tag, VoteResult } from '@/api/types';

const RESULT_HOLD_MS = 2000;

interface HudState {
  tag: Tag;
  xPct: number; // full-canvas coordinates
  yPct: number;
}

export function VoteCanvas({ poll, onAdvance }: { poll: Poll; onAdvance: () => void }) {
  const { submit } = useVote();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [voted, setVoted] = useState<Side | null>(null);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);

  // Reset everything for each new poll; clear the pending advance timer.
  useEffect(() => {
    setVoted(null);
    setResult(null);
    setHud(null);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll.id]);

  function handleVote(side: Side) {
    // Tapping the background while a HUD is open just dismisses it.
    if (hud) {
      setHud(null);
      return;
    }
    if (voted) return; // result window blocks re-votes

    setVoted(side);
    setHud(null);
    haptic(10);

    // Optimistic totals (server response replaces these).
    const a = poll.option_a_votes + (side === 'A' ? 1 : 0);
    const b = poll.option_b_votes + (side === 'B' ? 1 : 0);
    const { a_pct, b_pct } = percentages(a, b);
    setResult({ pollId: poll.id, a_votes: a, b_votes: b, a_pct, b_pct });

    submit(poll.id, side)
      .then((authoritative) => setResult(authoritative))
      .catch(() => {
        /* keep optimistic figures on network error */
      });

    // Exactly 2000ms from the tap, then advance to the prefetched next poll.
    timerRef.current = setTimeout(onAdvance, RESULT_HOLD_MS);
  }

  function openTag(side: Side, tag: Tag) {
    // Translate side-local coords into full-canvas coords for clamping.
    const xPct = side === 'A' ? tag.x_pct / 2 : 50 + tag.x_pct / 2;
    setHud({ tag, xPct, yPct: tag.y_pct });
  }

  const tagsA = poll.tags.filter((t) => t.side === 'A');
  const tagsB = poll.tags.filter((t) => t.side === 'B');
  const hasVoted = voted !== null;

  return (
    <div ref={containerRef} className="relative flex h-full w-full select-none bg-white">
      <SideCanvas
        side="A"
        imageUrl={poll.option_a_image_url}
        tags={tagsA}
        voted={hasVoted}
        isLoser={voted === 'B'}
        pct={result ? result.a_pct : null}
        votes={result ? result.a_votes : null}
        showDots={!hasVoted}
        onVote={() => handleVote('A')}
        onOpenTag={(t) => openTag('A', t)}
      />
      <SideCanvas
        side="B"
        imageUrl={poll.option_b_image_url}
        tags={tagsB}
        voted={hasVoted}
        isLoser={voted === 'A'}
        pct={result ? result.b_pct : null}
        votes={result ? result.b_votes : null}
        showDots={!hasVoted}
        onVote={() => handleVote('B')}
        onOpenTag={(t) => openTag('B', t)}
      />

      {/* Center "or" badge — vanishes immediately on vote */}
      {!hasVoted ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white/90 font-serif text-xl italic text-zinc-900 shadow-lg backdrop-blur">
            or
          </span>
        </div>
      ) : null}

      {/* Poll caption (context for the vote) */}
      {poll.caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
          <span className="max-w-[90%] truncate rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur">
            {poll.caption}
          </span>
        </div>
      ) : null}

      {/* Contextual shop HUD */}
      {hud ? (
        <ShopPopup
          brand={hud.tag.brand}
          itemName={hud.tag.item_name}
          priceCents={hud.tag.price_cents}
          currency={hud.tag.currency}
          verified={hud.tag.verified === 1}
          anchorXPct={hud.xPct}
          anchorYPct={hud.yPct}
          containerRef={containerRef}
          onActivate={() => {
            openAffiliate('poll_tag', hud.tag.id, hud.tag.affiliate_url);
            setHud(null);
          }}
          onClose={() => setHud(null)}
        />
      ) : null}

      {/* Screen-reader announcement of the split */}
      <div className="sr-only" aria-live="polite">
        {result ? `Look A ${result.a_pct} percent, Look B ${result.b_pct} percent` : ''}
      </div>
    </div>
  );
}
