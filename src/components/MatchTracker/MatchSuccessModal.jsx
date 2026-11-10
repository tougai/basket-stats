import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { getCategory } from '../../utils/formulas';

export function MatchSuccessModal({ match, onClose, onGoToStats }) {
  useEffect(() => {
    // Déclencher les confettis
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignorer si non disponible
    }
  }, []);

  if (!match) return null;

  const category = getCategory(match.quickScore, match.minutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl font-black text-white">
          Match Enregistré !
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {match.opponent ? `Contre ${match.opponent}` : 'Statistiques sauvegardées'} ({match.date})
        </p>

        {/* Fiche récapitulative */}
        <div className="bg-slate-850/80 rounded-2xl p-4 my-5 border border-slate-800 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Résultat :</span>
            <span className="text-xs font-black text-white px-2 py-0.5 rounded bg-slate-800">
              {match.result || 'Terminé'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Points marqués :</span>
            <span className="text-base font-mono font-black text-orange-400">
              {match.points} pts
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Quick Score :</span>
            <span className="text-base font-mono font-black text-cyan-300">
              {match.quickScore} QS
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Catégorie :</span>
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border ${category.badgeClass}`}>
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Temps de jeu :</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {match.minutes} minutes
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onGoToStats}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 active:scale-95 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition"
          >
            <span>Voir l'historique complet</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 font-bold rounded-2xl text-xs border border-slate-700 transition"
          >
            Nouveau match
          </button>
        </div>
      </div>
    </div>
  );
}
