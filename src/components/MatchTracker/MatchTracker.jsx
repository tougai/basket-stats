import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchSuccessModal } from './MatchSuccessModal';
import { LiveSingleScreen } from './LiveSingleScreen';
import { SeasonManagerModal } from '../Common/SeasonManagerModal';
import { calculatePoints, calculateQuickScore, calculateEfficiency, calculateValeurAjoutee } from '../../utils/formulas';
import { RotateCcw, Sparkles, Maximize2, Play, Users, Calendar } from 'lucide-react';

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
  const { activePlayer, currentSeason, seasons, addSeason, saveMatch, matchDraft, setMatchDraft } = useApp();

  const [isAddingNewSeason, setIsAddingNewSeason] = useState(false);
  const [newSeasonInput, setNewSeasonInput] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showSeasonManager, setShowSeasonManager] = useState(false);

  // Initialisation à partir du brouillon ou valeurs par défaut
  const [matchData, setMatchData] = useState(() => {
    if (matchDraft && matchDraft.playerId === activePlayer.id) {
      return matchDraft;
    }
    return {
      date: new Date().toISOString().slice(0, 10),
      season: currentSeason || '2026-2027',
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

  // Gestion continue du chronomètre en direct
  useEffect(() => {
    let interval = null;
    if (matchData.isTimerRunning) {
      interval = setInterval(() => {
        setMatchData(prev => ({
          ...prev,
          timerSeconds: (prev.timerSeconds || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchData.isTimerRunning]);

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
    const oppName = matchData.opponent.trim() || 'Adversaire';

    const calculatedPts = calculatePoints(matchData.pts2Made, matchData.pts3Made, matchData.ftMade);
    const finalMinutes = minutes;

    const fullMatch = {
      date: matchData.date.split('-').reverse().join('/'),
      season: matchData.season || currentSeason,
      type: matchData.type,
      opponent: oppName,
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
    if (window.confirm('Réinitialiser la feuille de match en cours ? Tous les compteurs seront remis à zéro.')) {
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

  // SI MODE DIRECT PLEIN ÉCRAN ACTIVÉ (1 seule page sans aucun défilement)
  if (isLiveMode) {
    return (
      <>
        <LiveSingleScreen
          matchData={{ ...matchData, points }}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onUndo={handleUndo}
          canUndo={matchData.undoStack && matchData.undoStack.length > 0}
          lastActionText={lastAction ? `${lastAction.label}` : ''}
          onOpenDetails={() => setIsLiveMode(false)}
          onSaveMatch={handleSaveMatch}
          onTimerToggle={() => setMatchData(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }))}
          onAdjustMinutes={(delta) => setMatchData(prev => ({ ...prev, timerSeconds: Math.max(0, (prev.timerSeconds || 0) + delta * 60) }))}
          onUpdateField={updateField}
          activePlayer={activePlayer}
        />
        {savedMatchSummary && (
          <MatchSuccessModal
            match={savedMatchSummary}
            onClose={() => {
              setSavedMatchSummary(null);
              setIsLiveMode(false);
            }}
            onGoToStats={() => {
              setSavedMatchSummary(null);
              setIsLiveMode(false);
              onNavigateToStats();
            }}
          />
        )}
      </>
    );
  }

  // A-t-on un match avec des statistiques déjà saisies en cours ?
  const hasLiveDraft = (points > 0 || matchData.timerSeconds > 0 || (matchData.undoStack && matchData.undoStack.length > 0));

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      {/* FICHE ÉPURÉE DE PRÉPARATION DU MATCH (OPTION A) */}
      <div className="bg-slate-850/90 border border-slate-750 p-5 rounded-3xl shadow-xl space-y-4">
        
        {/* En-tête : Joueur sélectionné */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                {hasLiveDraft ? 'Match en Cours' : 'Préparation du Match'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {hasLiveDraft ? 'Session active prête à être reprise' : 'Préparez les détails puis lancez le direct'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-orange-500/30 flex items-center justify-center text-[9px] font-bold text-orange-400 shrink-0">
              {activePlayer.photoUrl ? (
                <img src={activePlayer.photoUrl} alt={activePlayer.name} className="w-full h-full object-cover" />
              ) : (
                activePlayer.name?.[0]?.toUpperCase() || 'J'
              )}
            </div>
            <span className="text-xs font-mono font-bold text-orange-400 truncate max-w-[100px]">
              {activePlayer.name} (#{activePlayer.jerseyNumber || '?'})
            </span>
          </div>
        </div>

        {/* Bannière de reprise si match déjà en cours */}
        {hasLiveDraft && (
          <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-transparent border border-orange-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-amber-300">
                {matchData.opponent || 'Match Direct'}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                {points} pts • {minutes} min de jeu • {matchData.pf}/5 fautes
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLiveMode(true)}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reprendre</span>
            </button>
          </div>
        )}

        {/* Adversaire */}
        <div>
          <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider block mb-1.5">
            Adversaire *
          </label>
          <input
            type="text"
            placeholder="Ex: St Jory, Lavaur, Quint Fonsegrives..."
            value={matchData.opponent}
            onChange={(e) => updateField('opponent', e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-2xl px-3.5 py-3 text-sm font-bold text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Saison & Date */}
        <div className="grid grid-cols-2 gap-2.5 min-w-0">
          <div className="min-w-0 overflow-hidden">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 truncate">
              Saison
            </label>
            <select
              value={matchData.season}
              onChange={(e) => {
                if (e.target.value === '__add_season__') {
                  setIsAddingNewSeason(true);
                } else if (e.target.value === '__manage_seasons__') {
                  setShowSeasonManager(true);
                } else {
                  updateField('season', e.target.value);
                }
              }}
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-white outline-none truncate"
            >
              {(seasons || [currentSeason]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__add_season__">+ Nouvelle saison...</option>
              <option value="__manage_seasons__">⚙️ Gérer les saisons...</option>
            </select>
          </div>

          <div className="min-w-0 overflow-hidden">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 truncate">
              Date
            </label>
            <input
              type="date"
              value={matchData.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-white outline-none transition"
            />
          </div>
        </div>

        {/* Formulaire ajout nouvelle saison */}
        {isAddingNewSeason && (
          <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-orange-500/40 animate-in fade-in duration-150">
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
                  updateField('season', newSeasonInput.trim());
                  setNewSeasonInput('');
                  setIsAddingNewSeason(false);
                }
              }}
              className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNewSeason(false);
                setNewSeasonInput('');
              }}
              className="text-xs text-slate-400 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Type de match & Format Durée */}
        <div className="grid grid-cols-2 gap-2.5 min-w-0">
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
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2.5 text-xs font-medium text-white outline-none truncate"
            >
              {matchTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__add_new__">+ Ajouter un type...</option>
            </select>
          </div>

          <div className="min-w-0 overflow-hidden">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 truncate">
              Format Match
            </label>
            <select
              value={matchData.matchDuration}
              onChange={(e) => updateField('matchDuration', parseInt(e.target.value))}
              className="w-full min-w-0 max-w-full box-border bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2.5 text-xs font-medium text-white outline-none"
            >
              <option value={40}>40 min (Standard)</option>
              <option value={32}>32 min (Jeunes U15/U13)</option>
              <option value={20}>20 min (Tournoi)</option>
            </select>
          </div>
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
              Score du Match (modifiable en direct)
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
                placeholder="0"
                value={matchData.teamScore}
                onChange={(e) => updateField('teamScore', e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-750 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Score Adversaire :</span>
              <input
                type="number"
                placeholder="0"
                value={matchData.oppScore}
                onChange={(e) => updateField('oppScore', e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-750 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* GRAND BOUTON UNIQUE D'ENTRÉE EN MODE DIRECT PLEIN ÉCRAN */}
        <button
          type="button"
          onClick={() => {
            if (!matchData.opponent.trim()) {
              updateField('opponent', 'Adversaire');
            }
            setIsLiveMode(true);
          }}
          className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition mt-2"
        >
          <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          <span>{hasLiveDraft ? '🏀 Reprendre le Suivi en Direct' : '🏀 Démarrer le Match en Direct'}</span>
          <Maximize2 className="w-4 h-4 ml-1 opacity-80" />
        </button>

        {/* Bouton Réinitialiser discret si un brouillon est actif */}
        {hasLiveDraft && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleResetMatch}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1 mx-auto transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser cette feuille de match</span>
            </button>
          </div>
        )}

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
      {/* MODAL GESTION DES SAISONS */}
      {showSeasonManager && (
        <SeasonManagerModal onClose={() => setShowSeasonManager(false)} />
      )}
    </div>
  );
}
