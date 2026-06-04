import { useEffect } from 'react';
import { Sparkles, TriangleAlert, RefreshCw } from 'lucide-react';
import { usePollQueue } from './usePollQueue';
import { VoteCanvas } from './VoteCanvas';
import { prefetchImages } from '@/lib/prefetch';
import { Button } from '@/components/Button';

export function FeedScreen() {
  const { current, next, status, error, isEmpty, advance, reload } = usePollQueue();

  // Prefetch the next poll's images during the current poll (no flash on swap).
  useEffect(() => {
    if (next) prefetchImages([next.option_a_image_url, next.option_b_image_url]);
  }, [next]);

  if (status === 'loading') return <FeedSkeleton />;
  if (status === 'error') return <FeedMessage Icon={TriangleAlert} title="Couldn't load the feed" body={error ?? 'Please try again.'} onAction={reload} actionLabel="Retry" />;
  if (isEmpty) return <FeedMessage Icon={Sparkles} title="You're all caught up" body="You've voted on every look in the queue. Check back soon for fresh pairings." onAction={reload} actionLabel="Check again" />;
  if (!current) return <FeedSkeleton />; // brief top-up gap

  return (
    <div key={current.id} className="h-full w-full motion-safe:animate-fade-in">
      <VoteCanvas poll={current} onAdvance={advance} />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="relative flex h-full w-full bg-black">
      <div className="skeleton h-full w-1/2" />
      <div className="skeleton h-full w-1/2" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-zinc-900/80 font-serif text-xl italic text-zinc-300">
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Icon className="h-6 w-6 text-rose-400" aria-hidden />
      </div>
      <div>
        <h2 className="font-serif text-2xl text-zinc-50">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      </div>
      <Button variant="outline" onClick={onAction} className="mt-2">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {actionLabel}
      </Button>
    </div>
  );
}
