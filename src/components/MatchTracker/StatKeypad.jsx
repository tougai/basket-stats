import React from 'react';
import { RotateCcw, Award, Shield, Zap, Target } from 'lucide-react';

export function StatKeypad({ stats, onIncrement, onDecrement, onUndo, canUndo, lastActionText }) {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  };

  const handleAction = (key, label, delta = 1) => {
    triggerHaptic();
    onIncrement(key, label, delta);
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* 1. SECTION TIRS & POINTS */}
      <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
            🏀 Points & Tirs Réussis
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            Total : <span className="text-orange-400 font-extrabold text-sm">{stats.points} pts</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* 2 Points */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('pts2Made', '+2 PT')}
              className="w-full py-3.5 bg-gradient-to-br from-amber-500 to-orange-600 active:scale-95 text-white font-black rounded-xl text-lg shadow-md shadow-orange-500/20 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">+2 PT</span>
              <span className="text-[10px] font-medium opacity-85 mt-0.5">Tir 2 pts</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('pts2Made')}
                disabled={stats.pts2Made <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-slate-200 text-base">{stats.pts2Made}</span>
            </div>
          </div>

          {/* 3 Points */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('pts3Made', '+3 PT')}
              className="w-full py-3.5 bg-gradient-to-br from-purple-500 to-indigo-600 active:scale-95 text-white font-black rounded-xl text-lg shadow-md shadow-purple-500/20 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">+3 PT</span>
              <span className="text-[10px] font-medium opacity-85 mt-0.5">Tir 3 pts</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('pts3Made')}
                disabled={stats.pts3Made <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-slate-200 text-base">{stats.pts3Made}</span>
            </div>
          </div>

          {/* 1 Lancers Francs */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('ftMade', '+1 LF')}
              className="w-full py-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 active:scale-95 text-white font-black rounded-xl text-lg shadow-md shadow-emerald-500/20 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">+1 LF</span>
              <span className="text-[10px] font-medium opacity-85 mt-0.5">Lancer Fr.</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('ftMade')}
                disabled={stats.ftMade <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-slate-200 text-base">{stats.ftMade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION ACTIONS DÉCISIVES (Pondération x2 dans le Quick Score) */}
      <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            ⚡ Actions Majeures (x2 Quick Score)
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Impact direct
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Passes décisives AST */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('ast', '+1 AST')}
              className="w-full py-3 bg-gradient-to-br from-cyan-600 to-blue-700 active:scale-95 text-white font-extrabold rounded-xl text-base shadow-md shadow-cyan-500/15 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">Passe Dé</span>
              <span className="text-[10px] font-medium opacity-80 mt-0.5">AST</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('ast')}
                disabled={stats.ast <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-cyan-300 text-base">{stats.ast}</span>
            </div>
          </div>

          {/* Interceptions STL */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('stl', '+1 STL')}
              className="w-full py-3 bg-gradient-to-br from-blue-600 to-indigo-700 active:scale-95 text-white font-extrabold rounded-xl text-base shadow-md shadow-blue-500/15 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">Interception</span>
              <span className="text-[10px] font-medium opacity-80 mt-0.5">STL</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('stl')}
                disabled={stats.stl <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-blue-300 text-base">{stats.stl}</span>
            </div>
          </div>

          {/* Contres / Défense DEF */}
          <div className="flex flex-col bg-slate-900/90 rounded-2xl p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('def', '+1 DEF')}
              className="w-full py-3 bg-gradient-to-br from-violet-600 to-purple-800 active:scale-95 text-white font-extrabold rounded-xl text-base shadow-md shadow-violet-500/15 flex flex-col items-center justify-center transition"
            >
              <span className="leading-none">Contre / Def</span>
              <span className="text-[10px] font-medium opacity-80 mt-0.5">DEF</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={() => onDecrement('def')}
                disabled={stats.def <= 0}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg font-bold flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <span className="font-mono font-black text-violet-300 text-base">{stats.def}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION REBONDS & FAUTES */}
      <div className="grid grid-cols-2 gap-3">
        {/* Rebonds Totaux */}
        <div className="bg-slate-850/80 border border-slate-750 p-3 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              🔄 Rebonds
            </span>
            <span className="text-[10px] text-slate-400">Total</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAction('reb', '+1 REB')}
              className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-emerald-700 active:scale-95 text-white font-black rounded-xl text-base shadow-md shadow-teal-500/15"
            >
              +1 Reb
            </button>
            <div className="flex flex-col items-center justify-center px-1">
              <span className="font-mono font-black text-xl text-teal-300">{stats.reb}</span>
              <button
                type="button"
                onClick={() => onDecrement('reb')}
                disabled={stats.reb <= 0}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 disabled:opacity-20 mt-0.5"
              >
                -1
              </button>
            </div>
          </div>
        </div>

        {/* Fautes Personnelles PF */}
        <div className={`p-3 rounded-3xl border transition-all ${
          stats.pf >= 5
            ? 'bg-red-950/40 border-red-500 shadow-md shadow-red-500/20'
            : stats.pf === 4
            ? 'bg-amber-950/30 border-amber-500'
            : 'bg-slate-850/80 border-slate-750'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${stats.pf >= 4 ? 'text-red-400' : 'text-slate-400'}`}>
              ⚠️ Fautes (PF)
            </span>
            {stats.pf >= 5 ? (
              <span className="text-[9px] font-black uppercase text-red-400 animate-pulse">5 fautes !</span>
            ) : (
              <span className="text-[10px] text-slate-400">{5 - stats.pf} restant{5 - stats.pf > 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAction('pf', '+1 Faute')}
              disabled={stats.pf >= 5}
              className={`flex-1 py-3 active:scale-95 text-white font-black rounded-xl text-base shadow-md transition ${
                stats.pf >= 4
                  ? 'bg-gradient-to-br from-red-600 to-rose-700 shadow-red-500/25'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-900/30 hover:bg-slate-700'
              } disabled:opacity-40`}
            >
              +1 Faute
            </button>
            <div className="flex flex-col items-center justify-center px-1">
              <span className={`font-mono font-black text-xl ${stats.pf >= 4 ? 'text-red-400' : 'text-slate-200'}`}>
                {stats.pf}
              </span>
              <button
                type="button"
                onClick={() => onDecrement('pf')}
                disabled={stats.pf <= 0}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 disabled:opacity-20 mt-0.5"
              >
                -1
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOUTON ANNULER (UNDO) */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-800/90 hover:bg-slate-750 disabled:opacity-30 text-slate-300 disabled:text-slate-500 rounded-xl text-xs font-semibold border border-slate-700/80 active:scale-95 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Annuler dernière action</span>
        </button>

        {lastActionText && (
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[170px]">
            Dernier : <span className="text-orange-400 font-bold">{lastActionText}</span>
          </span>
        )}
      </div>
    </div>
  );
}
