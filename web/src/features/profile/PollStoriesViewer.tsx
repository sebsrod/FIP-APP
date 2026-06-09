import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ActivePoll, Side } from '@/api/types';
import { api } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { percentages } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface Props {
  polls: ActivePoll[];
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isOwner: boolean;
  onClose: () => void;
}

export function PollStoriesViewer({ polls, displayName, username, avatarUrl, isOwner, onClose }: Props) {
  const [items, setItems] = useState<ActivePoll[]>(polls);
  const [index, setIndex] = useState(0);
  const poll = items[index];
  if (!poll) return null;

  const showResults = isOwner || poll.voted_side !== null;

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(items.length - 1, i + delta)));
  }

  function vote(side: Side) {
    if (showResults) return;
    haptic(10);
    setItems((arr) =>
      arr.map((p, i) => {
        if (i !== index) return p;
        const a = p.option_a_votes + (side === 'A' ? 1 : 0);
        const b = p.option_b_votes + (side === 'B' ? 1 : 0);
        const { a_pct, b_pct } = percentages(a, b);
        return { ...p, option_a_votes: a, option_b_votes: b, a_pct, b_pct, voted_side: side };
      }),
    );
    api.polls
      .vote(poll.id, side)
      .then((r) =>
        setItems((arr) =>
          arr.map((p, i) =>
            i === index
              ? { ...p, option_a_votes: r.a_votes, option_b_votes: r.b_votes, a_pct: r.a_pct, b_pct: r.b_pct, voted_side: side }
              : p,
          ),
        ),
      )
      .catch(() => {});
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Progress segments */}
      <div className="flex gap-1 px-3 pt-3">
        {items.map((p, i) => (
          <div key={p.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className={cn('h-full bg-white transition-all', i <= index ? 'w-full' : 'w-0')} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar url={avatarUrl} name={displayName} size={32} />
          <div className="leading-tight">
            <div className="text-sm font-medium text-white">{displayName}</div>
            <div className="text-[11px] text-white/60">@{username}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Poll */}
      <div className="relative flex flex-1 overflow-hidden">
        {(['A', 'B'] as Side[]).map((side) => {
          const img = side === 'A' ? poll.option_a_image_url : poll.option_b_image_url;
          const pct = side === 'A' ? poll.a_pct : poll.b_pct;
          const isWinner = showResults && (side === 'A' ? poll.a_pct >= poll.b_pct : poll.b_pct > poll.a_pct);
          return (
            <button
              key={side}
              type="button"
              onClick={() => vote(side)}
              disabled={showResults}
              aria-label={`Vote for look ${side}`}
              className="relative h-full w-1/2"
            >
              <ImageWithFallback
                src={img}
                alt={`Look ${side}`}
                eager
                className="h-full w-full"
                imgClassName={showResults && !isWinner ? 'grayscale brightness-110 contrast-125' : undefined}
              />
              {showResults ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl bg-white/85 px-4 py-2 text-center shadow">
                    <div className={cn('text-4xl font-semibold tabular-nums leading-none', isWinner ? 'text-zinc-900' : 'text-zinc-400')}>{pct}%</div>
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}

        {/* center badge */}
        {!showResults ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/40 font-serif text-lg italic text-white backdrop-blur">or</span>
          </div>
        ) : null}

        {/* nav */}
        {index > 0 ? (
          <button type="button" onClick={() => go(-1)} aria-label="Previous" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {index < items.length - 1 ? (
          <button type="button" onClick={() => go(1)} aria-label="Next" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* footer: caption + tally */}
      <div className="px-4 py-4 text-center">
        {poll.caption ? <p className="font-serif text-base italic text-white">{poll.caption}</p> : null}
        <p className="mt-1 text-xs text-white/60 tabular-nums">
          {(poll.option_a_votes + poll.option_b_votes).toLocaleString()} votes
          {isOwner ? ' · tap arrows to review each poll' : poll.voted_side ? ' · thanks for voting' : ' · tap a side to vote'}
        </p>
      </div>
    </div>
  );
}
