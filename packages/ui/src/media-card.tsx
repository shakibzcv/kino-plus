import React, { useState, useEffect, ReactNode } from "react";

export interface MediaCardItem {
  id: string | number;
  title: string;
  overview?: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number | null;
  releaseDate?: string;
  mediaType?: "movie" | "tv";
  seasonCount?: number;
  logo?: string | null;
  provider?: string;
}

export interface RenderMediaImageOptions {
  isBackdrop?: boolean;
  sizes?: string;
  quality?: number;
}

export type RenderMediaImage = (
  src: string,
  alt: string,
  fill?: boolean,
  options?: RenderMediaImageOptions
) => ReactNode;

interface MediaCardProps {
  item: MediaCardItem;
  onClick: (item: MediaCardItem) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (item: MediaCardItem) => void;
  expandOnHover?: boolean;
  renderImage: RenderMediaImage;
  fetchLogo?: (id: string | number, type: "movie" | "tv") => Promise<string | null>;
}

// Client-side memory cache for fetched logos across card instances
const clientLogoCache = new Map<string, string | null>();

export function MediaCard({
  item,
  onClick,
  isWatchlisted = false,
  onToggleWatchlist,
  expandOnHover = true,
  renderImage,
  fetchLogo,
}: MediaCardProps): React.ReactElement {
  const mediaType = (item.mediaType || "movie") as "movie" | "tv";
  const [isHovered, setIsHovered] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(item.logo ?? null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!expandOnHover) return;

    if (item.logo) {
      setLogoUrl(item.logo);
      return;
    }

    const cacheKey = `${item.mediaType || "movie"}:${item.id}`;
    if (clientLogoCache.has(cacheKey)) {
      setLogoUrl(clientLogoCache.get(cacheKey) || null);
      return;
    }

    if (isHovered && !logoFailed && fetchLogo) {
      let active = true;
      fetchLogo(item.id, mediaType)
        .then((url) => {
          clientLogoCache.set(cacheKey, url);
          if (active && url) {
            setLogoUrl(url);
          }
        })
        .catch(() => {
          clientLogoCache.set(cacheKey, null);
        });

      return () => {
        active = false;
      };
    }
  }, [
    item.id,
    item.logo,
    item.mediaType,
    mediaType,
    isHovered,
    logoFailed,
    expandOnHover,
    fetchLogo,
  ]);

  const releaseYear = item.releaseDate ? item.releaseDate.slice(0, 4) : null;
  const ratingScore =
    item.rating && item.rating > 0 ? item.rating.toFixed(1) : null;
  const posterImg = item.poster || item.backdrop;
  const backdropImg = item.backdrop || item.poster;

  const handleCardClick = () => onClick(item);
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatchlist?.(item);
  };
  const handleActionButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(item);
  };

  // Fixed-width, non-expanding card for grid layouts (such as Search results)
  if (!expandOnHover) {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex-shrink-0 w-[155px] sm:w-[185px] md:w-[200px] h-[235px] sm:h-[275px] md:h-[300px] rounded-xl overflow-hidden cursor-pointer select-none bg-zinc-900 border border-white/5 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/70"
      >
        {/* Poster Image */}
        <div className="absolute inset-0">
          {posterImg ? (
            renderImage(posterImg, item.title, true, {
              isBackdrop: false,
              sizes: "(max-width: 640px) 160px, (max-width: 768px) 190px, 220px",
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-zinc-400">
              {item.title}
            </div>
          )}
        </div>

        {/* Top Badges (Rating & Media Type) + Watchlist Button */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 pointer-events-none">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase backdrop-blur-md ${
                item.mediaType === "tv"
                  ? "bg-purple-950/80 text-purple-200 border border-purple-700/50"
                  : "bg-cyan-950/80 text-cyan-200 border border-cyan-700/50"
              }`}
            >
              {item.mediaType === "tv" ? "TV" : "Movie"}
            </span>

            {ratingScore && (
              <span className="flex items-center gap-0.5 text-amber-300 font-bold bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px]">
                ★ {ratingScore}
              </span>
            )}
          </div>

          {onToggleWatchlist && (
            <button
              type="button"
              onClick={handleWatchlistClick}
              title={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border ${
                isWatchlisted
                  ? "bg-[#f2545b] text-white border-[#f2545b] shadow-md shadow-[#f2545b]/30 opacity-100"
                  : "bg-black/60 hover:bg-black/90 text-white border-white/20 opacity-0 group-hover:opacity-100"
              }`}
            >
              {isWatchlisted ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent group-hover:from-black/95 group-hover:via-black/50 transition-colors" />

        {/* Bottom Details */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 z-10">
          <p className="text-xs font-bold text-white truncate group-hover:text-[#f2545b] transition-colors">
            {item.title}
          </p>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mt-0.5">
            <span>
              {releaseYear || (item.mediaType === "tv" ? "TV Series" : "Movie")}
            </span>
            {item.seasonCount ? (
              <span>
                {item.seasonCount}{" "}
                {item.seasonCount === 1 ? "Season" : "Seasons"}
              </span>
            ) : (
              <span>HD</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex-shrink-0 h-[235px] sm:h-[275px] md:h-[300px] rounded-xl overflow-hidden cursor-pointer select-none transition-[width] duration-500 ease-out bg-zinc-900 ${
        isHovered
          ? "w-[415px] sm:w-[490px] md:w-[533px] z-20 shadow-2xl shadow-black/80"
          : "w-[155px] sm:w-[185px] md:w-[200px] z-10"
      }`}
    >
      {/* 1. Poster Image Layer (Visible at 2:3 resting state) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {posterImg ? (
          renderImage(posterImg, item.title, true, {
            isBackdrop: false,
            sizes: "(max-width: 640px) 160px, (max-width: 768px) 190px, 220px",
          })
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-zinc-400">
            {item.title}
          </div>
        )}

        {/* Optional Provider Badge on Poster */}
        {item.provider === "prime" && (
          <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-[#00a8e1] text-white text-[10px] font-bold">
            prime
          </div>
        )}
      </div>

      {/* 2. Backdrop Image Layer (Visible at 16:9 expanded state) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {backdropImg
          ? renderImage(backdropImg, item.title, true, {
              isBackdrop: true,
              sizes: "(max-width: 640px) 450px, (max-width: 768px) 520px, 600px",
              quality: 90,
            })
          : null}
      </div>

      {/* 3. Dark Vignette / Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-60"
        }`}
      />

      {/* 4. Resting State Minimal Title (When NOT hovered) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-2.5 transition-opacity duration-200 ${
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <p className="text-xs font-semibold text-white truncate">
          {item.title}
        </p>
        {item.seasonCount ? (
          <p className="text-[10px] text-zinc-400 font-medium">
            {item.seasonCount} {item.seasonCount === 1 ? "Season" : "Seasons"}
          </p>
        ) : null}
      </div>

      {/* 5. Hovered State Rich Content on Left/Bottom Corner */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-20 flex flex-col justify-end text-left transition-all duration-300 ease-out ${
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {/* Row 1: Title Logo Graphic (with styled text fallback) */}
        {logoUrl && !logoFailed ? (
          <div className="relative h-9 sm:h-11 md:h-12 w-auto max-w-[210px] sm:max-w-[250px] md:max-w-[280px] mb-2 flex items-end">
             {/* Using a regular img here for the logo as it's not a background and usually small/cached */}
            <img
              src={logoUrl}
              alt={item.title}
              className="max-h-full w-auto max-w-full object-contain object-left filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
              onError={() => setLogoFailed(true)}
            />
          </div>
        ) : (
          <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight line-clamp-1 mb-2 drop-shadow-md">
            {item.title}
          </h3>
        )}

        {/* Row 2: Action Row ("More Details" button & "+" Watchlist button) */}
        <div className="flex items-center gap-2 mb-2">
          {/* More Details Button */}
          <button
            type="button"
            onClick={handleActionButtonClick}
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            aria-label={`More Details for ${item.title}`}
          >
            <span>More Details</span>
          </button>

          {/* Add to Watchlist (+) Button */}
          {onToggleWatchlist && (
            <button
              type="button"
              onClick={handleWatchlistClick}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                isWatchlisted
                  ? "bg-[#f2545b] text-white shadow-md shadow-[#f2545b]/30"
                  : "bg-black/70 hover:bg-black/90 text-white"
              }`}
              title={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
              aria-label={
                isWatchlisted ? "Remove from watchlist" : "Add to watchlist"
              }
            >
              {isWatchlisted ? (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
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
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Row 3: Metadata Badges (Rating, Year, HD, Season/Type) */}
        <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
          {ratingScore && (
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[11px]">
              <svg className="w-3 h-3 fill-emerald-400" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {ratingScore}
            </span>
          )}

          {releaseYear && (
            <span className="font-semibold text-zinc-200">{releaseYear}</span>
          )}

          <span className="text-[10px] text-zinc-300 font-bold px-1.5 py-0.5 rounded bg-black/60">
            HD
          </span>

          {item.seasonCount ? (
            <span className="text-[11px] text-zinc-300 font-medium bg-zinc-800/80 px-1.5 py-0.5 rounded">
              {item.seasonCount} {item.seasonCount === 1 ? "Season" : "Seasons"}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-300 font-medium bg-zinc-800/80 px-1.5 py-0.5 rounded capitalize">
              {item.mediaType || "Movie"}
            </span>
          )}
        </div>

        {/* Row 4: Short Overview Synopsis */}
        {item.overview && (
          <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-2 leading-relaxed pt-1">
            {item.overview}
          </p>
        )}
      </div>
    </div>
  );
}
