import { ArrowLeft, LogOut, Search, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useProfile } from './useProfile';
import { LookCard } from './LookCard';
import { Wordmark } from '@/components/Wordmark';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import { formatCount } from '@/lib/format';

interface Props {
  username: string;
  isMe: boolean;
  onBack?: () => void;
  onOpenSearch?: () => void;
}

export function ProfileScreen({ username, isMe, onBack, onOpenSearch }: Props) {
  const { logout } = useAuth();
  const { profile, status, error } = useProfile(username);

  return (
    <div className="relative h-full overflow-y-auto bg-zinc-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-4 py-3 backdrop-blur">
        {isMe ? (
          <>
            <Wordmark className="text-xl" />
            <div className="flex items-center gap-1">
              {onOpenSearch ? (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  aria-label="Search creators"
                  className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/5"
                >
                  <Search className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="-ml-1.5 inline-flex items-center gap-1 rounded-full p-1.5 text-zinc-200 transition-colors hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="truncate text-sm font-medium text-zinc-200">@{profile?.user.username ?? username}</span>
            <span className="w-8" aria-hidden />
          </>
        )}
      </div>

      {status === 'loading' ? (
        <ProfileSkeleton />
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3 px-10 py-20 text-center">
          <TriangleAlert className="h-7 w-7 text-rose-400" aria-hidden />
          <p className="text-sm text-zinc-400">{error ?? 'Could not load this profile.'}</p>
        </div>
      ) : profile ? (
        <>
          {/* Header */}
          <header className="flex flex-col items-center gap-3 px-6 py-7 text-center">
            <Avatar url={profile.user.avatar_url} name={profile.user.display_name} size={80} />
            <div>
              <h1 className="font-serif text-2xl text-zinc-50">{profile.user.display_name}</h1>
              <p className="text-sm text-zinc-500">@{profile.user.username}</p>
            </div>
            <div className="flex items-center gap-6 text-center">
              <Stat value={formatCount(profile.user.followers_count)} label="Followers" />
              <Stat value={formatCount(profile.looks.length)} label="Looks" />
            </div>
            {profile.user.bio ? (
              <p className="max-w-xs text-sm leading-relaxed text-zinc-300">{profile.user.bio}</p>
            ) : null}
            {isMe ? (
              <p className="mt-1 text-xs text-zinc-500">Tap the ✛ below to publish a new look.</p>
            ) : null}
          </header>

          {/* Magazine feed */}
          <section className="flex flex-col gap-6 pb-8">
            {profile.looks.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">
                {isMe
                  ? 'No looks yet — publish your first to start your lookbook.'
                  : 'This creator hasn’t published any looks yet.'}
              </p>
            ) : (
              profile.looks.map((look) => <LookCard key={look.id} look={look} />)
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums text-zinc-50">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-7">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-24" />
      <div className="mt-6 w-full">
        <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      </div>
    </div>
  );
}
