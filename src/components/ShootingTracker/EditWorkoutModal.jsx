import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, X, Check, Clock, Calendar } from 'lucide-react';

export function EditWorkoutModal({ workout, onClose }) {
  const { updateWorkout } = useApp();

  const [title, setTitle] = useState(workout.title || '');
  const [date, setDate] = useState(workout.date || '');
  const [made, setMade] = useState(workout.made || 0);
  const [missed, setMissed] = useState(workout.missed || 0);
  const [durationMinutes, setDurationMinutes] = useState(workout.durationMinutes || 15);
  const [notes, setNotes] = useState(workout.notes || '');

  const total = (parseInt(made) || 0) + (parseInt(missed) || 0);
  const percentage = total > 0 ? Number((((parseInt(made) || 0) / total) * 100).toFixed(1)) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (total <= 0) {
      alert('Veuillez renseigner au moins 1 tir.');
      return;
    }

    updateWorkout(workout.id, {
      title: title.trim() || 'Séance de shoot',
      category: workout.category || (title.includes('3') ? '3 Points' : 'Mi-distance'),
      date: date.trim() || new Date().toLocaleDateString('fr-FR'),
      made: parseInt(made) || 0,
      missed: parseInt(missed) || 0,
      total,
      percentage,
      durationMinutes: parseInt(durationMinutes) || 0,
      notes: notes.trim(),
      spots: workout.spots || []
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 modal-safe-overlay">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Modifier la séance</h3>
              <p className="text-[11px] text-slate-400">Corriger les tirs ou remarques</p>
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto pr-0.5 text-xs">
          {/* Titre atelier */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Atelier / Type de séance :
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
            />
          </div>

          {/* Date & Durée */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Date (JJ/MM/AAAA) :
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="12/02/2026"
                className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Durée (min) :
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono text-center"
              />
            </div>
          </div>

          {/* Tirs réussis et manqués */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-850/80 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                Tirs Réussis (Made) :
              </label>
              <input
                type="number"
                min="0"
                value={made}
                onChange={(e) => setMade(e.target.value)}
                className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-base font-black text-emerald-300 outline-none font-mono text-center"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-red-400 block mb-1">
                Tirs Manqués (Miss) :
              </label>
              <input
                type="number"
                min="0"
                value={missed}
                onChange={(e) => setMissed(e.target.value)}
                className="w-full bg-slate-900 border border-red-500/40 rounded-xl px-3 py-2 text-base font-black text-red-300 outline-none font-mono text-center"
              />
            </div>

            {/* Total & Pourcentage calculé */}
            <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Total : {total} tirs</span>
              <span className={`font-mono font-black px-2 py-0.5 rounded-lg border ${
                percentage >= 70
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : percentage >= 50
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>
                {percentage}% de réussite
              </span>
            </div>
          </div>

          {/* Remarques */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Remarques / Sensations :
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Bon rythme fluide, bon arc de tir..."
              className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-lg shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
