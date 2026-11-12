import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, X, Check, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPOTS_DEFAULT = [
  { id: 'corner_d', name: 'Corner Droit', short: '0° D', tour1: '', tour2: '' },
  { id: 'wing_d', name: '45° Droit', short: 'Aile D', tour1: '', tour2: '' },
  { id: 'top', name: 'Axe', short: 'Tête 90°', tour1: '', tour2: '' },
  { id: 'wing_g', name: '45° Gauche', short: 'Aile G', tour1: '', tour2: '' },
  { id: 'corner_g', name: 'Corner Gauche', short: '0° G', tour1: '', tour2: '' }
];

export function SpotEntryModal({ onClose, onSuccess }) {
  const { saveWorkout, activePlayer } = useApp();

  const [date, setDate] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  });

  const [title, setTitle] = useState('3 Points (Tour 5 spots)');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [notes, setNotes] = useState('');

  // 5 spots avec valeurs du tour 1 et tour 2
  const [spots, setSpots] = useState(SPOTS_DEFAULT);

  const handleSpotChange = (index, field, value) => {
    // Nettoyage de l'entrée numérique (max 10 par tour)
    let numVal = value.replace(/[^0-9]/g, '');
    if (numVal !== '') {
      const parsed = Math.min(10, Math.max(0, parseInt(numVal, 10)));
      numVal = isNaN(parsed) ? '' : String(parsed);
    }

    setSpots(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: numVal };
      return copy;
    });
  };

  // Calculs totaux
  const spotsCalculated = spots.map(s => {
    const t1 = parseInt(s.tour1, 10) || 0;
    const t2 = parseInt(s.tour2, 10) || 0;
    const made = t1 + t2;
    const total = 20; // 2 tours de 10
    const pct = Number(((made / total) * 100).toFixed(1));
    return {
      ...s,
      t1,
      t2,
      made,
      total,
      pct
    };
  });

  const totalMade = spotsCalculated.reduce((sum, s) => sum + s.made, 0);
  const totalAttempted = spotsCalculated.reduce((sum, s) => sum + s.total, 0); // 100 tirs
  const globalPercentage = totalAttempted > 0
    ? Number(((totalMade / totalAttempted) * 100).toFixed(1))
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (totalMade === 0) {
      if (!window.confirm('Vous avez enregistré 0 tirs réussis sur 100. Confirmer ?')) {
        return;
      }
    }

    const structuredSpots = spotsCalculated.map(s => ({
      name: s.name,
      tour1: s.t1,
      tour2: s.t2,
      made: s.made,
      total: s.total,
      pct: s.pct
    }));

    saveWorkout({
      title: title.trim() || '3 Points (Tour 5 spots)',
      category: '3 Points',
      date: date.trim() || new Date().toLocaleDateString('fr-FR'),
      made: totalMade,
      missed: totalAttempted - totalMade,
      total: totalAttempted,
      percentage: globalPercentage,
      durationMinutes: parseInt(durationMinutes, 10) || 20,
      spots: structuredSpots,
      notes: notes.trim()
    });

    if (globalPercentage >= 50) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 modal-safe-overlay">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Saisie Séance 5 Spots (3 Pts)
              </h3>
              <p className="text-[11px] text-slate-400">
                Saisie directe des 2 tours de 10 tirs par spot pour {activePlayer?.name || 'le joueur'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENU AVEC SCROLL */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
          
          {/* MÉTADONNÉES : DATE & DURÉE */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Date (JJ/MM/AAAA) :
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="28/10/2025"
                  className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Durée estimée :
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none text-center"
                />
                <span className="text-[10px] text-slate-400 absolute right-3 top-2.5">min</span>
              </div>
            </div>
          </div>

          {/* TABLEAU DES 5 SPOTS */}
          <div className="bg-slate-850/90 border border-slate-750 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Spot (Ordre chrono)</span>
              <div className="flex items-center gap-3">
                <span className="w-12 text-center">Tour 1 (/10)</span>
                <span className="w-12 text-center">Tour 2 (/10)</span>
                <span className="w-14 text-right">Total /20</span>
              </div>
            </div>

            {spotsCalculated.map((spot, idx) => (
              <div
                key={spot.id}
                className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{spot.name}</span>
                      {spot.pct >= 50 && (
                        <span className="text-[9px] text-emerald-400 font-normal">🔥</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{spot.short}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={spot.tour1}
                    onChange={(e) => handleSpotChange(idx, 'tour1', e.target.value)}
                    className="w-12 h-9 bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl text-center font-mono font-black text-sm text-white outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={spot.tour2}
                    onChange={(e) => handleSpotChange(idx, 'tour2', e.target.value)}
                    className="w-12 h-9 bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl text-center font-mono font-black text-sm text-white outline-none"
                  />
                  <div className="w-14 text-right font-mono">
                    <div className="text-xs font-black text-white">
                      {spot.made}<span className="text-slate-500 text-[10px]">/20</span>
                    </div>
                    <div className={`text-[10px] font-bold ${
                      spot.pct >= 50 ? 'text-emerald-400' : spot.pct >= 35 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {spot.pct}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RÉCAPITULATIF GLOBAL DE LA SÉANCE */}
          <div className="bg-gradient-to-br from-slate-850 to-slate-900 border border-orange-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                Score Global de la Séance
              </div>
              <div className="text-lg font-black text-white mt-0.5 font-mono">
                {totalMade} <span className="text-xs text-slate-400 font-normal">rentrés sur {totalAttempted} tirs</span>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-2xl font-black font-mono tracking-tight ${
                globalPercentage >= 50 ? 'text-emerald-400' : globalPercentage >= 40 ? 'text-amber-400' : 'text-orange-400'
              }`}>
                {globalPercentage}%
              </div>
              <div className="text-[9px] text-slate-400 font-semibold">
                {globalPercentage >= 50 ? '🔥 Chaud bouillant' : globalPercentage >= 40 ? '👍 Bon niveau' : '💪 À travailler'}
              </div>
            </div>
          </div>

          {/* REMARQUES */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Remarques / Sensations (Optionnel) :
            </label>
            <input
              type="text"
              placeholder="Ex: Belle régularité dans l'axe, fatigue sur les 45°..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* BOUTONS D'ACTION */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition text-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Valider la Séance</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
