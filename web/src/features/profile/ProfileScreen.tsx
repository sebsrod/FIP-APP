import { useState } from 'react';
import { LogOut, Plus, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useProfile } from './useProfile';
import { LookCard } from './LookCard';
import { PublishModal } from './PublishModal';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { formatCount } from '@/lib/format';

function Avatar({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  if (!url || failed) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 font-serif text-2xl italic text-zinc-300">
        {initial}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      className="h-20 w-20 rounded-full border border-white/10 bg-zinc-800 object-cover"
    />
  );
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, status, error, addLook } = useProfile(user?.username ?? null);
  const [publishing, setPublishing] = useState(false);

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-4 py-3 backdrop-blur">
        <Wordmark className="text-xl" />
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </button>
      </div>

      {status === 'loading' ? (
        <ProfileSkeleton />
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3 px-10 py-20 text-center">
          <TriangleAlert className="h-7 w-7 text-rose-400" aria-hidden />
          <p className="text-sm text-zinc-400">{error ?? 'Could not load your profile.'}</p>
        </div>
      ) : profile ? (
        <>
          {/* Header */}
          <header className="flex flex-col items-center gap-3 px-6 py-7 text-center">
            <Avatar url={profile.user.avatar_url} name={profile.user.display_name} />
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
            <Button onClick={() => setPublishing(true)} className="mt-2 w-full max-w-xs">
              <Plus className="h-4 w-4" aria-hidden />
              Publish New Look
            </Button>
          </header>

          {/* Magazine feed */}
          <section className="flex flex-col gap-6 pb-8">
            {profile.looks.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">
                No looks yet — publish your first to start your lookbook.
              </p>
            ) : (
              profile.looks.map((look) => <LookCard key={look.id} look={look} />)
            )}
          </section>
        </>
      ) : null}

      {publishing ? (
        <PublishModal
          onClose={() => setPublishing(false)}
          onPublished={(look) => {
            addLook(look);
            setPublishing(false);
          }}
        />
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
      <Skeleton className="mt-2 h-10 w-full max-w-xs rounded-lg" />
      <div className="mt-6 w-full">
        <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      </div>
    </div>
  );
}
