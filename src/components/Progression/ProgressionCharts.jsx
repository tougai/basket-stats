import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculatePoints,
  calculateQuickScore,
  getCategory,
  parseResult
} from '../../utils/formulas';
import {
  TrendingUp,
  Award,
  Flame,
  Target,
  Zap,
  Calendar,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

export function ProgressionCharts({ onNavigateToMatch }) {
  const {
    activePlayer,
    activePlayerMatches,
    activePlayerWorkouts,
    seasons,
    currentSeason
  } = useApp();

  // Liste des saisons disponibles
  const availableSeasons = Array.from(
    new Set([...(seasons || []), ...activePlayerMatches.map(m => m.season).filter(Boolean)])
  ).sort().reverse();

  if (availableSeasons.length === 0) {
    availableSeasons.push('2026-2027');
  }

  const [selectedSeason, setSelectedSeason] = useState(availableSeasons[0] || 'ALL');
  const [selectedMetric, setSelectedMetric] = useState('points'); // 'points' | 'quickScore' | 'minutes'
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // Trier les matchs chronologiquement (du plus ancien au plus récent pour tracer la courbe)
  const parseMatchDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const trimmed = dateStr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        return new Date(year, month, day).getTime();
      }
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Filtrer les matchs par saison
  const seasonMatches = activePlayerMatches.filter(m => {
    if (selectedSeason === 'ALL') return true;
    return m.season === selectedSeason;
  });

  // Trier chronologiquement pour la courbe
  const chronologicalMatches = [...seasonMatches].sort((a, b) => {
    const timeA = parseMatchDate(a.date);
    const timeB = parseMatchDate(b.date);
    return timeA - timeB;
  });

  // Données des matchs enrichies
  const dataPoints = chronologicalMatches.map((m, index) => {
    const pts = parseInt(m.points) || calculatePoints(m.pts2Made, m.pts3Made, m.ftMade);
    const qs = calculateQuickScore({ ...m, points: pts });
    const mins = parseInt(m.minutes) || 0;
    const cat = getCategory(qs, mins);
    const parsed = parseResult(m.result);

    return {
      index,
      id: m.id,
      date: m.date,
      opponent: m.opponent || `Match ${index + 1}`,
      points: pts,
      quickScore: qs,
      minutes: mins,
      category: cat,
      result: m.result,
      isWin: parsed.isWin,
      pts2Made: parseInt(m.pts2Made) || 0,
      pts3Made: parseInt(m.pts3Made) || 0,
      ftMade: parseInt(m.ftMade) || 0,
      reb: parseInt(m.reb) || 0,
      ast: parseInt(m.ast) || 0,
      stl: parseInt(m.stl) || 0,
      def: parseInt(m.def) || 0
    };
  });

  // Statistiques globales
  const totalMatches = dataPoints.length;
  const totalPoints = dataPoints.reduce((acc, p) => acc + p.points, 0);
  const avgPoints = totalMatches > 0 ? (totalPoints / totalMatches).toFixed(1) : '0.0';
  const totalQS = dataPoints.reduce((acc, p) => acc + p.quickScore, 0);
  const avgQS = totalMatches > 0 ? (totalQS / totalMatches).toFixed(1) : '0.0';

  // Record de points (Career High)
  const careerHigh = dataPoints.reduce((max, p) => (p.points > max.points ? p : max), { points: 0, opponent: 'Aucun' });

  // Record de Quick Score
  const peakQS = dataPoints.reduce((max, p) => (p.quickScore > max.quickScore ? p : max), { quickScore: 0, opponent: 'Aucun' });

  // Tendance sur les 3 derniers matchs
  let trendPoints = 0;
  let trendIcon = Minus;
  let trendColor = 'text-slate-400';
  let trendText = 'Stable';

  if (totalMatches >= 3) {
    const last3 = dataPoints.slice(-3);
    const last3Avg = last3.reduce((acc, p) => acc + p.points, 0) / 3;
    const overallAvg = parseFloat(avgPoints);
    const diff = Number((last3Avg - overallAvg).toFixed(1));
    trendPoints = diff;

    if (diff > 0.5) {
      trendIcon = ArrowUpRight;
      trendColor = 'text-emerald-400';
      trendText = `+${diff} pts sur les 3 derniers matchs`;
    } else if (diff < -0.5) {
      trendIcon = ArrowDownRight;
      trendColor = 'text-amber-400';
      trendText = `${diff} pts sur les 3 derniers matchs`;
    } else {
      trendIcon = Minus;
      trendColor = 'text-slate-400';
      trendText = `En ligne avec la moyenne (${avgPoints} pts)`;
    }
  }

  // Répartition des points (2PT, 3PT, LF)
  const total2Pt = dataPoints.reduce((acc, p) => acc + p.pts2Made * 2, 0);
  const total3Pt = dataPoints.reduce((acc, p) => acc + p.pts3Made * 3, 0);
  const totalFT = dataPoints.reduce((acc, p) => acc + p.ftMade, 0);
  const totalPointsBreakdown = total2Pt + total3Pt + totalFT;

  const pct2Pt = totalPointsBreakdown > 0 ? Math.round((total2Pt / totalPointsBreakdown) * 100) : 0;
  const pct3Pt = totalPointsBreakdown > 0 ? Math.round((total3Pt / totalPointsBreakdown) * 100) : 0;
  const pctFT = totalPointsBreakdown > 0 ? Math.round((totalFT / totalPointsBreakdown) * 100) : 0;

  // Détail du point actif (cliqué ou dernier par défaut)
  const activeDetailPoint = selectedPointIndex !== null && dataPoints[selectedPointIndex]
    ? dataPoints[selectedPointIndex]
    : dataPoints[dataPoints.length - 1];

  // Calcul coordonnées SVG pour la courbe
  const svgWidth = 360;
  const svgHeight = 170;
  const padX = 24;
  const padTop = 20;
  const padBottom = 26;

  const plotWidth = svgWidth - padX * 2;
  const plotHeight = svgHeight - padTop - padBottom;

  const currentValues = dataPoints.map(p => p[selectedMetric]);
  const maxVal = Math.max(...currentValues, selectedMetric === 'points' ? 15 : 20, 5);
  const minVal = 0;

  const getCoordinates = (index, val) => {
    const x = totalMatches <= 1
      ? svgWidth / 2
      : padX + (index / (totalMatches - 1)) * plotWidth;
    const ratio = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
    const y = padTop + plotHeight - ratio * plotHeight;
    return { x, y };
  };

  const pointsString = dataPoints
    .map((p, idx) => {
      const { x, y } = getCoordinates(idx, p[selectedMetric]);
      return `${x},${y}`;
    })
    .join(' ');

  // Zone fermée sous la courbe pour le dégradé
  const areaString = totalMatches > 0
    ? `${pointsString} ${getCoordinates(totalMatches - 1, 0).x},${padTop + plotHeight} ${getCoordinates(0, 0).x},${padTop + plotHeight}`
    : '';

  // Ligne de référence de la moyenne
  const avgVal = selectedMetric === 'points'
    ? parseFloat(avgPoints)
    : selectedMetric === 'quickScore'
    ? parseFloat(avgQS)
    : 0;
  const avgY = padTop + plotHeight - ((avgVal - minVal) / (maxVal - minVal || 1)) * plotHeight;

  return (
    <div className="space-y-4 pb-28 max-w-md mx-auto select-none animate-in fade-in duration-200">
      {/* 1. EN-TÊTE JOUEUR & SÉLECTEUR DE SAISON */}
      <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-mono font-black text-white text-lg shadow-md overflow-hidden relative shrink-0">
              {activePlayer.photoUrl ? (
                <img src={activePlayer.photoUrl} alt={activePlayer.name} className="w-full h-full object-cover" />
              ) : (
                <span>#{activePlayer.jerseyNumber || '?'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white leading-tight">
                  Progression de {activePlayer.name}
                </h2>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Courbes de forme, records & constance
              </div>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
            {totalMatches} match{totalMatches > 1 ? 's' : ''}
          </span>
        </div>

        {/* Sélecteur de saison */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {availableSeasons.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSelectedSeason(s);
                setSelectedPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                selectedSeason === s
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setSelectedSeason('ALL');
              setSelectedPointIndex(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedSeason === 'ALL'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {totalMatches === 0 ? (
        /* ÉTAT VIDE : Aucun match */
        <div className="bg-slate-850/80 border border-slate-750 p-6 rounded-3xl text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto text-2xl">
            📈
          </div>
          <h3 className="text-sm font-black text-white">Pas encore assez de données</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Enregistrez les premiers matchs de {activePlayer.name} pour voir ses courbes de progression se dessiner automatiquement !
          </p>
          {onNavigateToMatch && (
            <button
              type="button"
              onClick={onNavigateToMatch}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition"
            >
              <Activity className="w-4 h-4" />
              <span>Enregistrer un match</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 2. CARTES KPI CLÉS DE PROGRESSION */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Record de points (Career High) */}
            <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Record Points</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{careerHigh.date}</span>
              </div>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {careerHigh.points} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                vs {careerHigh.opponent}
              </div>
            </div>

            {/* Pic de Quick Score */}
            <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Pic Quick Score</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{peakQS.date}</span>
              </div>
              <div className="text-3xl font-black font-mono text-cyan-300 mt-1">
                {peakQS.quickScore} <span className="text-xs font-normal text-slate-400">QS</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                vs {peakQS.opponent}
              </div>
            </div>

            {/* Moyenne Points & Tendance */}
            <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
              <div className="text-[10px] font-bold uppercase text-orange-400 tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>Moyenne Points</span>
              </div>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {avgPoints} <span className="text-xs font-normal text-slate-400">pts/m</span>
              </div>
              <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${trendColor}`}>
                {React.createElement(trendIcon, { className: 'w-3 h-3 shrink-0' })}
                <span className="truncate">{trendText}</span>
              </div>
            </div>

            {/* Quick Score Moyen */}
            <div className="bg-slate-850/80 border border-slate-750 p-3.5 rounded-3xl">
              <div className="text-[10px] font-bold uppercase text-purple-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Impact Moyen</span>
              </div>
              <div className="text-3xl font-black font-mono text-purple-300 mt-1">
                {avgQS} <span className="text-xs font-normal text-slate-400">QS/m</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Sur {totalMatches} match{totalMatches > 1 ? 's' : ''} analysé{totalMatches > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* 3. GRAPHIQUE INTERACTIF PRINCIPAL */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>Évolution Match après Match</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Appuyez sur un point pour voir le détail
                </p>
              </div>

              {/* Sélecteur de métrique */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedMetric('points')}
                  className={`px-2 py-1 rounded-lg transition ${
                    selectedMetric === 'points'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Points
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMetric('quickScore')}
                  className={`px-2 py-1 rounded-lg transition ${
                    selectedMetric === 'quickScore'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Score
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMetric('minutes')}
                  className={`px-2 py-1 rounded-lg transition ${
                    selectedMetric === 'minutes'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Minutes
                </button>
              </div>
            </div>

            {/* Zone graphique SVG responsive */}
            <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2 pt-3">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Dégradé sous la courbe Points */}
                  <linearGradient id="curveGradientPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Dégradé sous la courbe Quick Score */}
                  <linearGradient id="curveGradientQS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Dégradé sous la courbe Minutes */}
                  <linearGradient id="curveGradientMins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Lignes de grille horizontales */}
                <line
                  x1={padX}
                  y1={padTop}
                  x2={svgWidth - padX}
                  y2={padTop}
                  stroke="#334155"
                  strokeDasharray="2,3"
                  strokeWidth="1"
                />
                <line
                  x1={padX}
                  y1={padTop + plotHeight / 2}
                  x2={svgWidth - padX}
                  y2={padTop + plotHeight / 2}
                  stroke="#334155"
                  strokeDasharray="2,3"
                  strokeWidth="1"
                />
                <line
                  x1={padX}
                  y1={padTop + plotHeight}
                  x2={svgWidth - padX}
                  y2={padTop + plotHeight}
                  stroke="#475569"
                  strokeWidth="1"
                />

                {/* Ligne de moyenne de saison en pointillés */}
                {avgVal > 0 && (
                  <g>
                    <line
                      x1={padX}
                      y1={avgY}
                      x2={svgWidth - padX}
                      y2={avgY}
                      stroke={selectedMetric === 'points' ? '#F97316' : '#06B6D4'}
                      strokeDasharray="4,4"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                    <text
                      x={svgWidth - padX + 2}
                      y={avgY + 3}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      Moy: {avgVal}
                    </text>
                  </g>
                )}

                {/* Remplissage dégradé sous la courbe */}
                {areaString && (
                  <polygon
                    points={areaString}
                    fill={
                      selectedMetric === 'points'
                        ? 'url(#curveGradientPoints)'
                        : selectedMetric === 'quickScore'
                        ? 'url(#curveGradientQS)'
                        : 'url(#curveGradientMins)'
                    }
                  />
                )}

                {/* Courbe principale */}
                {totalMatches > 1 && (
                  <polyline
                    fill="none"
                    stroke={
                      selectedMetric === 'points'
                        ? '#F97316'
                        : selectedMetric === 'quickScore'
                        ? '#06B6D4'
                        : '#14B8A6'
                    }
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                  />
                )}

                {/* Points individuels */}
                {dataPoints.map((p, idx) => {
                  const { x, y } = getCoordinates(idx, p[selectedMetric]);
                  const isSelected = (selectedPointIndex !== null && selectedPointIndex === idx) ||
                    (selectedPointIndex === null && idx === dataPoints.length - 1);

                  return (
                    <g
                      key={p.id}
                      onClick={() => setSelectedPointIndex(idx)}
                      className="cursor-pointer"
                    >
                      {/* Zone cliquable plus large pour mobile */}
                      <circle cx={x} cy={y} r="14" fill="transparent" />

                      {/* Halo pour point sélectionné */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill={selectedMetric === 'points' ? '#F97316' : '#06B6D4'}
                          opacity="0.3"
                          className="animate-ping"
                        />
                      )}

                      {/* Cercle du point */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? "5" : "3.5"}
                        fill={isSelected ? "#FFFFFF" : selectedMetric === 'points' ? '#FB923C' : '#38BDF8'}
                        stroke={selectedMetric === 'points' ? '#C2410C' : '#0284C7'}
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                      />

                      {/* Valeur textuelle au-dessus du point */}
                      <text
                        x={x}
                        y={y - 8}
                        fill={isSelected ? "#FFFFFF" : "#CBD5E1"}
                        fontSize={isSelected ? "10" : "8"}
                        fontWeight={isSelected ? "bold" : "normal"}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {p[selectedMetric]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Carte de détail du match sélectionné */}
            {activeDetailPoint && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">
                      vs {activeDetailPoint.opponent}
                    </span>
                    {activeDetailPoint.result && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        activeDetailPoint.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {activeDetailPoint.result}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeDetailPoint.date}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-850 p-2 rounded-xl">
                    <div className="text-[9px] uppercase font-bold text-orange-400">Points</div>
                    <div className="text-base font-black font-mono text-white mt-0.5">
                      {activeDetailPoint.points}
                    </div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-xl">
                    <div className="text-[9px] uppercase font-bold text-cyan-400">Quick Score</div>
                    <div className="text-base font-black font-mono text-cyan-300 mt-0.5">
                      {activeDetailPoint.quickScore}
                    </div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-xl">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Minutes</div>
                    <div className="text-base font-black font-mono text-slate-200 mt-0.5">
                      {activeDetailPoint.minutes}
                    </div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-xl">
                    <div className="text-[9px] uppercase font-bold text-teal-400">Reb / Ast</div>
                    <div className="text-base font-black font-mono text-teal-300 mt-0.5">
                      {activeDetailPoint.reb}/{activeDetailPoint.ast}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. RÉPARTITION DES POINTS (2PT vs 3PT vs LANCERS FRANCS) */}
          <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Répartition des Points
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  D'où proviennent les paniers marqués
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-xl">
                {totalPointsBreakdown} pts au total
              </span>
            </div>

            {/* Barre de répartition segmentée */}
            {totalPointsBreakdown > 0 ? (
              <div className="space-y-2.5">
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-800 border border-slate-750">
                  {pct2Pt > 0 && (
                    <div
                      style={{ width: `${pct2Pt}%` }}
                      className="bg-orange-500 h-full transition-all duration-300"
                      title={`Tirs à 2 pts : ${pct2Pt}% (${total2Pt} pts)`}
                    />
                  )}
                  {pct3Pt > 0 && (
                    <div
                      style={{ width: `${pct3Pt}%` }}
                      className="bg-cyan-500 h-full transition-all duration-300"
                      title={`Tirs à 3 pts : ${pct3Pt}% (${total3Pt} pts)`}
                    />
                  )}
                  {pctFT > 0 && (
                    <div
                      style={{ width: `${pctFT}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                      title={`Lancers Francs : ${pctFT}% (${totalFT} pts)`}
                    />
                  )}
                </div>

                {/* Légende détaillée */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-center gap-1.5 text-orange-400 font-bold text-[10px] uppercase">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>2 Points</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">{total2Pt} pts</div>
                    <div className="text-[10px] text-slate-400">{pct2Pt}%</div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>3 Points</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">{total3Pt} pts</div>
                    <div className="text-[10px] text-slate-400">{pct3Pt}%</div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Lancers (FT)</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">{totalFT} pts</div>
                    <div className="text-[10px] text-slate-400">{pctFT}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                Aucun point enregistré pour le moment.
              </p>
            )}
          </div>

          {/* 5. HISTORIQUE DE PROGRESSION DES SÉANCES DE SHOOT */}
          {activePlayerWorkouts.length > 0 && (
            <div className="bg-slate-850/80 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Progression aux Entraînements</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Pourcentages de réussite aux shoots
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-xl">
                  {activePlayerWorkouts.length} séance{activePlayerWorkouts.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {activePlayerWorkouts.slice(0, 5).map(w => (
                  <div
                    key={w.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 px-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{w.title}</span>
                        <span className="text-[10px] text-slate-400">{w.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {w.made}/{w.total} tirs rentrés {w.notes ? `• "${w.notes}"` : ''}
                      </div>
                    </div>

                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                      w.percentage >= 70
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : w.percentage >= 50
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {w.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
