import * as XLSX from 'xlsx';
import {
  calculatePoints,
  parseResult,
  calculateMinPercentage,
  calculatePointsPercentage,
  calculateValeurAjoutee,
  calculateEfficiency,
  calculateQuickScore,
  getCategory
} from './formulas';

/**
 * Exporte les matchs d'un joueur sous forme de classeur Excel .xlsx
 * respectant scrupuleusement la structure des 21 colonnes du tableur d'origine.
 */
export function exportMatchesToExcel(player, matches = [], workouts = []) {
  const wb = XLSX.utils.book_new();

  // Regrouper les matchs par saison
  const seasonsMap = {};
  matches.forEach(m => {
    const s = m.season || '2025-2026';
    if (!seasonsMap[s]) seasonsMap[s] = [];
    seasonsMap[s].push(m);
  });

  // Si aucun match, créer au moins la saison en cours
  if (Object.keys(seasonsMap).length === 0) {
    seasonsMap['2025-2026'] = [];
  }

  // Créer une feuille par saison (ex: "U15M R2 2025-2026")
  Object.keys(seasonsMap).sort().reverse().forEach(seasonName => {
    const seasonMatches = seasonsMap[seasonName];
    const sheetData = [];

    // Ligne 1 : En-têtes (Colonnes A à U)
    sheetData.push([
      'Date',            // A
      'Type',            // B
      'Adversaire',      // C
      'Résultat',        // D
      'Minutes',         // E
      '% min',           // F
      'Points',          // G
      '% points',        // H
      'Valeur Ajoutee',  // I
      '2PT',             // J
      '3PT',             // K
      'FT',              // L
      'Reb (Tot)',       // M
      'DREB',            // N
      'AST',             // O
      'STL',             // P
      'DEF',             // Q
      'PF',              // R
      'Efficiency',      // S
      'Quick Score',     // T
      'Categorie'        // U
    ]);

    // Lignes de données
    seasonMatches.forEach(m => {
      const minutes = parseInt(m.minutes) || 0;
      const parsedRes = parseResult(m.result);
      const points = parseInt(m.points) || calculatePoints(m.pts2Made, m.pts3Made, m.ftMade);
      const matchDuration = m.matchDuration || 40;
      const minPct = minutes > 0 ? Number((calculateMinPercentage(minutes, matchDuration) * 100).toFixed(1)) + '%' : 'Pas joué';
      const ptsPct = (minutes > 0 && parsedRes.teamScore > 0)
        ? Number((calculatePointsPercentage(points, parsedRes.teamScore) * 100).toFixed(1)) + '%'
        : (minutes === 0 ? 'Pas joué' : '0%');
      const va = minutes > 0 ? calculateValeurAjoutee(points, parsedRes.teamScore, minutes, matchDuration) : 'Pas joué';
      const eff = minutes > 0 ? calculateEfficiency(m) : 'Pas joué';
      const qs = minutes > 0 ? calculateQuickScore(m) : 'Pas joué';
      const cat = getCategory(qs, minutes).label;

      sheetData.push([
        m.date || '',
        m.type || '',
        m.opponent || '',
        m.result || '',
        minutes,
        minPct,
        points,
        ptsPct,
        va,
        parseInt(m.pts2Made) || 0,
        parseInt(m.pts3Made) || 0,
        parseInt(m.ftMade) || 0,
        parseInt(m.reb) || 0,
        parseInt(m.dreb) || 0,
        parseInt(m.ast) || 0,
        parseInt(m.stl) || 0,
        parseInt(m.def) || 0,
        parseInt(m.pf) || 0,
        eff,
        qs,
        cat
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Définir des largeurs de colonnes agréables
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 20 }, // Type
      { wch: 18 }, // Adversaire
      { wch: 14 }, // Résultat
      { wch: 10 }, // Minutes
      { wch: 10 }, // % min
      { wch: 10 }, // Points
      { wch: 10 }, // % points
      { wch: 15 }, // Valeur Ajoutee
      { wch: 8 },  // 2PT
      { wch: 8 },  // 3PT
      { wch: 8 },  // FT
      { wch: 10 }, // Reb
      { wch: 8 },  // DREB
      { wch: 8 },  // AST
      { wch: 8 },  // STL
      { wch: 8 },  // DEF
      { wch: 8 },  // PF
      { wch: 12 }, // Efficiency
      { wch: 12 }, // Quick Score
      { wch: 14 }  // Categorie
    ];

    const cleanSheetName = `${player.team || 'U15'} ${seasonName}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });

  // Ajouter un onglet Séances de Shoot si disponibles
  if (workouts && workouts.length > 0) {
    const workoutData = [
      ['Date', 'Atelier', 'Tirs Réussis', 'Tirs Ratés', 'Total Tirs', '% Réussite', 'Durée (min)', 'Remarques']
    ];

    workouts.forEach(w => {
      workoutData.push([
        w.date || '',
        w.title || w.category || '',
        w.made || 0,
        w.missed || 0,
        (w.made || 0) + (w.missed || 0),
        `${w.percentage || 0}%`,
        w.durationMinutes || '',
        w.notes || ''
      ]);
    });

    const wsWorkouts = XLSX.utils.aoa_to_sheet(workoutData);
    wsWorkouts['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsWorkouts, 'Séances de Shoot');
  }

  // Déclencher le téléchargement du fichier
  const fileName = `stats_basket_${player.name.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exporte les données complètes au format JSON pour sauvegarde / transfert
 */
export function exportBackupJSON(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `basket_stats_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
