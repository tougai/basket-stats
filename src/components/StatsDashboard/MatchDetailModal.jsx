import React from 'react';
import { X, Trophy, Award, Clock, Activity, Share2 } from 'lucide-react';
import {
  calculatePoints,
  parseResult,
  calculateMinPercentage,
  calculatePointsPercentage,
  calculateValeurAjoutee,
  calculateEfficiency,
  calculateQuickScore,
  getCategory
} from '../../utils/formulas';

export function MatchDetailModal({ match, player, onClose }) {
  if (!match) return null;

  const minutes = parseInt(match.minutes) || 0;
  const parsedRes = parseResult(match.result);
  const points = parseInt(match.points) || calculatePoints(match.pts2Made, match.pts3Made, match.ftMade);
  const minPct = minutes > 0 ? (calculateMinPercentage(minutes, 40) * 100).toFixed(1) + '%' : 'Pas joué';
  const ptsPct = (minutes > 0 && parsedRes.teamScore > 0)
    ? (calculatePointsPercentage(points, parsedRes.teamScore) * 100).toFixed(1) + '%'
    : (minutes === 0 ? 'Pas joué' : '0%');
  const va = minutes > 0 ? calculateValeurAjoutee(points, parsedRes.teamScore, minutes, 40) : 'Pas joué';
  const eff = minutes > 0 ? calculateEfficiency(match) : 'Pas joué';
  const qs = minutes > 0 ? calculateQuickScore(match) : 'Pas joué';
  const cat = getCategory(qs, minutes);

  const columns = [
    { code: 'A', name: 'Date', value: match.date },
    { code: 'B', name: 'Type', value: match.type },
    { code: 'C', name: 'Adversaire', value: match.opponent },
    { code: 'D', name: 'Résultat', value: match.result },
    { code: 'E', name: 'Minutes', value: `${minutes} min` },
    { code: 'F', name: '% min', value: minPct },
    { code: 'G', name: 'Points', value: `${points} pts`, highlight: true },
    { code: 'H', name: '% points', value: ptsPct },
    { code: 'I', name: 'Valeur Ajoutée', value: va, highlight: true },
    { code: 'J', name: '2PT réussis', value: match.pts2Made || 0 },
    { code: 'K', name: '3PT réussis', value: match.pts3Made || 0 },
    { code: 'L', name: 'FT (Lancers)', value: match.ftMade || 0 },
    { code: 'M', name: 'Reb (Tot)', value: match.reb || 0 },
    { code: 'N', name: 'DREB (Défensifs)', value: match.dreb || 0 },
    { code: 'O', name: 'AST (Passes)', value: match.ast || 0 },
    { code: 'P', name: 'STL (Interceptions)', value: match.stl || 0 },
    { code: 'Q', name: 'DEF (Contres)', value: match.def || 0 },
    { code: 'R', name: 'PF (Fautes)', value: match.pf || 0 },
    { code: 'S', name: 'Efficiency', value: eff },
    { code: 'T', name: 'Quick Score', value: qs, highlight: true },
    { code: 'U', name: 'Catégorie', value: `${cat.emoji} ${cat.label}`, highlight: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">{match.opponent}</span>
              <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded ${
                parsedRes.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {match.result}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {match.date} • {match.type} ({player.name})
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tableau des 21 colonnes */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Détail des 21 colonnes du tableur
          </div>

          {columns.map(col => (
            <div
              key={col.code}
              className={`flex items-center justify-between p-2 rounded-xl border ${
                col.highlight
                  ? 'bg-orange-500/10 border-orange-500/30 font-bold'
                  : 'bg-slate-850/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-slate-500 w-4">
                  {col.code}
                </span>
                <span className="text-slate-300 font-medium">{col.name}</span>
              </div>
              <span className={`font-mono ${col.highlight ? 'text-orange-400 font-black' : 'text-white'}`}>
                {col.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
