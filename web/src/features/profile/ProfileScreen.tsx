import { useState } from 'react';
import { ArrowLeft, LogOut, Plus, Search, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useProfile } from './useProfile';
import { LookCard } from './LookCard';
import { PhotoComposer } from './PhotoComposer';
import { PollStoriesViewer } from './PollStoriesViewer';
import { Wordmark } from '@/components/Wordmark';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  username: string;
  isMe: boolean;
  onBack?: () => void;
  onOpenSearch?: () => void;
}

export function ProfileScreen({ username, isMe, onBack, onOpenSearch }: Props) {
  const { logout } = useAuth();
  const { profile, status, error, reload } = useProfile(username);
  const [composing, setComposing] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);

  const hasPolls = (profile?.polls.length ?? 0) > 0;

  return (
    <div className="relative h-full overflow-y-auto bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        {isMe ? (
          <>
            <Wordmark className="text-xl" />
            <div className="flex items-center gap-1 text-zinc-500">
              {onOpenSearch ? (
                <button type="button" onClick={onOpenSearch} aria-label="Search creators" className="rounded-full p-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                  <Search className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              <button type="button" onClick={() => setComposing(true)} aria-label="Publish a photo" className="rounded-full p-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                <Plus className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" onClick={logout} aria-label="Log out" className="rounded-full p-2 transition-colors hover:bg-zinc-100 hover:text-rose-600">
                <LogOut className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={onBack} aria-label="Back" className="-ml-1.5 rounded-full p-1.5 text-zinc-700 transition-colors hover:bg-zinc-100">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="truncate text-sm font-medium text-zinc-900">@{profile?.user.username ?? username}</span>
            <span className="w-8" aria-hidden />
          </>
        )}
      </div>

      {status === 'loading' ? (
        <ProfileSkeleton />
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3 px-10 py-20 text-center">
          <TriangleAlert className="h-7 w-7 text-zinc-400" aria-hidden />
          <p className="text-sm text-zinc-500">{error ?? 'Could not load this profile.'}</p>
        </div>
      ) : profile ? (
        <>
          <header className="flex flex-col items-center gap-3 px-6 py-7 text-center">
            {/* Avatar with story-ring when there are active polls */}
            <button
              type="button"
              onClick={() => hasPolls && setStoriesOpen(true)}
              aria-label={hasPolls ? 'View active polls' : profile.user.display_name}
              className={cn('rounded-full', hasPolls ? 'bg-rose-500 p-[3px]' : 'cursor-default')}
            >
              <div className={hasPolls ? 'rounded-full bg-white p-[2px]' : ''}>
                <Avatar url={profile.user.avatar_url} name={profile.user.display_name} size={80} />
              </div>
            </button>
            {hasPolls ? (
              <span className="-mt-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                {profile.polls.length} active poll{profile.polls.length > 1 ? 's' : ''}
              </span>
            ) : null}

            <div>
              <h1 className="font-serif text-2xl text-zinc-900">{profile.user.display_name}</h1>
              <p className="text-sm text-zinc-500">@{profile.user.username}</p>
            </div>
            <div className="flex items-center gap-6 text-center">
              <Stat value={formatCount(profile.user.followers_count)} label="Followers" />
              <Stat value={formatCount(profile.looks.length)} label="Photos" />
            </div>
            {profile.user.bio ? <p className="max-w-xs text-sm leading-relaxed text-zinc-600">{profile.user.bio}</p> : null}
          </header>

          {/* Vertical photo feed (not a grid) */}
          <section className="flex flex-col gap-6 pb-8">
            {profile.looks.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-zinc-400">
                {isMe ? 'No photos yet — tap + to publish your first.' : 'No photos yet.'}
              </p>
            ) : (
              profile.looks.map((look) => <LookCard key={look.id} look={look} />)
            )}
          </section>
        </>
      ) : null}

      {composing ? (
        <PhotoComposer
          onCancel={() => setComposing(false)}
          onPublished={() => {
            setComposing(false);
            void reload();
          }}
        />
      ) : null}

      {storiesOpen && profile && hasPolls ? (
        <PollStoriesViewer
          polls={profile.polls}
          displayName={profile.user.display_name}
          username={profile.user.username}
          avatarUrl={profile.user.avatar_url}
          isOwner={profile.is_owner}
          onClose={() => setStoriesOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums text-zinc-900">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
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
