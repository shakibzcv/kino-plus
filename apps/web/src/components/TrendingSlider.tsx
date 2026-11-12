"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingMovie } from "../lib/tmdb";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CACHE_KEY = "kino_public_trending";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns cached trending data if still fresh, otherwise null.
 */
function getCachedTrending(): TrendingMovie[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (
      Date.now() - timestamp < CACHE_TTL_MS &&
      Array.isArray(data) &&
      data.length > 0
    ) {
      return data;
    }
  } catch {
    /* corrupt cache — ignore */
  }
  return null;
}

function setCachedTrending(data: TrendingMovie[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    /* storage full — ignore */
  }
}

/**
 * Fetches trending movies from the PUBLIC endpoint (no auth required).
 * Used on the landing/auth screen before the user has signed in.
 */
async function fetchPublicTrending(): Promise<TrendingMovie[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/trending?timeWindow=day`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const movies = (json.data as TrendingMovie[]) || [];
    if (movies.length > 0) setCachedTrending(movies);
    return movies;
  } catch (err) {
    console.error("[TrendingSlider] Error fetching public trending:", err);
    return [];
  }
}

export default function TrendingSlider(): React.ReactElement {
  // Initialize from cache for instant render — no loading spinner on repeat visits
  const cached = getCachedTrending();
  const [movies, setMovies] = useState<TrendingMovie[]>(cached || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cached);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // If we already have cached data, skip the loading state but still
    // refresh silently in the background to keep it fresh.
    fetchPublicTrending()
      .then((data: TrendingMovie[]) => {
        if (isMounted && data && data.length > 0) {
          setMovies(data);
        }
      })
      .catch((err: unknown) =>
        console.error("Error fetching trending movies:", err),
      )
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        slider.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.75;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 select-none">
      {/* Section Title */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-3 sm:mb-5">
        Trending Now
      </h2>

      {/* Slider Container */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll Left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-20 sm:h-28 w-8 sm:w-10 md:w-12 bg-black/70 hover:bg-black/95 text-white flex items-center justify-center rounded-r-md backdrop-blur-sm border-r border-y border-white/10 transition-all duration-200 cursor-pointer shadow-2xl opacity-0 group-hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}

        {/* Scrollable Track - Responsive item sizing and seamless touch swipe */}
        <div
          ref={sliderRef}
          className="flex items-center gap-3.5 sm:gap-5 md:gap-7 overflow-x-auto overflow-y-hidden scroll-smooth pt-3 pb-7 sm:pb-8 px-2 sm:px-4 no-scrollbar overscroll-x-contain"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {movies.slice(0, 10).map((movie, index) => {
            const rank = index + 1;
            const targetUrl =
              movie.mediaType === "tv"
                ? `/tv/${movie.id}`
                : `/movie/${movie.id}`;
            return (
              <Link
                key={`trend-${movie.id}-${index}`}
                href={targetUrl}
                className="relative flex-shrink-0 group/card cursor-pointer transition-transform duration-300 hover:scale-105 w-[135px] sm:w-[165px] md:w-[190px]"
              >
                {/* Poster Card */}
                <div className="relative w-full aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-[#181818] border border-white/10 group-hover/card:border-white/30 transition-all">
                  {movie.poster ? (
                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 140px, (max-width: 1024px) 170px, 200px"
                      className="object-cover object-center pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-zinc-900 text-center">
                      <span className="text-xs sm:text-sm font-semibold text-gray-300">
                        {movie.title}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/card:opacity-30 transition-opacity pointer-events-none" />
                </div>

                {/* Big Ranked Outline Number Overlapping Left Corner */}
                <div className="absolute -left-2.5 sm:-left-3.5 -bottom-2 sm:-bottom-3 z-10 pointer-events-none">
                  <span
                    className="font-black text-6xl sm:text-7xl md:text-8xl leading-none select-none tracking-tighter"
                    style={{
                      color: "#000000",
                      WebkitTextStroke: "3px #595959",
                      textShadow: "0 4px 12px rgba(0, 0, 0, 0.95)",
                      fontFamily: "Arial Black, Impact, sans-serif",
                    }}
                  >
                    {rank}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll Right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-20 sm:h-28 w-8 sm:w-10 md:w-12 bg-black/70 hover:bg-black/95 text-white flex items-center justify-center rounded-l-md backdrop-blur-sm border-l border-y border-white/10 transition-all duration-200 cursor-pointer shadow-2xl opacity-0 group-hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
