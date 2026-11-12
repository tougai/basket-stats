import React, { useState, useMemo } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

function parseDateFr(dStr) {
  if (!dStr || typeof dStr !== 'string') return 0;
  const parts = dStr.split('/');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  }
  return new Date(dStr).getTime() || 0;
}

const SPOT_NAMES = ['Corner Droit', '45° Droit', 'Axe', '45° Gauche', 'Corner Gauche'];

export function ShootingStatsView({ workouts = [], activePlayer = {}, onSwitchToLive }) {
  const [selectedCategory, setSelectedCategory] = useState('3 Points');
  const [selectedSpotIndex, setSelectedSpotIndex] = useState(2); // 2 = Axe (Tête 90°) par défaut
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // Catégories disponibles
  const categories = ['3 Points', 'Mi-distance', 'Flotteurs', 'Lancers Francs'];

  // ==========================================
  // 1. ANALYSE SPÉCIFIQUE 3 POINTS (PAR SPOT UNIQUEMENT)
  // ==========================================
  const spotAnalytics = useMemo(() => {
    const threePtWorkouts = [...workouts]
      .filter(w => w.category === '3 Points' || (w.title && w.title.includes('3 P')))
      .sort((a, b) => parseDateFr(a.date) - parseDateFr(b.date));

    const spotsMap = {
      'Corner Droit': { name: 'Corner Droit', short: '0° D', totalMade: 0, totalAttempted: 0, history: [] },
      '45° Droit': { name: '45° Droit', short: '45° D', totalMade: 0, totalAttempted: 0, history: [] },
      'Axe': { name: 'Axe', short: 'Axe 90°', totalMade: 0, totalAttempted: 0, history: [] },
      '45° Gauche': { name: '45° Gauche', short: '45° G', totalMade: 0, totalAttempted: 0, history: [] },
      'Corner Gauche': { name: 'Corner Gauche', short: '0° G', totalMade: 0, totalAttempted: 0, history: [] }
    };

    const uniqueDates = new Set();

    threePtWorkouts.forEach(w => {
      // Cas 1 : séance multi-spots (ex: Quentin 5 spots)
      if (Array.isArray(w.spots) && w.spots.length > 0) {
        uniqueDates.add(w.date);
        w.spots.forEach(s => {
          if (spotsMap[s.name]) {
            const m = parseInt(s.made, 10) || 0;
            const t = parseInt(s.total, 10) || 20;
            const pct = s.pct !== undefined ? s.pct : Number(((m / t) * 100).toFixed(1));
            spotsMap[s.name].totalMade += m;
            spotsMap[s.name].totalAttempted += t;
            spotsMap[s.name].history.push({
              date: w.date,
              workoutId: w.id,
              made: m,
              total: t,
              tour1: s.tour1,
              tour2: s.tour2,
              pct
            });
          }
        });
      }
      // Cas 2 : séance avec un spot individuel
      else {
        let targetSpot = w.spot;
        if (!targetSpot && w.title) {
          if (w.title.includes('Axe')) targetSpot = 'Axe';
          else if (w.title.includes('Corner D')) targetSpot = 'Corner Droit';
          else if (w.title.includes('Corner G')) targetSpot = 'Corner Gauche';
          else if (w.title.includes('45° D') || w.title.includes('45 D')) targetSpot = '45° Droit';
          else if (w.title.includes('45° G') || w.title.includes('45 G')) targetSpot = '45° Gauche';
          else if (w.title.includes('45')) targetSpot = '45° Droit';
        }
        if (targetSpot && (targetSpot === '45°' || targetSpot === '45')) {
          targetSpot = '45° Droit';
        }

        if (targetSpot && spotsMap[targetSpot]) {
          uniqueDates.add(w.date);
          const m = parseInt(w.made, 10) || 0;
          const t = parseInt(w.total, 10) || 0;
          const pct = parseFloat(w.percentage) || (t > 0 ? Number(((m / t) * 100).toFixed(1)) : 0);
          spotsMap[targetSpot].totalMade += m;
          spotsMap[targetSpot].totalAttempted += t;
          spotsMap[targetSpot].history.push({
            date: w.date,
            workoutId: w.id,
            made: m,
            total: t,
            pct
          });
        }
      }
    });

    const spotsList = SPOT_NAMES.map((name, idx) => {
      const item = spotsMap[name];
      const overallPct = item.totalAttempted > 0
        ? Number(((item.totalMade / item.totalAttempted) * 100).toFixed(1))
        : 0;

      let trendDiff = 0;
      if (item.history.length >= 2) {
        const first = item.history[0].pct;
        const last = item.history[item.history.length - 1].pct;
        trendDiff = Number((last - first).toFixed(1));
      }

      return {
        ...item,
        spotIndex: idx,
        overallPct,
        trendDiff
      };
    });

    return {
      dates: Array.from(uniqueDates).sort((a, b) => parseDateFr(a) - parseDateFr(b)),
      spots: spotsList
    };
  }, [workouts]);

  // Spot actuellement sélectionné
  const activeSpot = useMemo(() => {
    if (!spotAnalytics || !spotAnalytics.spots.length) return null;
    return spotAnalytics.spots[selectedSpotIndex] || spotAnalytics.spots[0];
  }, [spotAnalytics, selectedSpotIndex]);

  // Points pour la courbe d'évolution du spot sélectionné
  const spotChartPoints = useMemo(() => {
    if (!activeSpot || !activeSpot.history) return [];
    return activeSpot.history.map((h, i) => ({
      index: i,
      date: h.date,
      percentage: h.pct,
      made: h.made,
      total: h.total,
      tour1: h.tour1,
      tour2: h.tour2
    }));
  }, [activeSpot]);

  // ==========================================
  // 2. ANALYSE AUTRES CATÉGORIES (MI-DISTANCE SANS SPOT, FLOTTEURS, LF)
  // ==========================================
  const nonSpotWorkouts = useMemo(() => {
    return [...workouts]
      .filter(w => w.category === selectedCategory)
      .sort((a, b) => parseDateFr(a.date) - parseDateFr(b.date));
  }, [workouts, selectedCategory]);

  const nonSpotStats = useMemo(() => {
    let totalMade = 0;
    let totalAttempted = 0;
    let bestPct = 0;

    nonSpotWorkouts.forEach(w => {
      const m = parseInt(w.made, 10) || 0;
      const t = parseInt(w.total, 10) || 0;
      totalMade += m;
      totalAttempted += t;
      const pct = parseFloat(w.percentage) || (t > 0 ? (m / t) * 100 : 0);
      if (pct > bestPct) bestPct = pct;
    });

    const overallPct = totalAttempted > 0
      ? Number(((totalMade / totalAttempted) * 100).toFixed(1))
      : 0;

    return {
      totalMade,
      totalAttempted,
      overallPct,
      count: nonSpotWorkouts.length,
      bestPct
    };
  }, [nonSpotWorkouts]);

  const nonSpotChartPoints = useMemo(() => {
    return nonSpotWorkouts.map((w, idx) => ({
      index: idx,
      id: w.id,
      date: w.date,
      percentage: parseFloat(w.percentage) || 0,
      made: w.made,
      total: w.total,
      title: w.title,
      notes: w.notes
    }));
  }, [nonSpotWorkouts]);

  // Dimensions SVG génériques pour les courbes
  const svgWidth = 460;
  const svgHeight = 160;
  const paddingX = 35;
  const paddingY = 25;

  const getCoordinates = (points, index, value) => {
    const total = points.length;
    const x = total <= 1
      ? svgWidth / 2
      : paddingX + (index / (total - 1)) * (svgWidth - paddingX * 2);
    const clampedVal = Math.max(0, Math.min(100, value));
    const y = svgHeight - paddingY - (clampedVal / 100) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const is3Point = selectedCategory === '3 Points';
  const currentChartPoints = is3Point ? spotChartPoints : nonSpotChartPoints;

  const polylinePoints = currentChartPoints.map((p, i) => {
    const { x, y } = getCoordinates(currentChartPoints, i, p.percentage);
    return `${x},${y}`;
  }).join(' ');

  const areaPolygonPoints = currentChartPoints.length > 1
    ? `${getCoordinates(currentChartPoints, 0, 0).x},${svgHeight - paddingY} ${polylinePoints} ${getCoordinates(currentChartPoints, currentChartPoints.length - 1, 0).x},${svgHeight - paddingY}`
    : '';

  const activePoint = selectedPointIndex !== null && currentChartPoints[selectedPointIndex]
    ? currentChartPoints[selectedPointIndex]
    : (currentChartPoints.length > 0 ? currentChartPoints[currentChartPoints.length - 1] : null);

  return (
    <div className="space-y-4 text-slate-100">
      
      {/* 1. EN-TÊTE & SÉLECTEUR DE CATÉGORIES */}
      <div className="bg-slate-850/90 border border-slate-750 p-3.5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white leading-tight">
                Statistiques & Évolution
              </h2>
              {activePlayer?.name && (
                <span className="text-[10px] font-bold bg-orange-500/15 text-orange-400 px-1.5 py-0.2 rounded-md border border-orange-500/30">
                  {activePlayer.name}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {is3Point
                ? 'Suivi précis par spot (5 spots) • Tendance par date'
                : 'Suivi de séance globale sans détail de spot'}
            </p>
          </div>

          {onSwitchToLive && (
            <button
              type="button"
              onClick={onSwitchToLive}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-750 active:scale-95 transition"
            >
              <Target className="w-3.5 h-3.5 text-orange-400" />
              <span>Saisie Séance</span>
            </button>
          )}
        </div>

        {/* ONGLETS DES CATÉGORIES */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedPointIndex(null);
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

      {/* ========================================================
          VUE 1 : CATÉGORIE 3 POINTS (CONSIDÈRE UNIQUEMENT LES SPOTS)
         ======================================================== */}
      {is3Point ? (
        <div className="space-y-4">
          
          {/* TERRAIN BASKET 2D AVEC LES 5 SPOTS */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>🎯 Demi-Terrain : Cartographie des 5 Spots</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Touchez un spot pour visualiser son évolution chronologique
                </p>
              </div>
            </div>

            {/* DEMI-TERRAIN SVG */}
            <div className="bg-[#0A0E1A] border border-slate-800 rounded-3xl p-3 relative overflow-hidden">
              <svg viewBox="0 0 380 240" className="w-full h-auto select-none">
                <defs>
                  <radialGradient id="hoopGlow3pt" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#FF5722" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#FF5722" stop-opacity="0" />
                  </radialGradient>
                </defs>

                {/* Traçage du terrain */}
                <g stroke="#1E293B" strokeWidth="2" fill="none">
                  {/* Ligne de fond */}
                  <line x1="20" y1="215" x2="360" y2="215" strokeWidth="3" />
                  {/* Raquette */}
                  <rect x="145" y="110" width="90" height="105" />
                  {/* Cercle LF */}
                  <circle cx="190" cy="110" r="45" strokeDasharray="4 4" />
                  {/* Ligne 3 pts FIBA */}
                  <path d="M 45,215 L 45,155 C 45,70 110,35 190,35 C 270,35 335,70 335,155 L 335,215" strokeWidth="2.5" stroke="#334155" />
                  {/* Panneau & Arceau */}
                  <line x1="165" y1="205" x2="215" y2="205" stroke="#F97316" strokeWidth="3" />
                  <circle cx="190" cy="195" r="10" stroke="#F97316" strokeWidth="2.5" fill="none" />
                  <circle cx="190" cy="195" r="22" fill="url(#hoopGlow3pt)" />
                </g>

                {/* 5 SPOTS INTERACTIFS (Corner D -> 45° D -> Axe -> 45° G -> Corner G) */}
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
                      onClick={() => {
                        setSelectedSpotIndex(spotIdx);
                        setSelectedPointIndex(null);
                      }}
                    >
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="18"
                          fill="none"
                          stroke={spotColor}
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      )}

                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '13' : '11'}
                        fill={spotColor}
                        stroke="#0F172A"
                        strokeWidth="2.5"
                        className="transition-transform duration-150 group-hover:scale-110"
                      />

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

              {/* Légende */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>≥ 50% (Hot 🔥)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>40-49% (Solide)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>&lt; 40% (À travailler)</span>
                </span>
              </div>
            </div>

            {/* BOUTONS PILULES DES 5 SPOTS */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {spotAnalytics.spots.map((s, idx) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setSelectedSpotIndex(idx);
                    setSelectedPointIndex(null);
                  }}
                  className={`p-1.5 rounded-xl text-center border transition active:scale-95 ${
                    selectedSpotIndex === idx
                      ? 'bg-orange-500/20 border-orange-500 text-white shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[9px] font-bold truncate">{idx + 1}. {s.short}</div>
                  <div className={`text-xs font-black font-mono mt-0.5 ${
                    s.overallPct >= 50 ? 'text-emerald-400' : s.overallPct >= 40 ? 'text-amber-400' : 'text-orange-400'
                  }`}>
                    {s.overallPct}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FICHE D'ÉVOLUTION PAR DATE DU SPOT SÉLECTIONNÉ */}
          {activeSpot && (
            <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Évolution par Date : {activeSpot.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Total spot : <span className="text-white font-bold">{activeSpot.totalMade}</span>/{activeSpot.totalAttempted} tirs ({activeSpot.overallPct}% cumulé)
                  </p>
                </div>

                {/* TENDANCE DU SPOT */}
                <div>
                  {activeSpot.trendDiff > 0 ? (
                    <span className="text-emerald-400 text-xs font-black font-mono flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      <ArrowUpRight className="w-3.5 h-3.5" />+{activeSpot.trendDiff}%
                    </span>
                  ) : activeSpot.trendDiff < 0 ? (
                    <span className="text-rose-400 text-xs font-black font-mono flex items-center gap-0.5 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                      <ArrowDownRight className="w-3.5 h-3.5" />{activeSpot.trendDiff}%
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-black font-mono flex items-center gap-0.5 bg-slate-800 px-2 py-0.5 rounded-lg">
                      <Minus className="w-3.5 h-3.5" />0%
                    </span>
                  )}
                </div>
              </div>

              {/* COURBE D'ÉVOLUTION SVG DU SPOT */}
              {spotChartPoints.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
                      <defs>
                        <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#F97316" stop-opacity="0.35" />
                          <stop offset="100%" stop-color="#F97316" stop-opacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Repères horizontaux (0%, 25%, 50%, 75%, 100%) */}
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

                      {/* Remplissage sous la courbe */}
                      {areaPolygonPoints && (
                        <polygon points={areaPolygonPoints} fill="url(#spotGrad)" />
                      )}

                      {/* Ligne */}
                      {spotChartPoints.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />
                      )}

                      {/* Points individuels */}
                      {spotChartPoints.map((p, idx) => {
                        const { x, y } = getCoordinates(spotChartPoints, idx, p.percentage);
                        const isSelected = selectedPointIndex === idx || (selectedPointIndex === null && idx === spotChartPoints.length - 1);

                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedPointIndex(idx)}
                          >
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
                            />
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

                  {/* DÉTAIL DU POINT SÉLECTIONNÉ POUR CE SPOT */}
                  {activePoint && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Séance du <span className="text-white font-bold">{activePoint.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                          Score sur ce spot : <span className="text-emerald-400 font-black">{activePoint.made}</span>/{activePoint.total}
                          {activePoint.tour1 !== undefined && (
                            <span className="text-slate-500 font-normal"> (T1: {activePoint.tour1}/10, T2: {activePoint.tour2}/10)</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-base font-black font-mono ${
                          activePoint.percentage >= 50 ? 'text-emerald-400' : 'text-orange-400'
                        }`}>
                          {activePoint.percentage}%
                        </div>
                        <div className="text-[9px] uppercase font-bold text-slate-500">Adresse</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">
                  Aucun historique disponible pour ce spot.
                </div>
              )}
            </div>
          )}

          {/* TABLEAU CHRONOLOGIQUE DES 5 SPOTS */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>📋 Tableau des résultats par spot :</span>
              <span className="text-slate-500 font-mono text-[9px]">Ordre : 1 ➔ 5</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                    <th className="py-1 font-bold">Spot</th>
                    {spotAnalytics.dates.map(d => (
                      <th key={d} className="py-1 text-center font-bold px-1.5">{d.slice(0, 5)}</th>
                    ))}
                    <th className="py-1 text-right font-bold text-white">Cumul</th>
                    <th className="py-1 text-right font-bold text-slate-400">Tendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {spotAnalytics.spots.map((s, idx) => (
                    <tr
                      key={s.name}
                      onClick={() => {
                        setSelectedSpotIndex(idx);
                        setSelectedPointIndex(null);
                      }}
                      className={`hover:bg-slate-800/60 cursor-pointer transition ${
                        selectedSpotIndex === idx ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <td className="py-2 font-bold text-slate-200 flex items-center gap-1.5 truncate max-w-[100px]">
                        <span className="text-[9px] text-orange-400 font-bold">{idx + 1}.</span>
                        <span className="truncate">{s.name}</span>
                      </td>

                      {spotAnalytics.dates.map(d => {
                        const h = s.history.find(item => item.date === d);
                        return (
                          <td key={d} className="py-2 text-center px-1">
                            {h ? (
                              <>
                                <div className={`text-[10px] font-bold ${
                                  h.pct >= 50 ? 'text-emerald-400' : h.pct >= 35 ? 'text-amber-400' : 'text-slate-400'
                                }`}>
                                  {h.made}/{h.total}
                                </div>
                                <div className="text-[8px] text-slate-500 font-mono">
                                  {h.pct}%
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2 text-right font-bold text-white">
                        <div>{s.totalMade}/{s.totalAttempted}</div>
                        <div className="text-[9px] text-orange-400">{s.overallPct}%</div>
                      </td>

                      <td className="py-2 text-right">
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

        </div>
      ) : (
        /* ========================================================
            VUE 2 : AUTRES CATÉGORIES (MI-DISTANCE SANS SPOT, ETC.)
           ======================================================== */
        <div className="space-y-4">
          
          {/* SYNTHÈSE GLOBALE NON DÉTAILLÉE PAR SPOT */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Adresse</div>
              <div className={`text-2xl font-black font-mono mt-0.5 ${
                nonSpotStats.overallPct >= 50 ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                {nonSpotStats.overallPct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {nonSpotStats.totalMade}/{nonSpotStats.totalAttempted} tirs
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Séances</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
                {nonSpotStats.count}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {nonSpotStats.count > 0 ? Math.round(nonSpotStats.totalAttempted / nonSpotStats.count) : 0} tirs/séance
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Record</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                {nonSpotStats.bestPct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                {selectedCategory}
              </div>
            </div>
          </div>

          {/* COURBE D'ÉVOLUTION CHRONOLOGIQUE */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                📈 Évolution par Date : {selectedCategory}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selectedCategory === 'Mi-distance'
                  ? 'Suivi global des tirs à mi-distance (sans distinction de spot)'
                  : 'Taux de réussite chronologique'}
              </p>
            </div>

            {nonSpotChartPoints.length > 0 ? (
              <div className="space-y-2.5">
                <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
                    <defs>
                      <linearGradient id="nonSpotGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#F97316" stop-opacity="0.35" />
                        <stop offset="100%" stop-color="#F97316" stop-opacity="0.0" />
                      </linearGradient>
                    </defs>

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

                    {areaPolygonPoints && (
                      <polygon points={areaPolygonPoints} fill="url(#nonSpotGrad)" />
                    )}

                    {nonSpotChartPoints.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylinePoints}
                      />
                    )}

                    {nonSpotChartPoints.map((p, idx) => {
                      const { x, y } = getCoordinates(nonSpotChartPoints, idx, p.percentage);
                      const isSelected = selectedPointIndex === idx || (selectedPointIndex === null && idx === nonSpotChartPoints.length - 1);

                      return (
                        <g
                          key={p.id || idx}
                          className="cursor-pointer"
                          onClick={() => setSelectedPointIndex(idx)}
                        >
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
                          />
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

                {/* Point sélectionné */}
                {activePoint && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{activePoint.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">({activePoint.date})</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        <span className="text-emerald-400 font-bold">{activePoint.made}</span>/{activePoint.total} tirs réussis
                        {activePoint.notes ? ` • ${activePoint.notes}` : ''}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono text-emerald-400">
                        {activePoint.percentage}%
                      </div>
                      <div className="text-[9px] uppercase font-bold text-slate-500">Réussite</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                Aucune séance enregistrée pour cette catégorie.
              </div>
            )}
          </div>

          {/* LISTE DES SÉANCES */}
          <div className="bg-slate-850/90 border border-slate-750 p-4 rounded-3xl shadow-sm space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Historique des séances ({selectedCategory})
            </div>
            <div className="space-y-1.5">
              {nonSpotWorkouts.map(w => (
                <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{w.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{w.date}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {w.made}/{w.total} tirs
                      {w.durationMinutes ? ` • ${w.durationMinutes} min` : ''}
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-emerald-400 text-sm">
                    {w.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
