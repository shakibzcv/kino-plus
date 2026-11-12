"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import { getCategoryVisual } from "../../lib/categories";
import { getMediaByCategory, TrendingMovie } from "../../lib/tmdb";

function CategoryMediaContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryName =
    searchParams.get("name") || searchParams.get("category") || "Action";
  const visualInfo = getCategoryVisual(categoryName);

  const [items, setItems] = useState<TrendingMovie[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Fetch category media from the Express API backend
  const loadMedia = useCallback(
    async (cat: string, pageNum: number, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await getMediaByCategory(cat, "all", pageNum);
        const newItems = response.items || [];
        if (append) {
          setItems((prev) => {
            const seen = new Set(
              prev.map((x) => `${x.mediaType || "movie"}-${x.id}`),
            );
            const unique = newItems.filter(
              (x) => !seen.has(`${x.mediaType || "movie"}-${x.id}`),
            );
            return [...prev, ...unique];
          });
        } else {
          const seen = new Set<string>();
          const unique = newItems.filter((x) => {
            const k = `${x.mediaType || "movie"}-${x.id}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setItems(unique);
        }
        setTotalPages(response.totalPages || 1);
        setError(null);
      } catch (err: any) {
        console.error(`Failed to load media for ${cat}:`, err);
        setError("Failed to load titles for this category. Please try again.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(1);
    loadMedia(categoryName, 1, false);
  }, [categoryName, loadMedia]);

  const handleLoadMore = () => {
    if (isLoadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMedia(categoryName, nextPage, true);
  };

  const filteredItems = items;

  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
      {/* Global Navigation Header */}
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb Back Link to Categories */}
        <div className="mb-4">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors group cursor-pointer"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Categories</span>
          </Link>
        </div>

        {/* Category Header Section matching Image 2 */}
        <div className="mb-8 sm:mb-10 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2.5">
            {visualInfo.name} Movies & TV Shows
          </h1>
          <p className="text-xs sm:text-sm md:text-[15px] text-zinc-300 leading-relaxed font-normal">
            {visualInfo.description}
          </p>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div
                key={`cat-skeleton-${idx}`}
                className="aspect-[2/3] rounded-xl bg-[#23262d] animate-pulse border border-white/5"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <p className="text-red-400 font-semibold mb-4 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => loadMedia(categoryName, 1, false)}
              className="px-5 py-2 rounded-full bg-[#f2545b] hover:bg-[#e0434b] text-white font-semibold text-xs transition-transform hover:scale-105"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-white mb-2">
              No titles available
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              We couldn&apos;t find any titles for {categoryName} right now.
            </p>
            <Link
              href="/categories"
              className="px-4 py-2 rounded-full bg-[#27292e] text-white hover:bg-[#35383f] text-xs font-semibold"
            >
              Back to Categories
            </Link>
          </div>
        )}

        {/* 6-Column Media Grid matching Image 2 */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {filteredItems.map((item, idx) => {
                const targetUrl =
                  item.mediaType === "tv"
                    ? `/tv/${item.id}`
                    : `/movie/${item.id}`;
                const posterUrl = item.poster || item.backdrop;
                const isTv = item.mediaType === "tv";

                return (
                  <Link
                    key={`${item.mediaType || "movie"}-${item.id}-${idx}`}
                    href={targetUrl}
                    className="group flex flex-col cursor-pointer transition-all duration-300"
                  >
                    {/* Poster with '> Free' badge matching Image 2 */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#23262d] shadow-md border border-white/5 group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-zinc-500">
                          {item.title}
                        </div>
                      )}

                      {/* Play hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-[#f2545b] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <svg
                            className="w-5 h-5 fill-white ml-0.5"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Metadata text underneath the poster matching Image 2 */}
                    <div className="mt-2 px-0.5">
                      {isTv && item.seasonCount ? (
                        <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-none">
                          {item.seasonCount}{" "}
                          {item.seasonCount === 1 ? "Season" : "Seasons"}
                        </p>
                      ) : (
                        <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-none truncate">
                          {item.title}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 rounded-full bg-[#27292e] hover:bg-[#35383f] text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Loading More Titles...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More {visualInfo.name} Titles</span>
                      <svg
                        className="w-4 h-4 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

function CategoryLoadingFallback() {
  return (
    <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#f2545b]/30 border-t-[#f2545b] rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-zinc-400">Loading Category...</p>
    </div>
  );
}

export default function CategoryMediaPage() {
  return (
    <Suspense fallback={<CategoryLoadingFallback />}>
      <CategoryMediaContent />
    </Suspense>
  );
}
