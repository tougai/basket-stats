import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Edit3, Trash2, Check, Upload, Share2, QrCode, Shield, Award, Users, Copy, CheckCheck, X, Camera, RotateCw } from 'lucide-react';
import { exportBackupJSON } from '../../utils/exportExcel';
import { compressImageFile } from '../../utils/imageUtils';
import QRCode from 'qrcode';

const PUBLIC_APP_URL = 'https://tougai.github.io/basket-stats/';

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
    seasons,
    importBackupData,
    resetAllData
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Déterminer l'URL publique officielle (propre, sans paramètre query)
  const shareUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? `${window.location.origin}${window.location.pathname}`
    : PUBLIC_APP_URL;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error(err));
  }, [shareUrl]);

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    jerseyNumber: '',
    team: 'U15M R2',
    club: 'BBC',
    position: 'Meneur / Arrière',
    dominantHand: 'Droitier',
    photoUrl: ''
  });

  const openAddForm = () => {
    setFormData({
      name: '',
      fullName: '',
      jerseyNumber: '',
      team: 'U15',
      club: 'BBC',
      position: 'Arrière',
      dominantHand: 'Droitier',
      photoUrl: ''
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
      dominantHand: player.dominantHand || 'Droitier',
      photoUrl: player.photoUrl || ''
    });
    setEditingPlayerId(player.id);
    setIsEditing(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 200, 0.82);
      setFormData(prev => ({ ...prev, photoUrl: compressed }));
    } catch (err) {
      alert('Erreur lors du traitement de la photo.');
    }
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
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-mono font-black text-white text-base shadow-md overflow-hidden relative shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>#{p.jerseyNumber || '?'}</span>
                      )}
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
              Partager l'application
            </h3>
          </div>

          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Lien Officiel
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Cette application fonctionne 100% hors-ligne. Les données restent strictement privées sur votre smartphone.
          Partagez le lien avec les autres parents de l'équipe pour qu'ils puissent suivre leurs propres enfants au gymnase !
        </p>

        {/* Affichage direct de l'URL avec bouton Copier */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 px-3">
          <span className="text-xs font-mono text-slate-300 truncate flex-1 select-all">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Boutons d'action : Partager + QR Code + Export JSON */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Basket Stats Pro',
                  text: 'Suivi des statistiques et tirs de basket pour enfants au gymnase !',
                  url: shareUrl
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-400" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => exportBackupJSON({ players, matches, workouts, seasons })}
            className="py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
            title="Exporter Sauvegarde JSON"
          >
            <span>💾 Backup</span>
          </button>
        </div>

        {/* Guide installation PWA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs space-y-2 mt-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>📲 Installer sur votre écran d'accueil :</span>
          </div>
          <div className="text-slate-300 space-y-1.5 text-[11px] leading-relaxed">
            <p>
              <strong className="text-orange-400">🍎 Sur iPhone :</strong> Ouvrez obligatoirement le lien dans <span className="font-bold text-white">Safari</span> (pas dans Chrome ni WhatsApp). Appuyez sur le bouton <strong>Partager</strong> (carré avec flèche vers le haut), puis faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong> ➕.
            </p>
            <p>
              <strong className="text-emerald-400">🤖 Sur Android :</strong> Dans <strong>Chrome</strong>, appuyez sur les 3 points en haut à droite $\rightarrow$ <strong>« Installer l'application »</strong>.
            </p>
          </div>
        </div>

        {/* Import JSON & Réinitialisation */}
        <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs text-slate-400">
          <label className="cursor-pointer text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurer JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px] font-medium"
            title="Recharger l'application pour appliquer les mises à jour"
          >
            <RotateCw className="w-3 h-3 text-orange-400" />
            <span>Recharger l'app</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Voulez-vous réinitialiser l\'application ? Toutes les données actuelles seront effacées pour repartir d\'une page vierge. Pensez à faire une sauvegarde JSON au préalable !')) {
                resetAllData();
              }
            }}
            className="text-slate-500 hover:text-red-400 transition flex items-center gap-1 text-[11px]"
            title="Réinitialiser à l'état vierge"
          >
            <Trash2 className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* MODAL QR CODE À FLASHER AU GYMNASE */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 modal-safe-overlay">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-3 text-orange-400">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-white">
              Flasher pour ouvrir l'application
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Pointez l'appareil photo du smartphone d'un parent pour ouvrir directement l'application !
            </p>

            {/* Image QR Code générée */}
            {qrCodeDataUrl ? (
              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-56 h-56 mx-auto" />
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-800 animate-pulse rounded-2xl mx-auto flex items-center justify-center text-xs text-slate-500">
                Génération...
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-400 mt-4 break-all bg-slate-850 p-2 rounded-xl border border-slate-800 select-all">
              {shareUrl}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-2xl text-xs border border-slate-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* FORMULAIRE MODAL AJOUT / MODIFICATION JOUEUR */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md modal-safe-overlay">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              {editingPlayerId ? 'Modifier le profil' : 'Ajouter un enfant (Fratrie)'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Photo / Avatar du joueur */}
              <div className="flex items-center gap-3.5 p-2.5 bg-slate-850/80 rounded-2xl border border-slate-750">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-mono font-black text-lg shadow-md overflow-hidden shrink-0">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  ) : (
                    <span>#{formData.jerseyNumber || '?'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white mb-1">Photo du joueur</div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-orange-400 hover:text-orange-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.photoUrl ? 'Changer' : 'Ajouter'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
