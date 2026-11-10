import React, { createContext, useContext, useState, useEffect } from 'react';
import initialData from '../data/initialData.json';

const AppContext = createContext();

const STORAGE_KEY_PLAYERS = 'basket_stats_players_v1';
const STORAGE_KEY_MATCHES = 'basket_stats_matches_v1';
const STORAGE_KEY_WORKOUTS = 'basket_stats_workouts_v1';
const STORAGE_KEY_ACTIVE_PLAYER = 'basket_stats_active_player_v1';
const STORAGE_KEY_DRAFT = 'basket_stats_match_draft_v1';
const STORAGE_KEY_SEASONS = 'basket_stats_seasons_v1';

export function AppProvider({ children }) {
  // 1. Initialiser la liste des joueurs
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur chargement joueurs', e);
    }
    return initialData.players || [];
  });

  // 2. Joueur actif sélectionné
  const [activePlayerId, setActivePlayerId] = useState(() => {
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
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur chargement matchs', e);
    }
    return initialData.matches || [];
  });

  // 4. Séances de shoots (Workouts)
  const [workouts, setWorkouts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKOUTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur chargement séances', e);
    }
    return initialData.workouts || [];
  });

  // 5. Gestion des saisons (liste dynamique et saison courante)
  const [seasons, setSeasons] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEASONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Récupérer toutes les saisons existantes dans les données
    const matchSeasons = Array.from(new Set((initialData.matches || []).map(m => m.season).filter(Boolean)));
    const merged = Array.from(new Set(['2026-2027', '2025-2026', ...matchSeasons])).sort().reverse();
    return merged;
  });

  const [currentSeason, setCurrentSeason] = useState(() => {
    return seasons[0] || '2026-2027';
  });

  // 6. Brouillon du match en direct (pour reprise immédiate sans perte)
  const [matchDraft, setMatchDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

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

  // Joueur actuellement actif
  const activePlayer = players.find(p => p.id === activePlayerId) || players[0] || {
    id: 'default',
    name: 'Joueur',
    fullName: 'Joueur',
    team: 'U15',
    jerseyNumber: '1',
    club: 'Club'
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
      alert('Vous devez conserver au moins un profil.');
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
        deleteMatch,
        workouts,
        activePlayerWorkouts,
        saveWorkout,
        deleteWorkout,
        currentSeason,
        setCurrentSeason,
        seasons,
        addSeason,
        matchDraft,
        setMatchDraft,
        importBackupData
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
