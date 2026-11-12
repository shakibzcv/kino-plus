import React, { useState, useEffect } from "react";
import "./App.css";
import {
  UserProfile,
  MediaItem,
  WatchlistItem,
} from "./types";
import { fetchWatchlist, toggleWatchlist } from "./lib/api";
import Sidebar, { NavTabId } from "./components/Sidebar";
import IntroAnimation from "./components/IntroAnimation";
import HomeView from "./views/HomeView";
import MoviesView from "./views/MoviesView";
import TvShowsView from "./views/TvShowsView";
import AnimeView from "./views/AnimeView";
import CategoriesView from "./views/CategoriesView";
import WatchlistView from "./views/WatchlistView";
import ProfileView from "./views/ProfileView";
import DetailsView from "./views/DetailsView";
import AuthPage from "./components/AuthPage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const TAB_LABELS: Record<NavTabId, string> = {
  home: "Home",
  movies: "Movies",
  "tv-shows": "TV Shows",
  anime: "Anime",
  categories: "Categories",
  watchlist: "Watchlist",
  profile: "Account & Sessions",
};

export default function App(): React.ReactElement {
  const [showIntro, setShowIntro] = useState(true);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("kino_desktop_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<NavTabId>("home");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [activeDetailsMedia, setActiveDetailsMedia] = useState<MediaItem | null>(null);

  // Auth flow states
  const [authStatus, setAuthStatus] = useState<
    "idle" | "requesting" | "authenticating" | "error"
  >("idle");
  const [authUrl, setAuthUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load user's watchlist when authenticated
  useEffect(() => {
    if (!user) return;
    setIsWatchlistLoading(true);
    fetchWatchlist()
      .then((items) => setWatchlist(items))
      .catch(() => {})
      .finally(() => setIsWatchlistLoading(false));
  }, [user]);

  // Handle successful authentication tokens
  const handleAuthSuccess = async (token: string, refreshToken?: string) => {
    try {
      if (token) {
        localStorage.setItem("kino_desktop_token", token);
      }
      if (refreshToken) {
        localStorage.setItem("kino_desktop_refresh_token", refreshToken);
      }

      // Fetch user profile from /auth/me
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const apiUser = data?.data?.user;
        if (apiUser) {
          const authedUser: UserProfile = {
            id: apiUser.id || "",
            name: apiUser.name || apiUser.email || "User",
            email: apiUser.email || "",
            avatar: apiUser.avatar || "",
          };
          localStorage.setItem("kino_desktop_user", JSON.stringify(authedUser));
          setUser(authedUser);
          setAuthStatus("idle");
          setErrorMessage("");

          if (window.ipcRenderer?.focusWindow) {
            window.ipcRenderer.focusWindow();
          }
          return;
        }
      }

      // Fallback: decode JWT payload if /auth/me is unreachable
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const decoded = JSON.parse(atob(payloadPart));
          const authedUser: UserProfile = {
            id: decoded.id || "",
            name: decoded.name || decoded.email?.split("@")[0] || "User",
            email: decoded.email || "",
            avatar: decoded.avatar || "",
          };
          localStorage.setItem("kino_desktop_user", JSON.stringify(authedUser));
          setUser(authedUser);
          setAuthStatus("idle");
          setErrorMessage("");

          if (window.ipcRenderer?.focusWindow) {
            window.ipcRenderer.focusWindow();
          }
          return;
        }
      } catch {}

      setAuthStatus("error");
      setErrorMessage("Failed to retrieve user profile after login.");
    } catch (err: any) {
      console.error("[Desktop] Auth handling error:", err);
      setAuthStatus("error");
      setErrorMessage("Failed to complete sign-in. Please try again.");
    }
  };

  // Listen for tokens from Electron loopback server and OS deep-link
  useEffect(() => {
    if (!window.ipcRenderer?.on) return;

    // 1. Direct tokens from loopback server (http://127.0.0.1:45678/callback)
    const handleAuthTokens = (
      _event: any,
      payload: { token: string; refreshToken?: string },
    ) => {
      console.log("[Desktop] Received auth-tokens via loopback server");
      if (payload?.token) {
        handleAuthSuccess(payload.token, payload.refreshToken);
      }
    };

    // 2. Direct tokens from OS deep link (kinoplus://auth/callback?token=...&refreshToken=...)
    const handleDeepLink = (_event: any, url: string) => {
      console.log("[Desktop] Received deep-link:", url);
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get("token");
        const refreshToken = parsed.searchParams.get("refreshToken");
        if (token) {
          handleAuthSuccess(token, refreshToken || undefined);
          return;
        }
      } catch {}

      const matchToken = url.match(/[?&]token=([^&]+)/);
      const matchRefresh = url.match(/[?&]refreshToken=([^&]+)/);
      if (matchToken && matchToken[1]) {
        const token = decodeURIComponent(matchToken[1]);
        const refreshToken =
          matchRefresh && matchRefresh[1]
            ? decodeURIComponent(matchRefresh[1])
            : undefined;
        handleAuthSuccess(token, refreshToken);
      }
    };

    window.ipcRenderer.on("auth-tokens", handleAuthTokens);
    window.ipcRenderer.on("deep-link", handleDeepLink);

    return () => {
      window.ipcRenderer?.off?.("auth-tokens", handleAuthTokens);
      window.ipcRenderer?.off?.("deep-link", handleDeepLink);
    };
  }, []);

  // Start Google OAuth flow directly in external browser
  const handleStartGoogleAuth = async () => {
    try {
      setErrorMessage("");
      setAuthStatus("authenticating");

      const targetAuthUrl = `${API_BASE_URL}/auth/google?client=desktop`;
      setAuthUrl(targetAuthUrl);

      if (window.ipcRenderer?.openExternal) {
        await window.ipcRenderer.openExternal(targetAuthUrl);
      } else {
        window.open(targetAuthUrl, "_blank");
      }
    } catch (err: any) {
      console.error("[Desktop] Auth launch error:", err);
      setAuthStatus("error");
      setErrorMessage(
        err?.message || "Failed to open browser for authentication.",
      );
    }
  };

  const handleCancelAuth = () => {
    setAuthStatus("idle");
    setErrorMessage("");
  };

  const handleReopenBrowser = async () => {
    const url = authUrl || `${API_BASE_URL}/auth/google?client=desktop`;
    if (window.ipcRenderer?.openExternal) {
      await window.ipcRenderer.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("kino_desktop_user");
    localStorage.removeItem("kino_desktop_token");
    localStorage.removeItem("kino_desktop_refresh_token");
    setUser(null);
    setAuthStatus("idle");
    setErrorMessage("");
    setActiveTab("home");
    setActiveDetailsMedia(null);
  };

  useEffect(() => {
    const onUnauthorized = () => {
      handleSignOut();
      setErrorMessage("Your session has expired. Please sign in again.");
    };
    window.addEventListener("kino:desktop-unauthorized", onUnauthorized);
    return () => window.removeEventListener("kino:desktop-unauthorized", onUnauthorized);
  }, []);

  // Watchlist toggle handler
  const handleToggleWatchlist = async (media: MediaItem) => {
    const isCurrently = watchlist.some((w) => String(w.mediaId) === String(media.id));

    if (isCurrently) {
      setWatchlist((prev) => prev.filter((w) => String(w.mediaId) !== String(media.id)));
    } else {
      setWatchlist((prev) => [
        ...prev,
        {
          mediaId: String(media.id),
          mediaType: media.mediaType || "movie",
          title: media.title,
          posterPath: media.poster,
          backdropPath: media.backdrop,
          rating: media.rating,
        },
      ]);
    }

    await toggleWatchlist({
      mediaId: String(media.id),
      mediaType: media.mediaType || "movie",
      title: media.title,
      posterPath: media.poster,
      backdropPath: media.backdrop,
      rating: media.rating,
    });
  };

  const handlePlayMedia = (
    media: MediaItem,
  ) => {
    setActiveDetailsMedia(media);
  };

  return (
    <div className="flex w-screen h-screen bg-[#0e1013] text-white overflow-hidden select-none">
      {/* Cinematic Intro Animation */}
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* Left Sidebar */}
      {user && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setActiveDetailsMedia(null);
          }}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Draggable Bar */}
        <div className="titlebar-drag flex items-center justify-between h-10 px-5 bg-transparent flex-shrink-0 z-30">
          <div className="flex items-center space-x-2">
            {user && (
              activeDetailsMedia ? (
                <div className="titlebar-no-drag flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveDetailsMedia(null)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-white/10 active:scale-95"
                    title="Back"
                    aria-label="Back"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[320px]">
                    {activeDetailsMedia.title}
                  </span>
                </div>
              ) : activeTab === "watchlist" ? null : (
                <div className="titlebar-no-drag flex items-center">
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                    {TAB_LABELS[activeTab] || "Home"}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Reserved space for native window controls (Minimize, Maximize, Close) */}
          <div className="w-[140px] h-full flex-shrink-0" aria-hidden="true" />
        </div>

        {/* View Router */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#0e1013] via-[#090b0e] to-[#060709]">
          {user ? (
            activeDetailsMedia ? (
              <DetailsView
                media={activeDetailsMedia}
                onBack={() => setActiveDetailsMedia(null)}
                onWatch={(item) => {
                  handlePlayMedia(item);
                }}
                onSelectMedia={setActiveDetailsMedia}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ) : (
              <>
                {activeTab === "home" && (
                  <HomeView
                    onSelectMedia={setActiveDetailsMedia}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onPlay={handlePlayMedia}
                    onNavigateTab={(tab) => {
                      setActiveTab(tab as NavTabId);
                      setActiveDetailsMedia(null);
                    }}
                  />
                )}
                {activeTab === "movies" && (
                  <MoviesView
                    onSelectMedia={setActiveDetailsMedia}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onPlay={handlePlayMedia}
                  />
                )}
                {activeTab === "tv-shows" && (
                  <TvShowsView
                    onSelectMedia={setActiveDetailsMedia}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onPlay={handlePlayMedia}
                  />
                )}
                {activeTab === "anime" && (
                  <AnimeView
                    onSelectMedia={setActiveDetailsMedia}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onPlay={handlePlayMedia}
                  />
                )}
                {activeTab === "categories" && (
                  <CategoriesView
                    onSelectMedia={setActiveDetailsMedia}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onPlay={handlePlayMedia}
                  />
                )}
                {activeTab === "watchlist" && (
                  <WatchlistView
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onSelectMedia={setActiveDetailsMedia}
                    onPlay={handlePlayMedia}
                    isLoading={isWatchlistLoading}
                    onNavigateTab={(tab) => {
                      setActiveTab(tab as NavTabId);
                      setActiveDetailsMedia(null);
                    }}
                  />
                )}
                {activeTab === "profile" && (
                  <ProfileView
                    user={user}
                    onSignOut={handleSignOut}
                    onUpdateName={(newName) => {
                      const updated = { ...user, name: newName };
                      setUser(updated);
                      localStorage.setItem("kino_desktop_user", JSON.stringify(updated));
                    }}
                  />
                )}
              </>
            )
          ) : (
            /* ========================================================================= */
            /* AUTHENTICATION SCREEN                                                     */
            /* ========================================================================= */
            <AuthPage
              onStartGoogleAuth={handleStartGoogleAuth}
              authStatus={authStatus}
              errorMessage={errorMessage}
              onReopenBrowser={handleReopenBrowser}
              onCancelAuth={handleCancelAuth}
            />
          )}
        </div>
      </div>
    </div>
  );
}
