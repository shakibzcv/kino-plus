import React, { useRef, useState, useEffect } from "react";
import { TrailerCard, type RenderTrailerImage } from "./trailer-card";

export interface SharedTrailerItem {
  id: string | number;
  title: string;
  thumbnail: string;
  youtubeUrl?: string;
  videoKey?: string;
  channelTitle?: string;
  duration?: string;
  views?: string;
  publishedAt?: string;
  linkUrl?: string;
  [key: string]: any;
}

export interface TrailerSliderProps {
  title: string;
  items: SharedTrailerItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPlayTrailer?: (item: SharedTrailerItem) => void;
  renderImage?: RenderTrailerImage;
}

const defaultPlainImage: RenderTrailerImage = (src, alt, fill) => (
  <img
    src={src}
    alt={alt}
    className={`object-cover object-center ${fill ? "w-full h-full" : ""}`}
    loading="lazy"
  />
);

export function TrailerSlider({
  title,
  items,
  isLoading = false,
  error = null,
  onRetry,
  onPlayTrailer,
  renderImage = defaultPlainImage,
}: TrailerSliderProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const CardComponent = TrailerCard as React.ComponentType<any>;

  return (
    <section className="w-full mb-10 relative select-none">
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 transition-colors">
          <span>{title}</span>
          <svg
            className="w-4 h-4 text-zinc-400 opacity-60 inline"
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-[#1f2229] hover:bg-[#2c303a] text-white hover:scale-105 active:scale-95 border border-white/10 shadow-md cursor-pointer"
                : "bg-white/[0.03] text-zinc-600 border border-white/5 cursor-not-allowed opacity-30"
            }`}
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
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-[#1f2229] hover:bg-[#2c303a] text-white hover:scale-105 active:scale-95 border border-white/10 shadow-md cursor-pointer"
                : "bg-white/[0.03] text-zinc-600 border border-white/5 cursor-not-allowed opacity-30"
            }`}
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
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative w-full">
        {error ? (
          <div className="mx-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 p-4 rounded-xl bg-[#1e2024] border border-red-500/20 text-zinc-300 text-xs sm:text-sm my-1">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-red-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
            className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[200px] sm:w-[230px] md:w-[250px] lg:w-[270px] animate-pulse"
                  >
                    <div className="w-full aspect-video bg-zinc-800/60 rounded-lg sm:rounded-xl" />
                    <div className="mt-2 h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="mt-1 h-2.5 bg-zinc-800/60 rounded w-1/2" />
                  </div>
                ))
              : items.map((item) => (
                  <CardComponent
                    key={item.id}
                    item={item as any}
                    onClick={() => onPlayTrailer?.(item)}
                    renderImage={renderImage}
                  />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
