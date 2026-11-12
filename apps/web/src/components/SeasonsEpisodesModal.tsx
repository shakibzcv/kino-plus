"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormattedSeason,
  FormattedEpisode,
  SeriesRatingsGraphData,
  getTvSeasonEpisodes,
  getTvSeriesRatings,
} from "@/lib/tmdb";
import SeriesRatingsGraph from "./SeriesRatingsGraph";

interface SeasonsEpisodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string | number;
  showTitle: string;
  seasons: FormattedSeason[];
  initialSeason?: number;
  initialTab?: "episodes" | "graph";
  onSelectEpisode?: (season: number, episode: number) => void;
}

export default function SeasonsEpisodesModal({
  isOpen,
  onClose,
  showId,
  showTitle,
  seasons,
  initialSeason = 1,
  initialTab = "episodes",
  onSelectEpisode,
}: SeasonsEpisodesModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"episodes" | "graph">(initialTab);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [episodes, setEpisodes] = useState<FormattedEpisode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
  const [ratingsData, setRatingsData] = useState<SeriesRatingsGraphData | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState<boolean>(false);

  // Sync initial tab / season on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialSeason) setSelectedSeason(initialSeason);
    }
  }, [isOpen, initialTab, initialSeason]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load episodes when selectedSeason changes
  useEffect(() => {
    if (!isOpen || activeTab !== "episodes") return;
    let isMounted = true;
    setIsLoadingEpisodes(true);

    getTvSeasonEpisodes(showId, selectedSeason)
      .then((data) => {
        if (isMounted) {
          setEpisodes(data);
          setIsLoadingEpisodes(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEpisodes([]);
          setIsLoadingEpisodes(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, showId, selectedSeason, activeTab]);

  // Load ratings graph data on demand or when switched to graph
  useEffect(() => {
    if (!isOpen || ratingsData) return;
    let isMounted = true;
    setIsLoadingRatings(true);

    getTvSeriesRatings(showId)
      .then((data) => {
        if (isMounted) {
          setRatingsData(data);
          setIsLoadingRatings(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingRatings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, showId, ratingsData]);

  if (!isOpen) return null;

  const validSeasons = seasons.filter((s) => s.seasonNumber > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-white/10 bg-[#161822]/80 backdrop-blur-sm shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate max-w-md sm:max-w-xl">
              {showTitle}
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
              <span>{validSeasons.length} Seasons</span>
              <span>•</span>
              {ratingsData?.overallAverage ? (
                <span className="text-amber-400 font-bold">
                  ★ {ratingsData.overallAverage.toFixed(1)} Series Rating
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switchers in header */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "episodes"
                    ? "bg-[#f2545b] text-white shadow-md shadow-[#f2545b]/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Episodes</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("graph")}
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "graph"
                    ? "bg-[#f2545b] text-white shadow-md shadow-[#f2545b]/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Series Graph</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 no-scrollbar">
          {activeTab === "episodes" ? (
            <div className="flex flex-col gap-6">
              {validSeasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 bg-black/40 border border-white/10 rounded-2xl p-2.5">
                  {validSeasons.map((season) => {
                    const isSelected = season.seasonNumber === selectedSeason;
                    return (
                      <button
                        key={season.seasonNumber}
                        type="button"
                        onClick={() => setSelectedSeason(season.seasonNumber)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? "bg-white text-black shadow-lg shadow-white/10 scale-105"
                            : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
                        }`}
                      >
                        Season {season.seasonNumber}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode Items List */}
              {isLoadingEpisodes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
                    >
                      <div className="w-28 sm:w-36 aspect-video rounded-xl bg-zinc-800/60 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-zinc-700/60" />
                        <div className="h-3 w-1/2 rounded bg-zinc-800/50" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : episodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        onClose();
                        if (onSelectEpisode) {
                          onSelectEpisode(selectedSeason, ep.episodeNumber);
                        }
                      }}
                      className="group flex items-start gap-4 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/70 border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-md"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-zinc-950 shrink-0">
                        {ep.still ? (
                          <Image
                            src={ep.still}
                            alt={ep.name}
                            fill
                            sizes="144px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized={ep.still.startsWith("http")}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xs">
                            Ep {ep.episodeNumber}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-200">
                          {ep.runtime ? `${ep.runtime}m` : `Ep ${ep.episodeNumber}`}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-extrabold text-[#f2545b]">
                              Episode {ep.episodeNumber}
                            </span>
                            {ep.rating > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400 shrink-0">
                                ★ {ep.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#f2545b] transition-colors truncate">
                            {ep.name}
                          </h4>
                          {ep.overview && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                              {ep.overview}
                            </p>
                          )}
                        </div>

                        {ep.airDate && (
                          <span className="text-[10px] text-zinc-500 font-medium mt-1">
                            Aired: {ep.airDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400">
                  <p>No episodes found for Season {selectedSeason}.</p>
                </div>
              )}
            </div>
          ) : (
            /* Series Graph View */
            <div className="w-full">
              {isLoadingRatings ? (
                <div className="p-12 text-center text-zinc-400 animate-pulse">
                  <p className="font-semibold text-sm">
                    Loading complete series episode ratings...
                  </p>
                </div>
              ) : ratingsData ? (
                <SeriesRatingsGraph
                  data={ratingsData}
                  seriesId={showId}
                  onSelectEpisode={(season, episode) => {
                    onClose();
                    if (onSelectEpisode) {
                      onSelectEpisode(season, episode);
                    }
                  }}
                />
              ) : (
                <div className="p-8 text-center text-zinc-400">
                  <p>Could not load ratings graph for this series.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
