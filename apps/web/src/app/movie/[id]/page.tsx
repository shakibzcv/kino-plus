"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "../../../components/Footer";
import AuthModal from "../../../components/AuthModal";
import MediaSlider from "../../../components/MediaSlider";
import Header from "../../../components/Header";
import KinoLogo from "../../../components/KinoLogo";
import WatchProviders from "../../../components/WatchProviders";
import { getMediaDetails, MediaDetails, ExtraVideo } from "../../../lib/tmdb";
import { useUserData } from "../../../context/UserDataContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;

  const { isInWatchlist, toggleWatchlist } = useUserData();
  const isWatchlisted = isInWatchlist("movie", movieId);

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleToggleWatchlist = async () => {
    if (!details) return;
    await toggleWatchlist({
      mediaId: movieId,
      mediaType: "movie",
      title: details.title,
      posterPath: details.poster,
      backdropPath: details.backdrop,
      logoPath: details.logo,
      logo: details.logo,
      overview: details.overview,
      rating: details.rating,
      voteAverage: details.rating,
      category: details.genres ? details.genres.join(", ") : undefined,
      genres: details.genres,
    });
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeTrailer, setActiveTrailer] = useState<ExtraVideo | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Cast horizontal scroll ref & helper
  const castScrollRef = useRef<HTMLDivElement>(null);
  const scrollCast = (direction: "left" | "right") => {
    if (castScrollRef.current) {
      const scrollAmount = direction === "left" ? -360 : 360;
      castScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMediaDetails(movieId, "movie");
        if (isMounted) {
          setDetails(data);
        }
      } catch (err: any) {
        console.error("Failed to load movie details:", err);
        if (isMounted) {
          setError("Internal Server Error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (movieId) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleTrailerClick = (video: ExtraVideo) => {
    setActiveTrailer(video);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0e1013] text-white flex flex-col font-sans">
        {/* Skeleton Top Bar */}
        <div className="h-14 border-b border-[#2b2d32] bg-[#18191c]/80 animate-pulse" />
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-10 space-y-8 animate-pulse">
          <div className="h-[400px] w-full bg-zinc-800/40 rounded-2xl" />
          <div className="h-10 w-64 bg-zinc-800/60 rounded" />
          <div className="h-24 w-full bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen w-full bg-[#0e1013] text-white flex flex-col font-sans">
        {/* Sticky Header */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#18191c]/95 backdrop-blur-md border-b border-[#2b2d32] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <KinoLogo href="/" size="md" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/60 border border-[#f2545b]/30 flex items-center justify-center text-[#f2545b] mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Internal Server Error
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            Unable to load the requested movie details right now. Please try
            again or explore other titles.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-[#f2545b] hover:bg-[#e0434b] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#f2545b]/25"
            >
              Retry
            </button>
            <Link
              href="/"
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0e1013] text-white flex flex-col font-sans select-none pt-[57px] overflow-x-clip">
      {/* 1. Header */}
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* ========================================================
          2. HERO SECTION (CINEMATIC BACKDROP & BRAND GRADIENT)
          ======================================================== */}
      <section className="relative w-full min-h-[580px] md:min-h-[660px] flex items-end overflow-hidden pb-8 sm:pb-12">
        {/* High-res backdrop with radial wash */}
        {details.backdrop && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <Image
              src={details.backdrop}
              alt={details.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
            {/* Cinematic Gradient Fade into Deep Obsidian Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e1013]/90 via-[#0e1013]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1013] via-[#0e1013]/30 to-transparent" />
          </div>
        )}

        {/* Hero Left Content Column (Full Width, Responsive Padding) */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
          <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            {/* Title / Wordmark / TMDB Logo */}
            {details.logo ? (
              <div className="relative h-14 sm:h-20 md:h-24 w-auto max-w-[280px] sm:max-w-[380px] md:max-w-[460px] mb-5 flex items-end">
                <Image
                  src={details.logo}
                  alt={details.title}
                  width={460}
                  height={130}
                  priority
                  className="max-h-full w-auto max-w-full object-contain object-left filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
                  unoptimized
                />
              </div>
            ) : (
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-4">
                {details.title}
              </h1>
            )}

            {/* Badges Row: PG-13, Rating, Year, Runtime, Genres */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300 font-semibold mb-5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-xs font-bold text-white uppercase">
                {details.certification || "PG-13"}
              </span>
              {details.rating > 0 && (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  ★ {details.rating.toFixed(1)}
                </span>
              )}
              <span>{details.releaseYear}</span>
              <span>{details.runtime}</span>
              {details.genres && details.genres.length > 0 && (
                <span>{details.genres.join(", ")}</span>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* 1. Watch Trailer Button */}
              {details.trailers && details.trailers.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleTrailerClick(details.trailers[0]!)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#f2545b] hover:bg-[#d94048] text-white transition-colors duration-150 cursor-pointer shadow-lg shadow-[#f2545b]/30"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Watch Trailer</span>
                </button>
              ) : null}

              {/* 2. Add to Watchlist Circular Button */}
              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shadow-md ${
                  isWatchlisted
                    ? "bg-[#f2545b] text-white shadow-[#f2545b]/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
                aria-label={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
              >
                {isWatchlisted ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>

              {/* 3. Watch Trailer Circular Button */}
              {details.trailers && details.trailers.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTrailerClick(details.trailers[0]!)}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shadow-md"
                  title="Watch Trailer"
                  aria-label="Watch Trailer"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}

              {/* 4. Share Circular Button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative shadow-md backdrop-blur-md"
                title="Share link"
                aria-label="Share link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copiedToast && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            {/* Synopsis Paragraph */}
            {details.overview && (
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl lg:max-w-4xl xl:max-w-5xl mb-3">
                {details.overview}
              </p>
            )}

            {/* Directed by */}
            {details.director && (
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Directed by{" "}
                <span className="text-white font-semibold">
                  {details.director}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          2.5. WHERE TO WATCH
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">
          Where to Watch
        </h3>
        <WatchProviders mediaId={details.id} mediaType="movie" />
      </section>

      {/* ========================================================
          3. CAST & CREW SECTION (MATCHING SCREENSHOT 1)
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
                    <Image
                      src={member.profileUrl}
                      alt={member.name}
                      fill
                      sizes="96px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
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
          5. TRAILERS & EXTRAS (MATCHING SCREENSHOT 2)
          ======================================================== */}
      {details.trailers && details.trailers.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Trailers & Extras
          </h2>

          <div
            className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {details.trailers.map((trailer) => (
              <div
                key={trailer.id}
                onClick={() => handleTrailerClick(trailer)}
                className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[280px] cursor-pointer group/trailer"
              >
                {/* 16:9 Thumbnail Container */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
                  <Image
                    src={trailer.thumbnail}
                    alt={trailer.name}
                    fill
                    sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 280px"
                    className="object-cover object-center transition-opacity duration-200 group-hover/trailer:opacity-80"
                  />
                  {/* Gradient overlay for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/trailer:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  {/* Minimal play icon — bottom-left on hover */}
                  <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover/trailer:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 z-10">
                    <svg className="w-3.5 h-3.5 fill-white drop-shadow" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white drop-shadow">Play</span>
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
          6. TITLES YOU MIGHT LIKE ON KINO
          ======================================================== */}
      {details.recommendations && details.recommendations.length > 0 && (
        <section className="w-full py-4">
          <MediaSlider
            title="Titles You Might Like on Kino"
            items={details.recommendations}
          />
        </section>
      )}

      {/* ========================================================
          7. MORE FROM THIS CAST & CREW (MATCHING SCREENSHOT 3)
          ======================================================== */}
      {details.castWorks && details.castWorks.length > 0 && (
        <section className="w-full py-2">
          <MediaSlider
            title="More From This Cast & Crew"
            items={details.castWorks}
          />
        </section>
      )}

      {/* ========================================================
          8. MORE FROM THIS STUDIO (MATCHING SCREENSHOT 3)
          ======================================================== */}
      {details.studioWorks && details.studioWorks.length > 0 && (
        <section className="w-full py-2">
          <MediaSlider
            title={
              details.studioName
                ? `More From ${details.studioName}`
                : "More From This Studio"
            }
            items={details.studioWorks}
          />
        </section>
      )}

      {/* ========================================================
          9. GET KINO ON YOUR DEVICES CTA (MATCHING SCREENSHOT 3)
          ======================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Get Kino on Your Devices
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-6 font-medium">
          Free on 20+ platforms. Pick yours.
        </p>

        {/* 3 Device Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-5">
          {/* App Store Badge */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#18191c] border border-white/10 hover:border-[#f2545b]/40 hover:bg-[#202227] transition-all cursor-pointer text-left shadow-lg">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.66-.9 2.69.99.08 2.01-.5 2.58-1.18z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-white">App Store</p>
              <p className="text-[10px] text-zinc-400">iOS & Apple TV</p>
            </div>
          </div>

          {/* Google Play Badge */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#18191c] border border-white/10 hover:border-[#f2545b]/40 hover:bg-[#202227] transition-all cursor-pointer text-left shadow-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <div>
              <p className="text-xs font-bold text-white">Google Play</p>
              <p className="text-[10px] text-zinc-400">Android</p>
            </div>
          </div>

          {/* TV Badge */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#18191c] border border-white/10 hover:border-[#f2545b]/40 hover:bg-[#202227] transition-all cursor-pointer text-left shadow-lg">
            <svg
              className="w-6 h-6 fill-none stroke-current text-white"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
            <div>
              <p className="text-xs font-bold text-white">TV</p>
              <p className="text-[10px] text-zinc-400">Fire TV, Roku & more</p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-[#f2545b] hover:text-[#ff757b] transition-colors inline-flex items-center gap-1"
        >
          <span>See all supported devices</span>
          <span>→</span>
        </Link>
      </section>

      {/* ========================================================
          10. GLOBAL FOOTER (MATCHING SCREENSHOT 4)
          ======================================================== */}
      <Footer />

      {/* ========================================================
          11. TRAILER VIDEO MODAL
          ======================================================== */}
      {activeTrailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveTrailer(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveTrailer(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/30 transition-all cursor-pointer"
              aria-label="Close trailer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailer.key}?autoplay=1`}
              title={activeTrailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
