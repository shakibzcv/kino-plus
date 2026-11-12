"use client";

import React, { useState } from "react";
import { SeriesRatingsGraphData } from "@/lib/tmdb";

interface SeriesRatingsGraphProps {
  data: SeriesRatingsGraphData;
  seriesId: string | number;
  onSelectEpisode?: (season: number, episode: number) => void;
}

export function getRatingColor(rating: number): { bg: string; text: string; dot: string } {
  if (rating >= 9.7) return { bg: "bg-[#0091ff]", text: "text-white", dot: "bg-[#0091ff]" };
  if (rating >= 9.0) return { bg: "bg-[#059669]", text: "text-white", dot: "bg-[#059669]" };
  if (rating >= 8.0) return { bg: "bg-[#16a34a]", text: "text-white", dot: "bg-[#16a34a]" };
  if (rating >= 7.0) return { bg: "bg-[#eab308]", text: "text-black", dot: "bg-[#eab308]" };
  if (rating >= 6.0) return { bg: "bg-[#ea580c]", text: "text-white", dot: "bg-[#ea580c]" };
  if (rating >= 5.0) return { bg: "bg-[#dc2626]", text: "text-white", dot: "bg-[#dc2626]" };
  return { bg: "bg-[#9333ea]", text: "text-white", dot: "bg-[#9333ea]" };
}

const RATING_LEGEND = [
  { label: "Absolute Cinema", range: "≥ 9.7",   color: "bg-[#0091ff]" },
  { label: "Awesome",         range: "9.0–9.6", color: "bg-[#059669]" },
  { label: "Great",           range: "8.0–8.9", color: "bg-[#16a34a]" },
  { label: "Good",            range: "7.0–7.9", color: "bg-[#eab308]" },
  { label: "Average",         range: "6.0–6.9", color: "bg-[#ea580c]" },
  { label: "Bad",             range: "5.0–5.9", color: "bg-[#dc2626]" },
  { label: "Garbage",         range: "< 5.0",   color: "bg-[#9333ea]" },
];

interface HoveredEp {
  season: number;
  episode: number;
  name: string;
  rating: number;
  airDate?: string;
}

interface EpCellProps {
  season: number;
  episode: number;
  name: string;
  rating: number;
  airDate?: string;
  onHover: (ep: HoveredEp) => void;
  onLeave: () => void;
  onSelectEpisode?: (season: number, episode: number) => void;
}

function EpCell({ season, episode, name, rating, airDate, onHover, onLeave, onSelectEpisode }: EpCellProps) {
  const colorInfo = getRatingColor(rating);
  return (
    <td className="p-0.5">
      <button
        type="button"
        onMouseEnter={() => onHover({ season, episode, name, rating, airDate })}
        onMouseLeave={onLeave}
        onClick={() => onSelectEpisode && onSelectEpisode(season, episode)}
        className={`w-14 h-11 rounded-lg ${colorInfo.bg} ${colorInfo.text} font-semibold text-sm flex items-center justify-center cursor-pointer transition-opacity duration-100 hover:opacity-75`}
      >
        {rating.toFixed(1)}
      </button>
    </td>
  );
}

export default function SeriesRatingsGraph({
  data,
  seriesId,
  onSelectEpisode,
}: SeriesRatingsGraphProps) {
  const [hoveredEp, setHoveredEp] = useState<HoveredEp | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, data]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -380 : 380;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!data || !data.seasons || data.seasons.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400 text-sm">
        No episode rating data available for this series.
      </div>
    );
  }

  const { seasons, maxEpisodes, overallAverage } = data;

  return (
    <div className="w-full flex flex-col gap-3 text-white select-none">
      {/* Header: legend + avg + scroll buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-zinc-400">
          {RATING_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
              <span className="text-zinc-300">{item.label}</span>
              <span className="text-zinc-600">{item.range}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-400">
            Avg <span className="text-amber-400 font-semibold">★ {overallAverage.toFixed(1)}</span>
          </span>
          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              title="Scroll left"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
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
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hover info strip — rendered OUTSIDE overflow container so it's never clipped */}
      <div className="h-7 flex items-center">
        {hoveredEp ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white">S{hoveredEp.season} E{hoveredEp.episode}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-300 truncate max-w-[260px] sm:max-w-md">{hoveredEp.name}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-amber-400 font-semibold">★ {hoveredEp.rating.toFixed(1)}</span>
            {hoveredEp.airDate && <span className="text-zinc-500 hidden sm:inline">{hoveredEp.airDate}</span>}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-600">Hover a cell to see episode details</span>
        )}
      </div>

      {/* Heatmap — with scroll container ref */}
      <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-2 scroll-smooth no-scrollbar">
        <div className="inline-block min-w-full">
          <table className="border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-10" />
                {Array.from({ length: maxEpisodes }).map((_, i) => (
                  <th key={i + 1} className="min-w-[56px] text-center text-[11px] text-zinc-500 pb-2">E{i + 1}</th>
                ))}
                <th className="min-w-[48px] text-center text-[11px] text-zinc-400 pb-2">Avg</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.seasonNumber}>
                  <td className="text-right pr-2 text-xs text-zinc-400 whitespace-nowrap">S{season.seasonNumber}</td>
                  {Array.from({ length: maxEpisodes }).map((_, epIdx) => {
                    const epNum = epIdx + 1;
                    const ep = season.episodes.find((e) => e.episodeNumber === epNum);
                    if (!ep || ep.rating <= 0) {
                      return <td key={epNum} className="p-0.5"><div className="w-14 h-11 rounded-lg" /></td>;
                    }
                    return (
                      <EpCell
                        key={epNum}
                        season={season.seasonNumber}
                        episode={ep.episodeNumber}
                        name={ep.name}
                        rating={ep.rating}
                        airDate={ep.airDate}
                        onHover={setHoveredEp}
                        onLeave={() => setHoveredEp(null)}
                        onSelectEpisode={onSelectEpisode}
                      />
                    );
                  })}
                  <td className="text-center px-1">
                    <span className="text-sm font-semibold text-white">
                      {season.averageRating > 0 ? season.averageRating.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
