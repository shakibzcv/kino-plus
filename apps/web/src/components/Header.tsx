"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useUserData } from "../context/UserDataContext";
import KinoLogo from "./KinoLogo";
import { searchMedia, TrendingMovie } from "../lib/tmdb";
// Watchlist uses standard plus icon

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

export interface HeaderProps {
  onOpenAuth?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  isSticky?: boolean;
}

export interface UnauthenticatedHeaderProps {
  onOpenAuth?: () => void;
  className?: string;
  isSticky?: boolean;
}

/**
 * 🌟 Unauthenticated Header:
 * - On the auth screen / landing screen: sticky is false (scrollable in normal flow, not sticky at top).
 * - If isSticky is explicitly passed true: stays sticky at top with dynamic blur backdrop on scroll.
 */
export function UnauthenticatedHeader({
  onOpenAuth,
  className = "",
  isSticky = false,
}: UnauthenticatedHeaderProps): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isSticky) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSticky]);

  const positionClass = isSticky
    ? "fixed top-0 left-0 right-0 z-50"
    : "relative w-full z-50";

  const styleClass = isSticky
    ? isScrolled
      ? "bg-[#0e1013]/95 backdrop-blur-md border-b border-[#2b2d32] shadow-md py-3 sm:py-3.5"
      : "bg-transparent border-b border-transparent py-4 sm:py-5"
    : "bg-transparent border-none shadow-none py-5 sm:py-6";

  return (
    <header
      className={`${positionClass} w-full transition-all duration-300 pointer-events-auto ${styleClass} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 select-none">
        {/* Kino Brand Logo */}
        <KinoLogo href="/" size="md" />

        {/* Sign In CTA */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="bg-[#f2545b] hover:bg-[#e0434b] active:scale-95 text-white font-semibold text-xs sm:text-sm px-5 py-2 rounded-full shadow-lg shadow-[#f2545b]/25 hover:shadow-[#f2545b]/40 transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </header>
  );
}

/**
 * 🌟 Authenticated Header:
 * - Solid frosted dark bar with active borders and blur
 * - Live instant TMDB & IPTV search input with floating flyout
 * - Nav links (Live TV, Categories), Watchlist indicator, User profile card & sign out
 */
export function AuthenticatedHeader({
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  isSticky = true,
}: HeaderProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } = useUserData();
  const recentSearches = searchHistory.slice(0, 6);

  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleCloseSignOutModal = useCallback(() => {
    if (isSigningOut) return;
    setIsSignOutConfirmOpen(false);
    setSignOutError(null);
  }, [isSigningOut]);

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      setSignOutError(null);
      await logout();
    } catch (err: unknown) {
      console.error("[Header] Logout failed:", err);
      setIsSigningOut(false);
      setSignOutError(
        err instanceof Error
          ? err.message
          : "Failed to sign out. Please try again."
      );
    }
  }, [logout]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Search state
  const [query, setQuery] = useState(searchQuery);
  const [liveResults, setLiveResults] = useState<TrendingMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchReqIdRef = useRef<number>(0);

  // Synchronize with external searchQuery prop only when externally changed
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Click outside to dismiss search dropdown & user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        userMenuContainerRef.current &&
        !userMenuContainerRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Smooth debounced search caller with race condition protection
  const performSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const currentReqId = ++searchReqIdRef.current;
    setIsSearching(true);
    try {
      const data = await searchMedia(trimmed);
      if (currentReqId === searchReqIdRef.current) {
        setLiveResults(data.results.slice(0, 6));
        setIsDropdownOpen(true);
      }
    } catch {
      if (currentReqId === searchReqIdRef.current) {
        setLiveResults([]);
      }
    } finally {
      if (currentReqId === searchReqIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange?.(val);
        performSearch(val);
      }, 300);
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearchChange?.(val);
      setLiveResults([]);
      setIsSearching(false);
      setIsDropdownOpen(false);
    }
  };

  const handleClearQuery = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    onSearchChange?.("");
    setLiveResults([]);
    setIsSearching(false);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const executeFullSearch = (targetQuery?: string) => {
    const finalQ = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!finalQ) return;
    addSearchHistory(finalQ);
    setIsDropdownOpen(false);
    router.push(`/search?q=${encodeURIComponent(finalQ)}`);
  };

  // Keyboard navigation inside search dropdown
  const totalItems = liveResults.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isDropdownOpen && query.trim().length >= 2) {
        setIsDropdownOpen(true);
        return;
      }
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < liveResults.length) {
        const item = liveResults[selectedIndex];
        if (item) {
          setIsDropdownOpen(false);
          const targetUrl =
            item.mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
          router.push(targetUrl);
          return;
        }
      }

      executeFullSearch();
    }
  };

  const desktopNavLinks = [
    { label: "Movies", href: "/movies" },
    { label: "TV Shows", href: "/tv" },
    { label: "Anime", href: "/anime" },
    { label: "Categories", href: "/categories" },
  ];

  const mobileNavLinks = [
    { label: "Movies", href: "/movies" },
    { label: "TV Shows", href: "/tv" },
    { label: "Anime", href: "/anime" },
    { label: "Categories", href: "/categories" },
    { label: "Watchlist", href: "/watchlist" },
    { label: "Account", href: "/account" },
  ];

  const positionClass = isSticky
    ? "fixed top-0 left-0 right-0 z-50 bg-[#18191c]/95 backdrop-blur-md"
    : "relative z-40 bg-[#18191c]";

  return (
    <>
      <header
        className={`${positionClass} w-full border-b border-[#2b2d32] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 text-sm select-none shadow-md`}
      >
      {/* Left: Brand Logo + Search Bar + Nav Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-7 min-w-0 flex-1">
        {/* Kino Brand Logo */}
        <KinoLogo href="/" size="md" />

        {/* Search Bar with Live Instant Flyout */}
        {showSearch && (
          <div
            ref={searchContainerRef}
            className="relative w-48 sm:w-64 md:w-72 lg:w-84 flex-shrink-0 hidden sm:block"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeFullSearch();
              }}
              className="relative w-full"
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                {isSearching ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
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
                ref={inputRef}
                type="text"
                placeholder="What do you want to watch?"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-[#2a2c30] hover:bg-[#32353a] focus:bg-[#32353a] text-white text-xs sm:text-sm pl-10 pr-8 py-1.5 rounded-full border border-transparent focus:border-zinc-500 focus:outline-none placeholder-zinc-400 transition-colors truncate shadow-inner"
              />

              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
            </form>

            {/* Instant Floating Live Search Dropdown */}
            {isDropdownOpen && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 w-[340px] sm:w-[400px] md:w-[460px] bg-[#1a1c22]/98 backdrop-blur-2xl border border-[#323640] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                {isSearching && (
                  <div className="h-0.5 w-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-[#f2545b] w-1/3 animate-pulse" />
                  </div>
                )}

                <div className="max-h-[380px] overflow-y-auto divide-y divide-[#242730] scrollbar-thin scrollbar-thumb-zinc-700">
                  {isSearching && liveResults.length === 0 && (
                    <div className="p-6 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
                      <span>Finding movies &amp; series...</span>
                    </div>
                  )}

                  {!isSearching && liveResults.length === 0 && (
                    <div className="p-6 text-center text-zinc-400 text-xs">
                      <p className="font-semibold text-zinc-300">
                        No results found for &ldquo;{query}&rdquo;
                      </p>
                      <p className="text-[11px] mt-1 text-zinc-500">
                        Check for spelling or try searching for a different
                        title, actor, or genre.
                      </p>
                    </div>
                  )}

                  {liveResults.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const year = item.releaseDate
                      ? item.releaseDate.slice(0, 4)
                      : "";
                    const targetUrl =
                      item.mediaType === "tv"
                        ? `/tv/${item.id}`
                        : `/movie/${item.id}`;

                    return (
                      <Link
                        key={`media-${item.id}-${idx}`}
                        href={targetUrl}
                        onClick={() => setIsDropdownOpen(false)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-3 p-3 transition-colors ${
                          isSelected
                            ? "bg-[#272a33] text-white"
                            : "hover:bg-[#20222a] text-zinc-200"
                        }`}
                      >
                        <div className="relative w-10 h-14 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/50">
                          {item.poster ? (
                            <Image
                              src={item.poster}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                              🎬
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate">
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase flex-shrink-0 ${
                                item.mediaType === "tv"
                                  ? "bg-purple-900/60 text-purple-300 border border-purple-700/40"
                                  : "bg-cyan-900/60 text-cyan-300 border border-cyan-700/40"
                              }`}
                            >
                              {item.mediaType === "tv" ? "TV Series" : "Movie"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            {year && <span>{year}</span>}
                            {item.rating > 0 && (
                              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                                ★ {item.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {item.overview && (
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {item.overview}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => executeFullSearch()}
                  className="w-full py-2.5 px-4 bg-[#14161a] hover:bg-[#1f2229] border-t border-[#292c34] text-xs font-semibold text-[#f2545b] hover:text-[#ff757b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>See all results for &ldquo;{query}&rdquo;</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Instant Floating Recent Searches & Trending Suggestions when empty */}
            {isDropdownOpen && query.trim().length === 0 && (recentSearches.length > 0 || TRENDING_SEARCHES.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 w-[340px] sm:w-[400px] md:w-[460px] bg-[#1a1c22]/98 backdrop-blur-2xl border border-[#323640] rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn text-xs">
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-zinc-400 font-semibold mb-2">
                      <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                        🕒 Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={() => clearSearchHistory()}
                        className="text-[#f2545b] hover:text-[#ff757b] font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term, i) => (
                        <div
                          key={`hdr-hist-${term}-${i}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#272a33] text-zinc-200 hover:text-white border border-[#343844] cursor-pointer"
                        >
                          <span
                            onClick={() => {
                              executeFullSearch(term);
                            }}
                          >
                            {term}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearchHistory(term);
                            }}
                            className="text-zinc-500 hover:text-white ml-0.5"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400 font-semibold text-xs block mb-2">
                    🔥 Trending Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TRENDING_SEARCHES.slice(0, 6).map((term, i) => (
                      <button
                        key={`hdr-trend-${term}-${i}`}
                        type="button"
                        onClick={() => executeFullSearch(term)}
                        className="px-3 py-1.5 rounded-full bg-[#20222a] text-zinc-300 hover:text-white border border-[#2e323d] hover:border-zinc-500 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-zinc-300">
          {desktopNavLinks.map((link) => {
            const isActive =
              link.href === "/categories"
                ? pathname === "/categories" || pathname.startsWith("/category")
                : pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "text-white bg-[#2b2e34] font-bold"
                    : "hover:text-white hover:bg-[#25282e]"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Auth Controls / Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {mounted && user ? (
          <>
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#2b2e34]"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileNavOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            <div ref={userMenuContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#f2545b]/50 transition-all focus:outline-none cursor-pointer"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "User Avatar"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#f2545b] text-white font-bold flex items-center justify-center text-xs shadow">
                    {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Custom User Dropdown Card */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-60 rounded-xl bg-[#1b1c21] border border-white/10 shadow-xl overflow-hidden z-50 animate-fadeIn select-none">
                  <div className="px-3.5 py-3 bg-[#15161a] border-b border-white/5 flex items-center gap-2.5">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name || "User Avatar"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#f2545b] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {(user.name || user.email || "U")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 flex flex-col gap-0.5">
                    {/* Watchlist */}
                    <Link
                      href="/watchlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Watchlist</span>
                    </Link>

                    {/* Account */}
                    <Link
                      href="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>Account</span>
                    </Link>

                    <div className="my-1 border-t border-white/5" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsSignOutConfirmOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse border border-white/10" />
          </div>
        )}
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileNavOpen && (
        <div
          className={`md:hidden ${
            isSticky ? "fixed top-[53px]" : "absolute top-full"
          } left-0 right-0 bg-[#18191c]/98 backdrop-blur-lg border-b border-[#2b2d32] p-4 flex flex-col gap-3 z-40 animate-fadeIn shadow-xl`}
        >
          {showSearch && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsMobileNavOpen(false);
                executeFullSearch();
              }}
              className="relative w-full"
            >
              <input
                type="text"
                placeholder="What do you want to watch?"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full bg-[#2a2c30] text-white text-xs pl-8 pr-4 py-2 rounded-full border border-transparent focus:border-zinc-500 focus:outline-none"
              />
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>
          )}

          {mobileNavLinks.map((link) => {
            const isActive =
              link.href === "/categories"
                ? pathname === "/categories" || pathname.startsWith("/category")
                : pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  isActive
                    ? "text-[#f2545b] bg-[#f2545b]/10 font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-[#25282e]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{link.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f2545b]" />
                )}
              </Link>
            );
          })}
        </div>
      )}

    </header>

      {/* Sign Out Confirmation Modal — Portal into document.body to completely escape header stacking context and backdrop-blur */}
      {mounted &&
        typeof document !== "undefined" &&
        isSignOutConfirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            {/* Click backdrop to cancel */}
            <div
              className="absolute inset-0"
              onClick={handleCloseSignOutModal}
            />
            <div className="relative z-10 bg-[#18191c] border border-zinc-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#f2545b] flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Sign Out?
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Are you sure you want to sign out of your Kino+ account?
              </p>

              {signOutError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 fill-red-400" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{signOutError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleCloseSignOutModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-transparent hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f2545b] hover:bg-[#ff656c] text-white transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[95px] justify-center"
                >
                  {isSigningOut ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <span>Sign Out</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * 🌟 Header Default Component:
 * Selects between UnauthenticatedHeader and AuthenticatedHeader based on user auth state.
 * - On the auth screen / landing screen: sticky is false (scrollable).
 * - On every other page (home dashboard, live TV, watch page, movie/tv details, categories): sticky is true at the top.
 */
export default function Header(props: HeaderProps): React.ReactElement {
  const { user, token, isAuthenticated } = useAuth();
  const isAuthed = Boolean(isAuthenticated || token || user);

  // If isSticky is explicitly provided, honor it. Otherwise:
  // - Auth page (unauthenticated): isSticky is false (scrollable)
  // - All other pages (home, live tv, watch, details, etc.): isSticky is true (sticky at top)
  const isSticky = props.isSticky !== undefined ? props.isSticky : isAuthed;

  const mergedProps = { ...props, isSticky };

  if (!isAuthed) {
    return (
      <UnauthenticatedHeader
        onOpenAuth={props.onOpenAuth}
        isSticky={isSticky}
      />
    );
  }

  return <AuthenticatedHeader {...mergedProps} isSticky={isSticky} />;
}
