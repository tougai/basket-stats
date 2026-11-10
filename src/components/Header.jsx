import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, ChevronDown, Check, WifiOff } from 'lucide-react';

export function Header({ onOpenProfileModal }) {
  const { players, activePlayer, setActivePlayerId, currentSeason, setCurrentSeason } = useApp();
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Titre */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-lg">
            🏀
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
              Basket Stats
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-400">
                Mode Hors-ligne
              </span>
            </div>
          </div>
        </div>

        {/* Sélecteur de joueur (Fratries) & Saison */}
        <div className="flex items-center gap-2">
          {/* Menu déroulant Fratries */}
          <div className="relative">
            <button
              onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-full py-1.5 px-3 transition active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-[10px] font-bold text-white">
                {activePlayer.name?.[0]?.toUpperCase() || 'J'}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[75px] truncate">
                {activePlayer.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Menu Joueurs */}
            {showPlayerDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowPlayerDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-850 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Changer de joueur (Fratries)
                  </div>
                  <div className="space-y-1">
                    {players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePlayerId(p.id);
                          setShowPlayerDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition ${
                          p.id === activePlayer.id
                            ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-slate-750 flex items-center justify-center font-bold text-[11px] text-white">
                            #{p.jerseyNumber || '?'}
                          </div>
                          <div className="text-left truncate">
                            <div className="truncate font-semibold">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.team || 'U15'}</div>
                          </div>
                        </div>
                        {p.id === activePlayer.id && (
                          <Check className="w-4 h-4 text-orange-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-750 mt-1.5 pt-1.5">
                    <button
                      onClick={() => {
                        setShowPlayerDropdown(false);
                        onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-orange-400 hover:bg-orange-500/10 transition font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Ajouter un joueur (Fratrie)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
