import React, { useState } from 'react';
import {
  calculatePoints,
  calculateQuickScore,
  calculateEfficiency,
  calculateValeurAjoutee,
  getCategory
} from '../../utils/formulas';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Save,
  Clock,
  Sparkles,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  X
} from 'lucide-react';

export function LiveSingleScreen({
  matchData,
  onIncrement,
  onDecrement,
  onUndo,
  canUndo,
  lastActionText,
  onOpenDetails,
  onSaveMatch,
  onTimerToggle,
  onAdjustMinutes,
  onUpdateField,
  activePlayer
}) {
  // Mode de saisie : normal (+) ou correction (-)
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);

  // Modal d'ajustement rapide du score en plein écran
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [teamScoreInput, setTeamScoreInput] = useState(matchData.teamScore || '');
  const [oppScoreInput, setOppScoreInput] = useState(matchData.oppScore || '');

  // Modal d'ajustement rapide du chrono
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Retour haptique tactile pour mobile
  const triggerHaptic = (intensity = 'normal') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(intensity === 'heavy' ? 45 : 25);
    }
  };

  // Traitement d'un clic sur une touche de stat
  const handleKeyTap = (key, label, value = 1) => {
    triggerHaptic(value > 1 ? 'heavy' : 'normal');

    if (isCorrectionMode) {
      // Décrémenter
      onDecrement(key);
      // Revenir automatiquement en mode normal après une correction pour éviter les fausses manips
      setIsCorrectionMode(false);
    } else {
      // Incrémenter
      onIncrement(key, label, value);
    }
  };

  const points = calculatePoints(matchData.pts2Made, matchData.pts3Made, matchData.ftMade);
  const minutes = Math.floor((matchData.timerSeconds || 0) / 60);
  const seconds = (matchData.timerSeconds || 0) % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const teamScoreNum = parseInt(matchData.teamScore) || 0;
  const oppScoreNum = parseInt(matchData.oppScore) || 0;
  const fullMatch = { ...matchData, points };
  const quickScore = calculateQuickScore(fullMatch);
  const efficiency = calculateEfficiency(fullMatch);
  const category = getCategory(quickScore, minutes > 0 ? minutes : (points > 0 ? 1 : 0));

  // Sauvegarder les scores depuis le modal rapide
  const handleSaveQuickScores = () => {
    if (onUpdateField) {
      onUpdateField('teamScore', teamScoreInput);
      onUpdateField('oppScore', oppScoreInput);
    }
    setShowScoreModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0B0F19] text-white flex flex-col justify-between p-2 sm:p-3 select-none safe-top safe-bottom">
      
      {/* 1. TOP BAR ULTRA COMPACTE (Score, Chrono & Stats Clés) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 px-3 shadow-lg flex items-center justify-between gap-2 shrink-0">
        
        {/* Adversaire + Bouton retour aux détails complets */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onOpenDetails}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 rounded-xl text-slate-300 border border-slate-700 shrink-0"
            title="Revenir aux détails du match"
          >
            <ChevronLeft className="w-4 h-4 text-orange-400" />
          </button>

          {/* Clic sur le nom / score ouvre le modal de score rapide */}
          <button
            type="button"
            onClick={() => {
              setTeamScoreInput(matchData.teamScore || '');
              setOppScoreInput(matchData.oppScore || '');
              setShowScoreModal(true);
            }}
            className="text-left min-w-0 max-w-[100px] sm:max-w-[140px] truncate group"
          >
            <div className="text-xs font-black text-white truncate group-hover:text-orange-400 transition">
              {matchData.opponent || 'Match Direct'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
              {teamScoreNum > 0 || oppScoreNum > 0 ? (
                <span className="text-amber-400 font-bold">{teamScoreNum} - {oppScoreNum}</span>
              ) : (
                <span className="text-slate-500">Score --/-- ✎</span>
              )}
            </div>
          </button>
        </div>

        {/* Chrono En jeu / Banc (Contrôle 1-clic) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onTimerToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-black border transition active:scale-95 ${
              matchData.isTimerRunning
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {matchData.isTimerRunning ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{formattedTimer}</span>
            <span className="text-[9px] font-normal opacity-80 uppercase tracking-tighter hidden xs:inline">
              {matchData.isTimerRunning ? 'Jeu' : 'Banc'}
            </span>
          </button>

          {/* Bouton rapide +1 min si l'on a oublié de lancer */}
          <button
            type="button"
            onClick={() => onAdjustMinutes && onAdjustMinutes(1)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-750 active:scale-90 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg border border-slate-700/80"
            title="Ajouter 1 minute de jeu"
          >
            +1m
          </button>
        </div>

        {/* Stats en direct : Points + Quick Score + Badge Catégorie */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <div className="text-xs font-black font-mono text-orange-400 leading-none">
              {points} <span className="text-[9px] font-normal text-slate-400">pts</span>
            </div>
            <div className="text-[10px] font-bold font-mono text-cyan-300 leading-none mt-1">
              {quickScore} <span className="text-[8px] font-normal text-slate-400">QS</span>
            </div>
          </div>

          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg border ${category.badgeClass}`}
            title={`Performance: ${category.name}`}
          >
            {category.emoji}
          </span>
        </div>
      </div>

      {/* BANDEAU INDICATEUR SI MODE CORRECTION (-) ACTIVÉ */}
      {isCorrectionMode && (
        <div className="bg-rose-500/20 border border-rose-500/60 rounded-xl px-3 py-1 flex items-center justify-between text-xs font-bold text-rose-300 animate-pulse shrink-0">
          <span>⚠️ MODE CORRECTION ACTIF : Touchez une stat pour soustraire 1</span>
          <button
            type="button"
            onClick={() => setIsCorrectionMode(false)}
            className="text-[11px] bg-rose-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider font-black"
          >
            Annuler
          </button>
        </div>
      )}

      {/* 2. CORPS CENTRAL : LES 8 TOUCHES DE SAISIE TACTILES (Zero-scroll garantie) */}
      <div className="flex-1 flex flex-col justify-between py-1.5 gap-2 min-h-0">
        
        {/* LIGNE 1 : SCORING (+2, +3, +1 LF) */}
        <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
          {/* 2 POINTS */}
          <button
            type="button"
            onClick={() => handleKeyTap('pts2Made', '+2 PT', 2)}
            className={`bg-gradient-to-br from-amber-500 to-orange-600 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-orange-500/20 transition relative overflow-hidden ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>2 PTS</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-white">
                {matchData.pts2Made}
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-2' : '+2'}
            </span>
            <div className="text-[10px] font-medium opacity-80">
              {matchData.pts2Made * 2} pts
            </div>
          </button>

          {/* 3 POINTS */}
          <button
            type="button"
            onClick={() => handleKeyTap('pts3Made', '+3 PT', 3)}
            className={`bg-gradient-to-br from-purple-500 to-indigo-600 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-purple-500/20 transition relative overflow-hidden ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>3 PTS</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-white">
                {matchData.pts3Made}
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-3' : '+3'}
            </span>
            <div className="text-[10px] font-medium opacity-80">
              {matchData.pts3Made * 3} pts
            </div>
          </button>

          {/* 1 LANCER FRANC */}
          <button
            type="button"
            onClick={() => handleKeyTap('ftMade', '+1 LF', 1)}
            className={`bg-gradient-to-br from-emerald-500 to-teal-600 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-emerald-500/20 transition relative overflow-hidden ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>LF</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-white">
                {matchData.ftMade}
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-1' : '+1'}
            </span>
            <div className="text-[10px] font-medium opacity-80">
              {matchData.ftMade} pt
            </div>
          </button>
        </div>

        {/* LIGNE 2 : ACTIONS DÉCISIVES (AST, STL, DEF) -> x2 Quick Score */}
        <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
          {/* AST (Passes Décisives) */}
          <button
            type="button"
            onClick={() => handleKeyTap('ast', '+1 AST', 1)}
            className={`bg-gradient-to-br from-cyan-600 to-blue-700 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-cyan-600/15 transition relative ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>PASSE</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-cyan-200">
                {matchData.ast}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-AST' : 'AST'}
            </span>
            <div className="text-[10px] font-bold text-cyan-200 opacity-90">
              +{matchData.ast * 2} QS
            </div>
          </button>

          {/* STL (Interceptions) */}
          <button
            type="button"
            onClick={() => handleKeyTap('stl', '+1 STL', 1)}
            className={`bg-gradient-to-br from-blue-600 to-indigo-700 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-blue-600/15 transition relative ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>INTERC.</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-blue-200">
                {matchData.stl}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-STL' : 'STL'}
            </span>
            <div className="text-[10px] font-bold text-blue-200 opacity-90">
              +{matchData.stl * 2} QS
            </div>
          </button>

          {/* DEF (Contres / Défense) */}
          <button
            type="button"
            onClick={() => handleKeyTap('def', '+1 DEF', 1)}
            className={`bg-gradient-to-br from-violet-600 to-purple-800 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-violet-600/15 transition relative ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>CONTRE</span>
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-xs text-violet-200">
                {matchData.def}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-DEF' : 'DEF'}
            </span>
            <div className="text-[10px] font-bold text-violet-200 opacity-90">
              +{matchData.def * 2} QS
            </div>
          </button>
        </div>

        {/* LIGNE 3 : REBONDS & FAUTES */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          {/* REBONDS TOTAUX */}
          <button
            type="button"
            onClick={() => handleKeyTap('reb', '+1 REB', 1)}
            className={`bg-gradient-to-br from-teal-600 to-emerald-700 active:scale-95 text-white rounded-2xl p-2 flex flex-col items-center justify-between shadow-md shadow-teal-600/15 transition relative ${
              isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 saturate-50' : ''
            }`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span>REBONDS</span>
              <span className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center font-mono font-black text-sm text-teal-200">
                {matchData.reb}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-1 REB' : '+1 REB'}
            </span>
            <div className="text-[10px] font-medium opacity-85">
              Total Rebonds
            </div>
          </button>

          {/* FAUTES PERSONNELLES (PF) */}
          <button
            type="button"
            onClick={() => handleKeyTap('pf', '+1 Faute', 1)}
            disabled={!isCorrectionMode && matchData.pf >= 5}
            className={`rounded-2xl p-2 flex flex-col items-center justify-between shadow-md transition relative ${
              matchData.pf >= 5 && !isCorrectionMode
                ? 'bg-rose-950 border border-rose-500 text-rose-300 opacity-60'
                : matchData.pf === 4 && !isCorrectionMode
                ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white animate-pulse shadow-red-500/30'
                : 'bg-gradient-to-br from-slate-750 to-slate-800 text-slate-200 hover:bg-slate-700'
            } ${isCorrectionMode ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900' : ''}`}
          >
            <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-90 px-1">
              <span className={matchData.pf >= 4 ? 'text-rose-200 font-black' : ''}>FAUTES</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                matchData.pf >= 4 ? 'bg-black text-rose-400 font-extrabold' : 'bg-black/30 text-white'
              }`}>
                {matchData.pf}/5
              </span>
            </div>

            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-auto">
              {isCorrectionMode ? '-1 FAUTE' : '+1 FAUTE'}
            </span>

            <div className="text-[10px] font-bold">
              {matchData.pf >= 5
                ? '🔴 SORTIE (5 Fautes)'
                : matchData.pf === 4
                ? '⚠️ Attention 4 fautes !'
                : `${5 - matchData.pf} restante${5 - matchData.pf > 1 ? 's' : ''}`}
            </div>
          </button>
        </div>
      </div>

      {/* 3. BARRE BASSE COMPACTE : ANNULER + BASCULE MODE -/+ + SCORE + TERMINER */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 flex items-center justify-between gap-1.5 shrink-0">
        
        {/* Annuler (Undo 1-tap) */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition shrink-0"
          title="Annuler la dernière action"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden xs:inline">Annuler</span>
        </button>

        {/* Bouton Bascule Mode Correction (-/+) */}
        <button
          type="button"
          onClick={() => setIsCorrectionMode(prev => !prev)}
          className={`flex items-center gap-1 px-2.5 py-2.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
            isCorrectionMode
              ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
          }`}
          title="Activer le mode soustraction pour corriger une erreur"
        >
          <span className="font-mono font-black text-sm">{isCorrectionMode ? '−' : '+/−'}</span>
          <span className="text-[11px] hidden sm:inline">{isCorrectionMode ? 'Correction' : 'Corriger'}</span>
        </button>

        {/* Bouton Score Rapide */}
        <button
          type="button"
          onClick={() => {
            setTeamScoreInput(matchData.teamScore || '');
            setOppScoreInput(matchData.oppScore || '');
            setShowScoreModal(true);
          }}
          className="flex items-center gap-1 px-2.5 py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 shrink-0"
          title="Modifier le score du match"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xs:inline">Score</span>
        </button>

        {/* Terminer & Enregistrer */}
        <button
          type="button"
          onClick={onSaveMatch}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 transition shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Terminer</span>
        </button>
      </div>

      {/* MODAL RAPIDE DE SCORE DU MATCH (Accessible sans quitter l'écran) */}
      {showScoreModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl p-5 w-full max-w-xs shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Score du Match
              </span>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Notre Équipe
                </span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={teamScoreInput}
                  onChange={(e) => setTeamScoreInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-orange-500 rounded-xl py-2.5 text-xl font-mono font-black text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Adversaire
                </span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={oppScoreInput}
                  onChange={(e) => setOppScoreInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-orange-500 rounded-xl py-2.5 text-xl font-mono font-black text-center text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveQuickScores}
              className="w-full py-3 bg-orange-500 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Valider le score</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
