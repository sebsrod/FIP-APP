import { cn } from '@/lib/cn';

/** The serif "FIP" wordmark — the editorial signature of the app. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-serif italic tracking-tight text-zinc-900', className)}>FIP</span>
  );
}
