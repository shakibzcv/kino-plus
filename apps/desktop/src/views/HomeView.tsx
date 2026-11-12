import React, { useState, useEffect, useCallback } from "react";
import { MediaItem, WatchlistItem, TrailerItem } from "../types";
import {
  fetchMostWatchlisted,
  fetchRecommendedMovies,
  fetchBingeShows,
  fetchTrendingTrailers,
  fetchNewTrailers,
  fetchLeavingSoonMovies,
  fetchHorrorMovies,
  fetchAnimeShows,
  fetchRealityShows,
  fetchActionMovies,
  fetchSciFiMovies,
  fetchAwardWinningDramas,
} from "../lib/api";
import MediaRail from "../components/MediaRail";
import CategoryChips from "../components/CategoryChips";
import TrailerSlider from "../components/TrailerSlider";

interface SectionState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
}

const loadingState = <T,>(): SectionState<T> => ({ data: [], isLoading: true, error: null });

interface HomeViewProps {
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function HomeView({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onPlay,
  onNavigateTab,
}: HomeViewProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState("");

  const [watchlistedState, setWatchlistedState] = useState<SectionState<MediaItem>>(loadingState());
  const [recommendedState, setRecommendedState] = useState<SectionState<MediaItem>>(loadingState());
  const [trendingTrState, setTrendingTrState] = useState<SectionState<TrailerItem>>(loadingState());
  const [horrorState, setHorrorState] = useState<SectionState<MediaItem>>(loadingState());
  const [leavingState, setLeavingState] = useState<SectionState<TrailerItem>>(loadingState());
  const [animeState, setAnimeState] = useState<SectionState<MediaItem>>(loadingState());
  const [bingeState, setBingeState] = useState<SectionState<MediaItem>>(loadingState());
  const [actionState, setActionState] = useState<SectionState<MediaItem>>(loadingState());
  const [newTrState, setNewTrState] = useState<SectionState<TrailerItem>>(loadingState());
  const [realityState, setRealityState] = useState<SectionState<MediaItem>>(loadingState());
  const [sciFiState, setSciFiState] = useState<SectionState<MediaItem>>(loadingState());
  const [dramasState, setDramasState] = useState<SectionState<MediaItem>>(loadingState());

  const fetchSection = useCallback(async <T,>(
    fetcher: () => Promise<T[]>,
    setState: React.Dispatch<React.SetStateAction<SectionState<T>>>,
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, isLoading: false, error: null });
    } catch {
      setState({ data: [], isLoading: false, error: "Internal Server Error" });
    }
  }, []);

  const loadAll = useCallback(() => {
    fetchSection(fetchMostWatchlisted, setWatchlistedState);
    fetchSection(fetchRecommendedMovies, setRecommendedState);
    fetchSection(fetchTrendingTrailers, setTrendingTrState);
    fetchSection(fetchHorrorMovies, setHorrorState);
    fetchSection(fetchLeavingSoonMovies, setLeavingState);
    fetchSection(fetchAnimeShows, setAnimeState);
    fetchSection(fetchBingeShows, setBingeState);
    fetchSection(fetchActionMovies, setActionState);
    fetchSection(fetchNewTrailers, setNewTrState);
    fetchSection(fetchRealityShows, setRealityState);
    fetchSection(fetchSciFiMovies, setSciFiState);
    fetchSection(fetchAwardWinningDramas, setDramasState);
  }, [fetchSection]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePlayMedia = (item: MediaItem) => {
    if (onPlay) onPlay(item);
    else onSelectMedia(item);
  };

  const handlePlayTrailer = (tr: TrailerItem) => {
    if (tr.id && onPlay) onPlay({ id: tr.id, title: tr.title, mediaType: "movie", backdrop: tr.thumbnail });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#18191c] text-white font-sans select-none overflow-y-auto">
      <main className="flex-1 w-full pt-6 sm:pt-8 pb-10">
        <CategoryChips selectedCategory={selectedCategory} onSelectCategory={(category) => { setSelectedCategory(category); onNavigateTab?.("categories"); }} onHeadingClick={() => onNavigateTab?.("categories")} />

        <MediaRail title="Most Watchlisted This Week" items={watchlistedState.data} isLoading={watchlistedState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        <MediaRail title="Recommended For You" items={recommendedState.data} isLoading={recommendedState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />

        <TrailerSlider title="Trending Trailers" items={trendingTrState.data} isLoading={trendingTrState.isLoading} error={trendingTrState.error} onRetry={() => fetchSection(fetchTrendingTrailers, setTrendingTrState)} onPlayTrailer={handlePlayTrailer} />

        <MediaRail title="Spine-Chilling Horror Debuts" items={horrorState.data} isLoading={horrorState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />

        <TrailerSlider title="Leaving Soon" items={leavingState.data} isLoading={leavingState.isLoading} error={leavingState.error} onRetry={() => fetchSection(fetchLeavingSoonMovies, setLeavingState)} onPlayTrailer={handlePlayTrailer} />

        <MediaRail title="Anime Hits & Animation" items={animeState.data} isLoading={animeState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        <MediaRail title="Binge-Worthy Shows" items={bingeState.data} isLoading={bingeState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        <MediaRail title="High-Octane Action Blockbusters" items={actionState.data} isLoading={actionState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />

        <TrailerSlider title="New Trailers" items={newTrState.data} isLoading={newTrState.isLoading} error={newTrState.error} onRetry={() => fetchSection(fetchNewTrailers, setNewTrState)} onPlayTrailer={handlePlayTrailer} />

        <MediaRail title="Reality & Lifestyle TV" items={realityState.data} isLoading={realityState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        <MediaRail title="Sci-Fi & Cyberpunk Visions" items={sciFiState.data} isLoading={sciFiState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
        <MediaRail title="Critically Acclaimed Dramas" items={dramasState.data} isLoading={dramasState.isLoading} onSelectMedia={onSelectMedia} onPlayMedia={handlePlayMedia} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
      </main>
    </div>
  );
}
