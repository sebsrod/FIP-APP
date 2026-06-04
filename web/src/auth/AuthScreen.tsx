import { useRef, useState, type FormEvent } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from './useAuth';
import { ApiError } from '@/api/client';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  const isLogin = mode === 'login';

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
  }

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
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName);
      }
      // On success the provider flips to "authed" and App swaps in the app.
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setPending(false);
    }
  }

  function fillDemo(u: string, p: string) {
    setMode('login');
    setError(null);
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        {/* Brand */}
        <header className="mb-10 text-center">
          <Wordmark className="text-5xl" />
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Two looks. One tap. <span className="text-zinc-200">Which look wins?</span>
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            ref={usernameRef}
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

          {/* Fixed-height error slot prevents layout jump when it appears. */}
          <div className="min-h-[1.25rem] px-0.5" aria-live="assertive">
            {error ? (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" pending={pending} className="w-full">
            {isLogin ? 'Log In' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {isLogin ? "New to FIP?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-rose-400 underline-offset-4 hover:underline"
          >
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>

      {/* Demo quick-fill — handy for first boot. */}
      <footer className="mt-8 border-t border-white/10 pt-5 text-center">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Try a demo account</p>
        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => fillDemo('demo', 'demo1234')}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/5"
          >
            demo / demo1234
          </button>
          <button
            type="button"
            onClick={() => fillDemo('studio', 'studio1234')}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/5"
          >
            studio / studio1234
          </button>
        </div>
      </footer>
    </div>
  );
}
