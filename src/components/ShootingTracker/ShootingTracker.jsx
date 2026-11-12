import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateShootingAccuracy } from '../../utils/formulas';
import { Target, Flame, RotateCcw, Save, Trash2, Calendar, Clock, Award, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditWorkoutModal } from './EditWorkoutModal';

const DRILL_PRESETS = [
  { id: '3pt_tour', label: '3 Points (Tour 5 spots)', target: 50, icon: '🔥' },
  { id: '3pt_corner', label: '3 Points (Corners)', target: 25, icon: '🔥' },
  { id: '3pt_wing', label: '3 Points (Ailes 45°)', target: 25, icon: '🔥' },
  { id: '3pt_top', label: '3 Points (Axe)', target: 25, icon: '🔥' },
  { id: 'floater', label: 'Flotteurs (Floaters)', target: 30, icon: '💫' },
  { id: 'lf', label: 'Lancers Francs', target: 20, icon: '🎯' },
  { id: 'mid_corner', label: 'Mi-distance (Corners)', target: 25, icon: '🏹' },
  { id: 'mid_wing', label: 'Mi-distance (Ailes 45°)', target: 25, icon: '🏹' },
  { id: 'mid_top', label: 'Mi-distance (Tête de raquette)', target: 25, icon: '🏹' },
  { id: 'free', label: 'Série Libre', target: 50, icon: '🏀' },
];

export function ShootingTracker() {
  const { activePlayer, activePlayerWorkouts, saveWorkout, deleteWorkout } = useApp();

  // État de la séance en cours
  const [selectedDrill, setSelectedDrill] = useState(DRILL_PRESETS[0]);
  const [made, setMade] = useState(0);
  const [missed, setMissed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [historyStack, setHistoryStack] = useState([]); // pour Undo
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [notes, setNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const accuracy = calculateShootingAccuracy(made, missed);
  const totalShots = made + missed;

  const triggerHaptic = (type = 'success') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(type === 'success' ? 30 : 15);
    }
  };

  const handleMade = () => {
    triggerHaptic('success');
    setMade(prev => prev + 1);
    setStreak(prev => {
      const next = prev + 1;
      if (next > maxStreak) setMaxStreak(next);
      return next;
    });
    setHistoryStack(prev => [...prev, 'made']);
  };

  const handleMissed = () => {
    triggerHaptic('miss');
    setMissed(prev => prev + 1);
    setStreak(0);
    setHistoryStack(prev => [...prev, 'missed']);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));

    if (last === 'made') {
      setMade(prev => Math.max(0, prev - 1));
      setStreak(prev => Math.max(0, prev - 1));
    } else {
      setMissed(prev => Math.max(0, prev - 1));
    }
  };

  const handleResetSession = () => {
    if (totalShots > 0 && window.confirm('Réinitialiser la séance de shoot en cours ?')) {
      setMade(0);
      setMissed(0);
      setStreak(0);
      setMaxStreak(0);
      setHistoryStack([]);
      setSessionStartTime(Date.now());
      setNotes('');
    }
  };

  const handleSaveWorkout = () => {
    if (totalShots === 0) {
      alert('Veuillez comptabiliser au moins un tir avant d\'enregistrer.');
      return;
    }

    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));

    saveWorkout({
      title: selectedDrill.label,
      category: selectedDrill.id.includes('lf')
        ? 'Lancers Francs'
        : (selectedDrill.id.includes('3pt')
          ? '3 Points'
          : (selectedDrill.id.includes('floater')
            ? 'Flotteurs'
            : 'Mi-distance')),
      made,
      missed,
      total: totalShots,
      percentage: accuracy.percentage,
      durationMinutes,
      maxStreak,
      notes: notes.trim()
    });

    if (accuracy.percentage >= 70 && totalShots >= 10) {
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
    }

    alert(`✅ Séance de shoot enregistrée ! (${accuracy.percentage}% de réussite)`);

    // Reset
    setMade(0);
    setMissed(0);
    setStreak(0);
    setMaxStreak(0);
    setHistoryStack([]);
    setSessionStartTime(Date.now());
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto select-none">
      {/* 1. SÉLECTEUR D'ATELIER DE SHOOT */}
      <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
            🎯 Atelier de Shoot
          </span>
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-750">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-orange-500/20 flex items-center justify-center text-[9px] font-bold text-orange-400 shrink-0">
              {activePlayer.photoUrl ? (
                <img src={activePlayer.photoUrl} alt={activePlayer.name} className="w-full h-full object-cover" />
              ) : (
                activePlayer.name?.[0]?.toUpperCase() || 'J'
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-300">
              {activePlayer.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DRILL_PRESETS.map(drill => (
            <button
              key={drill.id}
              type="button"
              onClick={() => {
                if (totalShots === 0 || window.confirm('Changer d\'atelier et réinitialiser les compteurs ?')) {
                  setSelectedDrill(drill);
                  setMade(0);
                  setMissed(0);
                  setStreak(0);
                  setHistoryStack([]);
                  setSessionStartTime(Date.now());
                }
              }}
              className={`p-2.5 rounded-2xl text-left border transition active:scale-95 flex items-center gap-2 ${
                selectedDrill.id === drill.id
                  ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-base">{drill.icon}</span>
              <div className="truncate">
                <div className="text-xs font-semibold truncate leading-tight">{drill.label}</div>
                <div className="text-[10px] text-slate-400">Objectif: {drill.target} tirs</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. AFFICHAGE DU TAUX DE RÉUSSITE EN DIRECT */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-850 border border-slate-750 p-5 rounded-3xl text-center shadow-xl relative overflow-hidden">
        {/* Glow dynamique selon pourcentage */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
          accuracy.percentage >= 70 ? 'bg-emerald-500' : (accuracy.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500')
        }`} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Taux de Réussite Direct
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak} d'affilée</span>
            </span>
          )}
        </div>

        {/* GROS POURCENTAGE */}
        <div className="py-2">
          <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${accuracy.color}`}>
            {totalShots > 0 ? `${accuracy.percentage}%` : '0.0%'}
          </div>
          <div className="text-sm font-semibold text-slate-300 mt-1">
            <span className="text-emerald-400 font-black text-base">{made}</span> rentrés sur{' '}
            <span className="text-white font-bold">{totalShots}</span> tentés
          </div>
        </div>

        {/* BARRE DE PROGRESSION VISUELLE */}
        <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/80 mt-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              accuracy.percentage >= 70
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : accuracy.percentage >= 50
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-red-500 to-rose-400'
            }`}
            style={{ width: `${totalShots > 0 ? Math.min(100, accuracy.percentage) : 0}%` }}
          />
        </div>

        {/* Détails secondaires */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Réussis</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">{made}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Ratés</div>
            <div className="font-mono font-bold text-rose-400 text-sm">{missed}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Max Série</div>
            <div className="font-mono font-bold text-amber-400 text-sm">{maxStreak}</div>
          </div>
        </div>
      </div>

      {/* 3. DEUX GROS BOUTONS TACTILES (RÉUSSI / RATÉ) */}
      <div className="grid grid-cols-2 gap-3">
        {/* RATÉ */}
        <button
          type="button"
          onClick={handleMissed}
          className="py-7 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 active:scale-95 text-white font-black text-xl rounded-3xl shadow-lg shadow-red-600/30 flex flex-col items-center justify-center gap-1 transition"
        >
          <XCircle className="w-8 h-8" />
          <span className="tracking-wide uppercase">RATÉ</span>
        </button>

        {/* RÉUSSI */}
        <button
          type="button"
          onClick={handleMade}
          className="py-7 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 active:scale-95 text-white font-black text-xl rounded-3xl shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center gap-1 transition"
        >
          <CheckCircle2 className="w-8 h-8" />
          <span className="tracking-wide uppercase">RÉUSSI</span>
        </button>
      </div>

      {/* Annuler dernier tir */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyStack.length === 0}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-800/90 hover:bg-slate-750 disabled:opacity-30 text-slate-300 disabled:text-slate-500 rounded-xl text-xs font-semibold border border-slate-700/80 active:scale-95 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Annuler dernier tir</span>
        </button>

        <button
          type="button"
          onClick={handleResetSession}
          disabled={totalShots === 0}
          className="text-xs text-slate-400 hover:text-red-400 disabled:opacity-30 transition font-medium"
        >
          Réinitialiser
        </button>
      </div>

      {/* 4. COMMENTAIRE ET ENREGISTREMENT */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
            Remarques / Sensations (Optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: Bonne mécanique, tir fluide..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-slate-500 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveWorkout}
          disabled={totalShots === 0}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 active:scale-98 disabled:opacity-40 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer la Séance de Shoot</span>
        </button>
      </div>

      {/* 5. HISTORIQUE DES SÉANCES DU JOUEUR */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Historique des Shoots
            </span>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
              {activePlayerWorkouts.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            {showHistory ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-2 mt-2">
            {activePlayerWorkouts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Aucune séance enregistrée pour {activePlayer.name}.
              </p>
            ) : (
              activePlayerWorkouts.map(w => (
                <div
                  key={w.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{w.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{w.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {w.made}/{w.total} tirs rentrés
                        {w.durationMinutes ? ` • ${w.durationMinutes} min` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                        w.percentage >= 70
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : w.percentage >= 50
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        {w.percentage}%
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingWorkout(w)}
                        className="text-slate-500 hover:text-orange-400 p-1 transition"
                        title="Modifier cette séance"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Supprimer cette séance ?')) {
                            deleteWorkout(w.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 transition"
                        title="Supprimer cette séance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Répartition visuelle par Spot (Corner Droit -> Corner Gauche) */}
                  {Array.isArray(w.spots) && w.spots.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>🎯 5 Spots (Corner D $\rightarrow$ Corner G) :</span>
                        <span className="font-mono text-slate-500">2 tours / spot</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {w.spots.map((s, idx) => (
                          <div key={idx} className="bg-slate-850 p-1 rounded-xl border border-slate-800">
                            <div className="text-[8px] text-slate-400 truncate font-semibold" title={s.name}>
                              {s.name}
                            </div>
                            <div className="text-[10px] font-bold font-mono text-white mt-0.5">
                              {s.made}/{s.total}
                            </div>
                            <div className={`text-[8px] font-mono font-bold ${
                              s.pct >= 50 ? 'text-emerald-400' : s.pct >= 35 ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {s.pct}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes / Remarques (si pas de grille de spots ou si notes additionnelles) */}
                  {w.notes && (!Array.isArray(w.spots) || w.spots.length === 0) && (
                    <div className="text-[10px] text-slate-300 bg-slate-850/80 border border-slate-750 px-2.5 py-1 rounded-xl leading-relaxed whitespace-pre-line">
                      {w.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL MODIFICATION SÉANCE */}
      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
        />
      )}
    </div>
  );
}
