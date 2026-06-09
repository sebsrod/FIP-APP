import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, UserRound } from 'lucide-react';
import { useUserSearch } from './useUserSearch';
import { Avatar } from '@/components/Avatar';
import { formatCount } from '@/lib/format';

export function SearchScreen({
  onClose,
  onSelectUser,
}: {
  onClose: () => void;
  onSelectUser: (username: string) => void;
}) {
  const [query, setQuery] = useState('');
  const { results, status } = useUserSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-zinc-200 px-3 py-3">
        <button type="button" onClick={onClose} aria-label="Back" className="rounded-full p-2 text-zinc-700 transition-colors hover:bg-zinc-100">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators"
            aria-label="Search creators by name or username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-transparent text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {status === 'idle' ? (
          <Hint text="Find other creators by username or display name." />
        ) : status === 'loading' ? (
          <p className="px-5 py-6 text-sm text-zinc-400">Searching…</p>
        ) : status === 'error' ? (
          <p className="px-5 py-6 text-sm text-rose-600">Something went wrong. Try again.</p>
        ) : results.length === 0 ? (
          <Hint text={`No creators match “${query.trim()}”.`} />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {results.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(u.username)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  <Avatar url={u.avatar_url} name={u.display_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-900">{u.display_name}</div>
                    <div className="truncate text-xs text-zinc-400">@{u.username}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-zinc-400">
                    <span className="tabular-nums text-zinc-700">{formatCount(u.followers_count)}</span> followers
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-10 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
        <UserRound className="h-5 w-5 text-zinc-400" aria-hidden />
      </div>
      <p className="text-sm text-zinc-400">{text}</p>
    </div>
  );
}
