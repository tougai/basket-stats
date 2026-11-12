import React, { createContext, useContext, useState, useEffect } from 'react';
import initialData from '../data/initialData.json';
import quentinData from '../data/quentinData.json';

const AppContext = createContext();

const STORAGE_KEY_PLAYERS = 'basket_stats_players_v1';
const STORAGE_KEY_MATCHES = 'basket_stats_matches_v1';
const STORAGE_KEY_WORKOUTS = 'basket_stats_workouts_v1';
const STORAGE_KEY_ACTIVE_PLAYER = 'basket_stats_active_player_v1';
const STORAGE_KEY_DRAFT = 'basket_stats_match_draft_v1';
const STORAGE_KEY_SEASONS = 'basket_stats_seasons_v1';

// Détection du paramètre secret ?demo=quentin ou ?quentin
const hasQuentinDemoParam = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'quentin' || params.has('quentin');
  } catch (e) {
    return false;
  }
};

export function AppProvider({ children }) {
  const isDemoRequested = hasQuentinDemoParam();

  // Notification Toast éphémère
  const [toastMessage, setToastMessage] = useState('');

  // 1. Initialiser la liste des joueurs
  const [players, setPlayers] = useState(() => {
    if (isDemoRequested) {
      return quentinData.players || [];
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erreur chargement joueurs', e);
    }
    return initialData.players || [];
  });

  // 2. Joueur actif sélectionné
  const [activePlayerId, setActivePlayerId] = useState(() => {
    if (isDemoRequested) {
      return quentinData.players?.[0]?.id || '';
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PLAYER);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return initialData.players?.[0]?.id || '';
  });

  // 3. Matchs
  const [matches, setMatches] = useState(() => {
    if (isDemoRequested) {
      return quentinData.matches || [];
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Migration automatique : injection de matchDuration pour les matchs de Quentin ou anciens matchs
          const quentinDurations = new Map((quentinData.matches || []).map(qm => [qm.id, qm.matchDuration]));
          return parsed.map(m => {
            if (m.matchDuration === undefined) {
              const dur = quentinDurations.get(m.id) || 40;
              return { ...m, matchDuration: dur };
            }
            return m;
          });
        }
      }
    } catch (e) {
      console.error('Erreur chargement matchs', e);
    }
    return initialData.matches || [];
  });

  // 4. Séances de shoots (Workouts)
  const [workouts, setWorkouts] = useState(() => {
    if (isDemoRequested) {
      return quentinData.workouts || [];
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKOUTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Synchronisation automatique des séances de Quentin (mise à jour des notes/spots ou ajout)
          const quentinMap = new Map((quentinData.workouts || []).map(w => [w.id, w]));
          const updatedExisting = parsed.map(w => {
            if (quentinMap.has(w.id)) {
              return { ...w, ...quentinMap.get(w.id) };
            }
            return w;
          });
          const existingIds = new Set(updatedExisting.map(w => w.id));
          const missingWorkouts = (quentinData.workouts || []).filter(w => !existingIds.has(w.id));
          return [...missingWorkouts, ...updatedExisting];
        }
      }
    } catch (e) {
      console.error('Erreur chargement séances', e);
    }
    return initialData.workouts || [];
  });

  // 5. Gestion des saisons
  const [seasons, setSeasons] = useState(() => {
    if (isDemoRequested) {
      const matchSeasons = Array.from(new Set((quentinData.matches || []).map(m => m.season).filter(Boolean)));
      return Array.from(new Set(['2026-2027', '2025-2026', ...matchSeasons])).sort().reverse();
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEASONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const matchSeasons = Array.from(new Set((initialData.matches || []).map(m => m.season).filter(Boolean)));
    const merged = Array.from(new Set(['2026-2027', '2025-2026', ...matchSeasons])).sort().reverse();
    return merged;
  });

  const [currentSeason, setCurrentSeason] = useState(() => {
    return seasons[0] || '2026-2027';
  });

  // 6. Brouillon du match en direct
  const [matchDraft, setMatchDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Nettoyage de l'URL si ?demo=quentin était utilisé et déclenchement du toast
  useEffect(() => {
    if (isDemoRequested) {
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      setToastMessage('🏀 Profil et 29 matchs de Quentin rechargés !');
    }
  }, [isDemoRequested]);

  // Disparition automatique du toast après 3.5s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEASONS, JSON.stringify(seasons));
  }, [seasons]);

  const addSeason = (newSeason) => {
    if (!newSeason || typeof newSeason !== 'string') return;
    const clean = newSeason.trim();
    if (!clean) return;
    setSeasons(prev => {
      const updated = Array.from(new Set([clean, ...prev])).sort().reverse();
      return updated;
    });
    setCurrentSeason(clean);
  };

  const updateSeason = (oldSeason, newSeason) => {
    if (!newSeason || typeof newSeason !== 'string') return;
    const clean = newSeason.trim();
    if (!clean || clean === oldSeason) return;

    setSeasons(prev => {
      const updated = prev.map(s => s === oldSeason ? clean : s);
      return Array.from(new Set(updated)).sort().reverse();
    });

    // Mettre à jour les matchs rattachés à cette saison
    setMatches(prev => prev.map(m => m.season === oldSeason ? { ...m, season: clean } : m));

    if (currentSeason === oldSeason) {
      setCurrentSeason(clean);
    }
    setToastMessage(`Saison renommée en "${clean}"`);
  };

  const deleteSeason = (seasonToDelete) => {
    if (seasons.length <= 1) {
      alert('Vous devez conserver au moins une saison.');
      return false;
    }

    const matchesCount = matches.filter(m => m.season === seasonToDelete).length;
    if (matchesCount > 0) {
      const confirmDelete = window.confirm(
        `Cette saison contient ${matchesCount} match(s). Supprimer la saison supprimera également ces matchs. Êtes-vous sûr de vouloir continuer ?`
      );
      if (!confirmDelete) return false;
      setMatches(prev => prev.filter(m => m.season !== seasonToDelete));
    }

    const remaining = seasons.filter(s => s !== seasonToDelete);
    setSeasons(remaining);

    if (currentSeason === seasonToDelete) {
      setCurrentSeason(remaining[0] || '2026-2027');
    }
    setToastMessage(`Saison "${seasonToDelete}" supprimée`);
    return true;
  };

  useEffect(() => {
    if (activePlayerId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PLAYER, activePlayerId);
    }
  }, [activePlayerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    if (matchDraft) {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(matchDraft));
    } else {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    }
  }, [matchDraft]);

  // Recharger les données complètes de Quentin
  const loadQuentinData = () => {
    setPlayers(quentinData.players || []);
    setActivePlayerId(quentinData.players?.[0]?.id || '');
    setMatches(quentinData.matches || []);
    setWorkouts(quentinData.workouts || []);
    const matchSeasons = Array.from(new Set((quentinData.matches || []).map(m => m.season).filter(Boolean)));
    setSeasons(Array.from(new Set(['2026-2027', '2025-2026', ...matchSeasons])).sort().reverse());
    setToastMessage('🏀 Profil et 29 matchs de Quentin rechargés !');
  };

  // Réinitialiser complètement l'application (espace vierge)
  const resetAllData = () => {
    setPlayers([]);
    setActivePlayerId('');
    setMatches([]);
    setWorkouts([]);
    setMatchDraft(null);
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
    localStorage.removeItem(STORAGE_KEY_MATCHES);
    localStorage.removeItem(STORAGE_KEY_WORKOUTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PLAYER);
    localStorage.removeItem(STORAGE_KEY_DRAFT);
    setToastMessage('🗑️ Application réinitialisée (espace vierge)');
  };

  // Joueur actuellement actif
  const activePlayer = players.find(p => p.id === activePlayerId) || players[0] || {
    id: '',
    name: 'Joueur',
    fullName: 'Joueur',
    team: 'U15',
    jerseyNumber: '',
    club: ''
  };

  // Matchs du joueur actif
  const activePlayerMatches = matches.filter(m => m.playerId === activePlayer.id);

  // Séances de shoot du joueur actif
  const activePlayerWorkouts = workouts.filter(w => w.playerId === activePlayer.id);

  // Actions Joueurs
  const addPlayer = (playerData) => {
    const newPlayer = {
      id: `player_${Date.now()}`,
      avatarColor: 'from-blue-500 to-indigo-600',
      ...playerData
    };
    setPlayers(prev => [...prev, newPlayer]);
    setActivePlayerId(newPlayer.id);
    return newPlayer;
  };

  const updatePlayer = (playerId, playerData) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...playerData } : p));
  };

  const deletePlayer = (playerId) => {
    if (players.length <= 1) {
      if (confirm('Ce joueur est le dernier. Supprimer son profil réinitialisera l\'application à l\'état vierge. Confirmer ?')) {
        resetAllData();
      }
      return;
    }
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setMatches(prev => prev.filter(m => m.playerId !== playerId));
    setWorkouts(prev => prev.filter(w => w.playerId !== playerId));
    const remaining = players.filter(p => p.id !== playerId);
    if (remaining.length > 0) {
      setActivePlayerId(remaining[0].id);
    }
  };

  // Actions Matchs
  const saveMatch = (matchData) => {
    const newMatch = {
      id: matchData.id || `match_${Date.now()}`,
      playerId: activePlayer.id,
      season: matchData.season || currentSeason,
      date: matchData.date || new Date().toLocaleDateString('fr-FR'),
      ...matchData
    };

    setMatches(prev => {
      const exists = prev.findIndex(m => m.id === newMatch.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = newMatch;
        return copy;
      }
      return [newMatch, ...prev];
    });

    // Effacer le brouillon une fois le match validé
    setMatchDraft(null);
    return newMatch;
  };

  const deleteMatch = (matchId) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const updateMatch = (matchId, updatedData) => {
    setMatches(prev => {
      return prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            ...updatedData
          };
        }
        return m;
      });
    });
  };

  // Actions Séances de Shoot
  const saveWorkout = (workoutData) => {
    const newWorkout = {
      id: workoutData.id || `workout_${Date.now()}`,
      playerId: activePlayer.id,
      date: workoutData.date || new Date().toLocaleDateString('fr-FR'),
      ...workoutData
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    return newWorkout;
  };

  const deleteWorkout = (workoutId) => {
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const updateWorkout = (workoutId, updatedData) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === workoutId) {
        const made = updatedData.made !== undefined ? parseInt(updatedData.made) || 0 : w.made;
        const missed = updatedData.missed !== undefined ? parseInt(updatedData.missed) || 0 : w.missed;
        const total = made + missed;
        const percentage = total > 0 ? Number(((made / total) * 100).toFixed(1)) : 0;
        return {
          ...w,
          ...updatedData,
          made,
          missed,
          total,
          percentage
        };
      }
      return w;
    }));
    setToastMessage('Séance de shoot mise à jour !');
  };

  // Import global de sauvegarde JSON
  const importBackupData = (imported) => {
    if (!imported) return false;
    if (Array.isArray(imported.players) && imported.players.length > 0) {
      setPlayers(imported.players);
      setActivePlayerId(imported.players[0].id);
    }
    if (Array.isArray(imported.matches)) {
      setMatches(imported.matches);
    }
    if (Array.isArray(imported.workouts)) {
      setWorkouts(imported.workouts);
    }
    if (Array.isArray(imported.seasons) && imported.seasons.length > 0) {
      setSeasons(imported.seasons);
    }
    setToastMessage('✅ Données restaurées avec succès !');
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        players,
        activePlayer,
        activePlayerId,
        setActivePlayerId,
        addPlayer,
        updatePlayer,
        deletePlayer,
        matches,
        activePlayerMatches,
        saveMatch,
        updateMatch,
        deleteMatch,
        workouts,
        activePlayerWorkouts,
        saveWorkout,
        updateWorkout,
        deleteWorkout,
        currentSeason,
        setCurrentSeason,
        seasons,
        addSeason,
        updateSeason,
        deleteSeason,
        matchDraft,
        setMatchDraft,
        importBackupData,
        loadQuentinData,
        resetAllData,
        toastMessage,
        setToastMessage
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé au sein de AppProvider');
  }
  return context;
}
