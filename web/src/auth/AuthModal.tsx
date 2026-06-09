import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from './useAuth';
import { ApiError } from '@/api/client';

type Mode = 'login' | 'signup';

export function AuthModal({
  reason,
  onClose,
  onSuccess,
}: {
  reason?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    if (!username.trim() || !password) {
      setError('Enter a username and password');
      return;
    }
    setPending(true);
    try {
      if (isLogin) await login(username.trim(), password);
      else await register(username.trim(), password, displayName);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setPending(false);
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? 'Log in' : 'Create account'}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Wordmark className="text-3xl" />
            <p className="mt-1 text-sm text-zinc-500">{reason ?? 'Join to publish and shop your looks.'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            ref={firstFieldRef}
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="your_handle"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
          />
          {!isLogin ? (
            <Input
              label="Display name"
              name="display_name"
              autoComplete="nickname"
              placeholder="Optional"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={pending}
            />
          ) : null}
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />

          <div className="min-h-[1.25rem]" aria-live="assertive">
            {error ? (
              <p role="alert" className="text-sm text-rose-600">
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" pending={pending} className="w-full">
            {isLogin ? 'Log In' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {isLogin ? 'New to FIP?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'login' ? 'signup' : 'login'));
              setError(null);
            }}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>

        <div className="mt-4 border-t border-zinc-200 pt-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-zinc-400">Try a demo account</p>
          <div className="mt-2 flex justify-center gap-2">
            {(
              [
                ['demo', 'demo1234'],
                ['studio', 'studio1234'],
              ] as const
            ).map(([u, p]) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setUsername(u);
                  setPassword(p);
                }}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                {u} / {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
