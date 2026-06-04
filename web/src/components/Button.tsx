import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  pending?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 disabled:hover:bg-rose-600',
  outline:
    'border border-white/15 bg-transparent text-zinc-100 hover:bg-white/5',
  ghost: 'bg-transparent text-zinc-300 hover:text-white hover:bg-white/5',
};

export function Button({
  variant = 'primary',
  pending = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
        'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || pending}
      {...props}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
