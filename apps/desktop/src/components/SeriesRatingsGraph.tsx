import { useState, useRef, useEffect, useCallback } from "react";
import { SeriesRatingsGraphData } from "../types";

interface SeriesRatingsGraphProps {
  data: SeriesRatingsGraphData;
  onSelectEpisode?: (season: number, episode: number) => void;
}

export function getRatingColor(rating: number): { bg: string; text: string; label: string } {
  if (rating >= 9.7) return { bg: "bg-[#0091ff]", text: "text-white", label: "Absolute Cinema" };
  if (rating >= 9.0) return { bg: "bg-[#059669]", text: "text-white", label: "Awesome" };
  if (rating >= 8.0) return { bg: "bg-[#16a34a]", text: "text-white", label: "Great" };
  if (rating >= 7.0) return { bg: "bg-[#eab308]", text: "text-black", label: "Good" };
  if (rating >= 6.0) return { bg: "bg-[#ea580c]", text: "text-white", label: "Average" };
  if (rating >= 5.0) return { bg: "bg-[#dc2626]", text: "text-white", label: "Bad" };
  return { bg: "bg-[#9333ea]", text: "text-white", label: "Garbage" };
}

const RATING_LEGEND = [
  { label: "Absolute Cinema", color: "bg-[#0091ff]", range: "≥ 9.7" },
  { label: "Awesome", color: "bg-[#059669]", range: "9.0 - 9.6" },
  { label: "Great", color: "bg-[#16a34a]", range: "8.0 - 8.9" },
  { label: "Good", color: "bg-[#eab308]", range: "7.0 - 7.9" },
  { label: "Average", color: "bg-[#ea580c]", range: "6.0 - 6.9" },
  { label: "Bad", color: "bg-[#dc2626]", range: "5.0 - 5.9" },
  { label: "Garbage", color: "bg-[#9333ea]", range: "< 5.0" },
];

export default function SeriesRatingsGraph({ data, onSelectEpisode }: SeriesRatingsGraphProps) {
  const [hoveredEp, setHoveredEp] = useState<{ season: number; episode: number; name: string; rating: number; voteCount: number; airDate?: string } | null>(null);
  const [layoutMode, setLayoutMode] = useState<"columns" | "rows">("columns");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, data, layoutMode]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -400 : 400;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!data || !data.seasons || data.seasons.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400 bg-zinc-900/40 rounded-2xl border border-white/5">
        <p className="font-semibold">No episode rating data available for this series.</p>
      </div>
    );
  }

  const { seasons, maxEpisodes, overallAverage } = data;

  return (
    <div className="w-full flex flex-col gap-5 text-white select-none">
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          {RATING_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
              <span className="text-zinc-300">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-zinc-200">
            <span>Overall AVG:</span>
            <span className="text-amber-400">★ {overallAverage.toFixed(1)}</span>
          </div>
          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              title="Scroll left"
              className="w-7 h-7 rounded-md hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              title="Scroll right"
              className="w-7 h-7 rounded-md hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-xs font-bold">
            <button type="button" onClick={() => setLayoutMode("columns")} className={`px-2.5 py-1 rounded-md transition-all ${layoutMode === "columns" ? "bg-white/20 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}>Columns</button>
            <button type="button" onClick={() => setLayoutMode("rows")} className={`px-2.5 py-1 rounded-md transition-all ${layoutMode === "rows" ? "bg-white/20 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}>Rows</button>
          </div>
        </div>
      </div>

      {/* Tooltip Banner */}
      <div className="min-h-[44px] flex items-center justify-between px-4 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-xs sm:text-sm">
        {hoveredEp ? (
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#f2545b]">S{hoveredEp.season} E{hoveredEp.episode}</span>
              <span className="text-zinc-400">•</span>
              <span className="font-bold text-white truncate max-w-[280px] sm:max-w-md">{hoveredEp.name}</span>
              {hoveredEp.airDate && <span className="text-zinc-400 text-xs hidden sm:inline">({hoveredEp.airDate})</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-black text-amber-400">★ {hoveredEp.rating.toFixed(1)}</span>
              {onSelectEpisode && (
                <button type="button" onClick={() => onSelectEpisode(hoveredEp.season, hoveredEp.episode)}
                  className="px-2.5 py-1 rounded bg-[#f2545b] text-white text-xs font-bold hover:bg-[#e0434b] transition-colors cursor-pointer">
                  Play
                </button>
              )}
            </div>
          </div>
        ) : (
          <span className="text-zinc-400 italic">Hover or tap any episode cell to inspect rating and details</span>
        )}
      </div>

      {/* Heatmap Matrix */}
      <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-4 scroll-smooth no-scrollbar">
        {layoutMode === "columns" ? (
          <div className="inline-block min-w-full">
            <table className="border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="w-12 text-center text-xs font-bold text-zinc-400 py-1"></th>
                  {seasons.map((season) => (
                    <th key={season.seasonNumber} className="min-w-[56px] text-center text-sm font-extrabold text-zinc-200 py-2 px-1">S{season.seasonNumber}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxEpisodes }).map((_, epIdx) => {
                  const epNum = epIdx + 1;
                  return (
                    <tr key={epNum}>
                      <td className="text-right pr-2 text-xs font-bold text-zinc-400 whitespace-nowrap">E{epNum}</td>
                      {seasons.map((season) => {
                        const ep = season.episodes.find((e) => e.episodeNumber === epNum);
                        if (!ep || ep.rating <= 0) return <td key={season.seasonNumber} className="p-0.5"><div className="w-14 h-11 rounded-lg bg-transparent" /></td>;
                        const colorInfo = getRatingColor(ep.rating);
                        return (
                          <td key={season.seasonNumber} className="p-0.5">
                            <button type="button"
                              onMouseEnter={() => setHoveredEp({ season: season.seasonNumber, episode: ep.episodeNumber, name: ep.name, rating: ep.rating, voteCount: ep.voteCount, airDate: ep.airDate })}
                              onClick={() => onSelectEpisode?.(season.seasonNumber, ep.episodeNumber)}
                              className={`w-14 h-11 rounded-lg ${colorInfo.bg} ${colorInfo.text} font-black text-sm sm:text-base flex items-center justify-center transition-all duration-150 hover:scale-110 hover:shadow-lg hover:shadow-black/60 hover:z-10 relative cursor-pointer active:scale-95`}>
                              {ep.rating.toFixed(1)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td className="text-right pr-2 text-xs font-extrabold text-zinc-300 py-3 whitespace-nowrap">AVG.</td>
                  {seasons.map((season) => (
                    <td key={season.seasonNumber} className="text-center py-2 px-1">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-sm sm:text-base text-white tracking-wide">{season.averageRating > 0 ? season.averageRating.toFixed(1) : "-"}</span>
                        <div className="w-8 h-1 bg-[#16a34a] rounded-full mt-1" />
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inline-block min-w-full">
            <table className="border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="w-12 text-center text-xs font-bold text-zinc-400 py-1"></th>
                  {Array.from({ length: maxEpisodes }).map((_, epIdx) => (
                    <th key={epIdx + 1} className="min-w-[56px] text-center text-xs font-extrabold text-zinc-400 py-2 px-1">E{epIdx + 1}</th>
                  ))}
                  <th className="min-w-[56px] text-center text-xs font-extrabold text-zinc-300 py-2 px-1">AVG.</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((season) => (
                  <tr key={season.seasonNumber}>
                    <td className="text-right pr-2 text-xs font-bold text-zinc-300 whitespace-nowrap">S{season.seasonNumber}</td>
                    {Array.from({ length: maxEpisodes }).map((_, epIdx) => {
                      const epNum = epIdx + 1;
                      const ep = season.episodes.find((e) => e.episodeNumber === epNum);
                      if (!ep || ep.rating <= 0) return <td key={epNum} className="p-0.5"><div className="w-14 h-11 rounded-lg bg-transparent" /></td>;
                      const colorInfo = getRatingColor(ep.rating);
                      return (
                        <td key={epNum} className="p-0.5">
                          <button type="button"
                            onMouseEnter={() => setHoveredEp({ season: season.seasonNumber, episode: ep.episodeNumber, name: ep.name, rating: ep.rating, voteCount: ep.voteCount, airDate: ep.airDate })}
                            onClick={() => onSelectEpisode?.(season.seasonNumber, ep.episodeNumber)}
                            className={`w-14 h-11 rounded-lg ${colorInfo.bg} ${colorInfo.text} font-black text-sm sm:text-base flex items-center justify-center transition-all duration-150 hover:scale-110 hover:shadow-lg hover:shadow-black/60 hover:z-10 relative cursor-pointer active:scale-95`}>
                            {ep.rating.toFixed(1)}
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-1">
                      <span className="font-black text-sm sm:text-base text-white">{season.averageRating > 0 ? season.averageRating.toFixed(1) : "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
