/**
 * Global 401 hook. The API client calls this when a protected route rejects an
 * expired/invalid session, so the app can drop local auth state and return to
 * the auth screen instead of crashing.
 */
let handler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  handler = fn;
}

export function notifyUnauthorized(): void {
  handler?.();
}
