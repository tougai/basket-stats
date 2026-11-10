import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchDetailModal } from './MatchDetailModal';
import { exportMatchesToExcel, exportBackupJSON } from '../../utils/exportExcel';
import {
  calculatePoints,
  calculateQuickScore,
  getCategory,
  parseResult
} from '../../utils/formulas';
import { Download, Trash2, Trophy, Clock, Target, Eye, Filter, Share2 } from 'lucide-react';

export function StatsDashboard() {
  const {
    activePlayer,
    activePlayerMatches,
    activePlayerWorkouts,
    deleteMatch,
    players,
    matches,
    workouts,
    seasons,
    addSeason,
    currentSeason
  } = useApp();

  // Liste de toutes les saisons disponibles (triées de la plus récente à la plus ancienne)
  const availableSeasons = Array.from(
    new Set([...(seasons || []), ...activePlayerMatches.map(m => m.season).filter(Boolean)])
  ).sort().reverse();

  if (availableSeasons.length === 0) {
    availableSeasons.push('2026-2027');
  }

  // Par défaut : la dernière saison (ou saison en cours)
  const [selectedSeason, setSelectedSeason] = useState(availableSeasons[0] || '2026-2027');
  const [selectedType, setSelectedType] = useState('ALL');
  const [inspectMatch, setInspectMatch] = useState(null);
  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [newSeasonInput, setNewSeasonInput] = useState('');

  // Filtrer les matchs selon la saison et le type
  const filteredMatches = activePlayerMatches.filter(m => {
    const seasonMatch = selectedSeason === 'ALL' || m.season === selectedSeason;
    const typeMatch = selectedType === 'ALL' || m.type === selectedType;
    return seasonMatch && typeMatch;
  });

  // Calcul des moyennes et KPI de saison
  const playedMatches = filteredMatches.filter(m => (m.minutes || 0) > 0 || (m.points || 0) > 0);
  const matchCount = playedMatches.length;

  let totalPts = 0;
  let totalQuickScore = 0;
  let totalMinutes = 0;
  let wins = 0;
  let losses = 0;

  playedMatches.forEach(m => {
    const pts = parseInt(m.points) || calculatePoints(m.pts2Made, m.pts3Made, m.ftMade);
    const qs = calculateQuickScore({ ...m, points: pts });
    totalPts += pts;
    totalQuickScore += qs;
    totalMinutes += (parseInt(m.minutes) || 0);

    const parsed = parseResult(m.result);
    if (parsed.isWin === true) wins++;
    if (parsed.isWin === false) losses++;
  });

  const avgPts = matchCount > 0 ? (totalPts / matchCount).toFixed(1) : '0';
  const avgQS = matchCount > 0 ? (totalQuickScore / matchCount).toFixed(1) : '0';
  const avgMin = matchCount > 0 ? (totalMinutes / matchCount).toFixed(1) : '0';
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  // Calcul de l'adresse moyenne aux shoots d'entraînement
  let totalShotsMade = 0;
  let totalShotsAttempted = 0;
  activePlayerWorkouts.forEach(w => {
    totalShotsMade += (w.made || 0);
    totalShotsAttempted += (w.total || 0);
  });
  const workoutAccuracy = totalShotsAttempted > 0
    ? (Math.round((totalShotsMade / totalShotsAttempted) * 1000) / 10).toFixed(1)
    : '0';

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto select-none">
      {/* 1. SÉLECTEUR DE SAISON & EXPORT */}
      <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Bilan Saison
            </span>
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full">
              {activePlayer.name}
            </span>
          </div>

          {/* Bouton Export Excel officiel */}
          <button
            type="button"
            onClick={() => exportMatchesToExcel(activePlayer, activePlayerMatches, activePlayerWorkouts)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>

        {/* Pilules de saisons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {availableSeasons.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSeason(s)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                selectedSeason === s
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSelectedSeason('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedSeason === 'ALL'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes
          </button>

          {/* Bouton ajouter une nouvelle saison */}
          <button
            type="button"
            onClick={() => setIsAddingSeason(true)}
            className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 flex items-center gap-1 whitespace-nowrap active:scale-95 transition"
            title="Créer une nouvelle saison"
          >
            <span>+</span>
            <span>Saison</span>
          </button>
        </div>

        {/* Input d'ajout d'une nouvelle saison */}
        {isAddingSeason && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-900 rounded-2xl border border-orange-500/40 animate-in fade-in duration-150">
            <input
              type="text"
              autoFocus
              placeholder="Ex: 2027-2028"
              value={newSeasonInput}
              onChange={(e) => setNewSeasonInput(e.target.value)}
              className="flex-1 bg-transparent text-xs font-bold text-white placeholder-slate-500 outline-none px-2"
            />
            <button
              type="button"
              onClick={() => {
                if (newSeasonInput.trim()) {
                  addSeason(newSeasonInput.trim());
                  setSelectedSeason(newSeasonInput.trim());
                  setNewSeasonInput('');
                  setIsAddingSeason(false);
                }
              }}
              className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold rounded-lg shadow-sm"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSeason(false);
                setNewSeasonInput('');
              }}
              className="text-xs text-slate-400 hover:text-white px-1.5"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* 2. GRILLE KPI MOYENNES DE SAISON */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Moyenne Points */}
        <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
          <div className="text-[10px] font-bold uppercase text-orange-400 tracking-wider">
            Moyenne Points / m
          </div>
          <div className="text-3xl font-black font-mono text-white mt-1">
            {avgPts} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total : {totalPts} pts ({matchCount} matchs)
          </div>
        </div>

        {/* Moyenne Quick Score */}
        <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
          <div className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
            Quick Score Moyen
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300 mt-1">
            {avgQS} <span className="text-xs font-normal text-slate-400">QS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Temps moyen : {avgMin} min/m
          </div>
        </div>

        {/* Ratio Victoires */}
        <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
          <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
            Victoires équipe
          </div>
          <div className="text-3xl font-black font-mono text-emerald-300 mt-1">
            {winRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {wins} victoires • {losses} défaites
          </div>
        </div>

        {/* Adresse aux shoots d'entraînement */}
        <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
          <div className="text-[10px] font-bold uppercase text-purple-400 tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>Adresse Shoots</span>
          </div>
          <div className="text-3xl font-black font-mono text-purple-300 mt-1">
            {workoutAccuracy}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalShotsMade}/{totalShotsAttempted} aux entraînements
          </div>
        </div>
      </div>

      {/* 3. LISTE DES MATCHS AVEC FILTRE */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Historique des Matchs
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredMatches.length}
            </span>
          </div>
        </div>

        {/* Liste */}
        <div className="space-y-2.5">
          {filteredMatches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Aucun match enregistré pour cette sélection.
            </p>
          ) : (
            filteredMatches.map(m => {
              const pts = parseInt(m.points) || calculatePoints(m.pts2Made, m.pts3Made, m.ftMade);
              const qs = calculateQuickScore({ ...m, points: pts });
              const cat = getCategory(qs, m.minutes);
              const parsed = parseResult(m.result);

              return (
                <div
                  key={m.id}
                  onClick={() => setInspectMatch(m)}
                  className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">
                        {m.opponent || 'Adversaire inconnu'}
                      </span>
                      {m.result && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          parsed.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {m.result}
                        </span>
                      )}
                    </div>

                    {/* Badge Catégorie */}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cat.badgeClass}`}>
                      {cat.emoji} {cat.label}
                    </span>
                  </div>

                  {/* Ligne des stats clés */}
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 font-extrabold font-mono">{pts} pts</span>
                      <span className="text-cyan-300 font-bold font-mono">{qs} QS</span>
                      <span className="text-teal-300 font-mono">{m.reb || 0} reb</span>
                      <span className="text-slate-400 font-mono">{m.minutes || 0} min</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{m.date}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer le match contre ${m.opponent} ?`)) {
                            deleteMatch(m.id);
                          }
                        }}
                        className="text-slate-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. SAUVEGARDE GLOBALE JSON */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => exportBackupJSON({ players, matches, workouts })}
          className="text-xs text-slate-400 hover:text-orange-400 transition font-medium"
        >
          💾 Télécharger une copie de sauvegarde complète (JSON)
        </button>
      </div>

      {/* MODAL DÉTAIL DU MATCH (21 COLONNES) */}
      {inspectMatch && (
        <MatchDetailModal
          match={inspectMatch}
          player={activePlayer}
          onClose={() => setInspectMatch(null)}
        />
      )}
    </div>
  );
}
