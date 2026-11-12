import React, { useState, useEffect, useCallback } from "react";
import { MediaItem, WatchlistItem, TrailerItem } from "../types";
import {
  fetchRecommendedMovies,
  fetchActionMovies,
  fetchSciFiMovies,
  fetchHorrorMovies,
  fetchAwardWinningDramas,
  fetchTrendingTrailers,
  fetchNewTrailers,
  fetchLeavingSoonMovies,
  fetchMoviesByCategory,
} from "../lib/api";
import MediaRail from "../components/MediaRail";
import TrailerSlider from "../components/TrailerSlider";

interface MoviesViewProps {
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
}

export default function MoviesView({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onPlay,
}: MoviesViewProps): React.ReactElement {
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [actionMovies, setActionMovies] = useState<MediaItem[]>([]);
  const [trendingTrailers, setTrendingTrailers] = useState<TrailerItem[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<MediaItem[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<MediaItem[]>([]);
  const [leavingSoon, setLeavingSoon] = useState<TrailerItem[]>([]);
  const [dramas, setDramas] = useState<MediaItem[]>([]);
  const [newTrailers, setNewTrailers] = useState<TrailerItem[]>([]);
  const [comedyMovies, setComedyMovies] = useState<MediaItem[]>([]);
  const [crimeMovies, setCrimeMovies] = useState<MediaItem[]>([]);
  const [adventureMovies, setAdventureMovies] = useState<MediaItem[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filterMoviesOnly = (list: MediaItem[]) =>
    list.filter((item) => item.mediaType !== "tv").map((item) => ({ ...item, mediaType: "movie" as const }));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recom, act, tr, hor, sci, ls, dra, newTr, com, cri, adv, rom] = await Promise.all([
        fetchRecommendedMovies(),
        fetchActionMovies(),
        fetchTrendingTrailers(),
        fetchHorrorMovies(),
        fetchSciFiMovies(),
        fetchLeavingSoonMovies(),
        fetchAwardWinningDramas(),
        fetchNewTrailers(),
        fetchMoviesByCategory("comedy"),
        fetchMoviesByCategory("crime"),
        fetchMoviesByCategory("adventure"),
        fetchMoviesByCategory("romance"),
      ]);
      setRecommended(filterMoviesOnly(recom));
      setActionMovies(filterMoviesOnly(act));
      setTrendingTrailers(tr);
      setHorrorMovies(filterMoviesOnly(hor));
      setSciFiMovies(filterMoviesOnly(sci));
      setLeavingSoon(ls);
      setDramas(filterMoviesOnly(dra));
      setNewTrailers(newTr);
      setComedyMovies(filterMoviesOnly(com));
      setCrimeMovies(filterMoviesOnly(cri));
      setAdventureMovies(filterMoviesOnly(adv));
      setRomanceMovies(filterMoviesOnly(rom));
    } catch (err) {
      console.error("Failed to load movies data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePlayMedia = (item: MediaItem) => { if (onPlay) onPlay(item); else onSelectMedia(item); };
  const handlePlayTrailer = (tr: TrailerItem) => { if (tr.id && onPlay) onPlay({ id: tr.id, title: tr.title, mediaType: "movie", backdrop: tr.thumbnail }); };

  return (
    <div className="w-full h-full flex flex-col bg-[#18191c] text-white font-sans select-none overflow-y-auto">
      <main className="flex-1 w-full pt-6 sm:pt-8 pb-10">
        {/* Title Header */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Movies</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Stream popular blockbusters, award-winning dramas, and Hollywood hits.
          </p>
        </div>

        <div className="space-y-2">
          <MediaRail title="Recommended For You" items={recommended} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <MediaRail title="High-Octane Action Blockbusters" items={actionMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <TrailerSlider title="Trending Movie Trailers" items={trendingTrailers} isLoading={isLoading} onPlayTrailer={handlePlayTrailer} />
          <MediaRail title="Spine-Chilling Horror Debuts" items={horrorMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <MediaRail title="Sci-Fi & Cyberpunk Visions" items={sciFiMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <TrailerSlider title="Leaving Soon" items={leavingSoon} isLoading={isLoading} onPlayTrailer={handlePlayTrailer} />
          <MediaRail title="Critically Acclaimed Dramas" items={dramas} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <TrailerSlider title="New Movie Trailers" items={newTrailers} isLoading={isLoading} onPlayTrailer={handlePlayTrailer} />
          <MediaRail title="Laugh-Out-Loud Comedies" items={comedyMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <MediaRail title="Thrilling Crime & Mystery" items={crimeMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <MediaRail title="Epic Adventures & Quests" items={adventureMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
          <MediaRail title="Romantic Favorites & Love Stories" items={romanceMovies} isLoading={isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        </div>
      </main>
    </div>
  );
}
