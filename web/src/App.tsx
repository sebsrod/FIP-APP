import { useState } from 'react';
import { AuthProvider } from '@/auth/AuthContext';
import { useAuth } from '@/auth/useAuth';
import { AuthScreen } from '@/auth/AuthScreen';
import { DeviceFrame } from '@/components/DeviceFrame';
import { TabBar, type Tab } from '@/components/TabBar';
import { Wordmark } from '@/components/Wordmark';
import { FeedScreen } from '@/features/feed/FeedScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <Wordmark className="animate-pulse text-5xl" />
    </div>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('feed');
  return (
    <div className="flex h-full flex-col">
      <main className="relative flex-1 overflow-hidden">
        {tab === 'feed' ? <FeedScreen /> : <ProfileScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
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
