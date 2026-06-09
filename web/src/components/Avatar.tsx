import { useState } from 'react';
import { cn } from '@/lib/cn';

/** Round avatar with a graceful initial fallback when the image is missing. */
export function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (!url || failed) {
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-serif italic text-zinc-500',
          className,
        )}
        aria-hidden
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-full border border-zinc-200 bg-zinc-200 object-cover', className)}
    />
  );
}
