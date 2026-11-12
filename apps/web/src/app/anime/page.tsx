"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "../../components/Header";
import MediaSlider from "../../components/MediaSlider";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import {
  getAnimeShows,
  getAnimeAction,
  getAnimeTopRated,
  getAnimeFantasy,
  getAnimeComedy,
  getAnimeMovies,
  TrendingMovie,
} from "../../lib/tmdb";

type SectionState<T> = { data: T[]; isLoading: boolean; error: string | null };
const loading = <T,>(): SectionState<T> => ({
  data: [],
  isLoading: true,
  error: null,
});

export default function AnimePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Anime sections
  const [trendingAnimeState, setTrendingAnimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [actionAnimeState, setActionAnimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [moviesAnimeState, setMoviesAnimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [topRatedAnimeState, setTopRatedAnimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [fantasyAnimeState, setFantasyAnimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [comedyAnimeState, setComedyAnimeState] = useState<SectionState<TrendingMovie>>(loading());

  const fetchSection = useCallback(
    async <T,>(
      fetcher: () => Promise<T[]>,
      setState: React.Dispatch<React.SetStateAction<SectionState<T>>>,
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await fetcher();
        setState({ data, isLoading: false, error: null });
      } catch {
        setState({
          data: [],
          isLoading: false,
          error: "Failed to load",
        });
      }
    },
    [],
  );

  const loadAll = useCallback(() => {
    fetchSection(getAnimeShows, setTrendingAnimeState);
    fetchSection(getAnimeAction, setActionAnimeState);
    fetchSection(getAnimeMovies, setMoviesAnimeState);
    fetchSection(getAnimeTopRated, setTopRatedAnimeState);
    fetchSection(getAnimeFantasy, setFantasyAnimeState);
    fetchSection(getAnimeComedy, setComedyAnimeState);
  }, [fetchSection]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      <main className="flex-1 w-full pt-6 sm:pt-8 pb-16">
        {/* Title Header */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Anime
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Top-rated anime series, legendary shonen battles, and cinematic masterpieces.
          </p>
        </div>

        {/* 1. Trending Anime Hits */}
        <MediaSlider
          title="Trending Anime Hits"
          items={trendingAnimeState.data}
          isLoading={trendingAnimeState.isLoading}
          error={trendingAnimeState.error}
          onRetry={() => fetchSection(getAnimeShows, setTrendingAnimeState)}
        />

        {/* 2. Action & Shonen */}
        <MediaSlider
          title="High-Octane Action &amp; Shonen"
          items={actionAnimeState.data}
          isLoading={actionAnimeState.isLoading}
          error={actionAnimeState.error}
          onRetry={() => fetchSection(getAnimeAction, setActionAnimeState)}
        />

        {/* 3. Anime Movies */}
        <MediaSlider
          title="Acclaimed Anime Feature Films"
          items={moviesAnimeState.data}
          isLoading={moviesAnimeState.isLoading}
          error={moviesAnimeState.error}
          onRetry={() => fetchSection(getAnimeMovies, setMoviesAnimeState)}
        />

        {/* 4. Top Rated Classics */}
        <MediaSlider
          title="Top-Rated Anime Classics"
          items={topRatedAnimeState.data}
          isLoading={topRatedAnimeState.isLoading}
          error={topRatedAnimeState.error}
          onRetry={() => fetchSection(getAnimeTopRated, setTopRatedAnimeState)}
        />

        {/* 5. Epic Fantasy & Supernatural */}
        <MediaSlider
          title="Epic Fantasy &amp; Supernatural"
          items={fantasyAnimeState.data}
          isLoading={fantasyAnimeState.isLoading}
          error={fantasyAnimeState.error}
          onRetry={() => fetchSection(getAnimeFantasy, setFantasyAnimeState)}
        />

        {/* 6. Comedy & Slice of Life */}
        <MediaSlider
          title="Comedy &amp; Slice of Life"
          items={comedyAnimeState.data}
          isLoading={comedyAnimeState.isLoading}
          error={comedyAnimeState.error}
          onRetry={() => fetchSection(getAnimeComedy, setComedyAnimeState)}
        />
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
