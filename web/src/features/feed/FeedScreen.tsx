import { useEffect } from 'react';
import { Search, Sparkles, TriangleAlert, RefreshCw } from 'lucide-react';
import { usePollQueue } from './usePollQueue';
import { VoteCanvas } from './VoteCanvas';
import { prefetchImages } from '@/lib/prefetch';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';

export function FeedScreen({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { current, next, status, error, isEmpty, advance, reload } = usePollQueue();

  useEffect(() => {
    if (next) prefetchImages([next.option_a_image_url, next.option_b_image_url]);
  }, [next]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Wordmark className="text-xl" />
        {onOpenSearch ? (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search creators"
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="relative flex-1 overflow-hidden">
        {status === 'loading' ? (
          <FeedSkeleton />
        ) : status === 'error' ? (
          <FeedMessage Icon={TriangleAlert} title="Couldn't load polls" body={error ?? 'Please try again.'} onAction={reload} actionLabel="Retry" />
        ) : isEmpty ? (
          <FeedMessage Icon={Sparkles} title="You're all caught up" body="You've voted on every poll for now. Check back soon for fresh pairings." onAction={reload} actionLabel="Check again" />
        ) : !current ? (
          <FeedSkeleton />
        ) : (
          <div key={current.id} className="h-full w-full motion-safe:animate-fade-in">
            <VoteCanvas poll={current} onAdvance={advance} />
          </div>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="relative flex h-full w-full bg-white">
      <div className="skeleton h-full w-1/2" />
      <div className="skeleton h-full w-1/2" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white/90 font-serif text-xl italic text-zinc-400">
          or
        </span>
      </div>
    </div>
  );
}

function FeedMessage({
  Icon,
  title,
  body,
  onAction,
  actionLabel,
}: {
  Icon: typeof Sparkles;
  title: string;
  body: string;
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
        <Icon className="h-6 w-6 text-zinc-400" aria-hidden />
      </div>
      <div>
        <h2 className="font-serif text-2xl text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
      </div>
      <Button variant="outline" onClick={onAction} className="mt-2">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {actionLabel}
      </Button>
    </div>
  );
}
