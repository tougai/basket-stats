import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Upload, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export function WelcomeOnboarding() {
  const { addPlayer, importBackupData, loadQuentinData } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    team: 'U15',
    club: 'BBC',
    position: 'Arrière / Meneur',
    dominantHand: 'Droitier'
  });

  const [secretTapCount, setSecretTapCount] = useState(0);

  const handleSecretTap = () => {
    const next = secretTapCount + 1;
    if (next >= 5) {
      setSecretTapCount(0);
      loadQuentinData();
    } else {
      setSecretTapCount(next);
      setTimeout(() => setSecretTapCount(0), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Veuillez renseigner au moins le prénom de votre enfant.');
      return;
    }

    addPlayer({
      name: formData.name.trim(),
      fullName: formData.name.trim(),
      jerseyNumber: formData.jerseyNumber.trim() || '?',
      team: formData.team.trim() || 'U15',
      club: formData.club.trim() || 'Club',
      position: formData.position || 'Arrière / Meneur',
      dominantHand: formData.dominantHand || 'Droitier',
      avatarColor: 'from-orange-500 to-amber-600'
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (importBackupData(json)) {
          // Import réussi, la page d'accueil basculera automatiquement
        } else {
          alert('Format de sauvegarde invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto select-none animate-in fade-in zoom-in-95 duration-200">
      {/* 1. CARTE DE BIENVENUE */}
      <div className="bg-slate-850/90 border border-slate-750 p-5 rounded-3xl shadow-xl text-center relative overflow-hidden">
        {/* Halo décoratif subtil */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div
          onClick={handleSecretTap}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/25 mx-auto mb-3 cursor-pointer select-none active:scale-95 transition"
          title="Basket Stats"
        >
          🏀
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">
          Bienvenue sur Basket Stats !
        </h2>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          L'application pour enregistrer facilement les statistiques, shoots et temps de jeu de votre enfant au gymnase.
        </p>

        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-left">
          <div className="flex items-start gap-2.5">
            <span className="text-lg leading-none">👋</span>
            <div className="text-xs text-slate-300">
              <strong className="text-white block font-bold mb-0.5">Pour démarrer :</strong>
              Créez le profil de votre enfant (Prénom, N°) pour commencer à enregistrer ses matchs en direct !
            </div>
          </div>
        </div>
      </div>

      {/* 2. FORMULAIRE DE CRÉATION DU PREMIER JOUEUR */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-850/90 border border-slate-750 p-4 sm:p-5 rounded-3xl shadow-lg space-y-3.5"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Profil de votre enfant
            </h3>
            <p className="text-[11px] text-slate-400">
              Renseignez ses informations de joueur
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Prénom */}
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Prénom de l'enfant *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Lucas, Thomas..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Numéro de maillot */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              N° Maillot
            </label>
            <input
              type="text"
              placeholder="Ex: 7, 23"
              value={formData.jerseyNumber}
              onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition text-center font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Équipe / Catégorie */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Équipe / Catégorie
            </label>
            <input
              type="text"
              placeholder="Ex: U15M, U13..."
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Club */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Club
            </label>
            <input
              type="text"
              placeholder="Ex: BBC, Toulouse..."
              value={formData.club}
              onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Poste */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Poste (facultatif)
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none transition"
            >
              <option value="Meneur">Meneur</option>
              <option value="Arrière / Meneur">Arrière / Meneur</option>
              <option value="Arrière">Arrière</option>
              <option value="Ailier">Ailier</option>
              <option value="Ailier fort">Ailier fort</option>
              <option value="Pivot">Pivot</option>
            </select>
          </div>

          {/* Main dominante */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Main dominante
            </label>
            <select
              value={formData.dominantHand}
              onChange={(e) => setFormData({ ...formData, dominantHand: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 focus:border-orange-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none transition"
            >
              <option value="Droitier">Droitier</option>
              <option value="Gaucher">Gaucher</option>
            </select>
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition"
        >
          <span>🚀 Créer le profil & Commencer</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 3. RESTAURATION DE SAUVEGARDE EXISTANTE */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl text-center space-y-2.5">
        <div className="text-xs text-slate-400">
          Vous aviez déjà sauvegardé vos données ?
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-orange-400 hover:text-orange-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition shadow-sm">
          <Upload className="w-3.5 h-3.5" />
          <span>📥 Restaurer une sauvegarde (JSON)</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* 4. MENTION DE CONFIDENTIALITÉ & HORS-LIGNE */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 px-2 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>100% Hors-ligne & Privé : aucune donnée n'est envoyée sur Internet.</span>
      </div>
    </div>
  );
}
