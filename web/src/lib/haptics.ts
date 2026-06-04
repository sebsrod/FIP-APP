/** Subtle haptic feedback on vote, where supported. */
export function haptic(ms = 10): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* no-op */
  }
}
