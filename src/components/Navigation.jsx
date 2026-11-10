import React from 'react';
import { Activity, Target, BarChart3, Users } from 'lucide-react';

export function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'match', label: 'Match Live', icon: Activity, badge: 'Direct' },
    { id: 'shoot', label: 'Shoot', icon: Target },
    { id: 'stats', label: 'Bilan', icon: BarChart3 },
    { id: 'profiles', label: 'Profils', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe select-none">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative active:scale-95 ${
                isActive
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
