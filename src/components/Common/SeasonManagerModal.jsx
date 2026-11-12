import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Plus, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';

export function SeasonManagerModal({ onClose }) {
  const { seasons, addSeason, updateSeason, deleteSeason, matches, currentSeason, setCurrentSeason } = useApp();

  const [editingSeason, setEditingSeason] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [newSeasonInput, setNewSeasonInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const startEdit = (season) => {
    setEditingSeason(season);
    setEditedName(season);
  };

  const handleSaveEdit = (oldSeason) => {
    if (!editedName.trim()) return;
    updateSeason(oldSeason, editedName.trim());
    setEditingSeason(null);
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newSeasonInput.trim()) return;
    addSeason(newSeasonInput.trim());
    setNewSeasonInput('');
    setIsAdding(false);
  };

  const getMatchCount = (season) => {
    return matches.filter(m => m.season === season).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 modal-safe-overlay">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Gestion des Saisons</h3>
              <p className="text-[11px] text-slate-400">Ajouter, modifier ou supprimer</p>
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

        {/* Formulaire ajout nouvelle saison */}
        {isAdding ? (
          <form onSubmit={handleAddNew} className="mb-3 p-2.5 bg-slate-850 border border-orange-500/40 rounded-2xl animate-in fade-in duration-150">
            <label className="text-[10px] font-bold uppercase text-orange-400 block mb-1">
              Nouvelle saison (ex: 2027-2028)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="2027-2028"
                value={newSeasonInput}
                onChange={(e) => setNewSeasonInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl active:scale-95"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSeasonInput('');
                }}
                className="px-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mb-3 w-full py-2 bg-slate-850 hover:bg-slate-800 text-orange-400 border border-slate-750 hover:border-orange-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une nouvelle saison</span>
          </button>
        )}

        {/* Liste des saisons */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
          {seasons.map(season => {
            const matchCount = getMatchCount(season);
            const isEditingThis = editingSeason === season;
            const isCurrent = currentSeason === season;

            return (
              <div
                key={season}
                className={`p-3 rounded-2xl border transition ${
                  isCurrent
                    ? 'bg-orange-500/10 border-orange-500/40'
                    : 'bg-slate-850 border-slate-800'
                }`}
              >
                {isEditingThis ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-orange-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(season)}
                      className="p-1.5 bg-emerald-500 text-white rounded-lg active:scale-95"
                      title="Enregistrer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSeason(null)}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg"
                      title="Annuler"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => setCurrentSeason(season)}
                        className="text-left group"
                        title="Définir comme saison active"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white font-mono group-hover:text-orange-400 transition">
                            {season}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-orange-500 text-white rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {matchCount} match{matchCount > 1 ? 's' : ''} associé{matchCount > 1 ? 's' : ''}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(season)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                        title="Renommer la saison"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSeason(season)}
                        disabled={seasons.length <= 1}
                        className={`p-1.5 rounded-xl transition ${
                          seasons.length <= 1
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                        title={seasons.length <= 1 ? "Impossible de supprimer la dernière saison" : "Supprimer la saison"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
