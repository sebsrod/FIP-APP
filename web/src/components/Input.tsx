import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** Ultra-clean labeled input matching the design system. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-base text-zinc-900',
          'placeholder:text-zinc-400 transition-colors',
          'focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 focus:ring-offset-0',
          'disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
});
