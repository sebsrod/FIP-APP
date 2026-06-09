import { Home, Plus, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Tab = 'poll' | 'publish' | 'profile';

function TabItem({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof Home;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide transition-colors',
        active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
      {label}
    </button>
  );
}

/** Bottom tab bar: Poll · (create) · Profile. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="shrink-0 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <div className="flex items-center">
        <TabItem label="Poll" Icon={Home} active={active === 'poll'} onClick={() => onChange('poll')} />

        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => onChange('publish')}
            aria-label="Create a poll"
            aria-current={active === 'publish' ? 'page' : undefined}
            className={cn(
              '-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-lg shadow-black/15 transition-colors',
              active === 'publish' ? 'bg-black' : 'bg-zinc-900 hover:bg-zinc-700',
            )}
          >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <TabItem label="Profile" Icon={UserRound} active={active === 'profile'} onClick={() => onChange('profile')} />
      </div>
    </nav>
  );
}
