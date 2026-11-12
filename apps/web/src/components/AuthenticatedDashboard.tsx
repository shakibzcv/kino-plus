"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedHeader } from "./Header";
import CategoryChips from "./CategoryChips";
import MediaSlider from "./MediaSlider";
import TrailerSlider from "./TrailerSlider";
import Footer from "./Footer";
import {
  getMostWatchlisted,
  getRecommendedMovies,
  getBingeWorthyShows,
  getTrendingTrailers,
  getNewTrailers,
  getHorrorMovies,
  getAnimeShows,
  getRealityShows,
  getActionMovies,
  getSciFiMovies,
  getAwardWinningDramas,
  getLeavingSoonMovies,
  TrendingMovie,
  TrailerItem,
} from "../lib/tmdb";

type SectionState<T> = { data: T[]; isLoading: boolean; error: string | null };
const loading = <T,>(): SectionState<T> => ({
  data: [],
  isLoading: true,
  error: null,
});

/**
 * 🌟 Authenticated Dashboard View
 * Media browsing hub for authenticated users, pulling from the API.
 */
export default function AuthenticatedDashboard(): React.ReactElement {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [watchlistedState, setWatchlistedState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [recommendedState, setRecommendedState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [trendingTrState, setTrendingTrState] =
    useState<SectionState<TrailerItem>>(loading());
  const [horrorState, setHorrorState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [leavingState, setLeavingState] =
    useState<SectionState<TrailerItem>>(loading());
  const [animeState, setAnimeState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [bingeState, setBingeState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [actionState, setActionState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [newTrState, setNewTrState] =
    useState<SectionState<TrailerItem>>(loading());
  const [realityState, setRealityState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [sciFiState, setSciFiState] =
    useState<SectionState<TrendingMovie>>(loading());
  const [dramasState, setDramasState] =
    useState<SectionState<TrendingMovie>>(loading());

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
    fetchSection(getMostWatchlisted, setWatchlistedState);
    fetchSection(getRecommendedMovies, setRecommendedState);
    fetchSection(getTrendingTrailers, setTrendingTrState);
    fetchSection(getHorrorMovies, setHorrorState);
    fetchSection(getLeavingSoonMovies, setLeavingState);
    fetchSection(getAnimeShows, setAnimeState);
    fetchSection(getBingeWorthyShows, setBingeState);
    fetchSection(getActionMovies, setActionState);
    fetchSection(getNewTrailers, setNewTrState);
    fetchSection(getRealityShows, setRealityState);
    fetchSection(getSciFiMovies, setSciFiState);
    fetchSection(getAwardWinningDramas, setDramasState);
  }, [fetchSection]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
      <AuthenticatedHeader />

      <main className="flex-1 w-full pt-6 sm:pt-8 pb-16">
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            router.push(`/category?name=${encodeURIComponent(category)}`);
          }}
        />

        <MediaSlider
          title="Most Watchlisted This Week"
          items={watchlistedState.data}
          isLoading={watchlistedState.isLoading}
          error={watchlistedState.error}
          onRetry={() => fetchSection(getMostWatchlisted, setWatchlistedState)}
        />
        <MediaSlider
          title="Recommended For You"
          items={recommendedState.data}
          isLoading={recommendedState.isLoading}
          error={recommendedState.error}
          onRetry={() =>
            fetchSection(getRecommendedMovies, setRecommendedState)
          }
        />
        <TrailerSlider
          title="Trending Trailers"
          items={trendingTrState.data}
          isLoading={trendingTrState.isLoading}
          error={trendingTrState.error}
          onRetry={() => fetchSection(getTrendingTrailers, setTrendingTrState)}
        />
        <MediaSlider
          title="Spine-Chilling Horror Debuts"
          items={horrorState.data}
          isLoading={horrorState.isLoading}
          error={horrorState.error}
          onRetry={() => fetchSection(getHorrorMovies, setHorrorState)}
        />
        <TrailerSlider
          title="Leaving Soon"
          items={leavingState.data}
          isLoading={leavingState.isLoading}
          error={leavingState.error}
          onRetry={() => fetchSection(getLeavingSoonMovies, setLeavingState)}
        />
        <MediaSlider
          title="Anime Hits & Animation"
          items={animeState.data}
          isLoading={animeState.isLoading}
          error={animeState.error}
          onRetry={() => fetchSection(getAnimeShows, setAnimeState)}
        />
        <MediaSlider
          title="Binge-Worthy Shows"
          items={bingeState.data}
          isLoading={bingeState.isLoading}
          error={bingeState.error}
          onRetry={() => fetchSection(getBingeWorthyShows, setBingeState)}
        />
        <MediaSlider
          title="High-Octane Action Blockbusters"
          items={actionState.data}
          isLoading={actionState.isLoading}
          error={actionState.error}
          onRetry={() => fetchSection(getActionMovies, setActionState)}
        />
        <TrailerSlider
          title="New Trailers"
          items={newTrState.data}
          isLoading={newTrState.isLoading}
          error={newTrState.error}
          onRetry={() => fetchSection(getNewTrailers, setNewTrState)}
        />
        <MediaSlider
          title="Reality & Lifestyle TV"
          items={realityState.data}
          isLoading={realityState.isLoading}
          error={realityState.error}
          onRetry={() => fetchSection(getRealityShows, setRealityState)}
        />
        <MediaSlider
          title="Sci-Fi & Cyberpunk Visions"
          items={sciFiState.data}
          isLoading={sciFiState.isLoading}
          error={sciFiState.error}
          onRetry={() => fetchSection(getSciFiMovies, setSciFiState)}
        />
        <MediaSlider
          title="Critically Acclaimed Dramas"
          items={dramasState.data}
          isLoading={dramasState.isLoading}
          error={dramasState.error}
          onRetry={() => fetchSection(getAwardWinningDramas, setDramasState)}
        />
      </main>

      <Footer />
    </div>
  );
}
