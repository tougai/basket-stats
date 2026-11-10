import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Edit3, Trash2, Check, Upload, Share2, QrCode, Shield, Award, Users } from 'lucide-react';
import { exportBackupJSON } from '../../utils/exportExcel';

export function ProfileManager() {
  const {
    players,
    activePlayer,
    activePlayerId,
    setActivePlayerId,
    addPlayer,
    updatePlayer,
    deletePlayer,
    matches,
    workouts,
    importBackupData
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    jerseyNumber: '',
    team: 'U15M R2',
    club: 'BBC',
    position: 'Meneur / Arrière',
    dominantHand: 'Droitier'
  });

  const [showShareModal, setShowShareModal] = useState(false);

  const openAddForm = () => {
    setFormData({
      name: '',
      fullName: '',
      jerseyNumber: '',
      team: 'U15',
      club: 'BBC',
      position: 'Arrière',
      dominantHand: 'Droitier'
    });
    setEditingPlayerId(null);
    setIsEditing(true);
  };

  const openEditForm = (player) => {
    setFormData({
      name: player.name || '',
      fullName: player.fullName || '',
      jerseyNumber: player.jerseyNumber || '',
      team: player.team || '',
      club: player.club || '',
      position: player.position || '',
      dominantHand: player.dominantHand || 'Droitier'
    });
    setEditingPlayerId(player.id);
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Veuillez renseigner au moins le prénom de l\'enfant.');
      return;
    }

    if (editingPlayerId) {
      updatePlayer(editingPlayerId, formData);
    } else {
      addPlayer(formData);
    }

    setIsEditing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (importBackupData(json)) {
          alert('✅ Données importées avec succès !');
        } else {
          alert('Format de fichier invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto select-none">
      {/* 1. EN-TÊTE DU GESTIONNAIRE DE PROFILS */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Profils & Fratries
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gérez les fiches individuelles de vos enfants
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* LISTE DES CARTES JOUEURS */}
        <div className="space-y-2.5">
          {players.map(p => {
            const isActive = p.id === activePlayerId;
            const playerMatchCount = matches.filter(m => m.playerId === p.id).length;
            const playerWorkoutCount = workouts.filter(w => w.playerId === p.id).length;

            return (
              <div
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  isActive
                    ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-mono font-black text-white text-base shadow-md">
                      #{p.jerseyNumber || '?'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{p.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.team} • {p.club || 'Club'} • {p.position || 'Poste'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(p);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer le profil de ${p.name} et toutes ses statistiques ?`)) {
                            deletePlayer(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>🏀 {playerMatchCount} match{playerMatchCount > 1 ? 's' : ''}</span>
                  <span>🎯 {playerWorkoutCount} séance{playerWorkoutCount > 1 ? 's' : ''} shoot</span>
                  <span>✋ {p.dominantHand || 'Droitier'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PARTAGE & TRANSMISSION AUX AUTRES PARENTS */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Partager avec d'autres parents
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Cette application fonctionne 100% hors-ligne. Les données restent strictement privées sur votre smartphone.
          Partagez le lien avec les autres parents de l'équipe pour qu'ils puissent suivre leurs propres enfants au gymnase !
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Basket Stats Tracker',
                  text: 'Suivi des statistiques et tirs de basket pour enfants au gymnase !',
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien de l\'application copié dans le presse-papier !');
              }
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-400" />
            <span>Partager le lien</span>
          </button>

          <button
            type="button"
            onClick={() => exportBackupJSON({ players, matches, workouts })}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
            title="Exporter Sauvegarde JSON"
          >
            Export JSON
          </button>
        </div>

        {/* Import JSON */}
        <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Restaurer une sauvegarde :</span>
          <label className="cursor-pointer text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Importer JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* FORMULAIRE MODAL AJOUT / MODIFICATION JOUEUR */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              {editingPlayerId ? 'Modifier le profil' : 'Ajouter un enfant (Fratrie)'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Quentin, Lucas..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    N° Maillot
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 7"
                    value={formData.jerseyNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                    className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Équipe / Catégorie
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: U15M R2"
                    value={formData.team}
                    onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Club
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BBC"
                    value={formData.club}
                    onChange={(e) => setFormData(prev => ({ ...prev, club: e.target.value }))}
                    className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Main forte
                  </label>
                  <select
                    value={formData.dominantHand}
                    onChange={(e) => setFormData(prev => ({ ...prev, dominantHand: e.target.value }))}
                    className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2 text-sm text-white outline-none"
                  >
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Poste
                </label>
                <input
                  type="text"
                  placeholder="Ex: Arrière / Meneur"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
