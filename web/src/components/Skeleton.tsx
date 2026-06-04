import { cn } from '@/lib/cn';

/** Shimmer placeholder (see .skeleton in styles/index.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden />;
}
