"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "../../components/Header";
import MediaSlider from "../../components/MediaSlider";
import TrailerSlider from "../../components/TrailerSlider";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import {
  getRecommendedMovies,
  getActionMovies,
  getTrendingTrailers,
  getHorrorMovies,
  getSciFiMovies,
  getLeavingSoonMovies,
  getAwardWinningDramas,
  getNewTrailers,
  getMoviesByCategory,
  TrendingMovie,
  TrailerItem,
} from "../../lib/tmdb";

type SectionState<T> = { data: T[]; isLoading: boolean; error: string | null };
const loading = <T,>(): SectionState<T> => ({
  data: [],
  isLoading: true,
  error: null,
});

export default function MoviesPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Movie sections
  const [recommendedState, setRecommendedState] = useState<SectionState<TrendingMovie>>(loading());
  const [actionState, setActionState] = useState<SectionState<TrendingMovie>>(loading());
  const [trendingTrState, setTrendingTrState] = useState<SectionState<TrailerItem>>(loading());
  const [horrorState, setHorrorState] = useState<SectionState<TrendingMovie>>(loading());
  const [sciFiState, setSciFiState] = useState<SectionState<TrendingMovie>>(loading());
  const [leavingState, setLeavingState] = useState<SectionState<TrailerItem>>(loading());
  const [dramasState, setDramasState] = useState<SectionState<TrendingMovie>>(loading());
  const [newTrState, setNewTrState] = useState<SectionState<TrailerItem>>(loading());
  const [comedyState, setComedyState] = useState<SectionState<TrendingMovie>>(loading());
  const [crimeState, setCrimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [adventureState, setAdventureState] = useState<SectionState<TrendingMovie>>(loading());
  const [romanceState, setRomanceState] = useState<SectionState<TrendingMovie>>(loading());

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
    fetchSection(getRecommendedMovies, setRecommendedState);
    fetchSection(getActionMovies, setActionState);
    fetchSection(getTrendingTrailers, setTrendingTrState);
    fetchSection(getHorrorMovies, setHorrorState);
    fetchSection(getSciFiMovies, setSciFiState);
    fetchSection(getLeavingSoonMovies, setLeavingState);
    fetchSection(getAwardWinningDramas, setDramasState);
    fetchSection(getNewTrailers, setNewTrState);
    fetchSection(() => getMoviesByCategory("comedy"), setComedyState);
    fetchSection(() => getMoviesByCategory("crime"), setCrimeState);
    fetchSection(() => getMoviesByCategory("adventure"), setAdventureState);
    fetchSection(() => getMoviesByCategory("romance"), setRomanceState);
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
            Movies
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Stream popular blockbusters, award-winning dramas, and Hollywood hits.
          </p>
        </div>

        {/* 1. Recommended Movies */}
        <MediaSlider
          title="Recommended For You"
          items={recommendedState.data}
          isLoading={recommendedState.isLoading}
          error={recommendedState.error}
          onRetry={() => fetchSection(getRecommendedMovies, setRecommendedState)}
        />

        {/* 2. Action Blockbusters */}
        <MediaSlider
          title="High-Octane Action Blockbusters"
          items={actionState.data}
          isLoading={actionState.isLoading}
          error={actionState.error}
          onRetry={() => fetchSection(getActionMovies, setActionState)}
        />

        {/* 3. Trending Movie Trailers */}
        <TrailerSlider
          title="Trending Movie Trailers"
          items={trendingTrState.data}
          isLoading={trendingTrState.isLoading}
          error={trendingTrState.error}
          onRetry={() => fetchSection(getTrendingTrailers, setTrendingTrState)}
        />

        {/* 4. Spine-Chilling Horror */}
        <MediaSlider
          title="Spine-Chilling Horror Debuts"
          items={horrorState.data}
          isLoading={horrorState.isLoading}
          error={horrorState.error}
          onRetry={() => fetchSection(getHorrorMovies, setHorrorState)}
        />

        {/* 5. Sci-Fi & Cyberpunk Visions */}
        <MediaSlider
          title="Sci-Fi & Cyberpunk Visions"
          items={sciFiState.data}
          isLoading={sciFiState.isLoading}
          error={sciFiState.error}
          onRetry={() => fetchSection(getSciFiMovies, setSciFiState)}
        />

        {/* 6. Leaving Soon Trailers */}
        <TrailerSlider
          title="Leaving Soon"
          items={leavingState.data}
          isLoading={leavingState.isLoading}
          error={leavingState.error}
          onRetry={() => fetchSection(getLeavingSoonMovies, setLeavingState)}
        />

        {/* 7. Critically Acclaimed Dramas */}
        <MediaSlider
          title="Critically Acclaimed Dramas"
          items={dramasState.data}
          isLoading={dramasState.isLoading}
          error={dramasState.error}
          onRetry={() => fetchSection(getAwardWinningDramas, setDramasState)}
        />

        {/* 8. New Movie Trailers */}
        <TrailerSlider
          title="New Movie Trailers"
          items={newTrState.data}
          isLoading={newTrState.isLoading}
          error={newTrState.error}
          onRetry={() => fetchSection(getNewTrailers, setNewTrState)}
        />

        {/* 9. Comedies */}
        <MediaSlider
          title="Laugh-Out-Loud Comedies"
          items={comedyState.data}
          isLoading={comedyState.isLoading}
          error={comedyState.error}
          onRetry={() => fetchSection(() => getMoviesByCategory("comedy"), setComedyState)}
        />

        {/* 10. Crime & Mystery */}
        <MediaSlider
          title="Thrilling Crime & Mystery"
          items={crimeState.data}
          isLoading={crimeState.isLoading}
          error={crimeState.error}
          onRetry={() => fetchSection(() => getMoviesByCategory("crime"), setCrimeState)}
        />

        {/* 11. Adventures */}
        <MediaSlider
          title="Epic Adventures & Quests"
          items={adventureState.data}
          isLoading={adventureState.isLoading}
          error={adventureState.error}
          onRetry={() => fetchSection(() => getMoviesByCategory("adventure"), setAdventureState)}
        />

        {/* 12. Romance */}
        <MediaSlider
          title="Romantic Favorites & Love Stories"
          items={romanceState.data}
          isLoading={romanceState.isLoading}
          error={romanceState.error}
          onRetry={() => fetchSection(() => getMoviesByCategory("romance"), setRomanceState)}
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
