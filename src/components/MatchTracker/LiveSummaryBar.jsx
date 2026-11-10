import React from 'react';
import {
  calculatePoints,
  calculateEfficiency,
  calculateQuickScore,
  calculateValeurAjoutee,
  getCategory
} from '../../utils/formulas';

export function LiveSummaryBar({ match, minutes, teamScore }) {
  const points = calculatePoints(match.pts2Made, match.pts3Made, match.ftMade);
  const matchWithPts = { ...match, points };
  const quickScore = calculateQuickScore(matchWithPts);
  const efficiency = calculateEfficiency(matchWithPts);
  const category = getCategory(quickScore, minutes > 0 ? minutes : (points > 0 ? 1 : 0));
  const valeurAjoutee = calculateValeurAjoutee(points, teamScore, minutes, match.duration || 40);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-3.5 rounded-3xl shadow-xl select-none">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Performance Live
          </span>
          {/* Badge Catégorie */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${category.badgeClass}`}>
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </span>
        </div>

        {valeurAjoutee > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            <span>VA :</span>
            <span className="font-mono font-black">{valeurAjoutee}</span>
          </div>
        )}
      </div>

      {/* Grille des 4 indicateurs majeurs */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Points */}
        <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Points
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-orange-400 mt-0.5">
            {points}
          </div>
        </div>

        {/* Quick Score */}
        <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
            Quick Score
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-0.5">
            {quickScore}
          </div>
        </div>

        {/* Efficiency */}
        <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Eval
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-0.5">
            {efficiency}
          </div>
        </div>

        {/* Rebonds */}
        <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-teal-400 tracking-wider">
            Rebonds
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-teal-300 mt-0.5">
            {match.reb || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
