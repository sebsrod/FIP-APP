import type { ReactNode } from 'react';

/**
 * Centers the app in a premium "handset" frame on desktop, full-bleed on mobile.
 * Light gray page behind a white app surface.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-frame flex-col overflow-hidden bg-white no-overscroll sm:border-x sm:border-zinc-200 sm:shadow-2xl sm:shadow-black/10">
        {children}
      </div>
    </div>
  );
}
