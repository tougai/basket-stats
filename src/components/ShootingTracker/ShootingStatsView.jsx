import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Plus } from 'lucide-react';

// Fonction de parsing des dates JJ/MM/AAAA pour le tri chronologique
function parseDateFr(dStr) {
  if (!dStr || typeof dStr !== 'string') return 0;
  const parts = dStr.split('/');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  }
  return new Date(dStr).getTime() || 0;
}

export function ShootingStatsView({ workouts = [], activePlayer = {}, onSwitchToLive, onOpenSpotEntry }) {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedSpotIndex, setSelectedSpotIndex] = useState(null); // Pour zoom sur un spot
  const [selectedPointIndex, setSelectedPointIndex] = useState(null); // Pour zoom sur un point du graph

  // Catégories uniques disponibles
  const categories = useMemo(() => {
    const cats = new Set(workouts.map(w => w.category).filter(Boolean));
    return ['Tous', ...Array.from(cats)];
  }, [workouts]);

  // Filtrage des séances par catégorie
  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === 'Tous') return workouts;
    return workouts.filter(w => w.category === selectedCategory);
  }, [workouts, selectedCategory]);

  // Séances triées par date chronologique (du plus ancien au plus récent pour la courbe)
  const chronologicalWorkouts = useMemo(() => {
    return [...filteredWorkouts].sort((a, b) => parseDateFr(a.date) - parseDateFr(b.date));
  }, [filteredWorkouts]);

  // Calcul des statistiques globales sur la sélection
  const globalStats = useMemo(() => {
    let totalMade = 0;
    let totalAttempted = 0;
    let bestPercentage = 0;
    let bestSession = null;

    filteredWorkouts.forEach(w => {
      const m = parseInt(w.made) || 0;
      const t = parseInt(w.total) || 0;
      totalMade += m;
      totalAttempted += t;
      const pct = parseFloat(w.percentage) || (t > 0 ? (m / t) * 100 : 0);
      if (pct > bestPercentage) {
        bestPercentage = pct;
        bestSession = w;
      }
    });

    const overallPct = totalAttempted > 0
      ? Number(((totalMade / totalAttempted) * 100).toFixed(1))
      : 0;

    return {
      totalMade,
      totalAttempted,
      overallPct,
      count: filteredWorkouts.length,
      bestPercentage,
      bestSession
    };
  }, [filteredWorkouts]);

  // Analyse et cumul par Spot (3 Points ou séances avec spots)
  const spotAnalytics = useMemo(() => {
    // Séances ayant des spots définis
    const spotWorkouts = chronologicalWorkouts.filter(w => Array.isArray(w.spots) && w.spots.length > 0);
    if (spotWorkouts.length === 0) return null;

    // Ordre standard des 5 spots
    const spotNames = ['Corner Droit', '45° Droit', 'Axe', '45° Gauche', 'Corner Gauche'];
    const spotsData = {};

    spotNames.forEach(name => {
      spotsData[name] = {
        name,
        totalMade: 0,
        totalAttempted: 0,
        history: [] // { date, made, total, pct, tour1, tour2 }
      };
    });

    spotWorkouts.forEach(w => {
      w.spots.forEach(s => {
        if (spotsData[s.name]) {
          spotsData[s.name].totalMade += (parseInt(s.made) || 0);
          spotsData[s.name].totalAttempted += (parseInt(s.total) || 0);
          spotsData[s.name].history.push({
            date: w.date,
            workoutId: w.id,
            made: s.made,
            total: s.total,
            tour1: s.tour1,
            tour2: s.tour2,
            pct: s.pct !== undefined ? s.pct : Number(((s.made / s.total) * 100).toFixed(1))
          });
        }
      });
    });

    // Calcul du % cumulé pour chaque spot
    const spotsList = spotNames.map(name => {
      const data = spotsData[name];
      const pct = data.totalAttempted > 0
        ? Number(((data.totalMade / data.totalAttempted) * 100).toFixed(1))
        : 0;

      // Tendance : différence entre la dernière séance et la première
      let trendDiff = 0;
      if (data.history.length >= 2) {
        const first = data.history[0].pct;
        const last = data.history[data.history.length - 1].pct;
        trendDiff = Number((last - first).toFixed(1));
      }

      return {
        ...data,
        overallPct: pct,
        trendDiff
      };
    });

    return {
      dates: spotWorkouts.map(w => w.date),
      workouts: spotWorkouts,
      spots: spotsList
    };
  }, [chronologicalWorkouts]);

  // Points pour le graphique SVG d'évolution chronologique
  const chartPoints = useMemo(() => {
    if (chronologicalWorkouts.length === 0) return [];
    return chronologicalWorkouts.map((w, idx) => ({
      index: idx,
      id: w.id,
      date: w.date,
      title: w.title,
      category: w.category,
      percentage: parseFloat(w.percentage) || 0,
      made: w.made,
      total: w.total,
      notes: w.notes,
      spots: w.spots
    }));
  }, [chronologicalWorkouts]);

  // Dimensions SVG pour la courbe d'évolution
  const svgWidth = 460;
  const svgHeight = 180;
  const paddingX = 35;
  const paddingY = 25;

  const minPct = 0;
  const maxPct = 100;

  const getCoordinates = (index, value) => {
    const total = chartPoints.length;
    const x = total <= 1
      ? svgWidth / 2
      : paddingX + (index / (total - 1)) * (svgWidth - paddingX * 2);
    const clampedVal = Math.max(minPct, Math.min(maxPct, value));
    const y = svgHeight - paddingY - ((clampedVal - minPct) / (maxPct - minPct)) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const polylinePoints = chartPoints.map((p, i) => {
    const { x, y } = getCoordinates(i, p.percentage);
    return `${x},${y}`;
  }).join(' ');

  const areaPolygonPoints = chartPoints.length > 1
    ? `${getCoordinates(0, 0).x},${svgHeight - paddingY} ${polylinePoints} ${getCoordinates(chartPoints.length - 1, 0).x},${svgHeight - paddingY}`
    : '';

  // Point actif pour le tooltip / détail de la courbe
  const activeChartPoint = selectedPointIndex !== null && chartPoints[selectedPointIndex]
    ? chartPoints[selectedPointIndex]
    : (chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null);

  // Spot actif sélectionné pour le détail
  const activeSpot = selectedSpotIndex !== null && spotAnalytics?.spots?.[selectedSpotIndex]
    ? spotAnalytics.spots[selectedSpotIndex]
    : null;

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto select-none animate-in fade-in duration-200">
      
      {/* 1. EN-TÊTE & BOUTONS D'ACTION RAPIDE */}
      <div className="bg-slate-850/90 border border-slate-750 p-3.5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-tight">
                  Analyses & Évolution des Shoots
                </h2>
                {activePlayer?.name && (
                  <span className="text-[10px] font-bold bg-orange-500/15 text-orange-400 px-1.5 py-0.2 rounded-md border border-orange-500/30">
                    {activePlayer.name}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Progression globale & cartographie par spot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToLive}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 active:scale-95 transition"
          >
            <span>🎯 Tir Direct</span>
          </button>
        </div>

        {/* Filtres par Catégorie de shoot */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedPointIndex(null);
                setSelectedSpotIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 border ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SYNTHÈSE GLOBALE (KPIs) */}
      <div className="grid grid-cols-3 gap-2">
        {/* KPI 1 : ADRESSE GLOBALE */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center relative overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-slate-400">Adresse Globale</div>
          <div className={`text-2xl font-black font-mono mt-0.5 ${
            globalStats.overallPct >= 50 ? 'text-emerald-400' : globalStats.overallPct >= 40 ? 'text-amber-400' : 'text-orange-400'
          }`}>
            {globalStats.overallPct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {globalStats.totalMade}/{globalStats.totalAttempted} tirs
          </div>
        </div>

        {/* KPI 2 : VOLUME / SÉANCES */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Séances</div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
            {globalStats.count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {globalStats.count > 0 ? Math.round(globalStats.totalAttempted / globalStats.count) : 0} tirs/séance
          </div>
        </div>

        {/* KPI 3 : RECORD SÉANCE */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Record Séance</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
            {globalStats.bestPercentage}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {globalStats.bestSession?.date || 'N/A'}
          </div>
        </div>
      </div>

      {/* 3. COURBE D'ÉVOLUTION PAR DATE (GRAPHIQUE INTERACTIF) */}
      <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>📈 Évolution par Date ({selectedCategory})</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Taux de réussite au fil des entraînements
            </p>
          </div>

          {onOpenSpotEntry && (
            <button
              type="button"
              onClick={onOpenSpotEntry}
              className="px-2 py-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-bold rounded-xl text-[11px] flex items-center gap-1 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Saisie 5 spots</span>
            </button>
          )}
        </div>

        {chartPoints.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aucune séance enregistrée pour cette catégorie.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Zone graphique SVG */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="shootCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#F97316" stop-opacity="0.4" />
                    <stop offset="100%" stop-color="#F97316" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Lignes repères horizontales (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map(val => {
                  const y = svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);
                  return (
                    <g key={val}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#1E293B"
                        strokeDasharray={val === 50 ? '4 4' : '2 4'}
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 6}
                        y={y + 3}
                        fill="#64748B"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Remplissage dégradé sous la courbe */}
                {areaPolygonPoints && (
                  <polygon points={areaPolygonPoints} fill="url(#shootCurveGrad)" />
                )}

                {/* Ligne de la courbe */}
                {chartPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                )}

                {/* Points individuels de chaque séance */}
                {chartPoints.map((p, idx) => {
                  const { x, y } = getCoordinates(idx, p.percentage);
                  const isSelected = selectedPointIndex === idx || (selectedPointIndex === null && idx === chartPoints.length - 1);

                  return (
                    <g key={p.id} className="cursor-pointer" onClick={() => setSelectedPointIndex(idx)}>
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="9"
                          fill="#F97316"
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '6' : '4.5'}
                        fill={isSelected ? '#FFFFFF' : '#F97316'}
                        stroke="#0B0F19"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                      {/* Date sous le point */}
                      <text
                        x={x}
                        y={svgHeight - 8}
                        fill={isSelected ? '#F97316' : '#94A3B8'}
                        fontSize="9"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.date.slice(0, 5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Fiche détaillée du point sélectionné */}
            {activeChartPoint && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{activeChartPoint.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {activeChartPoint.date}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    <span className="text-white font-bold">{activeChartPoint.made}</span>/{activeChartPoint.total} tirs réussis
                    {activeChartPoint.category ? ` • ${activeChartPoint.category}` : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-black font-mono ${
                    activeChartPoint.percentage >= 50 ? 'text-emerald-400' : 'text-orange-400'
                  }`}>
                    {activeChartPoint.percentage}%
                  </div>
                  <div className="text-[9px] font-bold uppercase text-slate-500">Réussite</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CARTOGRAPHIE & HEATMAP DU TERRAIN PAR SPOT (3 POINTS) */}
      {spotAnalytics && (
        <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>🎯 Cartographie & Efficacité par Spot (3 Points)</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Cumul des tirs et taux de réussite selon l'angle de tir
              </p>
            </div>
          </div>

          {/* DEMI-TERRAIN BASKETBALL SVG INTERACTIF */}
          <div className="bg-[#0A0E1A] border border-slate-800 rounded-3xl p-3 relative overflow-hidden">
            <svg viewBox="0 0 380 240" className="w-full h-auto select-none">
              <defs>
                <radialGradient id="hoopGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#FF5722" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#FF5722" stop-opacity="0" />
                </radialGradient>
              </defs>

              {/* Lignes du terrain de basket */}
              <g stroke="#1E293B" strokeWidth="2" fill="none">
                {/* Ligne de fond (bas) */}
                <line x1="20" y1="215" x2="360" y2="215" strokeWidth="3" />
                
                {/* Raquette / Key */}
                <rect x="145" y="110" width="90" height="105" />
                {/* Cercle des lancers francs */}
                <circle cx="190" cy="110" r="45" strokeDasharray="4 4" />
                
                {/* Ligne à 3 points : deux lignes de corner droites et l'arc central */}
                <path d="M 45,215 L 45,155 C 45,70 110,35 190,35 C 270,35 335,70 335,155 L 335,215" strokeWidth="2.5" stroke="#334155" />
                
                {/* Panneau & Arceau */}
                <line x1="165" y1="205" x2="215" y2="205" stroke="#F97316" strokeWidth="3" />
                <circle cx="190" cy="195" r="10" stroke="#F97316" strokeWidth="2.5" fill="none" />
                <circle cx="190" cy="195" r="22" fill="url(#hoopGlow)" />
              </g>

              {/* LES 5 SPOTS INTERACTIFS SUR LE TERRAIN */}
              {/* Coordonnées précises des 5 spots dans l'ordre demandé :
                  1. Corner Droit : (335, 185)
                  2. 45° Droit : (285, 80)
                  3. Axe : (190, 35)
                  4. 45° Gauche : (95, 80)
                  5. Corner Gauche : (45, 185)
              */}
              {[
                { name: 'Corner Droit', cx: 335, cy: 185, spotIdx: 0, labelAnchor: 'end', labelX: 320, labelY: 188 },
                { name: '45° Droit', cx: 285, cy: 80, spotIdx: 1, labelAnchor: 'start', labelX: 295, labelY: 75 },
                { name: 'Axe', cx: 190, cy: 35, spotIdx: 2, labelAnchor: 'middle', labelX: 190, labelY: 22 },
                { name: '45° Gauche', cx: 95, cy: 80, spotIdx: 3, labelAnchor: 'end', labelX: 85, labelY: 75 },
                { name: 'Corner Gauche', cx: 45, cy: 185, spotIdx: 4, labelAnchor: 'start', labelX: 60, labelY: 188 },
              ].map(({ name, cx, cy, spotIdx, labelAnchor, labelX, labelY }) => {
                const s = spotAnalytics.spots[spotIdx];
                const isSelected = selectedSpotIndex === spotIdx;
                const isHot = s.overallPct >= 50;
                const isGood = s.overallPct >= 40 && s.overallPct < 50;
                const spotColor = isHot ? '#10B981' : isGood ? '#F59E0B' : '#F97316';

                return (
                  <g
                    key={name}
                    className="cursor-pointer group"
                    onClick={() => setSelectedSpotIndex(isSelected ? null : spotIdx)}
                  >
                    {/* Anneau de sélection */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="18"
                        fill="none"
                        stroke={spotColor}
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ animationDuration: '6s' }}
                      />
                    )}

                    {/* Pastille du spot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? '13' : '11'}
                      fill={spotColor}
                      stroke="#0F172A"
                      strokeWidth="2.5"
                      className="transition-transform duration-150 group-hover:scale-110"
                    />

                    {/* Numéro du spot */}
                    <text
                      x={cx}
                      y={cy + 3.5}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {spotIdx + 1}
                    </text>

                    {/* Pourcentage au dessus/à côté du spot */}
                    <text
                      x={labelX}
                      y={labelY}
                      fill={spotColor}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor={labelAnchor}
                      fontFamily="monospace"
                    >
                      {s.overallPct}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Légende sous le terrain */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>$\ge 50\%$ (Hot 🔥)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>$40-49\%$ (Solide)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>$&lt; 40\%$ (À travailler)</span>
              </span>
            </div>
          </div>

          {/* ZOOM SUR LE SPOT SÉLECTIONNÉ (OU APERÇU GÉNÉRAL) */}
          {activeSpot ? (
            <div className="bg-slate-900 border border-orange-500/40 rounded-2xl p-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-xs font-black text-white">{activeSpot.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({activeSpot.totalMade}/{activeSpot.totalAttempted} tirs)
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                  <span>{activeSpot.overallPct}% cumulé</span>
                </div>
              </div>

              {/* Historique date par date de ce spot spécifique */}
              <div className="grid grid-cols-3 gap-1.5 text-center mt-2 pt-2 border-t border-slate-800">
                {activeSpot.history.map((h, i) => (
                  <div key={i} className="bg-slate-850 p-1.5 rounded-xl border border-slate-800">
                    <div className="text-[9px] font-mono text-slate-400">{h.date}</div>
                    <div className="text-xs font-bold font-mono text-white mt-0.5">
                      {h.made}/{h.total}
                    </div>
                    <div className={`text-[10px] font-mono font-bold ${
                      h.pct >= 50 ? 'text-emerald-400' : h.pct >= 35 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {h.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-center text-slate-400 italic">
              💡 Touchez un numéro sur le terrain ci-dessus pour afficher l'évolution historique de ce spot.
            </div>
          )}

          {/* TABLEAU D'ÉVOLUTION DE TOUS LES SPOTS PAR SÉANCE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 overflow-x-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>📋 Suivi chronologique par spot :</span>
              <span className="text-slate-500 font-mono text-[9px]">Ordre : 1 $\rightarrow$ 5</span>
            </div>

            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                  <th className="py-1 font-bold">Spot</th>
                  {spotAnalytics.dates.map(d => (
                    <th key={d} className="py-1 text-center font-bold px-1.5">{d.slice(0, 5)}</th>
                  ))}
                  <th className="py-1 text-right font-bold text-white">Cumul</th>
                  <th className="py-1 text-right font-bold text-slate-400">Prog.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {spotAnalytics.spots.map((s, idx) => (
                  <tr
                    key={s.name}
                    onClick={() => setSelectedSpotIndex(idx)}
                    className={`hover:bg-slate-800/60 cursor-pointer transition ${
                      selectedSpotIndex === idx ? 'bg-orange-500/10' : ''
                    }`}
                  >
                    <td className="py-1.5 font-bold text-slate-200 flex items-center gap-1 truncate max-w-[90px]">
                      <span className="text-[9px] text-orange-400 font-bold">{idx + 1}.</span>
                      <span className="truncate">{s.name}</span>
                    </td>
                    {s.history.map((h, i) => (
                      <td key={i} className="py-1.5 text-center px-1">
                        <span className={`text-[10px] font-bold ${
                          h.pct >= 50 ? 'text-emerald-400' : h.pct >= 35 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {h.pct}%
                        </span>
                      </td>
                    ))}
                    <td className="py-1.5 text-right font-bold text-white">
                      {s.overallPct}%
                    </td>
                    <td className="py-1.5 text-right">
                      {s.trendDiff > 0 ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center justify-end">
                          <ArrowUpRight className="w-3 h-3" />+{s.trendDiff}%
                        </span>
                      ) : s.trendDiff < 0 ? (
                        <span className="text-rose-400 text-[10px] font-bold flex items-center justify-end">
                          <ArrowDownRight className="w-3 h-3" />{s.trendDiff}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] flex items-center justify-end">
                          <Minus className="w-3 h-3" />0%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}