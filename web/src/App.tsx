import { useState } from 'react';
import { AuthProvider } from '@/auth/AuthContext';
import { useAuth } from '@/auth/useAuth';
import { AuthScreen } from '@/auth/AuthScreen';
import { DeviceFrame } from '@/components/DeviceFrame';
import { TabBar, type Tab } from '@/components/TabBar';
import { Wordmark } from '@/components/Wordmark';
import { FeedScreen } from '@/features/feed/FeedScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { PublishScreen } from '@/features/publish/PublishScreen';
import { SearchScreen } from '@/features/search/SearchScreen';

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <Wordmark className="animate-pulse text-5xl" />
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const me = user?.username ?? '';

  const [tab, setTab] = useState<Tab>('feed');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  function goTab(t: Tab) {
    setSearchOpen(false);
    setViewingUsername(null);
    setTab(t);
  }

  return (
    <div className="flex h-full flex-col">
      <main className="relative flex-1 overflow-hidden">
        {tab === 'feed' ? <FeedScreen onOpenSearch={() => setSearchOpen(true)} /> : null}
        {tab === 'publish' ? (
          <PublishScreen onPublished={() => setTab('profile')} onCancel={() => setTab('feed')} />
        ) : null}
        {tab === 'profile' ? (
          <ProfileScreen username={me} isMe onOpenSearch={() => setSearchOpen(true)} />
        ) : null}

        {/* Foreign profile overlay (from search) */}
        {viewingUsername ? (
          <div className="absolute inset-0 z-40">
            <ProfileScreen
              key={viewingUsername}
              username={viewingUsername}
              isMe={false}
              onBack={() => setViewingUsername(null)}
            />
          </div>
        ) : null}

        {/* Search overlay */}
        {searchOpen ? (
          <SearchScreen
            onClose={() => setSearchOpen(false)}
            onSelectUser={(u) => {
              setSearchOpen(false);
              setViewingUsername(u);
            }}
          />
        ) : null}
      </main>

      <TabBar active={tab} onChange={goTab} />
    </div>
  );
}

/** Auth gate: everything past here requires a valid session. */
function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <Splash />;
  if (status === 'anon') return <AuthScreen />;
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
