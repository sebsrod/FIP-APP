import { useEffect, useState } from 'react';
import { AuthProvider } from '@/auth/AuthContext';
import { useAuth } from '@/auth/useAuth';
import { AuthModal } from '@/auth/AuthModal';
import { DeviceFrame } from '@/components/DeviceFrame';
import { TabBar, type Tab } from '@/components/TabBar';
import { Wordmark } from '@/components/Wordmark';
import { FeedScreen } from '@/features/feed/FeedScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { PollComposer } from '@/features/poll-composer/PollComposer';
import { SearchScreen } from '@/features/search/SearchScreen';

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <Wordmark className="animate-pulse text-5xl" />
    </div>
  );
}

function AppShell() {
  const { user, isGuest } = useAuth();
  const me = user?.username ?? '';

  const [tab, setTab] = useState<Tab>('poll');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  // Auth gating for publish/profile when browsing as a guest.
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);

  // If the session drops to a guest (e.g. after logout), leave gated tabs.
  useEffect(() => {
    if (isGuest && tab !== 'poll') setTab('poll');
  }, [isGuest, tab]);

  function navigate(t: Tab) {
    setSearchOpen(false);
    setViewingUsername(null);
    setTab(t);
  }

  function goTab(t: Tab) {
    if ((t === 'publish' || t === 'profile') && isGuest) {
      setPendingTab(t);
      setAuthReason(t === 'publish' ? 'Create an account to publish a poll.' : 'Log in to see your profile.');
      return;
    }
    navigate(t);
  }

  return (
    <div className="flex h-full flex-col">
      <main className="relative flex-1 overflow-hidden">
        {tab === 'poll' ? <FeedScreen onOpenSearch={() => setSearchOpen(true)} /> : null}
        {tab === 'publish' ? (
          <PollComposer onCancel={() => setTab('poll')} onCreated={() => setTab('profile')} />
        ) : null}
        {tab === 'profile' ? <ProfileScreen username={me} isMe onOpenSearch={() => setSearchOpen(true)} /> : null}

        {/* Foreign profile (from search) */}
        {viewingUsername ? (
          <div className="absolute inset-0 z-40">
            <ProfileScreen key={viewingUsername} username={viewingUsername} isMe={false} onBack={() => setViewingUsername(null)} />
          </div>
        ) : null}

        {/* Search */}
        {searchOpen ? (
          <SearchScreen
            onClose={() => setSearchOpen(false)}
            onSelectUser={(u) => {
              setSearchOpen(false);
              setViewingUsername(u);
            }}
          />
        ) : null}

        {/* Auth popup for guests */}
        {authReason !== null ? (
          <AuthModal
            reason={authReason}
            onClose={() => {
              setAuthReason(null);
              setPendingTab(null);
            }}
            onSuccess={() => {
              const t = pendingTab;
              setAuthReason(null);
              setPendingTab(null);
              if (t) navigate(t);
            }}
          />
        ) : null}
      </main>

      <TabBar active={tab} onChange={goTab} />
    </div>
  );
}

function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <Splash />;
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <DeviceFrame>
        <Gate />
      </DeviceFrame>
    </AuthProvider>
  );
}
