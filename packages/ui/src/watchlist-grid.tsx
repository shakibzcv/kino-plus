import type { ReactNode } from "react";
import { useState, useMemo } from "react";

// ─── Shared WatchlistItem type ────────────────────────────────────────────────
// Compatible with both apps. Only the fields actually rendered in the grid are
// declared here; extra fields are allowed through the generic constraint.
export interface WatchlistItem {
  id?: number;
  mediaId: string;
  mediaType: "movie" | "tv" | "episode";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  rating?: number | null;
  voteAverage?: number | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  seriesId?: string;
  logo?: string | null;
}

export type FilterTab = "all" | "movie" | "tv" | "episode";

/**
 * Platform-agnostic image renderer.
 * Web → Next.js <Image fill …>  (receives src/alt)
 * Desktop → plain <img>
 */
export type RenderWatchlistImage = (src: string, alt: string) => ReactNode;

export interface WatchlistGridProps {
  items: WatchlistItem[];
  /**
   * Called when the user clicks a card.
   * The platform-specific app decides how to navigate (router.push vs setActiveMedia).
   */
  onCardClick: (item: WatchlistItem) => void;
  /** Called when the ✕ remove button is clicked. */
  onRemove: (e: React.MouseEvent, item: WatchlistItem) => void;
  /**
   * Called when the user clicks "Browse Popular Titles" in the empty state.
   * The platform-specific app handles routing.
   */
  onBrowse: () => void;
  /**
   * Optional custom image renderer. Defaults to a plain <img> tag.
   * Pass a Next.js <Image> renderer from the web app for optimised images.
   */
  renderImage?: RenderWatchlistImage;
  /** Whether a loading skeleton should be shown (web only pattern). */
  isLoading?: boolean;
}

const defaultRenderImage: RenderWatchlistImage = (src, alt) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className="w-full h-full object-cover object-center transition-transform duration-500"
  />
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
        active
          ? "bg-[#f2545b] text-white shadow-md shadow-[#f2545b]/30"
          : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function WatchlistCard({
  item,
  onCardClick,
  onRemove,
  renderImage,
}: {
  item: WatchlistItem;
  onCardClick: (item: WatchlistItem) => void;
  onRemove: (e: React.MouseEvent, item: WatchlistItem) => void;
  renderImage: RenderWatchlistImage;
}) {
  const posterImg = item.posterPath || item.backdropPath;
  const isEpisode = item.mediaType === "episode";
  const score = Number(item.voteAverage ?? item.rating ?? 0);

  return (
    <div
      onClick={() => onCardClick(item)}
      className={`group relative rounded-xl overflow-hidden cursor-pointer select-none bg-zinc-900 transition-all duration-300 ${
        isEpisode ? "aspect-video sm:aspect-[2/3]" : "aspect-[2/3]"
      }`}
    >
      {/* Poster image */}
      <div className="absolute inset-0">
        {posterImg ? (
          renderImage(posterImg, item.title)
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-zinc-400">
            {item.title}
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent group-hover:from-black/95 group-hover:via-black/50 transition-colors" />

      {/* Top: remove button only */}
      <div className="absolute top-2.5 right-2.5 flex items-center justify-end z-20">
        <button
          type="button"
          onClick={(e) => onRemove(e, item)}
          aria-label="Remove from Watchlist"
          title="Remove from Watchlist"
          className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#f2545b] text-zinc-300 hover:text-white border border-white/20 hover:border-[#f2545b] flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bottom: title + rating */}
      <div className="absolute bottom-0 inset-x-0 p-3 z-10">
        <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#f2545b] transition-colors">
          {item.title}
        </p>
        {isEpisode && item.episodeTitle && (
          <p className="text-[11px] text-zinc-300 truncate mt-0.5">{item.episodeTitle}</p>
        )}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium mt-1">
          <span>
            {isEpisode
              ? `Episode ${item.episodeNumber}`
              : item.mediaType === "tv"
              ? "Series"
              : "Movie"}
          </span>
          {score > 0 ? (
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
              ★ {score.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Shared WatchlistGrid component used by the web app and the desktop app.
 *
 * Renders:
 * - A header with a count badge and filter tabs (All / Movies / TV Series / Episodes)
 * - A responsive poster grid of watchlist cards
 * - An empty state CTA that calls `onBrowse`
 *
 * Platform-specific concerns (Next.js Image, routing) are injected via props.
 */
export function WatchlistGrid({
  items,
  onCardClick,
  onRemove,
  onBrowse,
  renderImage = defaultRenderImage,
  isLoading = false,
}: WatchlistGridProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const movieCount = useMemo(() => items.filter((i) => i.mediaType === "movie").length, [items]);
  const tvCount = useMemo(() => items.filter((i) => i.mediaType === "tv").length, [items]);
  const episodeCount = useMemo(() => items.filter((i) => i.mediaType === "episode").length, [items]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((i) => i.mediaType === activeTab);
  }, [items, activeTab]);

  return (
    <div>
      {/* Header row: title + count + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Watchlist</h1>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All ({items.length})
          </TabButton>
          <TabButton active={activeTab === "movie"} onClick={() => setActiveTab("movie")}>
            Movies ({movieCount})
          </TabButton>
          <TabButton active={activeTab === "tv"} onClick={() => setActiveTab("tv")}>
            TV Series ({tvCount})
          </TabButton>
          <TabButton active={activeTab === "episode"} onClick={() => setActiveTab("episode")}>
            Episodes ({episodeCount})
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div>
        {isLoading && items.length === 0 ? (
          /* Loading skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          /* Card grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pb-16">
            {filteredItems.map((item, idx) => (
              <WatchlistCard
                key={`wl-item-${item.mediaType}-${item.mediaId}-${idx}`}
                item={item}
                onCardClick={onCardClick}
                onRemove={onRemove}
                renderImage={renderImage}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-zinc-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-400 mb-1">
              {activeTab === "all"
                ? "Your Watchlist is empty"
                : `No ${
                    activeTab === "movie"
                      ? "movies"
                      : activeTab === "tv"
                      ? "TV series"
                      : "episodes"
                  } in your Watchlist`}
            </p>
            <p className="text-xs text-zinc-500 mb-5 max-w-sm">
              Explore our collection of movies and series and add titles you want to watch later.
            </p>
            <button
              type="button"
              onClick={onBrowse}
              className="px-5 py-2.5 rounded-full bg-[#f2545b] hover:bg-[#e0434b] text-white text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
            >
              Browse Popular Titles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
