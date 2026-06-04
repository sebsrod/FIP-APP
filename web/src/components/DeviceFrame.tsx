import type { ReactNode } from 'react';

/**
 * Centers the app in a premium "handset" frame on desktop, full-bleed on mobile.
 * zinc-950 page behind a near-black app surface.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-zinc-950">
      <div className="mx-auto flex h-full w-full max-w-frame flex-col overflow-hidden bg-zinc-900 no-overscroll sm:border-x sm:border-white/10 sm:shadow-2xl sm:shadow-black/60">
        {children}
      </div>
    </div>
  );
}
