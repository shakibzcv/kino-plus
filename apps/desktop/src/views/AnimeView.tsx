import React, { useState, useEffect, useCallback } from "react";
import { MediaItem, WatchlistItem } from "../types";
import {
  fetchAnimeShows,
  fetchAnimeAction,
  fetchAnimeMovies,
  fetchAnimeTopRated,
  fetchAnimeFantasy,
  fetchAnimeComedy,
} from "../lib/api";
import MediaRail from "../components/MediaRail";

interface AnimeViewProps {
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
}

export default function AnimeView({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onPlay,
}: AnimeViewProps): React.ReactElement {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [actionAnime, setActionAnime] = useState<MediaItem[]>([]);
  const [animeMovies, setAnimeMovies] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [fantasy, setFantasy] = useState<MediaItem[]>([]);
  const [comedy, setComedy] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trend, act, mov, top, fan, com] = await Promise.all([
        fetchAnimeShows(),
        fetchAnimeAction(),
        fetchAnimeMovies(),
        fetchAnimeTopRated(),
        fetchAnimeFantasy(),
        fetchAnimeComedy(),
      ]);
      setTrending(trend);
      setActionAnime(act);
      setAnimeMovies(mov);
      setTopRated(top);
      setFantasy(fan);
      setComedy(com);
    } catch (err) {
      console.error("Failed to load anime data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlay = (item: MediaItem) => {
    if (onPlay) onPlay(item);
    else onSelectMedia(item);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#18191c] text-white font-sans select-none overflow-y-auto">
      <main className="flex-1 w-full pt-6 sm:pt-8 pb-10">
        {/* Title Header */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Anime
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Top-rated anime series, legendary shonen battles, and cinematic masterpieces.
          </p>
        </div>

        <div className="space-y-2">
          {/* 1. Trending Anime Hits */}
          <MediaRail
            title="Trending Anime Hits"
            items={trending}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 2. Action & Shonen */}
          <MediaRail
            title="High-Octane Action & Shonen"
            items={actionAnime}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 3. Anime Feature Films */}
          <MediaRail
            title="Acclaimed Anime Feature Films"
            items={animeMovies}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 4. Top Rated Classics */}
          <MediaRail
            title="Top-Rated Anime Classics"
            items={topRated}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 5. Epic Fantasy & Supernatural */}
          <MediaRail
            title="Epic Fantasy & Supernatural"
            items={fantasy}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 6. Comedy & Slice of Life */}
          <MediaRail
            title="Comedy & Slice of Life"
            items={comedy}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlay}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />
        </div>
      </main>
    </div>
  );
}

