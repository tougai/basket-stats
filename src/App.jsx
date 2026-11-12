import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MatchTracker } from './components/MatchTracker/MatchTracker';
import { ShootingTracker } from './components/ShootingTracker/ShootingTracker';
import { StatsDashboard } from './components/StatsDashboard/StatsDashboard';
import { ProgressionCharts } from './components/Progression/ProgressionCharts';
import { ProfileManager } from './components/Profiles/ProfileManager';
import { WelcomeOnboarding } from './components/Welcome/WelcomeOnboarding';

function MainApp() {
  const { players, toastMessage } = useApp();
  const [activeTab, setActiveTab] = useState('match');

  const hasPlayers = players && players.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification globale */}
      {toastMessage && (
        <div
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-orange-500/60 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <Header
        isWelcomeMode={!hasPlayers}
        onOpenProfileModal={() => setActiveTab('profiles')}
      />

      {/* Contenu principal */}
      <main className="flex-1 px-3 sm:px-4 pt-3.5 pb-28 max-w-md w-full mx-auto animate-in fade-in duration-200">
        {!hasPlayers ? (
          <WelcomeOnboarding />
        ) : (
          <>
            {activeTab === 'match' && (
              <MatchTracker onNavigateToStats={() => setActiveTab('stats')} />
            )}
            {activeTab === 'shoot' && (
              <ShootingTracker />
            )}
            {activeTab === 'stats' && (
              <StatsDashboard onNavigateToProgression={() => setActiveTab('progression')} />
            )}
            {activeTab === 'progression' && (
              <ProgressionCharts onNavigateToMatch={() => setActiveTab('match')} />
            )}
            {activeTab === 'profiles' && (
              <ProfileManager />
            )}
          </>
        )}
      </main>

      {/* Barre de navigation basse pour smartphone (masquée si aucun joueur créé) */}
      {hasPlayers && (
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
