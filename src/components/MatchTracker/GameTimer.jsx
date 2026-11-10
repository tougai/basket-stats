import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Clock } from 'lucide-react';

export function GameTimer({ timerSeconds, setTimerSeconds, isRunning, setIsRunning }) {
  // Intervalle pour faire défiler le chronomètre
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, setTimerSeconds]);

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const adjustMinutes = (delta) => {
    setTimerSeconds(prev => Math.max(0, prev + (delta * 60)));
  };

  const handleReset = () => {
    if (timerSeconds > 0 && window.confirm('Remettre le chronomètre à zéro ?')) {
      setIsRunning(false);
      setTimerSeconds(0);
    }
  };

  return (
    <div className={`p-4 rounded-3xl border transition-all duration-200 select-none ${
      isRunning
        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
        : 'bg-slate-850/80 border-slate-750'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>Temps de présence terrain</span>
        </div>

        {/* Badge d'état */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
          isRunning
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
            : 'bg-slate-800 text-slate-400 border-slate-750'
        }`}>
          {isRunning ? '🟢 En jeu' : '⏸ Sur le banc'}
        </span>
      </div>

      {/* Affichage du temps digital */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white py-1">
          {formattedTime}
          <span className="text-xs font-normal text-slate-400 ml-2">
            ({minutes} min)
          </span>
        </div>

        {/* Bouton principal tactile En jeu / Banc */}
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`px-5 py-3.5 rounded-2xl font-black text-sm tracking-wide uppercase transition active:scale-95 shadow-md flex items-center gap-2 ${
            isRunning
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Banc</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Entrée</span>
            </>
          )}
        </button>
      </div>

      {/* Ajustements manuels rapides */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2.5 text-xs">
        <span className="text-slate-400 font-medium">Ajustement rapide :</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustMinutes(-1)}
            disabled={timerSeconds < 60}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 active:scale-95 rounded-lg text-slate-300 font-bold border border-slate-700 disabled:opacity-30"
          >
            -1 min
          </button>
          <button
            type="button"
            onClick={() => adjustMinutes(1)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 active:scale-95 rounded-lg text-slate-300 font-bold border border-slate-700"
          >
            +1 min
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 bg-slate-800/60 hover:bg-slate-750 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700/60 active:scale-95 ml-1"
            title="Remettre à zéro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
