import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  src: string;
  alt: string;
  /** Classes for the wrapper box (sizing/positioning). */
  className?: string;
  /** Classes for the <img> itself (e.g. the post-vote high-key filter). */
  imgClassName?: string;
  /** Eager for above-the-fold vote canvas; lazy for profile feed. */
  eager?: boolean;
}

/** <img> with a skeleton while loading and a graceful fallback on error. */
export function ImageWithFallback({ src, alt, className, imgClassName, eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center bg-zinc-200', className)} role="img" aria-label={alt}>
        <ImageOff className="h-6 w-6 text-zinc-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-zinc-200', className)}>
      {!loaded ? <div className="skeleton absolute inset-0" aria-hidden /> : null}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full select-none object-cover motion-safe:transition motion-safe:duration-200 motion-safe:ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  );
}
