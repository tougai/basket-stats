import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MatchTracker } from './components/MatchTracker/MatchTracker';
import { ShootingTracker } from './components/ShootingTracker/ShootingTracker';
import { StatsDashboard } from './components/StatsDashboard/StatsDashboard';
import { ProfileManager } from './components/Profiles/ProfileManager';

function MainApp() {
  const [activeTab, setActiveTab] = useState('match');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* En-tête avec sélecteur de fratries */}
      <Header onOpenProfileModal={() => setActiveTab('profiles')} />

      {/* Contenu principal de l'onglet actif */}
      <main className="flex-1 px-3 sm:px-4 pt-3.5 pb-20 max-w-md w-full mx-auto animate-in fade-in duration-200">
        {activeTab === 'match' && (
          <MatchTracker onNavigateToStats={() => setActiveTab('stats')} />
        )}
        {activeTab === 'shoot' && (
          <ShootingTracker />
        )}
        {activeTab === 'stats' && (
          <StatsDashboard />
        )}
        {activeTab === 'profiles' && (
          <ProfileManager />
        )}
      </main>

      {/* Barre de navigation basse pour smartphone */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
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
