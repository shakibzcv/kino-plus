"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MediaCard from "../../components/MediaCard";
import AuthModal from "../../components/AuthModal";
import { searchMedia, TrendingMovie } from "../../lib/tmdb";
import { useUserData } from "../../context/UserDataContext";

const TRENDING_SEARCHES = [
  "Dune: Part Two",
  "The Bear",
  "Oppenheimer",
  "Succession",
  "The Last of Us",
  "Severance",
  "Shogun",
  "House of the Dragon",
];

type FilterTab = "all" | "movie" | "tv";
type SortOption = "relevance" | "rating" | "newest";

function SearchLoadingSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="h-6 w-36 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="h-10 w-72 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="flex gap-3 mb-8">
          <div className="h-8 w-24 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-zinc-800 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-[147px] sm:w-[173px] md:w-[187px] h-[220px] sm:h-[260px] md:h-[280px] bg-zinc-800/60 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } = useUserData();

  const queryParam = searchParams.get("q") || "";
  const [currentQuery, setCurrentQuery] = useState(queryParam);
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const recentSearches = searchHistory.slice(0, 6);

  const [movies, setMovies] = useState<TrendingMovie[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(queryParam.trim()));
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const searchReqIdRef = React.useRef(0);

  // Sync internal state when URL query parameter changes
  useEffect(() => {
    setCurrentQuery(queryParam);
    setDebouncedQuery(queryParam);
  }, [queryParam]);

  // Debounce typed query by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(currentQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentQuery]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    let isMounted = true;
    async function executeSearch() {
      const clean = debouncedQuery.trim();
      if (!clean) {
        setIsLoading(false);
        setIsSearching(false);
        setMovies([]);
        return;
      }

      const reqId = ++searchReqIdRef.current;
      if (movies.length === 0) {
        setIsLoading(true);
      }
      setIsSearching(true);

      try {
        const data = await searchMedia(clean);
        if (isMounted && reqId === searchReqIdRef.current) {
          const seen = new Set<string>();
          const uniqueMovies = (data.results || []).filter((x) => {
            const k = `${x.mediaType || "movie"}-${x.id}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setMovies(uniqueMovies);
          if (uniqueMovies.length > 0) {
            addSearchHistory(clean);
          }
        }
      } catch (err) {
        console.error("Search execution failed:", err);
        if (isMounted && reqId === searchReqIdRef.current) {
          setMovies([]);
        }
      } finally {
        if (isMounted && reqId === searchReqIdRef.current) {
          setIsLoading(false);
          setIsSearching(false);
        }
      }
    }

    executeSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Filtered Media
  const movieCount = useMemo(
    () => movies.filter((m) => m.mediaType === "movie").length,
    [movies],
  );
  const tvCount = useMemo(
    () => movies.filter((m) => m.mediaType === "tv").length,
    [movies],
  );
  const totalCount = movies.length;

  // Filter and sort items based on active tab and sort option
  const displayedMedia = useMemo(() => {
    let list = [...movies];

    if (activeTab === "movie") {
      list = list.filter((m) => m.mediaType === "movie");
    } else if (activeTab === "tv") {
      list = list.filter((m) => m.mediaType === "tv");
    }

    if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      });
    }

    return list;
  }, [movies, activeTab, sortBy]);

  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
      {/* Navigation Header */}
      <Header
        searchQuery={currentQuery}
        onSearchChange={(q) => setCurrentQuery(q)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-200">Search</span>
          {currentQuery && (
            <>
              <span>/</span>
              <span className="text-[#f2545b] font-medium truncate max-w-[200px]">
                &ldquo;{currentQuery}&rdquo;
              </span>
            </>
          )}
        </div>

        {/* Search Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#2b2d32]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#f2545b]/20 text-[#f2545b] border border-[#f2545b]/30">
                Search Results
              </span>
              {isSearching ? (
                <span className="text-xs text-[#f2545b] animate-pulse font-medium">
                  Updating...
                </span>
              ) : (
                !isLoading &&
                debouncedQuery && (
                  <span className="text-xs text-zinc-400">
                    {totalCount} {totalCount === 1 ? "match" : "matches"} found
                  </span>
                )
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {currentQuery ? (
                <span>
                  Results for &ldquo;
                  <span className="text-[#f2545b]">{currentQuery}</span>&rdquo;
                </span>
              ) : (
                "Search Movies & TV Shows"
              )}
            </h1>
          </div>

          {/* Sort By Filter */}
          {displayedMedia.length > 1 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-zinc-400">Sort:</span>
              <div className="inline-flex bg-[#23262d] rounded-lg p-0.5 border border-[#30343e] text-xs">
                <button
                  type="button"
                  onClick={() => setSortBy("relevance")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    sortBy === "relevance"
                      ? "bg-[#f2545b] text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Relevance
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("rating")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    sortBy === "rating"
                      ? "bg-[#f2545b] text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Rating ★
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    sortBy === "newest"
                      ? "bg-[#f2545b] text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>
          )}
        </div>

        {/* In-Page Search Input Bar */}
        <div className="relative w-full max-w-xl mb-6">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
          <input
            type="text"
            placeholder="Search movies, TV shows, actors..."
            value={currentQuery}
            onChange={(e) => {
              const val = e.target.value;
              setCurrentQuery(val);
              if (val.trim()) {
                router.replace(`/search?q=${encodeURIComponent(val)}`);
              } else {
                router.replace("/search");
              }
            }}
            className="w-full bg-[#20222a] hover:bg-[#272a33] focus:bg-[#272a33] text-white text-sm pl-10 pr-9 py-2.5 rounded-xl border border-[#343844] focus:border-[#f2545b]/60 focus:outline-none placeholder-zinc-500 transition-colors shadow-sm"
          />
          {currentQuery && (
            <button
              type="button"
              onClick={() => {
                setCurrentQuery("");
                router.replace("/search");
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-zinc-950 shadow-md font-bold"
                : "bg-[#252830] text-zinc-300 hover:bg-[#2d313b] hover:text-white border border-[#343844]"
            }`}
          >
            All Content ({totalCount})
          </button>

          {movieCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("movie")}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "movie"
                  ? "bg-white text-zinc-950 shadow-md font-bold"
                  : "bg-[#252830] text-zinc-300 hover:bg-[#2d313b] hover:text-white border border-[#343844]"
              }`}
            >
              Movies ({movieCount})
            </button>
          )}

          {tvCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("tv")}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "tv"
                  ? "bg-white text-zinc-950 shadow-md font-bold"
                  : "bg-[#252830] text-zinc-300 hover:bg-[#2d313b] hover:text-white border border-[#343844]"
              }`}
            >
              TV Shows ({tvCount})
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-[147px] sm:w-[173px] md:w-[187px] h-[220px] sm:h-[260px] md:h-[280px] bg-zinc-800/60 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Search Assist - When No Query is typed */}
        {!isLoading && !currentQuery.trim() && (
          <div className="py-6 max-w-2xl">
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-300">
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={clearSearchHistory}
                    className="text-xs text-[#f2545b] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <div
                      key={`recent-${term}-${i}`}
                      className="group flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-[#20222a] border border-[#2e323d] text-xs text-zinc-300 hover:text-white hover:border-zinc-500 cursor-pointer transition-colors"
                      onClick={() => {
                        setCurrentQuery(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                      }}
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearchHistory(term);
                        }}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title={`Remove ${term}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                <svg className="w-4 h-4 text-[#f2545b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term, idx) => (
                  <button
                    key={`trending-${term}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCurrentQuery(term);
                      addSearchHistory(term);
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e2027] hover:bg-[#282b35] text-zinc-300 hover:text-white text-xs font-medium border border-[#2e323d] transition-all cursor-pointer shadow-sm"
                  >
                    <span className="text-[#f2545b] font-bold text-[11px]">{idx + 1}</span>
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State / No Results */}
        {!isLoading && !isSearching && totalCount === 0 && Boolean(currentQuery.trim()) && (
          <div className="py-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#23262e] border border-[#333742] flex items-center justify-center text-3xl">
              🔍
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              No matches found for &ldquo;{currentQuery}&rdquo;
            </h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              We couldn&apos;t find any titles matching that search. Check the
              spelling or try searching with general keywords.
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/categories"
                className="px-5 py-2.5 rounded-full bg-[#f2545b] hover:bg-[#e0434b] text-white text-xs font-bold transition-all shadow"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}

        {/* Movies and TV Series Results Grid */}
        {!isLoading && displayedMedia.length > 0 && (
          <section
            className={`transition-opacity duration-200 ${isSearching ? "opacity-75" : "opacity-100"}`}
          >
            <div className="flex flex-wrap gap-4">
              {displayedMedia.map((item, idx) => (
                <MediaCard
                  key={`${item.mediaType || "movie"}-${item.id}-${idx}`}
                  item={item}
                  expandOnHover={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
}
