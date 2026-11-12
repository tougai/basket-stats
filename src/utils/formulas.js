/**
 * Formules de calcul basketball conformes au modèle Google Sheets
 */

/**
 * Calcule le total des points marqués
 */
export function calculatePoints(pts2Made = 0, pts3Made = 0, ftMade = 0) {
  const p2 = parseInt(pts2Made) || 0;
  const p3 = parseInt(pts3Made) || 0;
  const ft = parseInt(ftMade) || 0;
  return (p2 * 2) + (p3 * 3) + ft;
}

/**
 * Analyse une chaîne de résultat (ex: "73-44 W", "61-62 L", "75-60")
 */
export function parseResult(resultStr = '') {
  if (!resultStr || typeof resultStr !== 'string') {
    return { teamScore: 0, opponentScore: 0, isWin: null, raw: '' };
  }

  const clean = resultStr.trim();
  const match = clean.match(/^(\d+)\s*[-/]\s*(\d+)(?:\s*([WLwl]))?/);
  if (!match) {
    return { teamScore: 0, opponentScore: 0, isWin: null, raw: clean };
  }

  const teamScore = parseInt(match[1]) || 0;
  const opponentScore = parseInt(match[2]) || 0;
  let isWin = teamScore > opponentScore;
  if (match[3]) {
    isWin = match[3].toUpperCase() === 'W';
  }

  return { teamScore, opponentScore, isWin, raw: clean };
}

/**
 * Calcule le % de temps de jeu (% min)
 */
export function calculateMinPercentage(minutes = 0, matchDuration = 40) {
  const min = parseFloat(minutes) || 0;
  const dur = parseFloat(matchDuration) || 40;
  if (min <= 0 || dur <= 0) return 0;
  return min / dur;
}

/**
 * Calcule le % de points par rapport au score total de l'équipe
 */
export function calculatePointsPercentage(points = 0, teamScore = 0) {
  const pts = parseFloat(points) || 0;
  const total = parseFloat(teamScore) || 0;
  if (pts <= 0 || total <= 0) return 0;
  return pts / total;
}

/**
 * Calcule la Valeur Ajoutée (Efficacité offensive normalisée au temps de jeu)
 * Formule du tableur : ROUND(((Points / (ScoreEquipe / 5)) / (Minutes / Duree)) * 100, 0)
 */
export function calculateValeurAjoutee(points = 0, teamScore = 0, minutes = 0, matchDuration = 40) {
  const pts = parseFloat(points) || 0;
  const totalScore = parseFloat(teamScore) || 0;
  const min = parseFloat(minutes) || 0;
  const dur = parseFloat(matchDuration) || 40;

  if (min <= 0 || totalScore <= 0 || dur <= 0) return 0;

  const expectedScorePerPlayer = totalScore / 5;
  if (expectedScorePerPlayer <= 0) return 0;

  const scoringRatio = pts / expectedScorePerPlayer;
  const timeRatio = min / dur;

  if (timeRatio <= 0) return 0;

  return Math.round((scoringRatio / timeRatio) * 100);
}

/**
 * Calcule l'évaluation (Efficiency simplifiée du modèle)
 * Formule : Points + RebTot + AST + STL + DEF - PF
 */
export function calculateEfficiency(match = {}) {
  const pts = parseInt(match.points) || calculatePoints(match.pts2Made, match.pts3Made, match.ftMade);
  const reb = parseInt(match.reb) || 0;
  const ast = parseInt(match.ast) || 0;
  const stl = parseInt(match.stl) || 0;
  const def = parseInt(match.def) || 0;
  const pf = parseInt(match.pf) || 0;

  return pts + reb + ast + stl + def - pf;
}

/**
 * Calcule le Quick Score
 * Formule du tableur : Points + RebTot + (AST * 2) + (STL * 2) + (DEF * 2) - PF
 * Normalisé sur une base de 40 minutes (format standard) pour ne pas pénaliser
 * les formats de match réduits (ex: tournois 20 min ou jeunes 32 min vs 40 min).
 */
export function calculateQuickScore(match = {}, baseDuration = 40) {
  const pts = parseInt(match.points) || calculatePoints(match.pts2Made, match.pts3Made, match.ftMade);
  const reb = parseInt(match.reb) || 0;
  const ast = parseInt(match.ast) || 0;
  const stl = parseInt(match.stl) || 0;
  const def = parseInt(match.def) || 0;
  const pf = parseInt(match.pf) || 0;

  const rawScore = pts + reb + (ast * 2) + (stl * 2) + (def * 2) - pf;

  const matchDuration = parseFloat(match.matchDuration) || parseFloat(match.duration) || baseDuration;
  if (matchDuration <= 0 || matchDuration === baseDuration) {
    return rawScore;
  }

  // Normalisation au format standard (40 min)
  return Math.round(rawScore * (baseDuration / matchDuration));
}

/**
 * Détermine la catégorie de performance d'après le Quick Score
 */
export function getCategory(quickScore = 0, minutes = 1) {
  if (minutes === 0) {
    return {
      label: 'Pas joué',
      emoji: '⚪',
      color: 'gray',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      pillClass: 'bg-slate-700 text-slate-300'
    };
  }

  const qs = parseInt(quickScore) || 0;

  if (qs <= 10) {
    return {
      label: 'Faible',
      emoji: '🔴',
      color: 'red',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      pillClass: 'bg-red-500 text-white'
    };
  }
  if (qs <= 20) {
    return {
      label: 'Moyen',
      emoji: '🟡',
      color: 'yellow',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      pillClass: 'bg-amber-500 text-slate-900'
    };
  }
  if (qs <= 30) {
    return {
      label: 'Bon',
      emoji: '🟢',
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      pillClass: 'bg-emerald-500 text-white'
    };
  }
  if (qs <= 40) {
    return {
      label: 'Très bon',
      emoji: '🟢',
      color: 'green',
      badgeClass: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      pillClass: 'bg-teal-500 text-slate-950 font-bold'
    };
  }

  return {
    label: 'Excellent',
    emoji: '⭐',
    color: 'purple',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    pillClass: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold'
  };
}

/**
 * Calcule les statistiques d'un ensemble de tirs d'entraînement
 */
export function calculateShootingAccuracy(made = 0, missed = 0) {
  const m = parseInt(made) || 0;
  const miss = parseInt(missed) || 0;
  const total = m + miss;
  const percentage = total > 0 ? Math.round((m / total) * 1000) / 10 : 0;

  let color = 'text-slate-400';
  let badge = 'bg-slate-800 text-slate-300';
  if (total >= 5) {
    if (percentage >= 70) {
      color = 'text-emerald-400';
      badge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    } else if (percentage >= 50) {
      color = 'text-amber-400';
      badge = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    } else {
      color = 'text-red-400';
      badge = 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  }

  return { made: m, missed: miss, total, percentage, color, badge };
}
