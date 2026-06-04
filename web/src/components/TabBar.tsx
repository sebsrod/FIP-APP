import { Shirt, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Tab = 'feed' | 'profile';

const TABS: { id: Tab; label: string; Icon: typeof Shirt }[] = [
  { id: 'feed', label: 'Feed', Icon: Shirt },
  { id: 'profile', label: 'Profile', Icon: UserRound },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="shrink-0 border-t border-white/10 bg-zinc-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <div className="flex items-stretch">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium tracking-wide transition-colors',
                isActive ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
