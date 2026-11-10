import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GameTimer } from './GameTimer';
import { StatKeypad } from './StatKeypad';
import { LiveSummaryBar } from './LiveSummaryBar';
import { MatchSuccessModal } from './MatchSuccessModal';
import { calculatePoints, calculateQuickScore, calculateEfficiency, calculateValeurAjoutee } from '../../utils/formulas';
import { Save, Calendar, Shield, Swords, Plus, RotateCcw, Award } from 'lucide-react';

const DEFAULT_MATCH_TYPES = [
  'brassages region',
  'saison reg (dom)',
  'saison reg (ext)',
  'championnat R2',
  'match amical',
  'playoffs',
  'tournoi'
];

export function MatchTracker({ onNavigateToStats }) {
  const { activePlayer, currentSeason, saveMatch, matchDraft, setMatchDraft } = useApp();

  // Initialisation à partir du brouillon ou valeurs par défaut
  const [matchData, setMatchData] = useState(() => {
    if (matchDraft && matchDraft.playerId === activePlayer.id) {
      return matchDraft;
    }
    return {
      date: new Date().toISOString().slice(0, 10),
      season: currentSeason,
      type: 'saison reg (dom)',
      opponent: '',
      teamScore: '',
      oppScore: '',
      matchDuration: 40,
      pts2Made: 0,
      pts3Made: 0,
      ftMade: 0,
      reb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      def: 0,
      pf: 0,
      timerSeconds: 0,
      isTimerRunning: false,
      undoStack: []
    };
  });

  const [savedMatchSummary, setSavedMatchSummary] = useState(null);
  const [customTypePrompt, setCustomTypePrompt] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [matchTypes, setMatchTypes] = useState(DEFAULT_MATCH_TYPES);

  // Sauvegarder le brouillon dans le contexte à chaque modification
  useEffect(() => {
    setMatchDraft({
      ...matchData,
      playerId: activePlayer.id
    });
  }, [matchData, activePlayer.id, setMatchDraft]);

  // Synchronisation des points
  const points = calculatePoints(matchData.pts2Made, matchData.pts3Made, matchData.ftMade);
  const minutes = Math.floor((matchData.timerSeconds || 0) / 60);

  // Mise à jour d'un champ
  const updateField = (field, value) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  };

  // Actions de comptage avec pile d'annulation (Undo)
  const handleIncrement = (statKey, actionLabel, delta = 1) => {
    setMatchData(prev => {
      const prevVal = prev[statKey] || 0;
      const newVal = prevVal + delta;
      const newStack = [
        ...prev.undoStack,
        { statKey, delta, label: actionLabel, timestamp: Date.now() }
      ].slice(-15); // Garder les 15 dernières actions

      return {
        ...prev,
        [statKey]: newVal,
        undoStack: newStack
      };
    });
  };

  const handleDecrement = (statKey) => {
    setMatchData(prev => {
      const prevVal = prev[statKey] || 0;
      if (prevVal <= 0) return prev;
      return {
        ...prev,
        [statKey]: prevVal - 1
      };
    });
  };

  const handleUndo = () => {
    setMatchData(prev => {
      if (!prev.undoStack || prev.undoStack.length === 0) return prev;
      const stack = [...prev.undoStack];
      const lastAction = stack.pop();

      const currentVal = prev[lastAction.statKey] || 0;
      const revertedVal = Math.max(0, currentVal - lastAction.delta);

      return {
        ...prev,
        [lastAction.statKey]: revertedVal,
        undoStack: stack
      };
    });
  };

  const lastAction = matchData.undoStack?.[matchData.undoStack.length - 1];

  // Calcul du format de résultat (ex: "73-44 W")
  const teamScoreNum = parseInt(matchData.teamScore) || 0;
  const oppScoreNum = parseInt(matchData.oppScore) || 0;
  let formattedResult = '';
  if (teamScoreNum > 0 || oppScoreNum > 0) {
    const isW = teamScoreNum >= oppScoreNum;
    formattedResult = `${teamScoreNum}-${oppScoreNum} ${isW ? 'W' : 'L'}`;
  }

  // Enregistrer le match
  const handleSaveMatch = () => {
    if (!matchData.opponent.trim()) {
      alert('Veuillez renseigner le nom de l\'adversaire.');
      return;
    }

    const calculatedPts = calculatePoints(matchData.pts2Made, matchData.pts3Made, matchData.ftMade);
    const finalMinutes = minutes;

    const fullMatch = {
      date: matchData.date.split('-').reverse().join('/'),
      season: matchData.season || currentSeason,
      type: matchData.type,
      opponent: matchData.opponent.trim(),
      result: formattedResult || 'Score non renseigné',
      minutes: finalMinutes,
      points: calculatedPts,
      pts2Made: matchData.pts2Made,
      pts3Made: matchData.pts3Made,
      ftMade: matchData.ftMade,
      reb: matchData.reb,
      dreb: matchData.dreb || 0,
      ast: matchData.ast,
      stl: matchData.stl,
      def: matchData.def,
      pf: matchData.pf,
      matchDuration: matchData.matchDuration || 40
    };

    // Calculer les métriques
    fullMatch.quickScore = calculateQuickScore(fullMatch);
    fullMatch.efficiency = calculateEfficiency(fullMatch);
    fullMatch.valeurAjoutee = calculateValeurAjoutee(calculatedPts, teamScoreNum, finalMinutes, fullMatch.matchDuration);

    const saved = saveMatch(fullMatch);
    setSavedMatchSummary(saved);

    // Réinitialiser le formulaire
    setMatchData({
      date: new Date().toISOString().slice(0, 10),
      season: currentSeason,
      type: 'saison reg (dom)',
      opponent: '',
      teamScore: '',
      oppScore: '',
      matchDuration: 40,
      pts2Made: 0,
      pts3Made: 0,
      ftMade: 0,
      reb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      def: 0,
      pf: 0,
      timerSeconds: 0,
      isTimerRunning: false,
      undoStack: []
    });
  };

  const handleResetMatch = () => {
    if (window.confirm('Réinitialiser la feuille de match en cours ? Les compteurs seront remis à zéro.')) {
      setMatchData({
        date: new Date().toISOString().slice(0, 10),
        season: currentSeason,
        type: 'saison reg (dom)',
        opponent: '',
        teamScore: '',
        oppScore: '',
        matchDuration: 40,
        pts2Made: 0,
        pts3Made: 0,
        ftMade: 0,
        reb: 0,
        dreb: 0,
        ast: 0,
        stl: 0,
        def: 0,
        pf: 0,
        timerSeconds: 0,
        isTimerRunning: false,
        undoStack: []
      });
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      {/* 1. FICHE CONTEXTE DU MATCH */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Contexte du Match
            </span>
          </div>

          <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
            {activePlayer.name} (#{activePlayer.jerseyNumber || '?'})
          </span>
        </div>

        {/* Adversaire (Pleine largeur pour les noms longs) */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
            Adversaire *
          </label>
          <input
            type="text"
            placeholder="Ex: St Jory, Lavaur, Quinte Fontsgrive..."
            value={matchData.opponent}
            onChange={(e) => updateField('opponent', e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm font-semibold text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Date & Type de match (avec min-w-0 et overflow-hidden anti-débordement) */}
        <div className="grid grid-cols-2 gap-2.5 min-w-0">
          <div className="min-w-0 overflow-hidden">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 truncate">
              Date
            </label>
            <input
              type="date"
              value={matchData.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none transition"
            />
          </div>

          <div className="min-w-0 overflow-hidden">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 truncate">
              Type de match
            </label>
            <select
              value={matchData.type}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setCustomTypePrompt(true);
                } else {
                  updateField('type', e.target.value);
                }
              }}
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2 py-2 text-xs font-medium text-white outline-none truncate"
            >
              {matchTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__add_new__">+ Ajouter un type...</option>
            </select>
          </div>
        </div>

        {/* Format Match */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
            Format Match (Durée)
          </label>
          <select
            value={matchData.matchDuration}
            onChange={(e) => updateField('matchDuration', parseInt(e.target.value))}
            className="w-full min-w-0 bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2 text-xs font-medium text-white outline-none"
          >
            <option value={40}>40 min (Standard / 4x10 min)</option>
            <option value={32}>32 min (Jeunes U15/U13 / 4x8 min)</option>
            <option value={20}>20 min (Tournoi / 2x10 min)</option>
          </select>
        </div>

        {/* Formulaire ajout type personnalisé */}
        {customTypePrompt && (
          <div className="flex gap-2 p-2 bg-slate-900 rounded-xl border border-orange-500/30">
            <input
              type="text"
              placeholder="Nouveau type de match..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none px-2"
            />
            <button
              type="button"
              onClick={() => {
                if (newTypeName.trim()) {
                  setMatchTypes(prev => [...prev, newTypeName.trim()]);
                  updateField('type', newTypeName.trim());
                  setNewTypeName('');
                  setCustomTypePrompt(false);
                }
              }}
              className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg"
            >
              OK
            </button>
          </div>
        )}

        {/* Scores équipe & adversaire */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Score Final (pour Valeur Ajoutée & Résultat)
            </span>
            {formattedResult && (
              <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded ${
                teamScoreNum >= oppScoreNum ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {formattedResult}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Score Notre Équipe :</span>
              <input
                type="number"
                placeholder="Ex: 73"
                value={matchData.teamScore}
                onChange={(e) => updateField('teamScore', e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Score Adversaire :</span>
              <input
                type="number"
                placeholder="Ex: 44"
                value={matchData.oppScore}
                onChange={(e) => updateField('oppScore', e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRE DE SYNTHÈSE LIVE STICKY */}
      <LiveSummaryBar
        match={{ ...matchData, points }}
        minutes={minutes}
        teamScore={teamScoreNum}
      />

      {/* 3. CHRONOMÈTRE DU TEMPS DE JEU */}
      <GameTimer
        timerSeconds={matchData.timerSeconds}
        setTimerSeconds={(fn) => {
          setMatchData(prev => ({
            ...prev,
            timerSeconds: typeof fn === 'function' ? fn(prev.timerSeconds) : fn
          }));
        }}
        isRunning={matchData.isTimerRunning}
        setIsRunning={(fn) => {
          setMatchData(prev => ({
            ...prev,
            isTimerRunning: typeof fn === 'function' ? fn(prev.isTimerRunning) : fn
          }));
        }}
      />

      {/* 4. PAVÉ TACTILE DE SAISIE DES STATS */}
      <StatKeypad
        stats={{ ...matchData, points }}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onUndo={handleUndo}
        canUndo={matchData.undoStack && matchData.undoStack.length > 0}
        lastActionText={lastAction ? `${lastAction.label}` : ''}
      />

      {/* 5. BOUTONS BAS D'ACTION */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleSaveMatch}
          className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 active:scale-98 text-white font-black text-base uppercase tracking-wider rounded-3xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition"
        >
          <Save className="w-5 h-5" />
          <span>Enregistrer le Match</span>
        </button>

        <button
          type="button"
          onClick={handleResetMatch}
          className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser la saisie</span>
        </button>
      </div>

      {/* MODAL DE SUCCÈS */}
      {savedMatchSummary && (
        <MatchSuccessModal
          match={savedMatchSummary}
          onClose={() => setSavedMatchSummary(null)}
          onGoToStats={() => {
            setSavedMatchSummary(null);
            onNavigateToStats();
          }}
        />
      )}
    </div>
  );
}
