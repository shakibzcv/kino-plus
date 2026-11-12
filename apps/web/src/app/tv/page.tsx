"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "../../components/Header";
import MediaSlider from "../../components/MediaSlider";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import {
  getBingeWorthyShows,
  getRealityShows,
  getTvByCategory,
  TrendingMovie,
} from "../../lib/tmdb";

type SectionState<T> = { data: T[]; isLoading: boolean; error: string | null };
const loading = <T,>(): SectionState<T> => ({
  data: [],
  isLoading: true,
  error: null,
});

export default function TvShowsPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // TV show sections
  const [bingeState, setBingeState] = useState<SectionState<TrendingMovie>>(loading());
  const [dramaState, setDramaState] = useState<SectionState<TrendingMovie>>(loading());
  const [realityState, setRealityState] = useState<SectionState<TrendingMovie>>(loading());
  const [comedyState, setComedyState] = useState<SectionState<TrendingMovie>>(loading());
  const [actionState, setActionState] = useState<SectionState<TrendingMovie>>(loading());
  const [crimeState, setCrimeState] = useState<SectionState<TrendingMovie>>(loading());
  const [sciFiState, setSciFiState] = useState<SectionState<TrendingMovie>>(loading());
  const [familyState, setFamilyState] = useState<SectionState<TrendingMovie>>(loading());
  const [docState, setDocState] = useState<SectionState<TrendingMovie>>(loading());

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
    fetchSection(getBingeWorthyShows, setBingeState);
    fetchSection(() => getTvByCategory("drama"), setDramaState);
    fetchSection(getRealityShows, setRealityState);
    fetchSection(() => getTvByCategory("comedy"), setComedyState);
    fetchSection(() => getTvByCategory("action"), setActionState);
    fetchSection(() => getTvByCategory("crime"), setCrimeState);
    fetchSection(() => getTvByCategory("fantasy"), setSciFiState);
    fetchSection(() => getTvByCategory("family"), setFamilyState);
    fetchSection(() => getTvByCategory("documentary"), setDocState);
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
            TV Shows
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Binge-worthy series, reality sagas, and prestige television.
          </p>
        </div>

        {/* 1. Binge-Worthy Shows */}
        <MediaSlider
          title="Binge-Worthy Shows"
          items={bingeState.data}
          isLoading={bingeState.isLoading}
          error={bingeState.error}
          onRetry={() => fetchSection(getBingeWorthyShows, setBingeState)}
        />

        {/* 2. Prestige Drama Series */}
        <MediaSlider
          title="Prestige Drama Series"
          items={dramaState.data}
          isLoading={dramaState.isLoading}
          error={dramaState.error}
          onRetry={() => fetchSection(() => getTvByCategory("drama"), setDramaState)}
        />

        {/* 3. Reality & Lifestyle TV */}
        <MediaSlider
          title="Reality & Lifestyle TV"
          items={realityState.data}
          isLoading={realityState.isLoading}
          error={realityState.error}
          onRetry={() => fetchSection(getRealityShows, setRealityState)}
        />

        {/* 4. Hilarious Comedy Series */}
        <MediaSlider
          title="Hilarious Comedy Series"
          items={comedyState.data}
          isLoading={comedyState.isLoading}
          error={comedyState.error}
          onRetry={() => fetchSection(() => getTvByCategory("comedy"), setComedyState)}
        />

        {/* 5. Action & Adventure Series */}
        <MediaSlider
          title="Action & Adventure Series"
          items={actionState.data}
          isLoading={actionState.isLoading}
          error={actionState.error}
          onRetry={() => fetchSection(() => getTvByCategory("action"), setActionState)}
        />

        {/* 6. Edge-of-Your-Seat Crime & Mystery */}
        <MediaSlider
          title="Edge-of-Your-Seat Crime & Mystery"
          items={crimeState.data}
          isLoading={crimeState.isLoading}
          error={crimeState.error}
          onRetry={() => fetchSection(() => getTvByCategory("crime"), setCrimeState)}
        />

        {/* 7. Sci-Fi & Fantasy Series */}
        <MediaSlider
          title="Sci-Fi & Fantasy Series"
          items={sciFiState.data}
          isLoading={sciFiState.isLoading}
          error={sciFiState.error}
          onRetry={() => fetchSection(() => getTvByCategory("fantasy"), setSciFiState)}
        />

        {/* 8. Family Favorites */}
        <MediaSlider
          title="Family Favorites & Kids"
          items={familyState.data}
          isLoading={familyState.isLoading}
          error={familyState.error}
          onRetry={() => fetchSection(() => getTvByCategory("family"), setFamilyState)}
        />

        {/* 9. Documentaries & Docuseries */}
        <MediaSlider
          title="Fascinating Documentaries & Docuseries"
          items={docState.data}
          isLoading={docState.isLoading}
          error={docState.error}
          onRetry={() => fetchSection(() => getTvByCategory("documentary"), setDocState)}
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
