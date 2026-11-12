import React, { useState, useEffect, useRef } from "react";
import SeasonsEpisodesModal from "../components/SeasonsEpisodesModal";
import WatchProviders from "../components/WatchProviders";
import { MediaItem, MediaDetails, ExtraVideo, WatchlistItem } from "../types";
import { fetchMediaDetails } from "../lib/api";
import MediaRail from "../components/MediaRail";

interface DetailsViewProps {
  media: MediaItem;
  onBack?: () => void;
  onWatch?: (item: MediaItem, season?: number, episode?: number) => void;
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
}

export default function DetailsView({
  media,
  onBack,
  onSelectMedia,
  watchlist = [],
  onToggleWatchlist,
}: DetailsViewProps): React.ReactElement {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason] = useState(1);
  const [activeTrailer, setActiveTrailer] = useState<ExtraVideo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSeasonsModalOpen, setIsSeasonsModalOpen] = useState(false);
  const [seasonsModalTab, setSeasonsModalTab] = useState<"episodes" | "graph">("episodes");

  const castScrollRef = useRef<HTMLDivElement>(null);
  const scrollCast = (direction: "left" | "right") => {
    if (castScrollRef.current) {
      const scrollAmount = direction === "left" ? -360 : 360;
      castScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const isWatchlisted = watchlist.some((w) => String(w.mediaId) === String(media.id));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Watch ${details?.title || media.title} on Kino+`);
      showToast("Link copied to clipboard!");
    }
  };

  // Fetch full details
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    fetchMediaDetails(media.id, media.mediaType || "movie")
      .then((data) => {
        if (!active) return;
        if (data) {
          setDetails(data);
        } else {
          setError("Failed to load media details");
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load details:", err);
        setError("Failed to load media details");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [media.id, media.mediaType]);

  const isTv = (details?.mediaType || media.mediaType) === "tv";

  const displayTitle = details?.title || media.title;
  const ratingScore = details?.rating || media.rating;
  const releaseYear = (details?.releaseDate || media.releaseDate)?.slice(0, 4) || "2026";
  const totalEpisodesCount = details?.seasons
    ? details.seasons
        .filter((s) => s.seasonNumber > 0)
        .reduce((sum, s) => sum + (s.episodeCount || 0), 0)
    : 0;

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#0e1013] text-white flex flex-col font-sans select-none overflow-y-auto">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 2xl:px-20 pt-10 space-y-8 animate-pulse">
          <div className="h-[420px] w-full bg-zinc-800/40 rounded-2xl" />
          <div className="h-10 w-64 bg-zinc-800/60 rounded" />
          <div className="h-24 w-full bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="w-full h-full bg-[#0e1013] text-white flex flex-col items-center justify-center font-sans p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-[#f2545b]/30 flex items-center justify-center text-[#f2545b] mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Internal Server Error</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Unable to load details for this title right now. Please try again.
        </p>
        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Go Back
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#f2545b] hover:bg-[#e0434b] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#f2545b]/25"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0e1013] text-white flex flex-col font-sans select-none overflow-x-clip overflow-y-auto">

      {/* Hero Section */}
      <section className="relative w-full min-h-[580px] md:min-h-[660px] flex items-end overflow-hidden pb-8 sm:pb-12">
        {details.backdrop && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <img
              src={details.backdrop}
              alt={displayTitle}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e1013]/90 via-[#0e1013]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1013] via-[#0e1013]/30 to-transparent" />
          </div>
        )}

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
          <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            {details.logo ? (
              <div className="relative h-14 sm:h-20 md:h-24 w-auto max-w-[280px] sm:max-w-[380px] md:max-w-[460px] mb-5 flex items-end">
                <img
                  src={details.logo}
                  alt={displayTitle}
                  className="max-h-full w-auto max-w-full object-contain object-left filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
                />
              </div>
            ) : (
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-4">
                {displayTitle}
              </h1>
            )}

            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300 font-semibold mb-5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-xs font-bold text-white uppercase">
                {details.certification || (isTv ? "TV-MA" : "PG-13")}
              </span>
              {ratingScore && ratingScore > 0 ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  ★ {ratingScore.toFixed(1)}
                </span>
              ) : null}
              <span>{releaseYear}</span>
              {isTv && totalEpisodesCount > 0 ? (
                <span>{totalEpisodesCount} Episodes</span>
              ) : (
                <span>{details.runtime || "2h 00m"}</span>
              )}
              {details.genres && details.genres.length > 0 && (
                <span>{details.genres.join(", ")}</span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (details?.trailers && details.trailers.length > 0) {
                    setActiveTrailer(details.trailers[0]);
                  }
                }}
                disabled={!details?.trailers || details.trailers.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#f2545b] hover:bg-[#d94048] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors duration-150 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Watch Trailer</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWatchlist(media)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shadow-md ${
                  isWatchlisted
                    ? "bg-[#f2545b] text-white shadow-[#f2545b]/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
              >
                {isWatchlisted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative shadow-md backdrop-blur-md"
                title="Share"
                aria-label="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl lg:max-w-4xl xl:max-w-5xl mb-3">
              {details.overview}
            </p>
            {details.director && (
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {isTv ? "Created by" : "Directed by"}{" "}
                <span className="text-white font-semibold">{details.director}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          1.5. WHERE TO WATCH
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">
          Where to Watch
        </h3>
        <WatchProviders mediaId={media.id} mediaType={isTv ? "tv" : "movie"} />
      </section>

      {/* ========================================================
          2. SEASONS & EPISODES QUICK BAR
          ======================================================== */}
      {isTv && details.seasons && details.seasons.filter((s) => s.seasonNumber > 0).length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-6 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#161822]/90 via-[#181b28]/70 to-[#161822]/90 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#f2545b]/15 border border-[#f2545b]/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#f2545b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Seasons &amp; Episodes
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-semibold">
                    {details.seasons.filter((s) => s.seasonNumber > 0).length} Seasons
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Browse all episodes, view storylines, or inspect the episode rating heatmap graph.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSeasonsModalTab("graph");
                  setIsSeasonsModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer border border-white/10 active:scale-95"
              >
                <svg className="w-4 h-4 text-[#0091ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Series Graph</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeasonsModalTab("episodes");
                  setIsSeasonsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#f2545b] hover:bg-[#e0434b] text-white transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#f2545b]/30 active:scale-95"
              >
                <span>Browse Episodes</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          3. CAST & CREW SECTION
          ======================================================== */}
      {details.cast && details.cast.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
              Cast &amp; Crew
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCast("left")}
                aria-label="Scroll cast left"
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center justify-center border border-white/10 cursor-pointer shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollCast("right")}
                aria-label="Scroll cast right"
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center justify-center border border-white/10 cursor-pointer shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div
            ref={castScrollRef}
            className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {details.cast.map((member) => (
              <div
                key={member.id}
                className="flex-shrink-0 flex flex-col items-center w-20 sm:w-24 text-center group cursor-pointer"
              >
                {/* Circular Profile Avatar */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-zinc-800 border border-white/10 group-hover:border-white/40 transition-all">
                  {member.profileUrl ? (
                    <img
                      src={member.profileUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-bold bg-zinc-800">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Actor Name */}
                <p className="mt-2 text-xs sm:text-sm font-semibold text-white truncate w-full group-hover:text-zinc-200 transition-colors">
                  {member.name}
                </p>

                {/* Character Role */}
                <p className="text-[11px] text-zinc-400 truncate w-full">
                  {member.character}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          4. TRAILERS & EXTRAS SECTION
          ======================================================== */}
      {details.trailers && details.trailers.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Trailers &amp; Extras
          </h2>

          <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2">
            {details.trailers.map((trailer) => (
              <div
                key={trailer.id}
                onClick={() => setActiveTrailer(trailer)}
                className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[280px] cursor-pointer group/trailer"
              >
                {/* 16:9 Thumbnail Container */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 transition-all">
                  <img
                    src={trailer.thumbnail}
                    alt={trailer.name}
                    className="w-full h-full object-cover object-center group-hover/trailer:scale-105 transition-transform duration-200"
                  />
                  {/* Gradient overlay for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/trailer:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  {/* Bottom-left play icon and play text — fades in on hover, matching Continue Watching */}
                  <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover/trailer:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 z-10">
                    <svg className="w-3.5 h-3.5 fill-white drop-shadow" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white drop-shadow">
                      Play
                    </span>
                  </div>
                </div>

                {/* Trailer Title */}
                <p className="mt-2 text-xs sm:text-sm font-semibold text-white truncate group-hover/trailer:text-zinc-200 transition-colors">
                  {trailer.name}
                </p>

                {/* Trailer Type Label */}
                <p className="text-[11px] text-zinc-400 font-medium">
                  {trailer.type || "Trailer"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          5. TITLES YOU MIGHT LIKE ON KINO
          ======================================================== */}
      {details.recommendations && details.recommendations.length > 0 && (
        <section className="w-full py-4">
          <MediaRail
            title="Titles You Might Like on Kino"
            items={details.recommendations}
            onSelectMedia={onSelectMedia}
            onPlayMedia={(item) => onSelectMedia(item)}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />
        </section>
      )}

      {/* ========================================================
          6. MORE FROM THIS CAST & CREW
          ======================================================== */}
      {details.castWorks && details.castWorks.length > 0 && (
        <section className="w-full py-2">
          <MediaRail
            title="More From This Cast & Crew"
            items={details.castWorks}
            onSelectMedia={onSelectMedia}
            onPlayMedia={(item) => onSelectMedia(item)}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />
        </section>
      )}

      {/* ========================================================
          7. MORE FROM THIS STUDIO
          ======================================================== */}
      {details.studioWorks && details.studioWorks.length > 0 && (
        <section className="w-full py-2">
          <MediaRail
            title={
              details.studioName
                ? `More From ${details.studioName}`
                : "More From This Studio"
            }
            items={details.studioWorks}
            onSelectMedia={onSelectMedia}
            onPlayMedia={(item) => onSelectMedia(item)}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />
        </section>
      )}


      {/* ========================================================
          9. TRAILER MODAL
          ======================================================== */}
      {activeTrailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveTrailer(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveTrailer(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
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
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeTrailer.key}?autoplay=1`}
              title={activeTrailer.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Seasons & Episodes + Series Graph Modal */}
      {isTv && details && (
        <SeasonsEpisodesModal
          isOpen={isSeasonsModalOpen}
          onClose={() => setIsSeasonsModalOpen(false)}
          showId={media.id}
          showTitle={details.title}
          seasons={details.seasons || []}
          initialSeason={selectedSeason}
          initialTab={seasonsModalTab}
          onSelectEpisode={() => {
            setIsSeasonsModalOpen(false);
          }}
        />
      )}

      {/* ========================================================
          10. FLOATING TOAST NOTIFICATION (in original position)
          ======================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2026] border border-white/20 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-fadeIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
