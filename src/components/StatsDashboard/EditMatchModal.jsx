import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculatePoints,
  calculateQuickScore,
  calculateEfficiency,
  calculateValeurAjoutee,
  getCategory,
  parseResult
} from '../../utils/formulas';
import { X, Save, Clock, Trophy, Shield, Swords, Plus, Minus, AlertCircle } from 'lucide-react';

export function EditMatchModal({ match, onClose, onUpdated }) {
  const { updateMatch, seasons } = useApp();

  // Conversion de la date JJ/MM/AAAA vers AAAA-MM-JJ pour input[type="date"]
  const parseToIsoDate = (dStr) => {
    if (!dStr) return new Date().toISOString().slice(0, 10);
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dStr;
  };

  // Parsing du résultat existant (ex: "73-44 W")
  const parsedRes = match ? parseResult(match.result) : { teamScore: '', oppScore: '' };

  const [dateIso, setDateIso] = useState(() => match ? parseToIsoDate(match.date) : '');
  const [opponent, setOpponent] = useState(match?.opponent || '');
  const [season, setSeason] = useState(match?.season || '2026-2027');
  const [type, setType] = useState(match?.type || 'saison reg (dom)');
  const [matchDuration, setMatchDuration] = useState(match?.matchDuration || 40);

  // Temps de jeu officiel (minutes saisies après coup)
  const [minutes, setMinutes] = useState(parseInt(match?.minutes) || 0);

  // Scores
  const [teamScore, setTeamScore] = useState(parsedRes.teamScore || '');
  const [oppScore, setOppScore] = useState(parsedRes.oppScore || '');

  // Statistiques individuelles
  const [pts2Made, setPts2Made] = useState(parseInt(match?.pts2Made) || 0);
  const [pts3Made, setPts3Made] = useState(parseInt(match?.pts3Made) || 0);
  const [ftMade, setFtMade] = useState(parseInt(match?.ftMade) || 0);
  const [reb, setReb] = useState(parseInt(match?.reb) || 0);
  const [dreb, setDreb] = useState(parseInt(match?.dreb) || 0);
  const [ast, setAst] = useState(parseInt(match?.ast) || 0);
  const [stl, setStl] = useState(parseInt(match?.stl) || 0);
  const [def, setDef] = useState(parseInt(match?.def) || 0);
  const [pf, setPf] = useState(parseInt(match?.pf) || 0);

  if (!match) return null;

  // Calculs dynamiques
  const calculatedPts = calculatePoints(pts2Made, pts3Made, ftMade);
  const teamScoreNum = parseInt(teamScore) || 0;
  const oppScoreNum = parseInt(oppScore) || 0;

  let calculatedResult = match.result;
  if (teamScoreNum > 0 || oppScoreNum > 0) {
    const isW = teamScoreNum >= oppScoreNum;
    calculatedResult = `${teamScoreNum}-${oppScoreNum} ${isW ? 'W' : 'L'}`;
  }

  const previewMatch = {
    ...match,
    minutes,
    points: calculatedPts,
    pts2Made,
    pts3Made,
    ftMade,
    reb,
    dreb,
    ast,
    stl,
    def,
    pf,
    matchDuration
  };

  const calculatedQS = calculateQuickScore(previewMatch);
  const calculatedEff = calculateEfficiency(previewMatch);
  const calculatedVA = calculateValeurAjoutee(calculatedPts, teamScoreNum, minutes, matchDuration);
  const category = getCategory(calculatedQS, minutes > 0 ? minutes : (calculatedPts > 0 ? 1 : 0));

  const handleSave = () => {
    // Reconversion de la date en JJ/MM/AAAA
    let dateFr = match.date;
    if (dateIso.includes('-')) {
      dateFr = dateIso.split('-').reverse().join('/');
    }

    const updatedData = {
      date: dateFr,
      opponent: opponent.trim() || 'Adversaire',
      season,
      type,
      matchDuration,
      minutes,
      result: calculatedResult,
      points: calculatedPts,
      pts2Made,
      pts3Made,
      ftMade,
      reb,
      dreb,
      ast,
      stl,
      def,
      pf,
      quickScore: calculatedQS,
      efficiency: calculatedEff,
      valeurAjoutee: calculatedVA
    };

    updateMatch(match.id, updatedData);

    if (onUpdated) {
      onUpdated({ ...match, ...updatedData });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 modal-safe-overlay">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Modification après match
            </span>
            <h2 className="text-base font-black text-white">
              {opponent || 'Match'} • {match.date}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps scrollable des champs */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          
          {/* 1. SECTION TEMPS DE JEU (Mise en avant pour la table de marque) */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-orange-300 tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Temps de Jeu Officiel (Minutes)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Feuille de marque
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMinutes(m => Math.max(0, m - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold flex items-center justify-center border border-slate-700 text-base"
              >
                -1
              </button>

              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border-2 border-orange-500/50 focus:border-orange-500 rounded-xl py-2 text-2xl font-mono font-black text-center text-orange-400 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  sur {matchDuration} min de match
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMinutes(m => m + 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold flex items-center justify-center border border-slate-700 text-base"
              >
                +1
              </button>
            </div>
          </div>

          {/* 2. CONTEXTE & SCORES */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Contexte & Score Final
            </span>

            {/* Adversaire */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Adversaire :</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
              />
            </div>

            {/* Date & Saison */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Date :</label>
                <input
                  type="date"
                  value={dateIso}
                  onChange={(e) => setDateIso(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Saison :</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none"
                >
                  {(seasons || [season]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Format & Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Format match :</label>
                <select
                  value={matchDuration}
                  onChange={(e) => setMatchDuration(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2 py-2 text-xs font-semibold text-white outline-none"
                >
                  <option value={40}>40 min (Standard)</option>
                  <option value={32}>32 min (Jeunes)</option>
                  <option value={20}>20 min (Tournoi)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Type de match :</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400">Score Notre Équipe :</span>
                <input
                  type="number"
                  placeholder="0"
                  value={teamScore}
                  onChange={(e) => setTeamScore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Score Adversaire :</span>
                <input
                  type="number"
                  placeholder="0"
                  value={oppScore}
                  onChange={(e) => setOppScore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white outline-none mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* 3. STATISTIQUES INDIVIDUELLES */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Points & Tirs ({calculatedPts} pts au total)
              </span>
              <span className="text-xs font-black font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                {calculatedPts} PTS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-amber-400 block mb-1">2PT Réussis</span>
                <input
                  type="number"
                  min="0"
                  value={pts2Made}
                  onChange={(e) => setPts2Made(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 text-base font-mono font-bold text-center text-white outline-none"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">{pts2Made * 2} pts</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-purple-400 block mb-1">3PT Réussis</span>
                <input
                  type="number"
                  min="0"
                  value={pts3Made}
                  onChange={(e) => setPts3Made(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 text-base font-mono font-bold text-center text-white outline-none"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">{pts3Made * 3} pts</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 block mb-1">LF Réussis</span>
                <input
                  type="number"
                  min="0"
                  value={ftMade}
                  onChange={(e) => setFtMade(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-2 text-base font-mono font-bold text-center text-white outline-none"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">{ftMade} pt</span>
              </div>
            </div>

            {/* Autres métriques de jeu */}
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block pt-2 border-t border-slate-800">
              Rebonds, Passes & Défense
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-cyan-300 block mb-1">Passes (AST)</span>
                <input
                  type="number"
                  min="0"
                  value={ast}
                  onChange={(e) => setAst(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-blue-300 block mb-1">Interc. (STL)</span>
                <input
                  type="number"
                  min="0"
                  value={stl}
                  onChange={(e) => setStl(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-violet-300 block mb-1">Contres (DEF)</span>
                <input
                  type="number"
                  min="0"
                  value={def}
                  onChange={(e) => setDef(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-teal-300 block mb-1">Rebonds Tot</span>
                <input
                  type="number"
                  min="0"
                  value={reb}
                  onChange={(e) => setReb(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Rebonds Déf</span>
                <input
                  type="number"
                  min="0"
                  value={dreb}
                  onChange={(e) => setDreb(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-rose-300 block mb-1">Fautes (/5)</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={pf}
                  onChange={(e) => setPf(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl py-1.5 text-sm font-mono font-bold text-center text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. APERÇU EN DIRECT DES FORMULES CALCULÉES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Quick Score</span>
              <span className="text-base font-black font-mono text-cyan-300">{calculatedQS}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Efficacité</span>
              <span className="text-base font-black font-mono text-emerald-400">{calculatedEff}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Val. Ajoutée</span>
              <span className="text-base font-black font-mono text-amber-400">{calculatedVA}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Catégorie</span>
              <span className="text-xs font-black">{category.emoji} {category.label}</span>
            </div>
          </div>

        </div>

        {/* Footer avec Bouton Enregistrer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-3 bg-gradient-to-r from-orange-500 to-amber-600 active:scale-98 text-white font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les modifications</span>
          </button>
        </div>

      </div>
    </div>
  );
}
