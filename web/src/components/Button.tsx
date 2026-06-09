import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  pending?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black disabled:hover:bg-zinc-900',
  outline: 'border border-zinc-300 bg-transparent text-zinc-900 hover:bg-zinc-100',
  ghost: 'bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
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
