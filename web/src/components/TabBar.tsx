import { Plus, Shirt, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Tab = 'feed' | 'publish' | 'profile';

function TabItem({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof Shirt;
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
        active ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
      {label}
    </button>
  );
}

/** Bottom tab bar: Feed · Publish (raised center action) · Profile. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="shrink-0 border-t border-white/10 bg-zinc-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <div className="flex items-center">
        <TabItem label="Feed" Icon={Shirt} active={active === 'feed'} onClick={() => onChange('feed')} />

        {/* Center: Publish New Look */}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => onChange('publish')}
            aria-label="Publish a new look"
            aria-current={active === 'publish' ? 'page' : undefined}
            className={cn(
              '-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-zinc-900 shadow-lg shadow-rose-950/40 transition-colors',
              active === 'publish' ? 'bg-rose-500' : 'bg-rose-600 hover:bg-rose-500',
            )}
          >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <TabItem
          label="Profile"
          Icon={UserRound}
          active={active === 'profile'}
          onClick={() => onChange('profile')}
        />
      </div>
    </nav>
  );
}
