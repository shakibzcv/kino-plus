"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { TrendingMovie } from "../lib/tmdb";
import MediaCard from "./MediaCard";

interface MediaSliderProps {
  title: string;
  items: TrendingMovie[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function MediaSlider({
  title,
  items,
  isLoading = false,
  error = null,
  onRetry,
}: MediaSliderProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="w-full mb-8 relative select-none">
      {/* Section Header with Chevron */}
      <div className="flex items-center gap-1.5 mb-2 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 transition-colors">
          {title}
          <svg
            className={`w-4 h-4 text-zinc-400 transition-all duration-200 inline ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </h2>
      </div>

      {/* Horizontal Slider Area with Hover Arrows */}
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Arrow Button */}
        {canScrollLeft && !error && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
            className={`absolute left-1 sm:left-2 top-[40%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#18191c]/95 border border-white/20 text-white flex items-center justify-center shadow-2xl hover:bg-[#2c2f36] transition-all duration-200 cursor-pointer backdrop-blur-md ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Media Cards Track / Error State */}
        {error ? (
          <div className="mx-4 sm:mx-6 lg:mx-8 flex items-center justify-between gap-4 p-4 rounded-xl bg-[#1e2024] border border-red-500/20 text-zinc-300 text-xs sm:text-sm my-1">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer border border-zinc-700 shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isLoading
              ? Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 h-[220px] sm:h-[260px] md:h-[280px] w-[147px] sm:w-[173px] md:w-[187px] bg-zinc-800/60 rounded-xl animate-pulse"
                  />
                ))
              : items.map((item, idx) => (
                  <MediaCard key={`${item.id}-${idx}`} item={item} />
                ))}
          </div>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && !error && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
            className={`absolute right-1 sm:right-2 top-[40%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#18191c]/95 border border-white/20 text-white flex items-center justify-center shadow-2xl hover:bg-[#2c2f36] transition-all duration-200 cursor-pointer backdrop-blur-md ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
